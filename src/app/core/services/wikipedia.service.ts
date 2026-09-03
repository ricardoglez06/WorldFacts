import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface PlaceInfo {
  fact: string;
  source: string;
}

/**
 * Fetches a concise, relevant encyclopedic extract for a place from the
 * Spanish Wikipedia (action API, with redirects + sentence limit). The
 * `prop=extracts` endpoint returns readable prose for far more titles than
 * the REST summary endpoint, and `redirects=1` resolves aliases so the text
 * is always relevant to the requested place.
 */
@Injectable({ providedIn: 'root' })
export class WikipediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://es.wikipedia.org/w/api.php';

  getInfo(title: string): Observable<PlaceInfo> {
    const url =
      `${this.baseUrl}?action=query&prop=extracts|info` +
      `&explaintext=1&exsentences=25&inprop=url` +
      `&redirects=1&titles=${encodeURIComponent(title)}` +
      `&format=json&origin=*`;
    return this.http.get<any>(url).pipe(
      map((res) => {
        const pages = res?.query?.pages ?? {};
        const page = Object.values(pages)[0] as any;
        const fact = (page?.extract ?? '').trim();
        const source = page?.fullurl ?? '';
        return { fact, source } as PlaceInfo;
      })
    );
  }
}
