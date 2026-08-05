import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-doc-api',
  standalone: true,
  imports: [RouterLink],
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
      </p>

      <h2 id="connection-limits">Connection limits</h2>
      <p>
        Limit how many edges can attach to a port. Resolution order (first wins):
      </p>
      <ol>
        <li><code>node.handleConfig[port].maxConnections</code></li>
        <li><code>node.maxConnectionsPerPort</code></li>
        <li><code>[maxConnectionsPerHandle]</code> on the diagram</li>
      </ol>

      <pre><code>&lt;ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (nodesChange)="nodes.set($event)"
  (edgesChange)="edges.set($event)"
  (connect)="onConnect($event)"
/&gt;

nodes = signal&lt;Node[]&gt;([
  &#123;
    id: 'a',
    label: 'Source',
    position: &#123; x: 80, y: 100 &#125;,
    ports: 4,
    maxConnectionsPerPort: 1,
    handleConfig: &#123;
      bottom: &#123; maxConnections: 3 &#125; // override one port
    &#125;
  &#125;,
  &#123;
    id: 'b',
    label: 'Target',
    position: &#123; x: 360, y: 100 &#125;,
    ports: 4
  &#125;
]);</code></pre>

      <p>
        In the sandbox / properties sidebar you can edit
        <strong>Max connections / port</strong> and <strong>Per-port limits</strong> when a node is selected.
      </p>

      <h2 id="diagram-component-inputs">Key Diagram Inputs</h2>
      <p><a routerLink="/docs/inputs">Browse all inputs →</a></p>

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
            <td>Controlled nodes array.</td>
          </tr>
          <tr>
            <td><code>[edges]</code></td>
            <td><code>Edge[] | undefined</code></td>
            <td><code>undefined</code></td>
            <td>Controlled edges; pass <code>[]</code> after deleting the last edge.</td>
          </tr>
          <tr>
            <td><code>[maxConnectionsPerHandle]</code></td>
            <td><code>number</code></td>
            <td><code>undefined</code></td>
            <td>Global max edges per port (unlimited if unset).</td>
          </tr>
          <tr>
            <td><code>[proximityThreshold]</code></td>
            <td><code>number</code></td>
            <td><code>200</code></td>
            <td>Auto-connect distance when dragging nodes.</td>
          </tr>
          <tr>
            <td><code>[connectionValidator]</code></td>
            <td><code>(s, t) => boolean</code></td>
            <td><code>undefined</code></td>
            <td>Custom global connection validator.</td>
          </tr>
          <tr>
            <td><code>[validateConnection]</code></td>
            <td><code>(connection) => boolean</code></td>
            <td><code>undefined</code></td>
            <td>Validator with handle ids.</td>
          </tr>
          <tr>
            <td><code>[edgeReconnectable]</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Drag edge endpoints to reconnect.</td>
          </tr>
          <tr>
            <td><code>[showBackground]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Render background pattern.</td>
          </tr>
          <tr>
            <td><code>[backgroundVariant]</code></td>
            <td><code>'dots' | 'lines' | 'cross'</code></td>
            <td><code>'dots'</code></td>
            <td>Background pattern style.</td>
          </tr>
          <tr>
            <td><code>[showMinimap]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Show minimap overlay.</td>
          </tr>
          <tr>
            <td><code>[showZoomControls]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Show zoom / fit controls.</td>
          </tr>
          <tr>
            <td><code>[showUndoRedoControls]</code></td>
            <td><code>boolean</code></td>
            <td><code>true</code></td>
            <td>Show undo / redo controls.</td>
          </tr>
          <tr>
            <td><code>[snapToGrid]</code></td>
            <td><code>boolean</code></td>
            <td><code>false</code></td>
            <td>Snap nodes while dragging.</td>
          </tr>
          <tr>
            <td><code>[nodeTypes]</code></td>
            <td><code>Record&lt;string, Type&gt;</code></td>
            <td><code>&#123;&#125;</code></td>
            <td>Custom node type → component map.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="diagram-component-outputs">Key Diagram Outputs</h2>
      <p><a routerLink="/docs/outputs">Browse all outputs →</a></p>

      <table class="matrix-table">
        <thead>
          <tr>
            <th>Event</th>
            <th>Payload</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>(nodesChange)</code></td>
            <td><code>Node[]</code></td>
            <td>Nodes moved, added, deleted, or edited.</td>
          </tr>
          <tr>
            <td><code>(edgesChange)</code></td>
            <td><code>Edge[]</code></td>
            <td>Edges added, reconnected, or deleted.</td>
          </tr>
          <tr>
            <td><code>(connect)</code></td>
            <td><code>&#123; source, target, sourceHandle?, targetHandle? &#125;</code></td>
            <td>New port-to-port connection created.</td>
          </tr>
          <tr>
            <td><code>(connectStart)</code> / <code>(connectEnd)</code></td>
            <td><code>&#123; nodeId, handleId? &#125;</code></td>
            <td>Connection drag lifecycle.</td>
          </tr>
          <tr>
            <td><code>(edgeDrop)</code></td>
            <td><code>&#123; sourceNodeId, sourceHandleId, position &#125;</code></td>
            <td>Connection dropped on empty canvas.</td>
          </tr>
          <tr>
            <td><code>(beforeDelete)</code></td>
            <td><code>&#123; nodes, edges, cancel &#125;</code></td>
            <td>Cancellable delete.</td>
          </tr>
          <tr>
            <td><code>(importError)</code></td>
            <td><code>&#123; message, error? &#125;</code></td>
            <td>JSON import failure.</td>
          </tr>
          <tr>
            <td><code>(paneClick)</code></td>
            <td><code>&#123; event, position &#125;</code></td>
            <td>Empty canvas click.</td>
          </tr>
          <tr>
            <td><code>(contextMenu)</code></td>
            <td><code>&#123; type, item?, event &#125;</code></td>
            <td>Right-click on canvas / node / edge.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="exported-models">Core TypeScript Models</h2>

      <h3>Node</h3>
      <pre><code>export interface Node &#123;
  id: string;
  label?: string;
  type?: string;
  position: &#123; x: number; y: number &#125;;
  data?: Record&lt;string, any&gt;;
  width?: number;
  height?: number;
  selected?: boolean;
  /** 0=None, 1=Top, 2=Top/Bottom, 3=Left/Right, 4=All */
  ports?: 0 | 1 | 2 | 3 | 4;
  /** Default max edges for every port on this node */
  maxConnectionsPerPort?: number;
  handleConfig?: &#123;
    [handleId: string]: &#123;
      isConnectable?: boolean | number | ((node: Node, edges: Edge[]) => boolean);
      maxConnections?: number;
    &#125;;
  &#125;;
  easyConnect?: boolean;
&#125;</code></pre>

      <h3>Edge</h3>
      <pre><code>export interface Edge &#123;
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'bezier' | 'step' | 'smoothstep' | 'straight' | 'smart' | 'dashed';
  animated?: boolean;
  label?: string;
  markerEnd?: string;
  style?: Record&lt;string, string&gt;;
&#125;</code></pre>

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
export class DocApiComponent {}
