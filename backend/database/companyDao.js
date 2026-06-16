import pool from './db.js';

const migrate = async () => {
  try {
    const [rows] = await pool.execute("SHOW COLUMNS FROM companies LIKE 'extra_details'");
    if (rows.length === 0) {
      await pool.execute("ALTER TABLE companies ADD COLUMN extra_details JSON NULL");
    }
  } catch (e) {
    console.error('Company migration error:', e);
  }
};
migrate();

export const companyDao = {
  async getByEmployerId(employerId) {
    const [rows] = await pool.execute('SELECT * FROM companies WHERE employer_id = ? LIMIT 1', [employerId]);
    return rows[0] || null;
  },

  async ensureCompanyExists(employerId, userName) {
    let company = await this.getByEmployerId(employerId);
    if (!company) {
      const defaultName = userName ? `${userName}'s Company` : 'My Company';
      const [result] = await pool.execute(
        'INSERT INTO companies (employer_id, name) VALUES (?, ?)',
        [employerId, defaultName]
      );
      company = await this.getByEmployerId(employerId);
    }
    return company;
  },

  async updateCompany(employerId, data) {
    const { name, description, logo_url, website, industry, location, employee_count, extra_details } = data;

    const extraStr = extra_details ? JSON.stringify(extra_details) : null;

    const [result] = await pool.execute(
      `UPDATE companies SET 
        name = ?, 
        description = ?, 
        logo_url = ?, 
        website = ?, 
        industry = ?, 
        location = ?, 
        employee_count = ?,
        extra_details = ?
       WHERE employer_id = ?`,
      [
        name,
        description || null,
        logo_url || null,
        website || null,
        industry || null,
        location || null,
        employee_count || null,
        extraStr,
        employerId
      ]
    );

    return result.affectedRows > 0;
  }
};
