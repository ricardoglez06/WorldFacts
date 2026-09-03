import { Routes } from '@angular/router';
import { FactViewerComponent } from './features/fact-viewer/fact-viewer.component';

export const routes: Routes = [
  { path: '', component: FactViewerComponent },
  { path: '**', redirectTo: '' },
];
