import pool from './db.js';

const ensureTable = async () => {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      application_id BIGINT UNSIGNED NOT NULL,
      sender_id BIGINT UNSIGNED NOT NULL,
      receiver_id BIGINT UNSIGNED NOT NULL,
      body TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX idx_messages_application (application_id),
      INDEX idx_messages_receiver (receiver_id),
      CONSTRAINT fk_message_application FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_message_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};
ensureTable().catch((e) => console.error('Messages table migration error:', e));

export const messageDao = {
  async create({ applicationId, senderId, receiverId, body }) {
    const [result] = await pool.execute(
      `INSERT INTO messages (application_id, sender_id, receiver_id, body) VALUES (?, ?, ?, ?)`,
      [applicationId, senderId, receiverId, body]
    );
    return result.insertId;
  },

  async getById(id) {
    const [rows] = await pool.execute(`SELECT * FROM messages WHERE id = ? LIMIT 1`, [id]);
    return rows[0] || null;
  },

  async getThread(applicationId) {
    const [rows] = await pool.execute(
      `SELECT m.id, m.application_id AS applicationId, m.sender_id AS senderId, m.receiver_id AS receiverId,
              m.body, m.is_read AS isRead, m.created_at AS createdAt,
              u.name AS senderName, u.role AS senderRole
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.application_id = ?
       ORDER BY m.created_at ASC`,
      [applicationId]
    );
    return rows;
  },

  async getInboxForUser(userId) {
    const [rows] = await pool.execute(
      `SELECT
        m.application_id AS applicationId,
        MAX(m.created_at) AS lastMessageAt,
        COUNT(*) AS messageCount,
        SUM(CASE WHEN m.receiver_id = ? AND m.is_read = FALSE THEN 1 ELSE 0 END) AS unreadCount,
        (SELECT body FROM messages m2 WHERE m2.application_id = m.application_id ORDER BY m2.created_at DESC LIMIT 1) AS lastMessage,
        a.status AS applicationStatus,
        j.title AS jobTitle,
        uc.name AS candidateName,
        ue.name AS employerName
       FROM messages m
       JOIN applications a ON m.application_id = a.id
       JOIN jobs j ON a.job_id = j.id
       JOIN users uc ON a.candidate_id = uc.id
       JOIN users ue ON j.employer_id = ue.id
       WHERE a.candidate_id = ? OR j.employer_id = ?
       GROUP BY m.application_id, a.status, j.title, uc.name, ue.name
       ORDER BY lastMessageAt DESC`,
      [userId, userId, userId]
    );
    return rows;
  },

  async markThreadRead(applicationId, readerId) {
    await pool.execute(
      `UPDATE messages SET is_read = TRUE WHERE application_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [applicationId, readerId]
    );
  },
};
