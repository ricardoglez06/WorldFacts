import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { db } from '../src/config/database';
import { logger } from '../src/config/logger';

async function runMigrations(): Promise<void> {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  await db.query(sql);
  logger.info('Migration 001_initial_schema applied');

  // Create default admin if none exists
  const existing = await db.query('SELECT COUNT(*)::int AS count FROM admin_users');
  if (existing.rows[0].count === 0) {
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    await db.query(
      `INSERT INTO admin_users (username, password_hash, email, role)
       VALUES ($1, $2, $3, $4)`,
      ['admin', hash, process.env.ADMIN_EMAIL || 'admin@example.com', 'admin']
    );
    logger.warn(
      { username: 'admin' },
      `Default admin user created. Password: "${defaultPassword}" — change it immediately after first login.`
    );
  }
}

runMigrations()
  .then(() => {
    logger.info('Migrations complete');
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  });
