import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OUTPUT_CATEGORIES, OUTPUT_DOCS, OutputDoc } from '../data/output-docs.data';

@Component({
  selector: 'app-doc-outputs',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Outputs</h1>
        <p class="lead">
          Events emitted by the <code>&lt;ngx-workflow-diagram&gt;</code> component.
          Click any output for details and examples.
        </p>
      </div>

      <h2>Connecting ports (quick example)</h2>
      <p>
        Drag from one port to another to create an edge. Listen to connect lifecycle events:
      </p>
      <pre><code>&lt;ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  (edgesChange)="edges.set($event)"
  (connect)="onConnect($event)"
  (connectStart)="onConnectStart($event)"
  (connectEnd)="onConnectEnd($event)"
  (edgeDrop)="onEdgeDrop($event)"
/&gt;</code></pre>

      @for (category of categories; track category) {
        <h2>{{ category }}</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th width="22%">Output</th>
                <th width="38%">Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              @for (item of byCategory(category); track item.name) {
                <tr>
                  <td>
                    <a [routerLink]="['/docs/outputs', item.name]" class="output-link">
                      <code>({{ item.name }})</code>
                    </a>
                  </td>
                  <td><code>{{ item.type }}</code></td>
                  <td>{{ item.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
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
    .output-link { text-decoration: none; }
    .output-link:hover code { background: rgba(37, 99, 235, 0.12); }
    pre { background: var(--color-bg-surface); border: 1px solid var(--color-border); border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; }
    pre code { background: none; border: none; color: var(--color-text-primary); padding: 0; }
    :host ::ng-deep .prose { max-width: 100%; }
  `]
})
export class DocOutputsComponent {
  readonly categories = OUTPUT_CATEGORIES;
  readonly docs = OUTPUT_DOCS;

  byCategory(category: string): OutputDoc[] {
    return this.docs.filter(d => d.category === category);
  }
}
