import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { SessionUser } from '../models/types';
import { logger } from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export class AuthService {
  async login(username: string, password: string): Promise<{ token: string; user: SessionUser } | null> {
    try {
      const res = await db.query('SELECT * FROM admin_users WHERE username = $1', [username]);
      if (res.rows.length === 0) return null;

      const user = res.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return null;

      await db.query('UPDATE admin_users SET last_login = NOW() WHERE id = $1', [user.id]);

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
      );

      return {
        token,
        user: { userId: user.id, username: user.username, role: user.role },
      };
    } catch (err) {
      logger.error({ err, username }, 'Login failed');
      return null;
    }
  }

  verifyToken(token: string): SessionUser | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as SessionUser & { userId: number };
      return { userId: decoded.userId, username: decoded.username, role: decoded.role };
    } catch {
      return null;
    }
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const res = await db.query('SELECT * FROM admin_users WHERE id = $1', [userId]);
    if (res.rows.length === 0) return false;
    const valid = await bcrypt.compare(currentPassword, res.rows[0].password_hash);
    if (!valid) return false;
    const hash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE admin_users SET password_hash = $1 WHERE id = $2', [hash, userId]);
    return true;
  }
}

export const authService = new AuthService();
