import pool from './db.js';

async function seed() {
  console.log('Starting database seeding...');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert Mock Employer
    await connection.execute(`
      INSERT INTO users (id, provider, provider_user_id, role, name, email)
      VALUES (1, 'email', 'employer-1', 'employer', 'TechCorp Solutions', 'hiring@techcorp.com')
      ON DUPLICATE KEY UPDATE role='employer', name='TechCorp Solutions';
    `);

    // 2. Insert Mock Candidate
    await connection.execute(`
      INSERT INTO users (id, provider, provider_user_id, role, name, email)
      VALUES (2, 'email', 'candidate-1', 'candidate', 'Rahul Revanth', 'rahul@workyaar.local')
      ON DUPLICATE KEY UPDATE role='candidate', name='Rahul Revanth';
    `);

    // 3. Insert Mock Company
    await connection.execute(`
      INSERT INTO companies (id, employer_id, name, description, industry, location, employee_count)
      VALUES (1, 1, 'TechCorp Solutions', 'Building top 1% scalable software ecosystems.', 'Technology', 'Remote, IN', '10-50 employees')
      ON DUPLICATE KEY UPDATE name='TechCorp Solutions';
    `);

    // 4. Insert Mock Jobs
    await connection.execute(`
      INSERT INTO jobs (id, company_id, employer_id, title, description, requirements, location_type, job_type, location, salary_min, salary_max, status)
      VALUES 
      (1, 1, 1, 'Senior Backend Engineer', 'Looking for a Node.js/SQL expert to design robust APIs.', 'Node.js, Express, MySQL, Scalable Architecture', 'remote', 'full-time', 'Remote', 1200000.00, 1800000.00, 'active'),
      (2, 1, 1, 'Frontend Developer (React)', 'Build beautiful and interactive user interfaces using Tailwind and Framer Motion.', 'React, TypeScript, Tailwind CSS, Vite', 'hybrid', 'full-time', 'Hyderabad, IN', 800000.00, 1200000.00, 'active'),
      (3, 1, 1, 'Product Design Intern', 'Learn UI/UX design from professional product designers.', 'Figma, Prototyping, Design Systems', 'onsite', 'internship', 'Bangalore, IN', 20000.00, 30000.00, 'active')
      ON DUPLICATE KEY UPDATE title=VALUES(title), status=VALUES(status);
    `);

    await connection.commit();
    console.log('Seeding completed successfully!');
  } catch (error) {
    await connection.rollback();
    console.error('Seeding failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

seed();
