import { db } from '../config/database';
import { Place, FactCategory } from '../models/types';

export class PlaceService {
  async list(): Promise<Place[]> {
    const res = await db.query('SELECT * FROM places ORDER BY id');
    return res.rows;
  }

  async getBySlug(slug: string): Promise<Place | null> {
    const res = await db.query('SELECT * FROM places WHERE slug = $1', [slug]);
    return res.rows[0] || null;
  }

  async create(input: {
    slug: string;
    wikiTitle: string;
    displayName: string;
    country?: string;
    category: FactCategory;
    photoKeywords?: string;
  }): Promise<Place> {
    const res = await db.query(
      `INSERT INTO places (slug, wiki_title, display_name, country, category, photo_keywords)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        input.slug,
        input.wikiTitle,
        input.displayName,
        input.country || 'Mundo',
        input.category,
        input.photoKeywords || '',
      ]
    );
    return res.rows[0];
  }

  async update(
    id: number,
    input: Partial<{
      wikiTitle: string;
      displayName: string;
      country: string;
      category: FactCategory;
      photoKeywords: string;
    }>
  ): Promise<Place | null> {
    const current = await db.query('SELECT * FROM places WHERE id = $1', [id]);
    if (current.rows.length === 0) return null;
    const res = await db.query(
      `UPDATE places SET
         wiki_title = COALESCE($1, wiki_title),
         display_name = COALESCE($2, display_name),
         country = COALESCE($3, country),
         category = COALESCE($4, category),
         photo_keywords = COALESCE($5, photo_keywords),
         updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        input.wikiTitle ?? null,
        input.displayName ?? null,
        input.country ?? null,
        input.category ?? null,
        input.photoKeywords ?? null,
        id,
      ]
    );
    return res.rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const res = await db.query('DELETE FROM places WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  }
}

export const placeService = new PlaceService();
