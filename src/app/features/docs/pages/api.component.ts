import { Component } from '@angular/core';

@Component({
    selector: 'app-doc-api',
    standalone: true,
    template: `
    <div class="doc-content animate-fade-in">
      <h1>API Reference</h1>

      <h2>&lt;ngx-workflow-diagram&gt;</h2>
      <p>The main component of the library.</p>

      <h3>Inputs</h3>
      <div class="table-container">
        <table>
          <thead><tr><th>Input</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>[nodes]</code></td><td><code>Node[]</code></td><td><code>[]</code></td><td><strong>Required</strong>. Array of node objects to render.</td></tr>
            <tr><td><code>[edges]</code></td><td><code>Edge[]</code></td><td><code>[]</code></td><td><strong>Required</strong>. Array of edge objects to render.</td></tr>
            <tr><td><code>[viewOnly]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>If true, disables node dragging and interactions.</td></tr>
            <tr><td><code>[showMinimap]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows a navigation map.</td></tr>
            <tr><td><code>[showZoomControls]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Shows +/- zoom buttons.</td></tr>
            <tr><td><code>[showBackground]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Renders a background pattern.</td></tr>
            <tr><td><code>[backgroundVariant]</code></td><td><code>'dots' | 'lines'</code></td><td><code>'dots'</code></td><td>Style of the background pattern.</td></tr>
          </tbody>
        </table>
      </div>

      <h3>Outputs</h3>
      <div class="table-container">
        <table>
          <thead><tr><th>Output</th><th>Event</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td><code>(nodeClick)</code></td><td><code>Node</code></td><td>Emitted when a node is clicked.</td></tr>
            <tr><td><code>(edgeClick)</code></td><td><code>Edge</code></td><td>Emitted when an edge is clicked.</td></tr>
            <tr><td><code>(connect)</code></td><td><code>Connection</code></td><td>Emitted when two ports are connected.</td></tr>
            <tr><td><code>(backgroundClick)</code></td><td><code>MouseEvent</code></td><td>Emitted when background is clicked.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .doc-content { max-width: 800px; line-height: 1.6; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
    h2 { font-size: 1.75rem; font-weight: 700; margin-top: 48px; margin-bottom: 24px; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 32px; margin-bottom: 16px; }
    p { margin-bottom: 16px; color: var(--color-text-secondary); font-size: 1.1rem; }
    
    .table-container { 
      border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; overflow-x: auto;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; min-width: 600px; }
    th { background: var(--color-bg-surface); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    code { font-family: var(--font-mono); font-size: 0.85rem; background: var(--color-bg-surface-hover); padding: 2px 6px; border-radius: 4px; color: var(--color-text-primary); }
    strong { color: var(--color-text-primary); }
  `]
})
export class DocApiComponent { }
