import {
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FactsService } from '../../core/services/facts.service';
import { PlaceFact } from '../../core/models/place-fact.model';
import { FactCardComponent } from './fact-card/fact-card.component';
import { NavArrowComponent } from '../../shared/components/nav-arrow/nav-arrow.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-fact-viewer',
  standalone: true,
  imports: [FactCardComponent, NavArrowComponent, LoadingSpinnerComponent],
  templateUrl: './fact-viewer.component.html',
  styleUrl: './fact-viewer.component.scss',
})
export class FactViewerComponent implements OnInit {
  private readonly factsService = inject(FactsService);

  readonly total = this.factsService.total;
  readonly loadingMore = this.factsService.loadingMore;
  readonly places = this.factsService.places;
  readonly facts = this.factsService.facts;

  readonly currentIndex = signal(0);

  readonly currentFact = computed<PlaceFact | null>(() => {
    const list = this.facts();
    const i = this.currentIndex();
    return i < list.length ? list[i] : null;
  });

  readonly waiting = computed(
    () => this.total() === 0 || (this.currentFact() === null && this.total() > 0)
  );

  constructor() {
    // Prefetch current + neighbours whenever the index changes.
    effect(() => {
      this.factsService.prefetch(this.currentIndex());
    });
  }

  ngOnInit(): void {
    this.factsService.init();
  }

  next(): void {
    const len = this.total();
    if (len === 0) {
      return;
    }
    const i = this.currentIndex();
    if (i + 1 < len) {
      this.currentIndex.set(i + 1);
    } else {
      // Endless: grow the catalog, otherwise wrap around.
      if (this.factsService.loadingMore()) {
        this.currentIndex.set(0);
      } else {
        this.factsService.loadMore();
        this.currentIndex.set(0);
      }
    }
  }

  prev(): void {
    const len = this.total();
    if (len === 0) {
      return;
    }
    const i = this.currentIndex();
    this.currentIndex.set(i === 0 ? len - 1 : i - 1);
  }

  goTo(index: number): void {
    if (index < 0 || index >= this.total() || index === this.currentIndex()) {
      return;
    }
    this.currentIndex.set(index);
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.next();
    } else if (event.key === 'ArrowLeft') {
      this.prev();
    }
  }

  trackById = (_: number, item: PlaceFact | null): string =>
    item?.id ?? `empty-${_}`;
}
