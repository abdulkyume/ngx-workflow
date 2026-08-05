import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doc-api',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="prose">
      <span class="badge badge-accent">Reference</span>
      <h1>API Reference</h1>

      <p class="lead text-muted">
        Complete specification of component inputs, outputs, models, and exported services in <code>ngx-workflow</code>.
      </p>

      <h2 id="diagram-component-inputs">DiagramComponent Inputs</h2>
      
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>[nodes]</code></td>
            <td><code>Node[]</code></td>
            <td><code>[]</code></td>
            <td>Array of workflow nodes to render on the canvas.</td>
          </tr>
          <tr>
            <td><code>[edges]</code></td>
            <td><code>Edge[]</code></td>
            <td><code>[]</code></td>
            <td>Array of connection edges between nodes.</td>
          </tr>
          <tr>
            <td><code>[showBackground]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Whether to render the canvas background pattern.</td>
          </tr>
          <tr>
            <td><code>[backgroundVariant]</code></td>
            <td><code>'dots' | 'grid' | 'cross'</code></td>
            <td><code>'dots'</code></td>
            <td>Visual background pattern style.</td>
          </tr>
          <tr>
            <td><code>[showZoomControls]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Renders floating Zoom In, Zoom Out, and Fit View controls.</td>
          </tr>
          <tr>
            <td><code>[showMinimap]</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Renders floating interactive minimap navigation overlay.</td>
          </tr>
          <tr>
            <td><code>[showLayoutControls]</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Renders floating auto-layout direction trigger toolbar.</td>
          </tr>
          <tr>
            <td><code>[snapToGrid]</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Enables snapping node dragging to grid steps.</td>
          </tr>
          <tr>
            <td><code>[gridSize]</code></td>
            <td><code>number</code></td>
            <td><code>20</code></td>
            <td>Grid step size in pixels when snap-to-grid is enabled.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="diagram-component-outputs">DiagramComponent Outputs & Events</h2>

      <table class="matrix-table">
        <thead>
          <tr>
            <th>Event Output</th>
            <th>Payload Type</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>(nodeClick)</code></td>
            <td><code>Node</code></td>
            <td>Fired when a node is clicked.</td>
          </tr>
          <tr>
            <td><code>(nodesChange)</code></td>
            <td><code>Node[]</code></td>
            <td>Fired when nodes are dragged, moved, or deleted.</td>
          </tr>
          <tr>
            <td><code>(edgesChange)</code></td>
            <td><code>Edge[]</code></td>
            <td>Fired when edges are added, reconnected, or deleted.</td>
          </tr>
          <tr>
            <td><code>(connect)</code></td>
            <td><code>Connection</code></td>
            <td>Fired when a new connection handle drag is completed.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="exported-models">Core TypeScript Models</h2>

      <h3>WorkflowNode Interface</h3>
      <pre><code>export interface Node &#123;
  id: string;
  label?: string;
  type?: string;
  position: &#123; x: number; y: number &#125;;
  data?: Record&lt;string, any&gt;;
  ports?: number;
  selected?: boolean;
&#125;</code></pre>

      <h3>WorkflowEdge Interface</h3>
      <pre><code>export interface Edge &#123;
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'bezier' | 'step' | 'straight';
  animated?: boolean;
  label?: string;
  style?: Record&lt;string, string&gt;;
&#125;</code></pre>

      <h2 id="injectable-services">Injectable Services</h2>

      <ul>
        <li><code>DiagramStateService</code>: Central RxJS & Signals state provider for nodes, edges, selection, and viewport transform.</li>
        <li><code>AutoLayoutService</code>: Triggers ELK.js layout calculation (<code>applyLayout('TB' | 'LR')</code>).</li>
        <li><code>ExportService</code>: Exports canvas diagram as PNG, SVG, or JSON payload (<code>exportAsPng()</code>, <code>exportAsSvg()</code>).</li>
        <li><code>UndoRedoService</code>: Manages undo/redo state history stack (<code>undo()</code>, <code>redo()</code>).</li>
      </ul>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/customization" class="btn btn-primary">Next: Customization Guide →</a>
      </div>
    </article>
  `
})
export class DocApiComponent {}
