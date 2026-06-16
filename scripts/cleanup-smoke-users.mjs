import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'workyaar',
});

const [result] = await db.execute(
  'DELETE FROM users WHERE email LIKE ?',
  ['codex-smoke-%@workyaar.local'],
);

console.log(JSON.stringify({ deletedSmokeUsers: result.affectedRows }));
await db.end();
