import { Component, Input, OnChanges } from '@angular/core';
import { FactCategory } from '../../../core/models/place-fact.model';

@Component({
  selector: 'app-category-badge',
  standalone: true,
  template: `<span class="badge" [attr.data-cat]="category">{{ label }}</span>`,
  styles: [
    `
      .badge {
        display: inline-block;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        font-family: var(--font-body);
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #0a0a0c;
        background: var(--accent-warm);
      }
      .badge[data-cat='curioso'] {
        background: #4aa3ff;
        color: #04122b;
      }
      .badge[data-cat='escalofriante'] {
        background: #ff5a5f;
        color: #2a0507;
      }
      .badge[data-cat='raro'] {
        background: #b07cff;
        color: #1a0533;
      }
    `,
  ],
})
export class CategoryBadgeComponent implements OnChanges {
  @Input() category!: FactCategory;
  label = '';

  private readonly labels: Record<FactCategory, string> = {
    curioso: 'Curioso',
    escalofriante: 'Escalofriante',
    raro: 'Raro',
  };

  ngOnChanges(): void {
    this.label = this.category ? this.labels[this.category] : '';
  }
}
