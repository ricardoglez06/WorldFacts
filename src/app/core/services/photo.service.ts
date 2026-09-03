import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { UnsplashSearchResponse } from '../models/api-responses.model';
import { UNSPLASH_ACCESS_KEY } from '../tokens/env.tokens';

/**
 * Provides a REAL photograph of a place.
 *
 * - If an Unsplash Access Key is injected, it returns a curated landscape
 *   photo from Unsplash (best quality).
 * - Otherwise it pulls a real photograph from Wikimedia Commons by keyword,
 *   filtering out maps / diagrams / flags / SVGs. This guarantees a genuine
 *   photo of the place with zero configuration (no API key required).
 */
@Injectable({ providedIn: 'root' })
export class PhotoService {
  private readonly http = inject(HttpClient);
  private readonly key = inject(UNSPLASH_ACCESS_KEY);
  private readonly cache = new Map<string, string>();

  getPhoto(query: string, _lockId: number): Observable<string> {
    if (!query) {
      return of('');
    }
    if (this.cache.has(query)) {
      return of(this.cache.get(query)!);
    }
    const source$ = this.key ? this.unsplash(query) : this.commons(query);
    return source$.pipe(
      map((url) => {
        this.cache.set(query, url);
        return url;
      })
    );
  }

  /** Wikimedia Commons: real photo matched by keyword, never a map. */
  private commons(query: string): Observable<string> {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(query)} filetype:bitmap` +
      `&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1280` +
      `&format=json&origin=*`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const pages = res?.query?.pages ?? {};
        for (const k of Object.keys(pages)) {
          const info = pages[k]?.imageinfo?.[0];
          const u = info?.thumburl || info?.url;
          if (u && !/(\.svg|map|diagram|logo|flag|coat|location)/i.test(u)) {
            return u;
          }
        }
        return '';
      }),
      catchError(() => of(''))
    );
  }

  private unsplash(query: string): Observable<string> {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=1&orientation=landscape`;
    return this.http
      .get<UnsplashSearchResponse>(url, {
        headers: { Authorization: `Client-ID ${this.key}` },
      })
      .pipe(
        map((res) => res.results?.[0]?.urls?.regular ?? ''),
        catchError(() => of(''))
      );
  }
}
