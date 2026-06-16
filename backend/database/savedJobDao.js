import pool from './db.js';

export const savedJobDao = {
  async save(jobId, candidateId) {
    // INSERT IGNORE prevents duplicate errors since we have UNIQUE KEY
    await pool.execute(
      'INSERT IGNORE INTO saved_jobs (job_id, candidate_id) VALUES (?, ?)',
      [jobId, candidateId]
    );
  },

  async remove(jobId, candidateId) {
    const [result] = await pool.execute(
      'DELETE FROM saved_jobs WHERE job_id = ? AND candidate_id = ?',
      [jobId, candidateId]
    );
    return result.affectedRows;
  },

  async getByCandidate(candidateId) {
    const [rows] = await pool.execute(`
      SELECT
        sj.id AS savedId,
        sj.saved_at AS savedAt,
        j.id AS jobId,
        j.title AS jobTitle,
        j.job_type AS jobType,
        j.location_type AS locationType,
        j.location AS jobLocation,
        j.salary_min AS salaryMin,
        j.salary_max AS salaryMax,
        j.currency,
        j.status AS jobStatus,
        c.name AS companyName,
        c.logo_url AS companyLogo
      FROM saved_jobs sj
      JOIN jobs j ON sj.job_id = j.id
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE sj.candidate_id = ?
      ORDER BY sj.saved_at DESC
    `, [candidateId]);
    return rows;
  },

  async getSavedJobIds(candidateId) {
    const [rows] = await pool.execute(
      'SELECT job_id AS jobId FROM saved_jobs WHERE candidate_id = ?',
      [candidateId]
    );
    return rows.map((r) => Number(r.jobId));
  },

  async isSaved(jobId, candidateId) {
    const [rows] = await pool.execute(
      'SELECT id FROM saved_jobs WHERE job_id = ? AND candidate_id = ? LIMIT 1',
      [jobId, candidateId]
    );
    return rows.length > 0;
  }
};
