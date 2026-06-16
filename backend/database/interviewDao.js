import pool from './db.js';

export const interviewDao = {
  async create(data) {
    const { applicationId, candidateId, recruiterId, scheduledAt, durationMinutes, meetingLink, notes } = data;
    const [result] = await pool.execute(`
      INSERT INTO interviews (application_id, candidate_id, recruiter_id, scheduled_at, duration_minutes, meeting_link, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')
    `, [applicationId, candidateId, recruiterId, scheduledAt, durationMinutes || 30, meetingLink || null, notes || null]);
    return result.insertId;
  },

  async getById(id) {
    const [rows] = await pool.execute(`
      SELECT 
        i.id,
        i.application_id AS applicationId,
        i.candidate_id AS candidateId,
        i.recruiter_id AS recruiterId,
        i.scheduled_at AS scheduledAt,
        i.duration_minutes AS durationMinutes,
        i.meeting_link AS meetingLink,
        i.status,
        i.notes
      FROM interviews i
      WHERE i.id = ? LIMIT 1
    `, [id]);
    return rows[0] || null;
  },

  async getByCandidate(candidateId) {
    const [rows] = await pool.execute(`
      SELECT
        i.id,
        i.scheduled_at AS scheduledAt,
        i.duration_minutes AS durationMinutes,
        i.meeting_link AS meetingLink,
        i.status,
        i.notes,
        j.title AS jobTitle,
        j.location AS jobLocation,
        c.name AS companyName,
        c.logo_url AS companyLogo,
        u.name AS recruiterName,
        u.avatar_url AS recruiterAvatar
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      JOIN users u ON i.recruiter_id = u.id
      WHERE i.candidate_id = ?
      ORDER BY i.scheduled_at DESC
    `, [candidateId]);
    return rows;
  },

  async getByRecruiter(recruiterId) {
    const [rows] = await pool.execute(`
      SELECT
        i.id,
        i.scheduled_at AS scheduledAt,
        i.duration_minutes AS durationMinutes,
        i.meeting_link AS meetingLink,
        i.status,
        i.notes,
        j.title AS jobTitle,
        uc.name AS candidateName,
        uc.email AS candidateEmail,
        uc.avatar_url AS candidateAvatar
      FROM interviews i
      JOIN applications a ON i.application_id = a.id
      JOIN jobs j ON a.job_id = j.id
      JOIN users uc ON i.candidate_id = uc.id
      WHERE i.recruiter_id = ?
      ORDER BY i.scheduled_at DESC
    `, [recruiterId]);
    return rows;
  },

  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE interviews SET status = ? WHERE id = ?',
      [status, id]
    );
  }
};
