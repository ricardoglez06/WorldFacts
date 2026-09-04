import { db } from '../config/database';
import { wikipediaService } from './wikipedia.service';
import { geminiService } from './gemini.service';
import { pickInteresting } from '../utils/fallback';
import { FactResponse, FactCategory, Place } from '../models/types';
import { logger } from '../config/logger';

export class FactService {
  /** Get a curated fact for a place slug, generating + caching on a miss. */
  async getFactForSlug(slug: string): Promise<FactResponse | null> {
    let placeRes = await db.query('SELECT * FROM places WHERE slug = $1', [slug]);

    // Auto-provision places the frontend discovers dynamically (endless
    // carousel). The client already validated the slug against Wikipedia.
    if (placeRes.rows.length === 0) {
      const insert = await db.query(
        `INSERT INTO places (slug, wiki_title, display_name, country, category, photo_keywords)
         VALUES ($1, $1, $1, 'Mundo', 'curioso', $1)
         ON CONFLICT (slug) DO UPDATE SET slug = EXCLUDED.slug
         RETURNING *`,
        [slug]
      );
      placeRes = insert;
      logger.info({ slug }, 'Auto-provisioned place on cache miss');
    }
    const place: Place = placeRes.rows[0];

    const cached = await db.query(
      `SELECT f.fact_text, f.source_url, f.generation_method
       FROM facts f WHERE f.place_id = $1`,
      [place.id]
    );
    if (cached.rows.length > 0) {
      return {
        fact: cached.rows[0].fact_text,
        source: cached.rows[0].source_url,
        cached: true,
        method: cached.rows[0].generation_method,
      };
    }

    return this.generateAndStore(place);
  }

  /** Force regeneration (used by admin endpoint). */
  async regenerate(placeId: number): Promise<void> {
    await db.query('DELETE FROM facts WHERE place_id = $1', [placeId]);
  }

  private async generateAndStore(place: Place): Promise<FactResponse> {
    const extract = await wikipediaService.getEnhancedExtract(place.wiki_title);

    const result = await geminiService.generateFact(place.display_name, extract.text);
    let method: 'gemini' | 'fallback' = result.method;

    if (!result.fact) {
      result.fact = pickInteresting(extract.text, place.category as FactCategory);
      method = 'fallback';
    }

    const geminiCalls = method === 'gemini' ? 1 : 0;
    await db.query(
      `INSERT INTO facts (place_id, fact_text, source_url, gemini_model, generation_method)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (place_id) DO UPDATE SET
         fact_text = EXCLUDED.fact_text,
         source_url = EXCLUDED.source_url,
         gemini_model = EXCLUDED.gemini_model,
         generation_method = EXCLUDED.generation_method,
         updated_at = NOW()`,
      [place.id, result.fact, extract.sourceUrl || null, process.env.GEMINI_MODEL || null, method]
    );

    logger.info(
      { slug: place.slug, method, geminiCalls },
      'Fact generated and cached'
    );

    return {
      fact: result.fact,
      source: extract.sourceUrl || null,
      cached: false,
      method,
    };
  }
}

export const factService = new FactService();
