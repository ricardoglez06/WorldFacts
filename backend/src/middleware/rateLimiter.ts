import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';
import { logger } from '../config/logger';
import { getOrCreateSessionId } from '../utils/sessionId';

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const WINDOW_HOURS = parseInt(process.env.RATE_LIMIT_WINDOW_HOURS || '1', 10);

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionId = getOrCreateSessionId(req.headers['x-session-id'] as string);
  req.sessionId = sessionId;

  try {
    const sessionRes = await db.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);

    if (sessionRes.rows.length === 0) {
      await db.query(
        'INSERT INTO sessions (id, request_count, window_start) VALUES ($1, 0, NOW())',
        [sessionId]
      );
      return next();
    }

    const { request_count, window_start } = sessionRes.rows[0];
    const hoursElapsed =
      (Date.now() - new Date(window_start).getTime()) / (1000 * 60 * 60);

    // Window expired -> reset counter and start a new window
    if (hoursElapsed >= WINDOW_HOURS) {
      await db.query(
        'UPDATE sessions SET request_count = 0, window_start = NOW(), last_request = NOW() WHERE id = $1',
        [sessionId]
      );
      return next();
    }

    if (request_count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((WINDOW_HOURS - hoursElapsed) * 60);
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: `${retryAfter} minutes`,
        limit: MAX_REQUESTS,
        window: `${WINDOW_HOURS} hours`,
      });
      return;
    }

    await db.query(
      'UPDATE sessions SET request_count = request_count + 1, last_request = NOW() WHERE id = $1',
      [sessionId]
    );
    next();
  } catch (err) {
    logger.error({ err }, 'Rate limiter error (failing open)');
    next();
  }
}
