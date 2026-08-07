import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INPUT_CATEGORIES, INPUT_DOCS, InputDoc } from '../data/input-docs.data';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-inputs',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent],
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
      <app-code-block label="TypeScript" [code]="connectionLimitsSnippet" />
      <p class="text-muted">
        These fields (and RGBA colors, edge animation, markers) are also editable in the properties sidebar when a node is selected
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
    .table-wrapper {
      margin: 1.5rem 0;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      background: var(--color-bg-elevated);
    }
    table {
      width: 100%;
      min-width: 640px;
      text-align: left;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th {
      background: var(--color-bg-surface);
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: 0.9rem;
      white-space: nowrap;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      font-size: 0.9rem;
      vertical-align: top;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    tr:last-child td { border-bottom: none; }
    code {
      font-size: 0.85rem;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--color-border-strong);
      white-space: pre-wrap;
      word-break: normal;
      overflow-wrap: anywhere;
      font-family: var(--font-mono);
    }
    .input-link { text-decoration: none; }
    .input-link:hover code { filter: brightness(1.08); }
    .text-muted { color: var(--color-text-secondary); font-size: 0.95rem; }
    :host ::ng-deep .prose { max-width: 100%; }

    @media (max-width: 768px) {
      th, td { padding: 10px 12px; font-size: 0.84rem; }
      code { font-size: 0.78rem; }
    }
  `]
})
export class DocInputsComponent {
  readonly categories = INPUT_CATEGORIES;
  readonly docs = INPUT_DOCS;

  readonly connectionLimitsSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (nodesChange)="nodes.set($event)"
  (edgesChange)="edges.set($event)"
/>

// Per-node / per-port overrides
nodes.set([{
  id: 'process',
  label: 'Process',
  position: { x: 120, y: 80 },
  ports: 4,
  maxConnectionsPerPort: 1,
  handleConfig: {
    bottom: { maxConnections: 3 }
  }
}]);`;

  byCategory(category: string): InputDoc[] {
    return this.docs.filter(d => d.category === category);
  }
}
