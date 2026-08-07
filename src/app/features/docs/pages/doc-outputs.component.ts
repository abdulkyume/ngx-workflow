import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { OUTPUT_CATEGORIES, OUTPUT_DOCS, OutputDoc } from '../data/output-docs.data';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-outputs',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent],
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
      <app-code-block label="HTML" [code]="connectSnippet" />

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
      min-width: 560px;
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
    .output-link { text-decoration: none; }
    .output-link:hover code { filter: brightness(1.08); }
    :host ::ng-deep .prose { max-width: 100%; }

    @media (max-width: 768px) {
      th, td { padding: 10px 12px; font-size: 0.84rem; }
      code { font-size: 0.78rem; }
    }
  `]
})
export class DocOutputsComponent {
  readonly categories = OUTPUT_CATEGORIES;
  readonly docs = OUTPUT_DOCS;

  readonly connectSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  (edgesChange)="edges.set($event)"
  (connect)="onConnect($event)"
  (connectStart)="onConnectStart($event)"
  (connectEnd)="onConnectEnd($event)"
  (edgeDrop)="onEdgeDrop($event)"
/>`;

  byCategory(category: string): OutputDoc[] {
    return this.docs.filter(d => d.category === category);
  }
}
