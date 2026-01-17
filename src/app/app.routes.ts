import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { HomeComponent } from './features/home/home.component';
import { DocsComponent } from './features/docs/docs.component';
import { ExamplesComponent } from './features/examples/examples.component';

export const routes: Routes = [
    {
        path: '',
        component: MainLayoutComponent,
        children: [
            { path: '', component: HomeComponent },
            {
                path: 'docs',
                component: DocsComponent,
                children: [
                    { path: '', redirectTo: 'intro', pathMatch: 'full' },
                    { path: 'intro', loadComponent: () => import('./features/docs/pages/intro.component').then(m => m.DocIntroComponent) },
                    { path: 'concepts', loadComponent: () => import('./features/docs/pages/concepts.component').then(m => m.DocConceptsComponent) },
                    { path: 'api', loadComponent: () => import('./features/docs/pages/api.component').then(m => m.DocApiComponent) },
                    { path: 'customization', loadComponent: () => import('./features/docs/pages/customization.component').then(m => m.DocCustomizationComponent) },
                    { path: 'inputs', loadComponent: () => import('./features/docs/pages/doc-inputs.component').then(m => m.DocInputsComponent) },
                    { path: 'inputs/:id', loadComponent: () => import('./features/docs/pages/doc-input-detail.component').then(m => m.DocInputDetailComponent) },
                    { path: 'outputs', loadComponent: () => import('./features/docs/pages/doc-outputs.component').then(m => m.DocOutputsComponent) },
                    { path: 'outputs/:id', loadComponent: () => import('./features/docs/pages/doc-output-detail.component').then(m => m.DocOutputDetailComponent) }
                ]
            },
            { path: 'examples', component: ExamplesComponent }
        ]
    },
    { path: '**', redirectTo: '' }
];
