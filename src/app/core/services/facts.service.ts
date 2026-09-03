import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap } from 'rxjs';
import {
  PlaceFact,
  FactCategory,
  SeedPlace,
} from '../models/place-fact.model';
import { WikipediaService } from './wikipedia.service';
import { PhotoService } from './photo.service';

/**
 * Owns the catalog of places and a lazily-populated cache of facts.
 *
 * Performance:
 *  - Facts (Wikipedia extract + real photo) are fetched ONLY for the current
 *    index and its immediate neighbours (prefetch), never all at once.
 *  - Results are cached by index so re-visiting a place is instant.
 *
 * Endless: the catalog starts from a curated base (assets/data/places.json)
 * and keeps growing by pulling members of real Wikipedia geographic
 * categories, so the carousel can effectively run forever (1000+ places).
 */
@Injectable({ providedIn: 'root' })
export class FactsService {
  private readonly http = inject(HttpClient);
  private readonly wiki = inject(WikipediaService);
  private readonly photo = inject(PhotoService);

  private readonly _places = signal<SeedPlace[]>([]);
  private readonly _facts = signal<(PlaceFact | null)[]>([]);
  private readonly _loadingMore = signal(false);
  private readonly _initialized = signal(false);

  readonly places = this._places.asReadonly();
  readonly facts = this._facts.asReadonly();
  readonly loadingMore = this._loadingMore.asReadonly();
  readonly total = computed(() => this._places().length);

  private readonly loaded = new Set<number>();
  private readonly categories = [
    'Islas',
    'Montañas',
    'Lagos',
    'Cascadas',
    'Cuevas',
    'Desiertos',
    'Bosques',
    'Ruinas',
    'Acantilados',
    'Volcanes',
    'Glaciares',
    'Patrimonio de la Humanidad',
    'Cañones',
    'Fiordos',
    'Cataratas',
  ];
  private categoryIndex = 0;

  init(): void {
    if (this._initialized()) {
      return;
    }
    this._initialized.set(true);
    this.http.get<SeedPlace[]>('data/places.json').subscribe({
      next: (base) => {
        this._places.set(base);
        this._facts.set(base.map(() => null));
        this.prefetch(0);
      },
      error: (err) => {
        console.error('No se pudo cargar el catálogo base.', err);
      },
    });
  }

  /** Make sure index, and its neighbours, are loaded. */
  prefetch(index: number): void {
    this.ensure(index);
    this.ensure(index - 1);
    this.ensure(index + 1);
    if (index >= this.total() - 4) {
      this.loadMore();
    }
  }

  private ensure(index: number): void {
    if (index < 0 || index >= this.total()) {
      return;
    }
    if (this.loaded.has(index)) {
      return;
    }
    this.loaded.add(index);
    const seed = this._places()[index];
    this.buildFact(seed, index).subscribe((fact) => {
      this._facts.update((arr) => {
        const copy = arr.slice();
        copy[index] = fact;
        return copy;
      });
    });
  }

  /** Append more real places from Wikipedia categories (endless growth). */
  loadMore(): void {
    if (this._loadingMore()) {
      return;
    }
    this._loadingMore.set(true);
    const cat = this.categories[this.categoryIndex % this.categories.length];
    this.categoryIndex++;
    const url =
      `https://es.wikipedia.org/w/api.php?action=query&list=categorymembers` +
      `&cmtitle=Categoría:${encodeURIComponent(cat)}&cmtype=page&cmlimit=60` +
      `&format=json&origin=*`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        const members: { title: string }[] =
          res?.query?.categorymembers ?? [];
        const additions = members
          .map((m) => this.toSeed(m.title))
          .filter((s): s is SeedPlace => s !== null);
        if (additions.length) {
          this._places.update((p) => this.merge(p, additions));
          this._facts.update((f) => [
            ...f,
            ...additions.map(() => null),
          ]);
        }
        this._loadingMore.set(false);
      },
      error: () => this._loadingMore.set(false),
    });
  }

  private merge(
    existing: SeedPlace[],
    additions: SeedPlace[]
  ): SeedPlace[] {
    const seen = new Set(existing.map((p) => p.slug));
    const result = [...existing];
    for (const a of additions) {
      if (!seen.has(a.slug)) {
        seen.add(a.slug);
        result.push(a);
      }
    }
    return result;
  }

  private toSeed(title: string): SeedPlace | null {
    if (
      !title ||
      title.includes(':') ||
      /discusión|ayuda|categoría|usuario|plantilla|wikcionario/i.test(title)
    ) {
      return null;
    }
    const slug = title.trim().replace(/\s+/g, '_');
    return {
      slug,
      wikiTitle: title.trim(),
      displayName: title.trim(),
      country: 'Mundo',
      category: this.pickCategory(title),
      photoKeywords: title.trim(),
    };
  }

  private pickCategory(t: string): FactCategory {
    const s = t.toLowerCase();
    if (
      /(tumba|cementerio|embrujad|fantasma|maldic|asesin|guerra|genocid|masacre|horror|sanguin|muerte)/.test(
        s
      )
    ) {
      return 'escalofriante';
    }
    if (/(isla|lago|volc|desierto|cueva|bosque|extrañ|misteri|raro|fantást)/.test(s)) {
      return 'raro';
    }
    return 'curioso';
  }

  private buildFact(seed: SeedPlace, index: number): Observable<PlaceFact> {
    const fallback: PlaceFact = {
      id: seed.slug,
      locationName: seed.displayName,
      country: seed.country,
      imageUrl: '',
      imageThumbUrl: '',
      fact: 'Dato no disponible.',
      category: seed.category,
    };
    return this.wiki.getInfo(seed.wikiTitle).pipe(
      switchMap((info) => {
        const lockId = this.hash(seed.slug) + index;
        return this.photo.getPhoto(seed.photoKeywords, lockId).pipe(
          map((override): PlaceFact => {
            const fact = this.pickInteresting(info.fact, seed.category);
            const imageUrl = override || '';
            return {
              ...fallback,
              imageUrl,
              imageThumbUrl: imageUrl,
              fact,
              source: info.source,
            };
          })
        );
      }),
      catchError(() => of(fallback))
    );
  }

  /** Select the most interesting sentences, biased by the place category. */
  private pickInteresting(text: string, category: FactCategory): string {
    if (!text || text.trim().length < 20) {
      return 'Dato no disponible.';
    }
    // Strip Wikipedia section headings (== Title ==) and normalize spacing,
    // including zero-width / unicode spaces that break sentence splitting.
    const clean = text
      .replace(/==+.*?==+/g, ' ')
      .replace(/[\u00A0\u2000-\u200F\u2028\u2029\u202F\u205F\u3000\uFEFF\u200B\u200C\u200D\u00AD]/g, ' ')
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
      if (/\d/.test(s)) {
        sc += 1;
      }
      if (/(km|metros|años|siglo|%|grados)/.test(low)) {
        sc += 1;
      }
      if (low.includes('se cree') || low.includes('según') || low.includes('leyenda')) {
        sc += 1;
      }
      return sc;
    };

    const ranked = sentences
      .map((s) => ({ s, sc: score(s) }))
      .sort((a, b) => b.sc - a.sc);

    const top = ranked.filter((r) => r.sc > 0).slice(0, 3).map((r) => r.s);
    const chosen = top.length ? top : sentences.slice(0, 2);
    return chosen.join(' ');
  }

  private hash(str: string): number {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
}
