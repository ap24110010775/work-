import pool from './db.js';

export const adminDao = {
  async getAllUsers() {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        provider,
        role,
        name,
        email,
        avatar_url AS avatarUrl,
        created_at AS createdAt
      FROM users
      ORDER BY created_at DESC
    `);
    return rows;
  },

  async getAllJobs() {
    const [rows] = await pool.execute(`
      SELECT 
        j.id,
        j.title,
        j.location_type AS locationType,
        j.job_type AS jobType,
        j.status,
        j.created_at AS createdAt,
        c.name AS companyName,
        u.email AS employerEmail
      FROM jobs j
      LEFT JOIN companies c ON j.company_id = c.id
      LEFT JOIN users u ON j.employer_id = u.id
      ORDER BY j.created_at DESC
    `);
    return rows;
  },

  async getAllCompanies() {
    const [rows] = await pool.execute(`
      SELECT 
        c.id,
        c.name,
        c.industry,
        c.location,
        c.created_at AS createdAt,
        u.name AS employerName,
        u.email AS employerEmail
      FROM companies c
      LEFT JOIN users u ON c.employer_id = u.id
      ORDER BY c.created_at DESC
    `);
    return rows;
  }
};
