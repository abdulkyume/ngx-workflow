import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Diagram-heavy playgrounds stay Client-rendered: ngx-workflow-diagram uses
 * window HostListeners / ResizeObserver that tear down unsafely during SSG.
 *
 * Home + docs are prerendered so Google gets real HTML (diagrams on home only
 * mount in the browser via afterNextRender).
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'sandbox', renderMode: RenderMode.Client },
  { path: 'examples', renderMode: RenderMode.Client },
  { path: 'docs/inputs/:id', renderMode: RenderMode.Client },
  { path: 'docs/outputs/:id', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
