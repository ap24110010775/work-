import { authService } from '../services/authService.js';
import { authTransformer } from '../transformations/authTransformer.js';
import { authDao } from '../database/authDao.js';

export const authHandler = {
  async register(req, res, next) {
    try {
      const result = await authService.registerUser(req.body);
      return res.status(201).json({
        success: true,
        message: result.message,
        userId: result.userId
      });
    } catch (error) {
      if (error.message.includes('already in use')) {
        return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
      }
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.loginUser(req.body);
      return res.json({
        success: true,
        message: 'Login successful',
        token: result.token,
        user: authTransformer.toUserResponse(result.user)
      });
    } catch (error) {
      if (error.message.includes('Invalid email or password')) {
        return res.status(401).json({ success: false, error: 'Unauthorized', message: error.message });
      }
      if (error.message.includes('not verified')) {
        return res.status(403).json({ success: false, error: 'Forbidden', message: error.message });
      }
      next(error);
    }
  },

  async verifyOtp(req, res, next) {
    try {
      const result = await authService.verifyOtp(req.body);
      if (result.token) {
        return res.json({
          success: true,
          message: result.message,
          token: result.token,
          user: authTransformer.toUserResponse(result.user)
        });
      }
      return res.json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
      if (error.message.includes('Invalid or expired')) {
        return res.status(400).json({ success: false, error: 'ValidationError', message: error.message });
      }
      next(error);
    }
  },

  async googleLogin(req, res, next) {
    try {
      const { idToken, role } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, error: 'ValidationError', message: 'idToken is required' });
      }

      const result = await authService.googleLogin(idToken, role);
      return res.json({
        success: true,
        message: 'Google login successful',
        token: result.token,
        user: authTransformer.toUserResponse(result.user)
      });
    } catch (error) {
      return res.status(401).json({ success: false, error: 'Unauthorized', message: error.message });
    }
  },

  async forgotPassword(req, res, next) {
    try {
      if (!req.body.email) return res.status(400).json({ success: false, message: 'Email is required' });
      const result = await authService.forgotPassword(req.body.email);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.body);
      return res.json({ success: true, message: result.message });
    } catch (error) {
      if (error.message.includes('Invalid or expired')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  },

  async getMe(req, res, next) {
    try {
      // req.user.id is populated by authMiddleware
      const user = await authDao.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'NotFound', message: 'User not found' });
      }
      
      return res.json({
        success: true,
        user: authTransformer.toUserResponse(user)
      });
    } catch (error) {
      next(error);
    }
  }
};
