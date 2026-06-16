import pool from './db.js';

export const applicationDao = {
  async create(appData) {
    const { jobId, candidateId, resumeUrl, coverLetter } = appData;
    const [result] = await pool.execute(`
      INSERT INTO applications (job_id, candidate_id, resume_url, cover_letter, status)
      VALUES (?, ?, ?, ?, 'applied')
    `, [jobId, candidateId, resumeUrl || null, coverLetter || null]);
    return result.insertId;
  },

  async getByCandidate(candidateId) {
    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        a.job_id AS jobId,
        a.status,
        a.applied_at AS appliedAt,
        a.cover_letter AS coverLetter,
        j.title AS jobTitle,
        j.job_type AS jobType,
        j.location_type AS locationType,
        j.location AS jobLocation,
        c.name AS companyName,
        c.logo_url AS companyLogo
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE a.candidate_id = ?
      ORDER BY a.applied_at DESC
    `, [candidateId]);
    return rows;
  },

  async getByJob(jobId) {
    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        a.candidate_id AS candidateId,
        a.status,
        a.applied_at AS appliedAt,
        a.resume_url AS resumeUrl,
        a.cover_letter AS coverLetter,
        u.name AS candidateName,
        u.email AS candidateEmail,
        u.avatar_url AS candidateAvatar
      FROM applications a
      JOIN users u ON a.candidate_id = u.id
      WHERE a.job_id = ?
      ORDER BY a.applied_at DESC
    `, [jobId]);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        a.job_id AS jobId,
        a.candidate_id AS candidateId,
        a.status,
        a.applied_at AS appliedAt,
        j.employer_id AS employerId
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE applications SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  async getByEmployer(employerId) {
    const [rows] = await pool.execute(`
      SELECT 
        a.id,
        a.job_id AS jobId,
        a.status,
        a.applied_at AS appliedAt,
        a.resume_url AS resumeUrl,
        a.cover_letter AS coverLetter,
        j.title AS jobTitle,
        u.name AS candidateName,
        u.email AS candidateEmail,
        u.avatar_url AS candidateAvatar
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.candidate_id = u.id
      WHERE j.employer_id = ?
      ORDER BY a.applied_at DESC
    `, [employerId]);
    return rows;
  }
};
