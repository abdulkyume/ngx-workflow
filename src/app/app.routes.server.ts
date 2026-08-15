import { RenderMode, ServerRoute } from '@angular/ssr';
import { INPUT_DOCS } from './features/docs/data/input-docs.data';
import { OUTPUT_DOCS } from './features/docs/data/output-docs.data';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'sandbox', renderMode: RenderMode.Prerender },
  { path: 'examples', renderMode: RenderMode.Prerender },
  {
    path: 'docs/inputs/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => INPUT_DOCS.map((d) => ({ id: d.name })),
  },
  {
    path: 'docs/outputs/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => OUTPUT_DOCS.map((d) => ({ id: d.name })),
  },
  { path: '**', renderMode: RenderMode.Prerender },
];
