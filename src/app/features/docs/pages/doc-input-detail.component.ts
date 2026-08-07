import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { INPUT_DOCS } from '../data/input-docs.data';
import { NgxWorkflowModule } from 'ngx-workflow';

@Component({
  selector: 'app-doc-input-detail',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (input(); as item) {
      <div class="doc-detail">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/docs/inputs">Inputs</a>
          <span>/</span>
          <span>{{ item.name }}</span>
        </nav>

        <h1>{{ item.name }}</h1>
        <p class="lead">{{ item.description }}</p>

        <div class="meta-row">
          <div class="meta-item">
            <span class="meta-label">Category</span>
            <span class="meta-value">{{ item.category }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Type</span>
            <code class="meta-code">{{ item.type }}</code>
          </div>
          @if (item.default !== 'undefined') {
            <div class="meta-item">
              <span class="meta-label">Default</span>
              <code class="meta-code">{{ item.default }}</code>
            </div>
          }
        </div>

        <hr class="divider" />

        @if (item.example) {
          <section>
            <h2>Example</h2>
            <pre class="prose"><code>{{ item.example }}</code></pre>
          </section>
        }

        <section>
          <h2>Interactive preview</h2>
          <p class="lead">Try the diagram (drag ports to connect):</p>
          <div class="preview-frame">
            <ngx-workflow-diagram
              [nodes]="nodes"
              [edges]="edges"
              [showBackground]="true"
              [maxConnectionsPerHandle]="2"
            />
            <div class="preview-badge">ngx-workflow-diagram</div>
          </div>
        </section>
      </div>
    } @else {
      <div class="doc-detail" style="text-align:center;padding:64px 0">
        <h2>Input not found</h2>
        <a routerLink="/docs/inputs" class="btn btn-secondary">Back to Inputs</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    h2 {
      font-family: var(--font-display);
      font-size: 1.4rem;
      margin: 0 0 12px;
    }
    pre {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      overflow: auto;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: var(--color-text-primary);
    }
  `],
})
export class DocInputDetailComponent {
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.params);

  input = computed(() => {
    const name = this.params()?.['id'];
    return INPUT_DOCS.find((i) => i.name === name);
  });

  nodes = [
    { id: '1', position: { x: 80, y: 100 }, label: 'Node A', ports: 4, maxConnectionsPerPort: 2 },
    { id: '2', position: { x: 320, y: 100 }, label: 'Node B', ports: 4 },
  ];
  edges = [
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', label: 'Edge' },
  ];
}
