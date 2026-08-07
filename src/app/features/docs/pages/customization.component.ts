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

      <h2 id="custom-edge-styles">3. Custom Edge Styling & Animations</h2>
      <p>
        Stroke, labels, and animation dots accept hex / <code>rgb()</code> / <code>rgba()</code>.
        Built-in markers (<code>arrow</code>, <code>arrowclosed</code>, <code>dot</code>) match the edge stroke color.
        When <code>animated</code> is true and <code>animationType</code> is omitted, flow animation is used.
      </p>

      <app-code-block label="TypeScript" [code]="edgeStylesSnippet" />

      <h2 id="node-colors">4. Node Colors (RGBA)</h2>
      <p>
        Set fill, text, and border via <code>style</code> / <code>borderColor</code>, or edit them in the
        properties sidebar RGBA pickers (swatch + opacity + <code>rgba()</code> text).
      </p>

      <app-code-block label="TypeScript" [code]="nodeColorsSnippet" />

      <h2 id="css-variables">5. CSS Theme Customization Tokens</h2>
      <p>
        Override default CSS variables in your application stylesheet to match your corporate design system:
      </p>

      <app-code-block label="CSS" [code]="themeTokensSnippet" />

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/sandbox" class="btn btn-primary">Try Customization in Sandbox →</a>
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
        <p>Custom node content and metrics...</p>
        <span class="badge">CPU Metrics</span>
      </div>

      <!-- Output Connection Port -->
      <ngx-workflow-handle type="source" position="right" id="output-port" />
    </div>
  \`
})
export class CustomCardNodeComponent {
  data = input.required<any>();
}`;

  readonly connectionLimitsSnippet = `nodes = signal([
  {
    id: 'card-1',
    type: 'card',
    position: { x: 100, y: 80 },
    maxConnectionsPerPort: 1,
    handleConfig: {
      'output-port': { maxConnections: 2, isConnectable: true },
      'input-port': { maxConnections: 1 }
    }
  }
]);

// Or globally for every port in the diagram:
// <ngx-workflow-diagram [maxConnectionsPerHandle]="1" />`;

  readonly edgeStylesSnippet = `edges = signal<Edge[]>([
  {
    id: 'e-animated',
    source: 'n1',
    target: 'n2',
    animated: true,
    animationType: 'both',          // 'flow' | 'dot' | 'both'
    animationDuration: '1s',
    animationStyle: { fill: 'rgba(59, 130, 246, 1)' },
    markerStart: 'dot',
    markerEnd: 'arrow',             // tinted to match stroke
    label: 'retry',
    labelStyle: { fill: 'rgba(248, 250, 252, 0.9)' },
    style: {
      stroke: 'rgba(239, 68, 68, 1)',
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
}
