import { Request } from 'express';
import { db } from '../config/database';

/** Records an API request into api_metrics. Fire-and-forget (best effort). */
export async function logRequest(
  req: Request,
  statusCode: number,
  cacheHit: boolean,
  geminiCalls: number
): Promise<void> {
  const startTime = req.startTime ?? Date.now();
  const responseTime = Date.now() - startTime;
  try {
    await db.query(
      `INSERT INTO api_metrics (endpoint, method, status_code, response_time_ms, cache_hit, gemini_calls)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.path, req.method, statusCode, responseTime, cacheHit, geminiCalls]
    );
  } catch (err) {
    // metrics must never break the request path
    // eslint-disable-next-line no-console
    console.error('Failed to log metrics', err);
  }
}
