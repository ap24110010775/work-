import pool from './db.js';

export const jobDao = {
  async getAllActive() {
    const [rows] = await pool.execute(`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.requirements,
        j.location_type AS locationType,
        j.job_type AS jobType,
        j.location,
        j.salary_min AS salaryMin,
        j.salary_max AS salaryMax,
        j.currency,
        j.status,
        j.employer_id AS employerId,
        j.created_at AS createdAt,
        c.name AS companyName,
        c.logo_url AS companyLogo
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.status = 'active'
      ORDER BY j.created_at DESC
    `);
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.execute(`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.requirements,
        j.location_type AS locationType,
        j.job_type AS jobType,
        j.location,
        j.salary_min AS salaryMin,
        j.salary_max AS salaryMax,
        j.currency,
        j.status,
        j.employer_id AS employerId,
        j.created_at AS createdAt,
        c.name AS companyName,
        c.logo_url AS companyLogo
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.id = ?
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  },

  async create(jobData) {
    const {
      companyId,
      employerId,
      title,
      description,
      requirements,
      locationType,
      jobType,
      location,
      salaryMin,
      salaryMax,
      currency = 'INR',
      status = 'active'
    } = jobData;

    const [result] = await pool.execute(`
      INSERT INTO jobs (
        company_id, employer_id, title, description, requirements, 
        location_type, job_type, location, salary_min, salary_max, currency, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      companyId || null,
      employerId,
      title,
      description,
      requirements || null,
      locationType || 'onsite',
      jobType || 'full-time',
      location || null,
      salaryMin || null,
      salaryMax || null,
      currency,
      status
    ]);

    return result.insertId;
  },

  async getByEmployer(employerId) {
    const [rows] = await pool.execute(`
      SELECT 
        j.id,
        j.title,
        j.description,
        j.requirements,
        j.location_type AS locationType,
        j.job_type AS jobType,
        j.location,
        j.salary_min AS salaryMin,
        j.salary_max AS salaryMax,
        j.currency,
        j.status,
        j.employer_id AS employerId,
        j.created_at AS createdAt,
        c.name AS companyName,
        c.logo_url AS companyLogo
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      WHERE j.employer_id = ?
      ORDER BY j.created_at DESC
    `, [employerId]);
    return rows;
  },

  async update(id, employerId, jobData) {
    const {
      title,
      description,
      requirements,
      locationType,
      jobType,
      location,
      salaryMin,
      salaryMax,
      currency = 'INR',
      status
    } = jobData;

    const [result] = await pool.execute(`
      UPDATE jobs 
      SET 
        title = ?, 
        description = ?, 
        requirements = ?, 
        location_type = ?, 
        job_type = ?, 
        location = ?, 
        salary_min = ?, 
        salary_max = ?, 
        currency = ?, 
        status = ?
      WHERE id = ? AND employer_id = ?
    `, [
      title,
      description,
      requirements || null,
      locationType,
      jobType,
      location || null,
      salaryMin || null,
      salaryMax || null,
      currency,
      status,
      id,
      employerId
    ]);

    return result.affectedRows > 0;
  },

  async updateStatus(id, employerId, status) {
    const [result] = await pool.execute(`
      UPDATE jobs 
      SET status = ?
      WHERE id = ? AND employer_id = ?
    `, [status, id, employerId]);

    return result.affectedRows > 0;
  },

  async delete(id, employerId) {
    const [result] = await pool.execute(`
      DELETE FROM jobs 
      WHERE id = ? AND employer_id = ?
    `, [id, employerId]);

    return result.affectedRows > 0;
  }
};
