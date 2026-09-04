import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'worldfacts',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'world_facts',
  ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000,
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Unexpected error on idle PostgreSQL client', err);
});
