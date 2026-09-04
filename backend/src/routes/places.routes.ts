import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { placeService } from '../services/place.service';
import { factService } from '../services/fact.service';
import { FactCategory } from '../models/types';
import { logger } from '../config/logger';

export const placeAdminRoutes = Router();

// All admin place routes require a valid JWT
placeAdminRoutes.use(requireAuth);

const CATEGORIES: FactCategory[] = ['curioso', 'escalofriante', 'raro'];

// POST /api/admin/places
placeAdminRoutes.post('/places', async (req, res) => {
  const { slug, wikiTitle, displayName, country, category, photoKeywords } = req.body || {};
  if (!slug || !wikiTitle || !displayName || !category) {
    return res.status(400).json({ error: 'slug, wikiTitle, displayName and category are required' });
  }
  if (!CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category must be curioso | escalofriante | raro' });
  }
  try {
    const place = await placeService.create({ slug, wikiTitle, displayName, country, category, photoKeywords });
    res.status(201).json(place);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Place with this slug already exists' });
    }
    logger.error({ err }, 'Failed to create place');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/places/:id
placeAdminRoutes.put('/places/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const place = await placeService.update(id, req.body || {});
  if (!place) return res.status(404).json({ error: 'Place not found' });
  res.json(place);
});

// DELETE /api/admin/places/:id
placeAdminRoutes.delete('/places/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  const ok = await placeService.delete(id);
  if (!ok) return res.status(404).json({ error: 'Place not found' });
  res.status(204).send();
});

// POST /api/admin/places/:id/regenerate-fact
placeAdminRoutes.post('/places/:id/regenerate-fact', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
  await factService.regenerate(id);
  logger.info({ id }, 'Fact marked for regeneration');
  res.json({ message: 'Fact will be regenerated on next request' });
});
