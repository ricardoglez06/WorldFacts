import { InjectionToken } from '@angular/core';

/**
 * Unsplash Access Key. Optional: when provided, the FactsService enriches
 * each place with a high-quality landscape photo from Unsplash. When empty,
 * the app falls back to real images from Wikipedia's REST summary API
 * (no key required), so the app works out of the box.
 *
 * Provide it in app.config.ts or via a build-time replacement, e.g.:
 *   { provide: UNSPLASH_ACCESS_KEY, useValue: 'YOUR_KEY' }
 */
export const UNSPLASH_ACCESS_KEY = new InjectionToken<string>('UNSPLASH_ACCESS_KEY', {
  providedIn: 'root',
  factory: () => '',
});
