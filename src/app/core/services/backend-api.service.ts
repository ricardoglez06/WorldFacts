import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BackendFact {
  fact: string;
  source: string | null;
  cached: boolean;
  method: 'gemini' | 'fallback';
}

/**
 * Talks to the World Facts backend. The backend owns Wikipedia extraction,
 * Gemini curation, PostgreSQL caching, rate limiting and auth, so the
 * frontend only requests a curated fact per place slug.
 */
@Injectable({ providedIn: 'root' })
export class BackendApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;
  private readonly sessionId = this.getOrCreateSessionId();

  getFact(slug: string): Observable<BackendFact> {
    return this.http.get<BackendFact>(
      this.baseUrl + '/places/' + encodeURIComponent(slug) + '/fact',
      { headers: { 'x-session-id': this.sessionId } }
    );
  }

  private getOrCreateSessionId(): string {
    let id = localStorage.getItem('wf_session_id');
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : 's_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      localStorage.setItem('wf_session_id', id);
    }
    return id;
  }
}
