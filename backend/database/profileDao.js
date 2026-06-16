import pool from './db.js';

export const profileDao = {
  async getByUserId(userId) {
    // Check if profile exists, if not, create a default one
    const [existing] = await pool.execute(
      'SELECT id FROM candidate_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO candidate_profiles (user_id, resume_url, portfolio_url, bio, skills, experience, education) VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)',
        [userId]
      );
    }

    const [rows] = await pool.execute(`
      SELECT 
        u.id AS userId,
        u.name,
        u.email,
        u.avatar_url AS avatarUrl,
        u.role,
        cp.id AS profileId,
        cp.resume_url AS resumeUrl,
        cp.portfolio_url AS portfolioUrl,
        cp.bio,
        cp.skills,
        cp.experience,
        cp.education
      FROM users u
      LEFT JOIN candidate_profiles cp ON u.id = cp.user_id
      WHERE u.id = ?
      LIMIT 1
    `, [userId]);

    return rows[0] || null;
  },

  async update(userId, data) {
    const { name, bio, resumeUrl, portfolioUrl, skills, experience, education } = data;

    // Update user's name first
    if (name) {
      await pool.execute(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, userId]
      );
    }

    // Ensure candidate_profiles row exists
    const [existing] = await pool.execute(
      'SELECT id FROM candidate_profiles WHERE user_id = ? LIMIT 1',
      [userId]
    );
    if (existing.length === 0) {
      await pool.execute(
        'INSERT INTO candidate_profiles (user_id) VALUES (?)',
        [userId]
      );
    }

    // Prepare profile update query
    const fieldsToUpdate = [];
    const queryParams = [];

    if (bio !== undefined) {
      fieldsToUpdate.push('bio = ?');
      queryParams.push(bio);
    }
    if (resumeUrl !== undefined) {
      fieldsToUpdate.push('resume_url = ?');
      queryParams.push(resumeUrl);
    }
    if (portfolioUrl !== undefined) {
      fieldsToUpdate.push('portfolio_url = ?');
      queryParams.push(portfolioUrl);
    }
    if (skills !== undefined) {
      fieldsToUpdate.push('skills = ?');
      queryParams.push(JSON.stringify(skills));
    }
    if (experience !== undefined) {
      fieldsToUpdate.push('experience = ?');
      queryParams.push(JSON.stringify(experience));
    }
    if (education !== undefined) {
      fieldsToUpdate.push('education = ?');
      queryParams.push(JSON.stringify(education));
    }

    if (fieldsToUpdate.length > 0) {
      queryParams.push(userId);
      const query = `UPDATE candidate_profiles SET ${fieldsToUpdate.join(', ')} WHERE user_id = ?`;
      await pool.execute(query, queryParams);
    }

    return await this.getByUserId(userId);
  }
};
