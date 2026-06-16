import pool from './db.js';

export const subscriptionDao = {
  async getActiveByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async getById(id) {
    const [rows] = await pool.execute(`SELECT * FROM subscriptions WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async create(userId, plan, expiresAt) {
    const [result] = await pool.execute(
      `INSERT INTO subscriptions (user_id, plan, status, starts_at, expires_at) VALUES (?, ?, 'active', NOW(), ?)`,
      [userId, plan, expiresAt]
    );
    return result.insertId;
  },

  async activate(subscriptionId) {
    await pool.execute(
      `UPDATE subscriptions SET status = 'active' WHERE id = ?`,
      [subscriptionId]
    );
  },

  async cancel(subscriptionId) {
    await pool.execute(
      `UPDATE subscriptions SET status = 'cancelled' WHERE id = ?`,
      [subscriptionId]
    );
  }
};
