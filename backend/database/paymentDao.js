import pool from './db.js';

export const paymentDao = {
  async create(userId, razorpayOrderId, amountInr, currency = 'INR') {
    const [result] = await pool.execute(
      `INSERT INTO payments (user_id, razorpay_order_id, amount_inr, currency, status) VALUES (?, ?, ?, ?, 'created')`,
      [userId, razorpayOrderId, amountInr, currency]
    );
    return result.insertId;
  },

  async getByOrderId(razorpayOrderId) {
    const [rows] = await pool.execute(
      `SELECT * FROM payments WHERE razorpay_order_id = ? LIMIT 1`,
      [razorpayOrderId]
    );
    return rows[0] || null;
  },

  async markPaid(razorpayOrderId, razorpayPaymentId, razorpaySignature, subscriptionId) {
    await pool.execute(
      `UPDATE payments SET status = 'paid', razorpay_payment_id = ?, razorpay_signature = ?, subscription_id = ? WHERE razorpay_order_id = ?`,
      [razorpayPaymentId, razorpaySignature, subscriptionId, razorpayOrderId]
    );
  },

  async markFailed(razorpayOrderId) {
    await pool.execute(
      `UPDATE payments SET status = 'failed' WHERE razorpay_order_id = ?`,
      [razorpayOrderId]
    );
  },

  async getByUserId(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }
};
