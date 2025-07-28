import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión OK:', res.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('Error conexión BD:', error);
  }
})();
