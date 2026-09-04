import { db } from '../src/config/database';
import { factService } from '../src/services/fact.service';
import { logger } from '../src/config/logger';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function preGenerate(): Promise<void> {
  const res = await db.query('SELECT * FROM places');
  const places = res.rows;

  for (const place of places) {
    try {
      logger.info({ slug: place.slug }, 'Pre-generating fact');
      await factService.getFactForSlug(place.slug);
      // small delay to be gentle on the Gemini quota
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      logger.error({ err, slug: place.slug }, 'Failed to pre-generate');
    }
  }

  logger.info({ count: places.length }, 'Pre-generation finished');
  process.exit(0);
}

// If running inside the backend container, call the service directly.
// If hitting a live API, use fetch instead.
if (BACKEND_URL) {
  preGenerate().catch((err) => {
    logger.error({ err }, 'Pre-generation crashed');
    process.exit(1);
  });
}
