import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="loading" role="status" aria-live="polite">
      <div class="spinner" aria-hidden="true"></div>
      <p class="loading__text">Cargando lugares increíbles…</p>
    </div>
  `,
  styles: [
    `
      .loading {
        position: fixed;
        inset: 0;
        display: grid;
        place-content: center;
        justify-items: center;
        gap: 1.25rem;
        background: var(--bg-deep);
        color: var(--text-primary);
        z-index: 30;
      }
      .spinner {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: 4px solid rgba(255, 255, 255, 0.15);
        border-top-color: var(--accent-warm);
        animation: spin 0.9s linear infinite;
      }
      .loading__text {
        font-family: var(--font-body);
        letter-spacing: 0.04em;
        opacity: 0.85;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .spinner {
          animation-duration: 2.4s;
        }
      }
    `,
  ],
})
export class LoadingSpinnerComponent {}
