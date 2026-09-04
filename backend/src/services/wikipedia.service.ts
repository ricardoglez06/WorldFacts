import { WikipediaExtract } from '../models/types';
import { logger } from '../config/logger';

const API = 'https://es.wikipedia.org/w/api.php';

const TARGET_SECTIONS = [
  'curiosidades',
  'historia',
  'cultura',
  'leyendas',
  'récords',
  'misterios',
  'geología',
  'flora y fauna',
  'mitología',
];

interface WikiPage {
  extract?: string;
  fullurl?: string;
}

export class WikipediaService {
  /**
   * Fetch an enriched extract: the article introduction plus text from any
   * key sections (Curiosidades, Historia, Leyendas, ...). The combined text is
   * cleaned and truncated so the downstream LLM call stays cheap and relevant.
   */
  async getEnhancedExtract(title: string): Promise<WikipediaExtract> {
    const page = await this.fetchPage(title);
    if (!page || !page.extract) {
      return { text: '', sourceUrl: page?.fullurl || '' };
    }

    const combined = this.extractThemedSections(page.extract);
    return { text: combined, sourceUrl: page.fullurl || '' };
  }

  private async fetchPage(title: string): Promise<WikiPage | null> {
    const url =
      `${API}?action=query&prop=extracts|info` +
      `&explaintext=1&inprop=url` +
      `&redirects=1&titles=${encodeURIComponent(title)}` +
      `&format=json&origin=*`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const pages = data?.query?.pages ?? {};
      const page: WikiPage = Object.values(pages)[0] as WikiPage;
      return page || null;
    } catch (err) {
      logger.error({ err, title }, 'Wikipedia fetch failed');
      return null;
    }
  }

  /** Keep the intro + any themed sections, concatenated and capped. */
  private extractThemedSections(raw: string): string {
    const clean = this.clean(raw);
    const parts = clean.split(/==+\s*(.+?)\s*==+/);
    // parts: [introText, heading1, section1, heading2, section2, ...]
    const intro = (parts[0] || '').trim();
    const blocks: string[] = [intro];

    for (let i = 1; i < parts.length; i += 2) {
      const heading = (parts[i] || '').trim().toLowerCase();
      const body = (parts[i + 1] || '').trim();
      if (body && TARGET_SECTIONS.some((t) => heading.includes(t))) {
        blocks.push(body);
      }
    }

    let combined = blocks.join(' ').replace(/\s+/g, ' ').trim();
    if (combined.length > 2000) {
      combined = combined.slice(0, 2000);
    }
    return combined;
  }

  private clean(text: string): string {
    return text
      .replace(
        /[\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D\u00AD]/g,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const wikipediaService = new WikipediaService();
