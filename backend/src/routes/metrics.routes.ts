import { Router } from 'express';
import { db } from '../config/database';

export const metricsRoutes = Router();

// GET /api/metrics/summary
metricsRoutes.get('/metrics/summary', async (_req, res) => {
  const requests = await db.query(`
    SELECT
      COUNT(*)::int AS total_requests,
      COUNT(CASE WHEN cache_hit = true THEN 1 END)::int AS cache_hits,
      COUNT(CASE WHEN cache_hit = false THEN 1 END)::int AS cache_misses,
      COALESCE(SUM(gemini_calls), 0)::int AS total_gemini_calls,
      ROUND(AVG(response_time_ms))::int AS avg_response_time_ms,
      COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END)::int AS requests_24h
    FROM api_metrics
  `);
  const places = await db.query('SELECT COUNT(*)::int AS total FROM places');
  const facts = await db.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(CASE WHEN generation_method = 'gemini' THEN 1 END)::int AS gemini_generated,
      COUNT(CASE WHEN generation_method = 'fallback' THEN 1 END)::int AS fallback_generated
    FROM facts
  `);
  res.json({
    requests: requests.rows[0],
    places: places.rows[0],
    facts: facts.rows[0],
  });
});

// GET /api/metrics/recent
metricsRoutes.get('/metrics/recent', async (_req, res) => {
  const recent = await db.query(
    `SELECT endpoint, method, status_code, response_time_ms, cache_hit, created_at
     FROM api_metrics ORDER BY created_at DESC LIMIT 100`
  );
  res.json(recent.rows);
});
