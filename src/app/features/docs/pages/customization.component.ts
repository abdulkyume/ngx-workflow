import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-customization',
  standalone: true,
  imports: [RouterLink, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Customization</span>
      <h1>Custom Nodes, Edges & Theme Customization</h1>

      <p class="lead text-muted">
        Learn how to project custom Angular components into nodes, style connection handles, customize SVG edge paths, and override theme tokens.
      </p>

      <h2 id="custom-node-components">1. Custom Node Angular Templates</h2>
      <p>
        You can create custom Angular components to render inside nodes. Use <code>&lt;ngx-workflow-handle&gt;</code> to declare input/output connection ports:
      </p>

      <app-code-block label="TypeScript" [code]="customNodeSnippet" />

      <h2 id="connection-limits">2. Connection Limits on Ports</h2>
      <p>
        Cap edges per port on default or custom nodes. Number values on
        <code>isConnectable</code> also act as a max connection count.
      </p>

      <app-code-block label="TypeScript" [code]="connectionLimitsSnippet" />

      <h2 id="edge-routing">3. Direction-aware edge routing</h2>
      <p>
        Bezier, step, and smoothstep paths respect <code>sourceHandle</code> / <code>targetHandle</code>
        (<code>top</code> · <code>right</code> · <code>bottom</code> · <code>left</code>).
        A vertical <code>bottom → top</code> link curves out of the bottom port and into the top port —
        not a flat left-to-right diagonal.
      </p>
      <app-code-block label="TypeScript" [code]="edgeRoutingSnippet" />

      <h2 id="custom-edge-styles">4. Custom Edge Styling & Animations</h2>
      <p>
        Stroke, labels, and animation dots accept hex / <code>rgb()</code> / <code>rgba()</code>.
        Built-in markers (<code>arrow</code>, <code>arrowclosed</code>, <code>dot</code>) match the edge stroke color.
        When <code>animated</code> is true and <code>animationType</code> is omitted, flow animation is used.
      </p>

      <app-code-block label="TypeScript" [code]="edgeStylesSnippet" />

      <h2 id="node-colors">5. Node Colors (RGBA)</h2>
      <p>
        Set fill, text, and border via <code>style</code> / <code>borderColor</code>, or edit them in the
        properties sidebar RGBA pickers (swatch + opacity + <code>rgba()</code> text).
      </p>

      <app-code-block label="TypeScript" [code]="nodeColorsSnippet" />

      <h2 id="css-variables">6. CSS Theme Customization Tokens</h2>
      <p>
        Override default CSS variables in your application stylesheet to match your corporate design system:
      </p>

      <app-code-block label="CSS" [code]="themeTokensSnippet" />

      <h2 id="panels-and-legends">7. Overlay Panels & Workflow Legends</h2>
      <p>
        Use <code>&lt;ngx-workflow-panel&gt;</code> inside the diagram container to project floating legends, controls, or annotations.
        Supports 9 viewport anchor positions (<code>top-left</code>, <code>top-center</code>, <code>top-right</code>, <code>center-left</code>, <code>center</code>, <code>center-right</code>, <code>bottom-left</code>, <code>bottom-center</code>, <code>bottom-right</code>) and inline dynamic <code>[style]</code>.
      </p>

      <app-code-block label="HTML & TypeScript" [code]="panelLegendSnippet" />

      <h2 id="node-double-click-api">8. Headless Node Double-Click & REST API Inspector</h2>
      <p>
        Disable the default built-in properties editing sidebar (<code>[showPropertiesSidebar]="false"</code>) and handle
        <code>(nodeDoubleClick)</code> with your custom projected API inspector panel or drawer.
      </p>

      <app-code-block label="HTML & TypeScript" [code]="apiInspectorSnippet" />

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/examples" class="btn btn-primary">View Interactive Gallery & Legends →</a>
        <a routerLink="/sandbox" class="btn btn-secondary">Try in Sandbox</a>
      </div>
    </article>
  `
})
export class DocCustomizationComponent {
  readonly customNodeSnippet = `import { Component, input } from '@angular/core';
import { HandleComponent } from 'ngx-workflow';

@Component({
  selector: 'app-custom-card-node',
  standalone: true,
  imports: [HandleComponent],
  template: \`
    <div class="custom-card">
      <!-- Input Connection Port -->
      <ngx-workflow-handle type="target" position="left" id="input-port" />

      <div class="card-header">
        <span class="status-dot"></span>
        <h4>Custom Card Node Title</h4>
      </div>

      <div class="card-body">
        <p>Custom Angular signal data bindings</p>
      </div>

      <!-- Output Connection Port -->
      <ngx-workflow-handle type="source" position="right" id="output-port" />
    </div>
  \`
})
export class CustomCardNodeComponent {}`;

  readonly connectionLimitsSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
/>

nodes = signal<Node[]>([
  {
    id: 'a',
    position: { x: 80, y: 100 },
    ports: 4,
    maxConnectionsPerPort: 1,
    handleConfig: {
      bottom: { maxConnections: 3 }
    }
  }
]);`;

  readonly edgeRoutingSnippet = `edges = signal<Edge[]>([
  {
    id: 'e1',
    source: 'top-node',
    target: 'bottom-node',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'bezier'
  }
]);`;

  readonly edgeStylesSnippet = `edges = signal<Edge[]>([
  {
    id: 'e-styled',
    source: 'n1',
    target: 'n2',
    animated: true,
    animationType: 'both',
    animationStyle: { fill: 'rgba(56, 189, 248, 0.9)' },
    markerEnd: 'arrowclosed',
    style: {
      stroke: 'rgba(56, 189, 248, 0.85)',
      strokeWidth: '3',
      strokeDasharray: '5,5'
    }
  }
]);`;

  readonly nodeColorsSnippet = `nodes = signal<Node[]>([
  {
    id: 'n1',
    position: { x: 80, y: 100 },
    label: 'Opaque',
    style: {
      backgroundColor: '#ffffff',
      color: '#0f172a',
      borderColor: '#94a3b8'
    }
  },
  {
    id: 'n2',
    position: { x: 320, y: 100 },
    label: 'Glass',
    style: {
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      color: 'rgba(248, 250, 252, 0.95)',
      borderColor: 'rgba(45, 212, 191, 0.8)'
    },
    borderColor: 'rgba(45, 212, 191, 0.8)'
  }
]);`;

  readonly themeTokensSnippet = `:root {
  /* Brand Accent Colors */
  --ngx-workflow-accent: #3b82f6;
  --ngx-workflow-primary: #2dd4bf;
  --ngx-workflow-node-bg: #1e293b;
  --ngx-workflow-node-border: #334155;
  --ngx-workflow-node-text: #f8fafc;
  --ngx-workflow-edge-stroke: #94a3b8;

  /* Handle Ports */
  --ngx-workflow-handle-color: #60a5fa;
  --ngx-workflow-handle-hover: #2563eb;
  
  /* Selected Node Border Glow */
  --ngx-workflow-selected-glow: 0 0 0 2px #3b82f6;
}`;

  readonly panelLegendSnippet = `<ngx-workflow-diagram [nodes]="nodes" [edges]="edges">
  <!-- Projected Legend Panel with 9-point positioning -->
  <ngx-workflow-panel
    [position]="'top-right'"
    [style]="{ minWidth: '280px', background: 'rgba(15, 23, 42, 0.94)', color: '#f8fafc' }"
  >
    <div class="legend-card glass-panel">
      <div class="legend-header">
        <h4>Workflow Legend</h4>
      </div>

      <div class="legend-section">
        <span class="legend-title">Node Status</span>
        <div class="legend-item"><span class="dot bg-blue"></span> Active Ingestion</div>
        <div class="legend-item"><span class="dot bg-green"></span> Database Sink</div>
        <div class="legend-item"><span class="dot bg-red"></span> Alert Dead-Letter</div>
      </div>

      <div class="legend-section">
        <span class="legend-title">Connections</span>
        <div class="legend-item"><span class="line line-solid"></span> Primary Flow</div>
        <div class="legend-item"><span class="line line-dashed"></span> Fallback Queue</div>
      </div>
    </div>
  </ngx-workflow-panel>
</ngx-workflow-diagram>`;

  readonly apiInspectorSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [showPropertiesSidebar]="false"
  (nodeDoubleClick)="onNodeDoubleClick($event)"
  (paneClick)="closeInspector()"
>
  @if (inspectorOpen()) {
    <ngx-workflow-panel [position]="'center-right'" [style]="{ zIndex: 30 }">
      <div class="inspector-card glass-panel">
        <h4>{{ activeNode()?.label }} REST API Schema</h4>
        <p><strong>Endpoint:</strong> {{ nodeConfig()?.endpoint }}</p>
        <p><strong>Throughput:</strong> {{ nodeConfig()?.throughput }}</p>
        <button (click)="saveAndSync()">Save & Sync API</button>
      </div>
    </ngx-workflow-panel>
  }
</ngx-workflow-diagram>`;
}
