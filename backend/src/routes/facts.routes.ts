import { Router } from 'express';
import { rateLimiter } from '../middleware/rateLimiter';
import { factService } from '../services/fact.service';
import { placeService } from '../services/place.service';
import { logRequest } from '../middleware/metrics';
import { logger } from '../config/logger';

export const factRoutes = Router();

// GET /api/places — catalog for the front-end carousel
factRoutes.get('/places', async (_req, res) => {
  const places = await placeService.list();
  res.json(places);
});

// GET /api/places/:slug/fact — cached curated fact (rate limited)
factRoutes.get('/places/:slug/fact', rateLimiter, async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await factService.getFactForSlug(slug);
    if (!result) {
      await logRequest(req, 404, false, 0);
      return res.status(404).json({ error: 'Place not found' });
    }
    await logRequest(req, 200, result.cached, result.method === 'gemini' ? 1 : 0);
    res.json(result);
  } catch (err) {
    logger.error({ err, slug }, 'Failed to get fact');
    await logRequest(req, 500, false, 0);
    res.status(500).json({ error: 'Internal server error' });
  }
});
