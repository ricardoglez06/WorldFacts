import { Component, Input, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { PlaceFact } from '../../../core/models/place-fact.model';

@Component({
  selector: 'app-fact-card',
  standalone: true,
  imports: [],
  templateUrl: './fact-card.component.html',
  styleUrl: './fact-card.component.scss',
  animations: [
    trigger('reveal', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(22px) scale(0.99)' }),
        animate(
          '480ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0) scale(1)' })
        ),
      ]),
    ]),
  ],
})
export class FactCardComponent {
  @Input() fact!: PlaceFact;
  readonly imgFailed = signal(false);

  onImgError(): void {
    this.imgFailed.set(true);
  }
}
