import pool from './db.js';

export const authDao = {
  async createUser({ provider, providerUserId, role, name, email, avatarUrl, passwordHash }) {
    const [result] = await pool.execute(
      `INSERT INTO users (provider, provider_user_id, role, name, email, avatar_url, password_hash, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [provider, providerUserId || null, role, name, email, avatarUrl || null, passwordHash || null, provider !== 'local']
    );
    return result.insertId;
  },

  async findByEmail(email, provider = 'local') {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND provider = ? LIMIT 1',
      [email, provider]
    );
    return rows[0] || null;
  },

  async findAnyByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  async linkGoogleAccount(userId, providerUserId, avatarUrl) {
    await pool.execute(
      'UPDATE users SET provider_user_id = ?, avatar_url = COALESCE(avatar_url, ?) WHERE id = ?',
      [providerUserId, avatarUrl, userId]
    );
  },

  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async markAsVerified(userId) {
    await pool.execute(
      'UPDATE users SET is_verified = TRUE WHERE id = ?',
      [userId]
    );
  },

  async updatePassword(userId, passwordHash) {
    await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, userId]
    );
  },

  async createOtp(email, otpCode, purpose, expiresAt) {
    // Delete any existing OTP for this email & purpose to avoid clutter
    await pool.execute(
      'DELETE FROM otps WHERE email = ? AND purpose = ?',
      [email, purpose]
    );

    await pool.execute(
      'INSERT INTO otps (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otpCode, purpose, expiresAt]
    );
  },

  async verifyOtp(email, otpCode, purpose) {
    const [rows] = await pool.execute(
      'SELECT * FROM otps WHERE email = ? AND otp_code = ? AND purpose = ? AND expires_at > NOW() LIMIT 1',
      [email, otpCode, purpose]
    );
    
    if (rows.length > 0) {
      // OTP is valid, delete it so it can't be reused
      await pool.execute('DELETE FROM otps WHERE id = ?', [rows[0].id]);
      return true;
    }
    return false;
  },
  
  async logSocialEvent(userId, provider) {
    await pool.execute(
      'INSERT INTO social_login_events (user_id, provider) VALUES (?, ?)',
      [userId, provider]
    );
  }
};
