import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxWorkflowModule, Node, Edge, createNode, createEdge } from 'ngx-workflow';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-cookbook',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Cookbook</span>
      <h1>Nodes, edges, handles & performance</h1>
      <p class="lead text-muted">
        Feature recipes aligned with the ngx-vflow docs IA — implemented with ngx-workflow’s API.
      </p>

      <h2 id="factories">createNode / createEdge</h2>
      <app-code-block label="TypeScript" [code]="factorySnippet" />

      <h2 id="templates">HTML & SVG template nodes</h2>
      <p>Use <code>type: 'html-template'</code> or <code>type: 'svg-template'</code> with projected templates.</p>
      <app-code-block label="HTML" [code]="templateSnippet" />

      <h2 id="custom-edges">Custom edges</h2>
      <p>Register components via <code>NGX_WORKFLOW_EDGE_TYPES</code> / <code>[edgeTypes]</code>, or pass <code>[edgeTemplate]</code>.</p>
      <app-code-block label="TypeScript" [code]="edgeSnippet" />

      <h2 id="edge-routing">Direction-aware bezier routing</h2>
      <p>
        Pass <code>sourceHandle</code> / <code>targetHandle</code> so curves leave and enter the correct ports.
        Vertical stacks should use <code>bottom → top</code> (or <code>top → bottom</code>).
      </p>
      <app-code-block label="TypeScript" [code]="routingSnippet" />

      <h2 id="modes">Connection & selection modes</h2>
      <ul>
        <li><code>connectionMode="loose"</code> — handles optional (default).</li>
        <li><code>connectionMode="strict"</code> — both handles required.</li>
        <li><code>selectionMode="partial"</code> — lasso intersects node (default).</li>
        <li><code>selectionMode="full"</code> — node must be fully inside the lasso.</li>
      </ul>

      <h2 id="changes">Typed change streams</h2>
      <p>
        Listen to <code>(nodeChanges)</code> / <code>(edgeChanges)</code> for granular updates.
        Filter with host inputs <code>filterNodeTypes</code> / <code>filterEdgeTypes</code>
        and <code>(filteredNodeChanges)</code> / <code>(filteredEdgeChanges)</code>.
      </p>
      <app-code-block label="HTML" [code]="changesSnippet" />

      <h2 id="legend-inspector">Workflow Legend & Custom API Inspector</h2>
      <p>
        Combine <code>&lt;ngx-workflow-panel&gt;</code> with <code>[showPropertiesSidebar]="false"</code>
        and <code>(nodeDoubleClick)</code> to render rich status cards and fetch backend schemas on demand.
      </p>
      <app-code-block label="HTML & TypeScript" [code]="legendInspectorSnippet" />

      <h2 id="live-demo">Live mini demo</h2>
      <div class="demo-frame">
        @defer (on timer(1ms)) {
          <ngx-workflow-diagram
            [nodes]="nodes()"
            [edges]="edges()"
            [showMinimap]="false"
            [showSearchControls]="false"
            [fitViewOnInit]="true"
            connectionMode="loose"
            selectionMode="partial"
            [optimization]="{ lazyLoadTrigger: 'immediate', detachedGroupsLayer: true }"
            (nodeChanges)="lastChanges.set($event.length + ' node change(s)')"
          />
        } @placeholder {
          <div class="demo-placeholder">Diagram canvas</div>
        }
      </div>
      <p class="text-muted">{{ lastChanges() }}</p>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/testing" class="btn btn-primary">Next: Testing →</a>
        <a routerLink="/docs/customization" class="btn btn-secondary">Customization</a>
      </div>
    </article>
  `,
  styles: [
    `
      .demo-frame {
        height: 380px;
        border: 1px solid var(--border, #e5e7eb);
        border-radius: 8px;
        overflow: hidden;
      }
    `,
  ],
})
export class DocCookbookComponent {
  readonly lastChanges = signal('Interact with the canvas to see nodeChanges…');

  readonly nodes = signal<Node[]>([
    createNode({ id: '1', label: 'Source', position: { x: 40, y: 40 }, ports: 4 }),
    createNode({ id: '2', label: 'Sink', position: { x: 280, y: 40 }, ports: 4 }),
    createNode({ id: '3', label: 'Start', position: { x: 160, y: 140 }, ports: 4 }),
    createNode({ id: '4', label: 'End', position: { x: 160, y: 260 }, ports: 4 }),
  ]);

  readonly edges = signal<Edge[]>([
    createEdge({
      id: 'e1',
      source: '1',
      target: '2',
      type: 'bezier',
      sourceHandle: 'right',
      targetHandle: 'left',
      edgeLabels: { center: '→' },
      animated: true,
    }),
    createEdge({
      id: 'e2',
      source: '3',
      target: '4',
      type: 'bezier',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      edgeLabels: { center: '↓' },
      animated: true,
    }),
  ]);

  readonly factorySnippet = `import { createNode, createEdge } from 'ngx-workflow';

const nodes = [
  createNode({ label: 'A', position: { x: 0, y: 0 } }),
  createNode({ label: 'B', position: { x: 200, y: 0 } }),
];
const edges = [
  createEdge({ source: nodes[0].id, target: nodes[1].id, type: 'bezier' }),
];`;

  readonly templateSnippet = `<ngx-workflow-diagram [nodes]="nodes" [edges]="edges">
  <ng-template #nodeHtmlTemplate let-ctx>
    <div class="card">{{ ctx.data?.title }}</div>
  </ng-template>
</ngx-workflow-diagram>`;

  readonly edgeSnippet = `providers: [{
  provide: NGX_WORKFLOW_EDGE_TYPES,
  useValue: { 'glow': GlowEdgeComponent }
}]

// edge.type = 'glow'`;

  readonly routingSnippet = `createEdge({
  source: 'start',
  target: 'end',
  type: 'bezier',
  sourceHandle: 'bottom',
  targetHandle: 'top',
});`;

  readonly changesSnippet = `<ngx-workflow-diagram
  [nodes]="nodes"
  [edges]="edges"
  [filterNodeTypes]="['position', 'select']"
  (filteredNodeChanges)="onFiltered($event)"
  (nodeChanges)="onAll($event)"
/>`;

  readonly legendInspectorSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [showPropertiesSidebar]="false"
  (nodeDoubleClick)="onNodeDoubleClick($event)"
  (paneClick)="closeInspector()"
>
  <!-- Fixed Workflow Legend Panel -->
  <ngx-workflow-panel [position]="'top-right'" [style]="{ minWidth: '280px' }">
    <div class="legend-card">
      <h4>Workflow Legend</h4>
      <div class="item"><span class="dot bg-blue"></span> Active Ingestion</div>
      <div class="item"><span class="dot bg-emerald"></span> Database Sink</div>
    </div>
  </ngx-workflow-panel>

  <!-- Contextual API Inspector Panel on Double-Click -->
  @if (inspectorOpen()) {
    <ngx-workflow-panel [position]="'center-right'" [style]="{ zIndex: 30 }">
      <div class="inspector-card glass-panel">
        <h4>{{ activeNode()?.label }} API Schema</h4>
        <p>Endpoint: {{ activeConfig()?.endpoint }}</p>
        <button (click)="saveAndSync()">Save & Sync API</button>
      </div>
    </ngx-workflow-panel>
  }
</ngx-workflow-diagram>`;
}
