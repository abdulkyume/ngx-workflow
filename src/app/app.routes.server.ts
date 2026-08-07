import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Diagram-heavy routes stay Client-rendered: ngx-workflow-diagram uses
 * window HostListeners / ResizeObserver that tear down unsafely during SSG.
 * Content docs are prerendered so Google gets real HTML.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Client },
  { path: 'sandbox', renderMode: RenderMode.Client },
  { path: 'examples', renderMode: RenderMode.Client },
  { path: 'docs/inputs/:id', renderMode: RenderMode.Client },
  { path: 'docs/outputs/:id', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
