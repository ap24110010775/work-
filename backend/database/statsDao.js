import pool from './db.js';

export const statsDao = {
  async getCandidateStats(candidateId) {
    const [[appRow], [savedRow], [interviewRow]] = await Promise.all([
      pool.execute(
        'SELECT COUNT(*) AS total FROM applications WHERE candidate_id = ?',
        [candidateId]
      ),
      pool.execute(
        'SELECT COUNT(*) AS total FROM saved_jobs WHERE candidate_id = ?',
        [candidateId]
      ),
      pool.execute(
        'SELECT COUNT(*) AS total FROM interviews WHERE candidate_id = ? AND status = "scheduled"',
        [candidateId]
      ),
    ]);

    return {
      applications: Number(appRow[0].total),
      savedJobs: Number(savedRow[0].total),
      interviews: Number(interviewRow[0].total),
    };
  },

  async getEmployerStats(employerId) {
    const [[jobRow], [appRow], [shortRow], [interviewRow]] = await Promise.all([
      pool.execute(
        'SELECT COUNT(*) AS total FROM jobs WHERE employer_id = ? AND status = "active"',
        [employerId]
      ),
      pool.execute(
        'SELECT COUNT(*) AS total FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = ?',
        [employerId]
      ),
      pool.execute(
        'SELECT COUNT(*) AS total FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = ? AND a.status = "shortlisted"',
        [employerId]
      ),
      pool.execute(
        'SELECT COUNT(*) AS total FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE j.employer_id = ? AND i.status = "scheduled"',
        [employerId]
      ),
    ]);

    return {
      totalJobs: Number(jobRow[0].total),
      applications: Number(appRow[0].total),
      shortlisted: Number(shortRow[0].total),
      interviews: Number(interviewRow[0].total),
    };
  },

  async getAdminStats() {
    const [[userRow], [jobRow], [appRow], [companyRow]] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS total FROM users'),
      pool.execute('SELECT COUNT(*) AS total FROM jobs'),
      pool.execute('SELECT COUNT(*) AS total FROM applications'),
      pool.execute('SELECT COUNT(*) AS total FROM companies'),
    ]);

    return {
      users: Number(userRow[0].total),
      jobs: Number(jobRow[0].total),
      applications: Number(appRow[0].total),
      companies: Number(companyRow[0].total),
    };
  },
};
