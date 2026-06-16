import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import { authDao } from '../database/authDao.js';
import crypto from 'crypto';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Create a reusable transporter
const createTransporter = async () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Real email setup (Gmail, SendGrid, etc.)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // For Gmail, use an App Password!
      },
    });
  } else {
    // Fallback to console logging if no SMTP details are provided
    return {
      sendMail: async (info) => {
        console.log(`\n========================================`);
        console.log(`📧 MOCK EMAIL SENT TO: ${info.to}`);
        console.log(`📄 SUBJECT: ${info.subject}`);
        console.log(`✉️ CONTENT: ${info.text}`);
        console.log(`========================================\n`);
        return true;
      }
    };
  }
};

export const authService = {
  generateToken(user) {
    const secret = process.env.JWT_SECRET || 'change-me-in-production';
    return jwt.sign({ userId: user.id, role: user.role }, secret, { expiresIn: '7d' });
  },

  async registerUser({ name, email, password, role }) {
    const existingUser = await authDao.findByEmail(email, 'local');
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await authDao.createUser({
      provider: 'local',
      role: role || 'candidate',
      name,
      email,
      passwordHash
    });

    // Generate and send OTP for verification
    await this.sendOtp(email, 'verification');

    return { userId, message: 'Registration successful. Please verify your email with the OTP sent to you.' };
  },

  async loginUser({ email, password }) {
    const user = await authDao.findByEmail(email, 'local');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_verified) {
      // Auto-send a new OTP if they try to log in unverified
      await this.sendOtp(email, 'verification');
      throw new Error('Email not verified. A new OTP has been sent to your email.');
    }

    return { token: this.generateToken(user), user };
  },

  async sendOtp(email, purpose) {
    // Generate a 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    await authDao.createOtp(email, otpCode, purpose, expiresAt);

    const transporter = await createTransporter();
    await transporter.sendMail({
      from: '"WorkYaar" <noreply@workyaar.com>',
      to: email,
      subject: `Your WorkYaar ${purpose === 'verification' ? 'Verification' : 'Login'} Code`,
      text: `Your OTP is: ${otpCode}. It will expire in 15 minutes.`
    });
  },

  async verifyOtp({ email, otpCode, purpose = 'verification' }) {
    const isValid = await authDao.verifyOtp(email, otpCode, purpose);
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    if (purpose === 'verification') {
      const user = await authDao.findByEmail(email, 'local');
      if (user) {
        await authDao.markAsVerified(user.id);
        return { message: 'Email verified successfully', token: this.generateToken(user), user };
      }
    }
    
    return { success: true };
  },

  async forgotPassword(email) {
    const user = await authDao.findByEmail(email, 'local');
    if (!user) {
      throw new Error('User not found');
    }
    await this.sendOtp(email, 'reset');
    return { message: 'Password reset OTP sent to your email.' };
  },

  async resetPassword({ email, otpCode, newPassword }) {
    const isValid = await authDao.verifyOtp(email, otpCode, 'reset');
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }
    
    const user = await authDao.findByEmail(email, 'local');
    if (!user) throw new Error('User not found');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await authDao.updatePassword(user.id, passwordHash);

    return { message: 'Password has been reset successfully. You can now login.' };
  },

  async googleLogin(idToken, role) {
    let payload;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        // Real Google verification
        const ticket = await googleClient.verifyIdToken({ 
          idToken, 
          audience: process.env.GOOGLE_CLIENT_ID 
        });
        payload = ticket.getPayload();
      } else {
        // Mock fallback for development if keys aren't set
        payload = jwt.decode(idToken); 
        console.warn("⚠️ Using Mock Google Auth. Set GOOGLE_CLIENT_ID for real verification.");
      }
      
      if (!payload || !payload.email) throw new Error('Invalid Google Token');
    } catch (e) {
      console.error('Google Auth Error:', e.message);
      throw new Error('Google authentication failed: ' + e.message);
    }

    const { email, name, sub: providerUserId, picture: avatarUrl } = payload;

    let user = await authDao.findAnyByEmail(email);
    
    if (!user) {
      // New user — create with the role they selected on the login page
      const userId = await authDao.createUser({
        provider: 'google',
        providerUserId,
        role: role || 'candidate',
        name,
        email,
        avatarUrl
      });
      user = await authDao.findById(userId);
    } else {
      // Existing user — link Google to their account if not already linked
      await authDao.linkGoogleAccount(user.id, providerUserId, avatarUrl);
      // Re-fetch to get the latest state
      user = await authDao.findById(user.id);
    }

    await authDao.logSocialEvent(user.id, 'google');
    return { token: this.generateToken(user), user };
  }
};
