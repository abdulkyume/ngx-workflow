import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OUTPUT_DOCS } from '../data/output-docs.data';
import { NgxWorkflowModule } from 'ngx-workflow';

@Component({
  selector: 'app-doc-output-detail',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (output(); as item) {
      <div class="doc-detail">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/docs/outputs">Outputs</a>
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
        </div>

        <hr class="divider" />

        @if (item.example) {
          <section>
            <h2>Usage</h2>
            <pre><code>{{ item.example }}</code></pre>
          </section>
        }

        <div class="playground">
          <section>
            <h2>Interactive example</h2>
            <div class="preview-frame">
              <ngx-workflow-diagram
                [nodes]="nodes"
                [edges]="edges"
                [showBackground]="true"
                (nodeClick)="logEvent('nodeClick', $event)"
                (nodeDoubleClick)="logEvent('nodeDoubleClick', $event)"
                (edgeClick)="logEvent('edgeClick', $event)"
                (connect)="logEvent('connect', $event)"
                (connectStart)="logEvent('connectStart', $event)"
                (connectEnd)="logEvent('connectEnd', $event)"
                (edgeDrop)="logEvent('edgeDrop', $event)"
                (nodesChange)="logEvent('nodesChange', $event)"
                (edgesChange)="logEvent('edgesChange', $event)"
                (paneClick)="logEvent('paneClick', $event)"
                (paneScroll)="logEvent('paneScroll', $event)"
                (contextMenu)="logEvent('contextMenu', $event)"
                (nodeMouseEnter)="logEvent('nodeMouseEnter', $event)"
                (nodeMouseLeave)="logEvent('nodeMouseLeave', $event)"
                (nodeMouseMove)="logEvent('nodeMouseMove', $event)"
                (edgeMouseEnter)="logEvent('edgeMouseEnter', $event)"
                (edgeMouseLeave)="logEvent('edgeMouseLeave', $event)"
                (beforeDelete)="logEvent('beforeDelete', $event)"
                (importError)="logEvent('importError', $event)"
              />
            </div>
            <p class="hint">Interact with nodes and edges. Drag port-to-port to fire connect events.</p>
          </section>

          <section class="log-panel glass-panel">
            <div class="log-header">
              <h3>Event log</h3>
              <button type="button" class="btn btn-sm btn-outline" (click)="logs.set([])">Clear</button>
            </div>
            <div class="log-body">
              @if (logs().length === 0) {
                <p class="empty">No events logged yet.</p>
              }
              @for (log of logs(); track $index) {
                <div class="log-row" [class.highlight]="log.event === item.name">
                  <div class="log-meta">
                    <span>{{ log.time }}</span>
                    <strong>{{ log.event }}</strong>
                  </div>
                  <pre>{{ log.data }}</pre>
                </div>
              }
            </div>
          </section>
        </div>
      </div>
    } @else {
      <div class="doc-detail" style="text-align:center;padding:64px 0">
        <h2>Output not found</h2>
        <a routerLink="/docs/outputs" class="btn btn-secondary">Back to Outputs</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    h2, h3 {
      font-family: var(--font-display);
      margin: 0 0 12px;
    }
    h2 { font-size: 1.4rem; }
    h3 { font-size: 1.05rem; }
    pre {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 14px;
      overflow: auto;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-text-primary);
      margin: 0 0 20px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .playground {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .hint {
      margin: 10px 0 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
    .log-panel {
      border-radius: var(--radius-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 400px;
      max-height: 520px;
    }
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      border-bottom: 1px solid var(--color-border);
    }
    .log-body {
      flex: 1;
      overflow: auto;
      padding: 12px;
    }
    .empty {
      text-align: center;
      color: var(--color-text-muted);
      font-style: italic;
    }
    .log-row {
      border-left: 2px solid var(--color-border);
      padding: 0 0 12px 10px;
      margin-bottom: 10px;
    }
    .log-row.highlight { border-left-color: var(--color-primary); }
    .log-meta {
      display: flex;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-bottom: 4px;
    }
    .log-meta strong { color: var(--color-text-primary); }
    .log-row pre {
      margin: 0;
      padding: 8px;
      font-size: 0.72rem;
      background: var(--color-bg-base);
    }
    @media (max-width: 960px) {
      .playground { grid-template-columns: 1fr; }
    }
  `],
})
export class DocOutputDetailComponent {
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.params);

  output = computed(() => {
    const name = this.params()?.['id'];
    return OUTPUT_DOCS.find((i) => i.name === name);
  });

  logs = signal<Array<{ time: string; event: string; data: string }>>([]);

  nodes = [
    { id: '1', position: { x: 50, y: 50 }, label: 'Click Me' },
    { id: '2', position: { x: 250, y: 150 }, label: 'Drag Me' },
  ];
  edges = [{ id: 'e1-2', source: '1', target: '2', label: 'Connect' }];

  logEvent(eventName: string, data: unknown): void {
    const time = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dataStr = JSON.stringify(data, (key, value) => {
      if (key === 'source' && value?.view) return '[Window]';
      return value;
    });
    this.logs.update((prev) => [{ time, event: eventName, data: dataStr }, ...prev].slice(0, 50));
  }
}
