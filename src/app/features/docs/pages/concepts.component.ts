import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-concepts',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Core Architecture</span>
      <h1>Core Concepts & Reactive Architecture</h1>

      <p class="lead text-muted">
        Understanding the internal mechanics of <code>ngx-workflow</code> will help you build complex interactive diagram editors efficiently.
      </p>

      <h2 id="signals-state-model">1. Signals State Management</h2>
      <p>
        At the core of <code>ngx-workflow</code> is <code>DiagramStateService</code>. Instead of relying on continuous change detection cycles or heavy RxJS subscription chains for mouse movements, diagram state is modeled using Angular <code>signal()</code> and <code>computed()</code> primitives:
      </p>

      <app-code-block label="TypeScript" [code]="signalsSnippet" />

      <div class="callout callout-success">
        <div class="callout-title">⚡ Performance Impact</div>
        <div>Because nodes and handles consume Signal inputs directly, dragging a single node only updates that specific node component's transform without re-evaluating the rest of the diagram subtree!</div>
      </div>

      <h2 id="viewport-matrix">2. Viewport Transform & Canvas Coordinates</h2>
      <p>
        The diagram viewport handles pan (translate) and zoom (scale). All node positions are maintained in absolute graph space <code>(x, y)</code>, while the viewport transform matrix converts them to DOM client coordinates:
      </p>

      <app-code-block label="Formula" [code]="viewportSnippet" />

      <p>
        When users drag nodes, <code>ngx-workflow</code> automatically converts mouse offset events back into graph space coordinates, taking the current zoom level and pan offset into account.
      </p>

      <h2 id="handles-registry">3. Handles, Ports & Connecting</h2>
      <p>
        Connections originate and terminate at <strong>Handles</strong> (ports). Default nodes expose
        <code>top</code> / <code>right</code> / <code>bottom</code> / <code>left</code> based on
        <code>node.ports</code> (<code>0</code>=none … <code>4</code>=all).
      </p>

      <ul>
        <li><strong>Manual connect:</strong> drag from one port to another — a preview edge follows the pointer.</li>
        <li><strong>Auto-connect:</strong> drag a node near another (within <code>[proximityThreshold]</code>) to snap a link.</li>
        <li><strong>Limits:</strong> <code>handleConfig[port].maxConnections</code> → <code>maxConnectionsPerPort</code> → <code>[maxConnectionsPerHandle]</code>.</li>
        <li>Handles register with <code>HandleRegistryService</code> for typed <code>dataType</code> checks and connectability.</li>
      </ul>

      <app-code-block label="HTML" [code]="connectSnippet" />

      <h2 id="auto-layout">4. ELK.js Auto-Layout Engine</h2>
      <p>
        <code>ngx-workflow</code> includes <code>AutoLayoutService</code> which delegates layout computation to the Eclipse Layout Kernel (ELK). You can invoke auto-layout at any time:
      </p>

      <app-code-block label="TypeScript" [code]="layoutSnippet" />

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/api" class="btn btn-primary">Next: API Reference →</a>
        <a routerLink="/docs/customization" class="btn btn-secondary">Customization Guide</a>
      </div>
    </article>
  `
})
export class DocConceptsComponent {
  readonly signalsSnippet = `// State Architecture Overview
diagramState = {
  nodes: signal<WorkflowNode[]>([]),
  edges: signal<WorkflowEdge[]>([]),
  viewport: signal<ViewportState>({ x: 0, y: 0, zoom: 1 }),
  selectedNodeIds: signal<Set<string>>(new Set())
};`;

  readonly viewportSnippet = `DOM_X = (Graph_X * Zoom) + Pan_X
DOM_Y = (Graph_Y * Zoom) + Pan_Y`;

  readonly connectSnippet = `// Manual + limited connections
<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (connectStart)="..."
  (connect)="..."
  (edgesChange)="edges.set($event)"
/>`;

  readonly layoutSnippet = `import { AutoLayoutService } from 'ngx-workflow';

// Inject service in your component
private autoLayout = inject(AutoLayoutService);

async arrangeDiagram() {
  // Directions: 'TB' (Top-to-Bottom), 'LR' (Left-to-Right), 'BT', 'RL'
  await this.autoLayout.applyLayout('LR');
}`;
}
