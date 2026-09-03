import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-nav-arrow',
  standalone: true,
  template: `
    <button
      type="button"
      class="nav-arrow"
      [class.nav-arrow--right]="direction === 'right'"
      [attr.aria-label]="direction === 'right' ? 'Siguiente hecho' : 'Hecho anterior'"
      (click)="navigate.emit()"
    >
      <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
        <path
          [attr.d]="direction === 'right' ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  `,
  styles: [
    `
      .nav-arrow {
        position: fixed;
        top: 50%;
        left: clamp(12px, 3vw, 40px);
        transform: translateY(-50%);
        z-index: 20;
        width: clamp(48px, 5vw, 64px);
        height: clamp(48px, 5vw, 64px);
        display: grid;
        place-items: center;
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.08);
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-radius: 50%;
        cursor: pointer;
        backdrop-filter: blur(6px);
        transition: border-color 0.25s ease, background 0.25s ease,
          transform 0.25s ease;
      }
      .nav-arrow--right {
        left: auto;
        right: clamp(12px, 3vw, 40px);
      }
      .nav-arrow:hover {
        border-color: var(--accent-warm);
        background: rgba(232, 179, 57, 0.14);
        transform: translateY(-50%) scale(1.06);
      }
      .nav-arrow:focus-visible {
        outline: 2px solid var(--accent-warm);
        outline-offset: 3px;
      }
      @media (max-width: 768px) {
        .nav-arrow {
          top: auto;
          bottom: clamp(16px, 4vh, 32px);
          transform: none;
        }
        .nav-arrow:hover {
          transform: scale(1.06);
        }
        .nav-arrow--right {
          right: clamp(16px, 6vw, 32px);
        }
        .nav-arrow:not(.nav-arrow--right) {
          left: clamp(16px, 6vw, 32px);
        }
      }
    `,
  ],
})
export class NavArrowComponent {
  @Input() direction: 'left' | 'right' = 'left';
  @Output() navigate = new EventEmitter<void>();
}
