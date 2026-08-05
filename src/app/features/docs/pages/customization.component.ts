import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doc-customization',
  standalone: true,
  imports: [RouterLink],
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

      <pre><code>import &#123; Component, input &#125; from '&#64;angular/core';
import &#123; HandleComponent &#125; from 'ngx-workflow';

&#64;Component(&#123;
  selector: 'app-custom-card-node',
  standalone: true,
  imports: [HandleComponent],
  template: \`
    &lt;div class="custom-card"&gt;
      &lt;!-- Input Connection Port --&gt;
      &lt;ngx-workflow-handle type="target" position="left" id="input-port" /&gt;

      &lt;div class="card-header"&gt;
        &lt;span class="status-dot"&gt;&lt;/span&gt;
        &lt;h4&gt;Custom Card Node Title&lt;/h4&gt;
      &lt;/div&gt;

      &lt;div class="card-body"&gt;
        &lt;p&gt;Custom node content and metrics...&lt;/p&gt;
        &lt;span class="badge"&gt;CPU Metrics&lt;/span&gt;
      &lt;/div&gt;

      &lt;!-- Output Connection Port --&gt;
      &lt;ngx-workflow-handle type="source" position="right" id="output-port" /&gt;
    &lt;/div&gt;
  \`
&#125;)
export class CustomCardNodeComponent &#123;
  data = input.required&lt;any&gt;();
&#125;</code></pre>

      <h2 id="connection-limits">2. Connection Limits on Ports</h2>
      <p>
        Cap edges per port on default or custom nodes. Number values on
        <code>isConnectable</code> also act as a max connection count.
      </p>

      <pre><code>nodes = signal([
  &#123;
    id: 'card-1',
    type: 'card',
    position: &#123; x: 100, y: 80 &#125;,
    maxConnectionsPerPort: 1,
    handleConfig: &#123;
      'output-port': &#123; maxConnections: 2, isConnectable: true &#125;,
      'input-port': &#123; maxConnections: 1 &#125;
    &#125;
  &#125;
]);

// Or globally for every port in the diagram:
// &lt;ngx-workflow-diagram [maxConnectionsPerHandle]="1" /&gt;</code></pre>

      <h2 id="custom-edge-styles">3. Custom Edge Styling & Animations</h2>
      <p>
        Customize stroke colors, dash arrays, glow effects, or edge markers directly via edge properties:
      </p>

      <pre><code>edges = signal&lt;Edge[]&gt;([
  &#123;
    id: 'e-animated',
    source: 'n1',
    target: 'n2',
    animated: true,
    style: &#123;
      stroke: '#3b82f6',
      strokeWidth: '3px',
      strokeDasharray: '5,5'
    &#125;
  &#125;
]);</code></pre>

      <h2 id="css-variables">4. CSS Theme Customization Tokens</h2>
      <p>
        Override default CSS variables in your application stylesheet to match your corporate design system:
      </p>

      <pre><code>:root &#123;
  /* Brand Accent Colors */
  --ngx-workflow-accent: #3b82f6;
  --ngx-workflow-node-bg: #1e293b;
  --ngx-workflow-node-border: #334155;
  --ngx-workflow-node-text: #f8fafc;

  /* Handle Ports */
  --ngx-workflow-handle-color: #60a5fa;
  --ngx-workflow-handle-hover: #2563eb;
  
  /* Selected Node Border Glow */
  --ngx-workflow-selected-glow: 0 0 0 2px #3b82f6;
&#125;</code></pre>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/sandbox" class="btn btn-primary">Try Customization in Sandbox →</a>
      </div>
    </article>
  `
})
export class DocCustomizationComponent {}
