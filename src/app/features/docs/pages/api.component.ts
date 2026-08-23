import { Component, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';
import { CopyCodeComponent } from '../../../shared/ui/copy-code.component';

interface InputRow {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
}

interface OutputRow {
  name: string;
  payload: string;
  description: string;
}

@Component({
  selector: 'app-doc-api',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent, CopyCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Reference</span>
      <h1>API Reference</h1>

      <p class="lead text-muted">
        Component inputs, outputs, models, and services in <code>ngx-workflow</code>.
        For the full tables with examples, see
        <a routerLink="/docs/inputs">Inputs</a> and
        <a routerLink="/docs/outputs">Outputs</a>.
        For generated class/API docs (Compodoc), open
        <a href="/compodoc/" target="_blank" rel="noopener">/compodoc/</a>.
      </p>

      <p>
        <a class="btn btn-secondary" href="/compodoc/" target="_blank" rel="noopener">
          Open Compodoc API docs →
        </a>
      </p>

      <h2 id="connection-limits">Connection limits</h2>
      <p>
        Limit how many edges can attach to a port. Resolution order (first wins):
      </p>
      <ol class="priority-list">
        <li>
          <app-copy-code code="node.handleConfig[port].maxConnections" />
        </li>
        <li>
          <app-copy-code code="node.maxConnectionsPerPort" />
        </li>
        <li>
          <app-copy-code code="[maxConnectionsPerHandle]" />
          <span class="suffix">on the diagram</span>
        </li>
      </ol>

      <app-code-block label="TypeScript" [code]="connectionLimitsSnippet" />

      <p>
        In the sandbox / properties sidebar you can edit
        <strong>Max connections / port</strong> and <strong>Per-port limits</strong> when a node is selected.
        The same sidebar exposes RGBA pickers for node and edge colors, plus edge animation type/speed and markers.
        If you mount <code>&lt;ngx-workflow-properties-sidebar&gt;</code> yourself, bind
        <code>(nodeChange)</code> (not <code>(change)</code>) and <code>(edgeChange)</code>.
      </p>

      <h2 id="diagram-component-inputs">Key Diagram Inputs</h2>
      <p><a routerLink="/docs/inputs">Browse all inputs →</a></p>

      <div class="matrix-table-wrap">
        <table class="matrix-table cols-4">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            @for (row of inputRows; track row.name) {
              <tr>
                <td>
                  <div class="cell-stack">
                    <code class="mono">{{ row.name }}</code>
                    <button
                      type="button"
                      class="mini-copy"
                      [class.copied]="copiedKey() === row.name"
                      (click)="copyText(row.name)">
                      {{ copiedKey() === row.name ? 'Copied' : 'Copy' }}
                    </button>
                  </div>
                </td>
                <td><code class="mono">{{ row.type }}</code></td>
                <td><code class="mono">{{ row.defaultValue }}</code></td>
                <td class="desc">{{ row.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <h2 id="optimization">Large-graph optimization</h2>
      <p>
        Off-screen nodes are culled with a cached spatial hash (rebuild on graph changes, query on pan/zoom).
        Selected nodes stay mounted; adaptive buffer scales with zoom; optional
        <code>maxRenderedNodes</code> soft-caps density. See Compodoc for
        <code>FlowOptimization</code> and <code>SpatialIndex</code>.
      </p>
      <app-code-block label="TypeScript" [code]="optimizationSnippet" />

      <h2 id="diagram-component-outputs">Key Diagram Outputs</h2>
      <p><a routerLink="/docs/outputs">Browse all outputs →</a></p>

      <div class="matrix-table-wrap">
        <table class="matrix-table cols-3">
          <thead>
            <tr>
              <th>Event</th>
              <th>Payload</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            @for (row of outputRows; track row.name) {
              <tr>
                <td>
                  <div class="cell-stack">
                    <code class="mono">{{ row.name }}</code>
                    <button
                      type="button"
                      class="mini-copy"
                      [class.copied]="copiedKey() === row.name"
                      (click)="copyText(row.name)">
                      {{ copiedKey() === row.name ? 'Copied' : 'Copy' }}
                    </button>
                  </div>
                </td>
                <td><code class="mono">{{ row.payload }}</code></td>
                <td class="desc">{{ row.description }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <h2 id="overlay-components">Overlay Components</h2>
      <p>Project custom floating toolbars and anchored panels inside <code>&lt;ngx-workflow-diagram&gt;</code>.</p>
      
      <div class="matrix-table-wrap">
        <table class="matrix-table cols-4">
          <thead>
            <tr>
              <th>Component</th>
              <th>Input / Prop</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code class="mono">&lt;ngx-workflow-panel&gt;</code></td>
              <td><code class="mono">[position]</code></td>
              <td><code class="mono">PanelPosition</code></td>
              <td>9 anchor presets: <code>'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'</code> (default: <code>'top-left'</code>).</td>
            </tr>
            <tr>
              <td><code class="mono">&lt;ngx-workflow-panel&gt;</code></td>
              <td><code class="mono">[style]</code></td>
              <td><code class="mono">string | Record</code></td>
              <td>Inline dynamic CSS styles (dimensions, background colors, drop shadows, z-index).</td>
            </tr>
            <tr>
              <td><code class="mono">&lt;ngx-workflow-panel&gt;</code></td>
              <td><code class="mono">[className]</code></td>
              <td><code class="mono">string</code></td>
              <td>Custom CSS class applied to the panel container.</td>
            </tr>
            <tr>
              <td><code class="mono">&lt;ngx-workflow-node-toolbar&gt;</code></td>
              <td><code class="mono">[nodeId]</code></td>
              <td><code class="mono">string</code></td>
              <td>Target node ID to attach toolbar above/below.</td>
            </tr>
            <tr>
              <td><code class="mono">&lt;ngx-workflow-node-toolbar&gt;</code></td>
              <td><code class="mono">[position]</code></td>
              <td><code class="mono">'top' | 'bottom' | 'left' | 'right'</code></td>
              <td>Placement relative to the node boundary (default: <code>'top'</code>).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="exported-models">Core TypeScript Models</h2>

      <h3>Node</h3>
      <app-code-block label="TypeScript" [code]="nodeInterfaceSnippet" />

      <h3>Edge</h3>
      <app-code-block label="TypeScript" [code]="edgeInterfaceSnippet" />

      <h2 id="injectable-services">Injectable Services</h2>

      <ul>
        <li><code>DiagramStateService</code> — nodes, edges, selection, viewport.</li>
        <li><code>HandleRegistryService</code> — port registration and typed connect rules.</li>
        <li><code>AutoLayoutService</code> — ELK.js layout (<code>applyLayout('TB' | 'LR')</code>).</li>
        <li><code>ExportService</code> — PNG / SVG / JSON export.</li>
        <li><code>UndoRedoService</code> — history stack.</li>
      </ul>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/customization" class="btn btn-primary">Next: Customization Guide →</a>
        <a routerLink="/docs/inputs" class="btn btn-secondary">All Inputs</a>
      </div>
    </article>
  `
})
export class DocApiComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly copiedKey = signal<string | null>(null);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  readonly inputRows: InputRow[] = [
    { name: '[nodes]', type: 'Node[]', defaultValue: '[]', description: 'Controlled nodes array.' },
    { name: '[edges]', type: 'Edge[] | undefined', defaultValue: 'undefined', description: 'Controlled edges; pass [] after deleting the last edge.' },
    { name: '[maxConnectionsPerHandle]', type: 'number', defaultValue: 'undefined', description: 'Global max edges per port (unlimited if unset).' },
    { name: '[proximityThreshold]', type: 'number', defaultValue: '200', description: 'Auto-connect distance when dragging nodes.' },
    { name: '[connectionValidator]', type: '(s, t) => boolean', defaultValue: 'undefined', description: 'Custom global connection validator.' },
    { name: '[validateConnection]', type: '(connection) => boolean', defaultValue: 'undefined', description: 'Validator with handle ids.' },
    { name: '[edgeReconnectable]', type: 'boolean', defaultValue: 'false', description: 'Drag edge endpoints to reconnect.' },
    { name: '[showPropertiesSidebar]', type: 'boolean', defaultValue: 'false', description: 'Enable/disable built-in properties editing sidebar on double-click.' },
    { name: '[showSearchControls]', type: 'boolean', defaultValue: 'true', description: 'Show floating Ctrl+F search controls.' },
    { name: '[showBackground]', type: 'boolean', defaultValue: 'true', description: 'Render background pattern.' },
    { name: '[backgroundVariant]', type: "'dots' | 'lines' | 'cross'", defaultValue: "'dots'", description: 'Background pattern style.' },
    { name: '[showMinimap]', type: 'boolean', defaultValue: 'true', description: 'Show minimap overlay.' },
    { name: '[showZoomControls]', type: 'boolean', defaultValue: 'true', description: 'Show zoom / fit controls.' },
    { name: '[showUndoRedoControls]', type: 'boolean', defaultValue: 'true', description: 'Show undo / redo controls.' },
    { name: '[snapToGrid]', type: 'boolean', defaultValue: 'false', description: 'Snap nodes while dragging.' },
    { name: '[nodeTypes]', type: 'Record<string, Type>', defaultValue: '{}', description: 'Custom node type → component map.' },
    {
      name: '[optimization]',
      type: 'FlowOptimization',
      defaultValue: '{ virtualization: true, … }',
      description:
        'Lazy load + large-graph culling (spatial index, adaptive buffer, maxRenderedNodes, edgeVirtualization).',
    },
  ];

  readonly optimizationSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [optimization]="{
    lazyLoadTrigger: 'viewport',
    virtualization: true,
    adaptiveBuffer: true,
    keepSelectedVisible: true,
    maxRenderedNodes: 400,
    edgeVirtualization: 'any-endpoint',
    virtualizationBuffer: 500
  }"
/>`;

  readonly outputRows: OutputRow[] = [
    { name: '(nodesChange)', payload: 'Node[]', description: 'Nodes moved, added, deleted, or edited.' },
    { name: '(edgesChange)', payload: 'Edge[]', description: 'Edges added, reconnected, or deleted.' },
    { name: '(nodeClick)', payload: 'Node', description: 'Emitted when a node is clicked.' },
    { name: '(nodeDoubleClick)', payload: 'Node', description: 'Emitted when a node is double-clicked.' },
    { name: '(edgeClick)', payload: 'Edge', description: 'Emitted when an edge is clicked.' },
    { name: '(edgeDoubleClick)', payload: 'Edge', description: 'Emitted when an edge is double-clicked.' },
    { name: '(connect)', payload: '{ source, target, sourceHandle?, targetHandle? }', description: 'New port-to-port connection created.' },
    { name: '(connectStart) / (connectEnd)', payload: '{ nodeId, handleId? }', description: 'Connection drag lifecycle.' },
    { name: '(edgeDrop)', payload: '{ sourceNodeId, sourceHandleId, position }', description: 'Connection dropped on empty canvas.' },
    { name: '(beforeDelete)', payload: '{ nodes, edges, cancel }', description: 'Cancellable delete.' },
    { name: '(importError)', payload: '{ message, error? }', description: 'JSON import failure.' },
    { name: '(paneClick)', payload: '{ event, position }', description: 'Empty canvas click.' },
    { name: '(contextMenu)', payload: '{ type, item?, event }', description: 'Right-click on canvas / node / edge.' },
  ];

  readonly connectionLimitsSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (nodesChange)="nodes.set($event)"
  (edgesChange)="edges.set($event)"
  (connect)="onConnect($event)"
/>

nodes = signal<Node[]>([
  {
    id: 'a',
    label: 'Source',
    position: { x: 80, y: 100 },
    ports: 4,
    maxConnectionsPerPort: 1,
    handleConfig: {
      bottom: { maxConnections: 3 } // override one port
    }
  },
  {
    id: 'b',
    label: 'Target',
    position: { x: 360, y: 100 },
    ports: 4
  }
]);`;

  readonly nodeInterfaceSnippet = `export interface Node {
  id: string;
  label?: string;
  type?: string;
  position: { x: number; y: number };
  data?: Record<string, any>;
  width?: number;
  height?: number;
  selected?: boolean;
  /** Colors: hex / rgb() / rgba() — backgroundColor, color, borderColor */
  style?: Record<string, string>;
  borderColor?: string;
  borderWidth?: number;
  /** 0=None, 1=Top, 2=Top/Bottom, 3=Left/Right, 4=All */
  ports?: 0 | 1 | 2 | 3 | 4;
  /** Default max edges for every port on this node */
  maxConnectionsPerPort?: number;
  handleConfig?: {
    [handleId: string]: {
      isConnectable?: boolean | number | ((node: Node, edges: Edge[]) => boolean);
      maxConnections?: number;
    };
  };
  easyConnect?: boolean;
}`;

  readonly edgeInterfaceSnippet = `export interface Edge {
  id: string;
  source: string;
  target: string;
  /** Handle side: 'top' | 'right' | 'bottom' | 'left' — drives bezier/step direction */
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'bezier' | 'step' | 'smoothstep' | 'straight' | 'smart' | 'dashed';
  animated?: boolean; // defaults animationType to 'flow' when unset
  animationType?: 'flow' | 'dot' | 'both';
  animationDuration?: string; // e.g. '1s'
  animationStyle?: { fill?: string }; // moving-dot color (rgba ok)
  markerStart?: 'arrow' | 'arrowclosed' | 'dot' | string;
  markerEnd?: 'arrow' | 'arrowclosed' | 'dot' | string; // built-ins match stroke
  label?: string; // legacy center label
  edgeLabels?: { start?: string | EdgeLabel; center?: string | EdgeLabel; end?: string | EdgeLabel };
  labelStyle?: Record<string, string>;
  style?: Record<string, string>; // stroke, strokeWidth, strokeDasharray
}`;

  async copyText(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
    }
    this.copiedKey.set(value);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedKey.set(null), 1600);
  }
}
