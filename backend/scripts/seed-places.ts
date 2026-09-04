import * as fs from 'fs';
import * as path from 'path';
import { db } from '../src/config/database';
import { logger } from '../src/config/logger';
import { FactCategory } from '../src/models/types';

interface SeedPlace {
  slug: string;
  wikiTitle: string;
  displayName: string;
  country: string;
  category: FactCategory;
  photoKeywords: string;
}

async function seedPlaces(): Promise<void> {
  const candidates = [
    process.env.PLACES_JSON_PATH,
    path.join(__dirname, '..', '..', 'public', 'data', 'places.json'),
    path.join(__dirname, '..', '..', 'src', 'assets', 'data', 'places.json'),
  ].filter(Boolean) as string[];

  const file = candidates.find((p) => fs.existsSync(p));
  if (!file) {
    logger.error({ candidates }, 'places.json not found');
    process.exit(1);
  }

  const places: SeedPlace[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  let inserted = 0;

  for (const p of places) {
    const res = await db.query(
      `INSERT INTO places (slug, wiki_title, display_name, country, category, photo_keywords)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [p.slug, p.wikiTitle, p.displayName, p.country || 'Mundo', p.category, p.photoKeywords || '']
    );
    if (res.rows.length > 0) inserted++;
  }

  logger.info({ total: places.length, inserted }, 'Seed complete');
  process.exit(0);
}

seedPlaces().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
