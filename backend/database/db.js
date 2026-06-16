import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'workyaar',
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  keepAliveInitialDelay: 10000,
  enableKeepAlive: true,
});

// Simple query helper for common operations
export const query = async (sql, params) => {
  const [results] = await pool.execute(sql, params);
  return results;
};

// Expose the pool for transaction management
export default pool;
