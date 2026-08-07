import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'docs',
        loadComponent: () =>
          import('./features/docs/docs.component').then((m) => m.DocsComponent),
        children: [
          { path: '', redirectTo: 'intro', pathMatch: 'full' },
          {
            path: 'intro',
            loadComponent: () =>
              import('./features/docs/pages/intro.component').then((m) => m.DocIntroComponent),
          },
          {
            path: 'concepts',
            loadComponent: () =>
              import('./features/docs/pages/concepts.component').then((m) => m.DocConceptsComponent),
          },
          {
            path: 'api',
            loadComponent: () =>
              import('./features/docs/pages/api.component').then((m) => m.DocApiComponent),
          },
          {
            path: 'customization',
            loadComponent: () =>
              import('./features/docs/pages/customization.component').then(
                (m) => m.DocCustomizationComponent
              ),
          },
          {
            path: 'inputs',
            loadComponent: () =>
              import('./features/docs/pages/doc-inputs.component').then((m) => m.DocInputsComponent),
          },
          {
            path: 'inputs/:id',
            loadComponent: () =>
              import('./features/docs/pages/doc-input-detail.component').then(
                (m) => m.DocInputDetailComponent
              ),
          },
          {
            path: 'outputs',
            loadComponent: () =>
              import('./features/docs/pages/doc-outputs.component').then(
                (m) => m.DocOutputsComponent
              ),
          },
          {
            path: 'outputs/:id',
            loadComponent: () =>
              import('./features/docs/pages/doc-output-detail.component').then(
                (m) => m.DocOutputDetailComponent
              ),
          },
        ],
      },
      {
        path: 'sandbox',
        loadComponent: () =>
          import('./features/sandbox/sandbox.component').then((m) => m.SandboxComponent),
      },
      {
        path: 'examples',
        loadComponent: () =>
          import('./features/examples/examples.component').then((m) => m.ExamplesComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
