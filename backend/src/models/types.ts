export type FactCategory = 'curioso' | 'escalofriante' | 'raro';

export interface Place {
  id: number;
  slug: string;
  wiki_title: string;
  display_name: string;
  country: string;
  category: FactCategory;
  photo_keywords: string;
  created_at: Date;
  updated_at: Date;
}

export interface FactRecord {
  id: number;
  place_id: number;
  fact_text: string;
  source_url: string | null;
  gemini_model: string | null;
  generation_method: 'gemini' | 'fallback';
  created_at: Date;
  updated_at: Date;
}

export interface WikipediaExtract {
  text: string;
  sourceUrl: string;
}

export interface GeneratedFact {
  fact: string | null;
  method: 'gemini' | 'fallback';
}

export interface FactResponse {
  fact: string;
  source: string | null;
  cached: boolean;
  method: 'gemini' | 'fallback';
}

export interface SessionUser {
  userId: number;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      user?: SessionUser;
      startTime?: number;
    }
  }
}
