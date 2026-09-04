import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeneratedFact } from '../models/types';
import { logger } from '../config/logger';

const MAX_WORDS = 100;

function buildPrompt(placeName: string, extract: string): string {
  return `Eres un experto en turismo y divulgación científica con 20 años de experiencia.

CONTEXTO:
Lugar: ${placeName}
Extracto de Wikipedia:
${extract}

TAREA:
Extrae UN (1) solo dato que sea verdaderamente inusual, sorprendente o poco conocido sobre este lugar.

RESTRICCIONES:
- Máximo ${MAX_WORDS} palabras (CRÍTICO).
- Tono atractivo y narrativo (como un documental de misterios del mundo).
- IGNORA: datos demográficos aburridos, fechas de fundación comunes, coordenadas geográficas e información administrativa.
- PRIORIZA: leyendas, récords mundiales, fenómenos únicos, eventos históricos impactantes o misterios sin resolver.
- Si no encuentras nada verdaderamente interesante, responde exactamente: {"dato_curioso": null}

FORMATO DE SALIDA (JSON estricto):
{
  "dato_curioso": "texto del dato aquí"
}

Responde SOLO con el JSON, sin explicaciones adicionales ni comillas de código.`;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  }

  async generateFact(placeName: string, extract: string): Promise<GeneratedFact> {
    if (!extract || extract.trim().length < 30) {
      logger.warn({ placeName }, 'Skipping Gemini: extract too short');
      return { fact: null, method: 'gemini' };
    }

    const model = this.genAI.getGenerativeModel({ model: this.model });

    try {
      const result = await model.generateContent(buildPrompt(placeName, extract));
      const raw = result.response.text().trim();
      const parsed = this.parseJson(raw);

      if (parsed === null) {
        logger.info({ placeName }, 'Gemini returned null — no interesting fact found');
        return { fact: null, method: 'gemini' };
      }

      const fact = this.truncateToWords(parsed, MAX_WORDS);
      return { fact, method: 'gemini' };
    } catch (err) {
      logger.error({ err, placeName }, 'Gemini API error');
      return { fact: null, method: 'gemini' };
    }
  }

  private parseJson(raw: string): string | null {
    // Strip accidental markdown fences.
    let text = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    // Extract the first balanced JSON object.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      return this.recoverPlain(text);
    }
    text = text.slice(start, end + 1);
    try {
      const obj = JSON.parse(text);
      if (obj && obj.dato_curioso === null) return null;
      if (obj && typeof obj.dato_curioso === 'string' && obj.dato_curioso.trim()) {
        return obj.dato_curioso.trim();
      }
      return this.recoverPlain(text);
    } catch {
      return this.recoverPlain(text);
    }
  }

  /** Fallback: if JSON parse fails, use the raw text if it looks like a fact. */
  private recoverPlain(text: string): string | null {
    if (text && text.length > 10 && text.length < 800) return text;
    return null;
  }

  private truncateToWords(text: string, max: number): string {
    const words = text.split(/\s+/);
    if (words.length <= max) return text;
    return words.slice(0, max).join(' ');
  }
}

export const geminiService = new GeminiService();
