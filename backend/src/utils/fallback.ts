import { FactCategory } from '../models/types';

/**
 * Heuristic fallback used when Gemini returns no fact or fails.
 * Ported from the original Angular FactsService.pickInteresting().
 * Scores sentences by category keyword matches and keeps the most relevant.
 */
export function pickInteresting(text: string, category: FactCategory): string {
  if (!text || text.trim().length < 20) {
    return 'Dato no disponible.';
  }

  const clean = text
    .replace(/==+.*?==+/g, ' ')
    .replace(
      /[\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D\u00AD]/g,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 24);

  if (sentences.length === 0) {
    return text;
  }

  const keywords: Record<FactCategory, string[]> = {
    curioso: [
      'único', 'única', 'solo', 'sola', 'más grande', 'más alto', 'más antiguo',
      'considerado', 'récord', 'maravilla', 'patrimonio', 'curios',
      'extraordinari', 'singular', 'primero', 'antiguo', 'famoso', 'sorprend',
      'construido', 'descubierto',
    ],
    escalofriante: [
      'muerte', 'muertos', 'muertas', 'fantasma', 'embrujad', 'abandon',
      'prohib', 'maldic', 'asesin', 'guerra', 'genocid', 'masacre',
      'desaparec', 'misterio', 'sanguin', 'horror', 'conden', 'terror',
      'cadáver', 'tumba', 'epidemia', 'veneno',
    ],
    raro: [
      'raro', 'extrañ', 'misterio', 'inexplic', 'anómal', 'bizarro', 'curios',
      'desconoc', 'mito', 'leyenda', 'enigm', 'inusual', 'singular', 'aisla',
      'extraterrestre', 'paranormal', 'supuest', 'aparec',
    ],
  };

  const kws = keywords[category];
  const score = (s: string): number => {
    const low = s.toLowerCase();
    let sc = 0;
    for (const k of kws) {
      if (low.includes(k)) {
        sc += 2;
      }
    }
    if (/\d/.test(s)) sc += 1;
    if (/(km|metros|años|siglo|%|grados)/.test(low)) sc += 1;
    if (low.includes('se cree') || low.includes('según') || low.includes('leyenda')) sc += 1;
    return sc;
  };

  const ranked = sentences
    .map((s) => ({ s, sc: score(s) }))
    .sort((a, b) => b.sc - a.sc);

  const top = ranked.filter((r) => r.sc > 0).slice(0, 3).map((r) => r.s);
  const chosen = top.length ? top : sentences.slice(0, 2);
  return chosen.join(' ');
}
