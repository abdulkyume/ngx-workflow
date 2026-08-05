import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doc-concepts',
  standalone: true,
  imports: [RouterLink],
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

      <pre><code>// State Architecture Overview
diagramState = &#123;
  nodes: signal&lt;WorkflowNode[]&gt;([]),
  edges: signal&lt;WorkflowEdge[]&gt;([]),
  viewport: signal&lt;ViewportState&gt;(&#123; x: 0, y: 0, zoom: 1 &#125;),
  selectedNodeIds: signal&lt;Set&lt;string&gt;&gt;(new Set())
&#125;;</code></pre>

      <div class="callout callout-success">
        <div class="callout-title">⚡ Performance Impact</div>
        <div>Because nodes and handles consume Signal inputs directly, dragging a single node only updates that specific node component's transform without re-evaluating the rest of the diagram subtree!</div>
      </div>

      <h2 id="viewport-matrix">2. Viewport Transform & Canvas Coordinates</h2>
      <p>
        The diagram viewport handles pan (translate) and zoom (scale). All node positions are maintained in absolute graph space <code>(x, y)</code>, while the viewport transform matrix converts them to DOM client coordinates:
      </p>

      <pre><code>DOM_X = (Graph_X * Zoom) + Pan_X
DOM_Y = (Graph_Y * Zoom) + Pan_Y</code></pre>

      <p>
        When users drag nodes, <code>ngx-workflow</code> automatically converts mouse offset events back into graph space coordinates, taking the current zoom level and pan offset into account.
      </p>

      <h2 id="handles-registry">3. Handle Registry & Port Calculation</h2>
      <p>
        Connections originate and terminate at <strong>Handles</strong> (ports). Handles register their exact DOM bounds with <code>HandleRegistryService</code> whenever node positions change or canvas zoom updates:
      </p>

      <ul>
        <li><code>left</code> / <code>right</code> / <code>top</code> / <code>bottom</code> position presets.</li>
        <li>Automatic path tangent calculation for Bezier curve handles.</li>
        <li>Support for multiple input/output ports per node side.</li>
      </ul>

      <h2 id="auto-layout">4. ELK.js Auto-Layout Engine</h2>
      <p>
        <code>ngx-workflow</code> includes <code>AutoLayoutService</code> which delegates layout computation to the Eclipse Layout Kernel (ELK). You can invoke auto-layout at any time:
      </p>

      <pre><code>import &#123; AutoLayoutService &#125; from 'ngx-workflow';

// Inject service in your component
private autoLayout = inject(AutoLayoutService);

async arrangeDiagram() &#123;
  // Directions: 'TB' (Top-to-Bottom), 'LR' (Left-to-Right), 'BT', 'RL'
  await this.autoLayout.applyLayout('LR');
&#125;</code></pre>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/api" class="btn btn-primary">Next: API Reference →</a>
        <a routerLink="/docs/customization" class="btn btn-secondary">Customization Guide</a>
      </div>
    </article>
  `
})
export class DocConceptsComponent {}
