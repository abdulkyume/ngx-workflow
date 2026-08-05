import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INPUT_CATEGORIES, INPUT_DOCS, InputDoc } from '../data/input-docs.data';

@Component({
  selector: 'app-doc-inputs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Inputs</h1>
        <p class="lead">
          Configuration options for the <code>&lt;ngx-workflow-diagram&gt;</code> component.
          Click any input for details and examples.
        </p>
      </div>

      <h2>Connection limits (quick example)</h2>
      <p>
        Cap how many edges can attach to a port. Priority:
        <code>handleConfig[port].maxConnections</code> →
        <code>node.maxConnectionsPerPort</code> →
        <code>[maxConnectionsPerHandle]</code>.
      </p>
      <pre><code>&lt;ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (nodesChange)="nodes.set($event)"
  (edgesChange)="edges.set($event)"
/&gt;

// Per-node / per-port overrides
nodes.set([&#123;
  id: 'process',
  label: 'Process',
  position: &#123; x: 120, y: 80 &#125;,
  ports: 4,
  maxConnectionsPerPort: 1,
  handleConfig: &#123;
    bottom: &#123; maxConnections: 3 &#125;
  &#125;
&#125;]);</code></pre>
      <p class="text-muted">
        These fields are also editable in the properties sidebar when a node is selected
        (“Max connections / port” and “Per-port limits”).
      </p>

      @for (category of categories; track category) {
        <h2>{{ category }}</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th width="22%">Input</th>
                <th width="28%">Type</th>
                <th width="14%">Default</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              @for (item of byCategory(category); track item.name) {
                <tr>
                  <td>
                    <a [routerLink]="['/docs/inputs', item.name]" class="input-link">
                      <code>[{{ item.name }}]</code>
                    </a>
                  </td>
                  <td><code>{{ item.type }}</code></td>
                  <td><code>{{ item.default }}</code></td>
                  <td>{{ item.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <h2>Node model fields (not diagram inputs)</h2>
      <p>Set these on each <code>Node</code> object in <code>[nodes]</code>:</p>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="28%">Field</th>
              <th width="28%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>ports</code></td>
              <td><code>0 | 1 | 2 | 3 | 4</code></td>
              <td>0=None, 1=Top, 2=Top/Bottom, 3=Left/Right, 4=All (default).</td>
            </tr>
            <tr>
              <td><code>maxConnectionsPerPort</code></td>
              <td><code>number</code></td>
              <td>Default max edges for every port on this node.</td>
            </tr>
            <tr>
              <td><code>handleConfig[id].maxConnections</code></td>
              <td><code>number</code></td>
              <td>Override limit for a specific port (<code>top</code>, <code>right</code>, <code>bottom</code>, <code>left</code>).</td>
            </tr>
            <tr>
              <td><code>handleConfig[id].isConnectable</code></td>
              <td><code>boolean | number | fn</code></td>
              <td>Whether the port accepts connections (number = max count).</td>
            </tr>
            <tr>
              <td><code>easyConnect</code></td>
              <td><code>boolean</code></td>
              <td>Drag from node body to start a connection (use <code>.drag-handle</code> to move).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .table-wrapper { margin: 1.5rem 0; border: 1px solid var(--color-border); border-radius: 8px; box-shadow: var(--shadow-sm); overflow: hidden; }
    table { width: 100%; text-align: left; border-collapse: collapse; table-layout: fixed; }
    th { background: var(--color-bg-surface); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); font-size: 0.9rem; white-space: nowrap; word-wrap: break-word; }
    td { padding: 14px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 0.9rem; vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
    tr:last-child td { border-bottom: none; }
    code { font-size: 0.85rem; color: var(--color-primary); background: rgba(37, 99, 235, 0.05); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(37, 99, 235, 0.1); white-space: pre-wrap; word-break: break-all; font-family: var(--font-mono); }
    .input-link { text-decoration: none; }
    .input-link:hover code { background: rgba(37, 99, 235, 0.12); }
    pre { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; }
    pre code { background: none; border: none; color: var(--color-text-primary); padding: 0; }
    .text-muted { color: var(--color-text-secondary); font-size: 0.95rem; }
    :host ::ng-deep .prose { max-width: 100%; }
  `]
})
export class DocInputsComponent {
  readonly categories = INPUT_CATEGORIES;
  readonly docs = INPUT_DOCS;

  byCategory(category: string): InputDoc[] {
    return this.docs.filter(d => d.category === category);
  }
}
