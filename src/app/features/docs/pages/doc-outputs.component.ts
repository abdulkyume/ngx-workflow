import { Component } from '@angular/core';

@Component({
  selector: 'app-doc-outputs',
  standalone: true,
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Outputs</h1>
        <p class="lead">
          Events emitted by the <code>&lt;ngx-workflow-diagram&gt;</code> component.
        </p>
      </div>

      <h2>Element Events</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="25%">Output</th>
              <th width="30%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>(nodeClick)</code></td>
              <td><code>EventEmitter&lt;Node&gt;</code></td>
              <td>Fires when a node is clicked.</td>
            </tr>
            <tr>
              <td><code>(nodeDoubleClick)</code></td>
              <td><code>EventEmitter&lt;Node&gt;</code></td>
              <td>Fires when a node is double-clicked.</td>
            </tr>
            <tr>
              <td><code>(edgeClick)</code></td>
              <td><code>EventEmitter&lt;Edge&gt;</code></td>
              <td>Fires when an edge is clicked.</td>
            </tr>
            <tr>
              <td><code>(nodeMouseEnter)</code></td>
              <td><code>EventEmitter&lt;Node&gt;</code></td>
              <td>Fires when mouse enters a node.</td>
            </tr>
            <tr>
              <td><code>(nodeMouseLeave)</code></td>
              <td><code>EventEmitter&lt;Node&gt;</code></td>
              <td>Fires when mouse leaves a node.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Graph Events</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="25%">Output</th>
              <th width="30%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
             <tr>
              <td><code>(nodesChange)</code></td>
              <td><code>EventEmitter&lt;Node[]&gt;</code></td>
              <td>Fires when nodes are updated (moved, properties changed).</td>
            </tr>
             <tr>
              <td><code>(edgesChange)</code></td>
              <td><code>EventEmitter&lt;Edge[]&gt;</code></td>
              <td>Fires when edges are updated (reconnected, deleted).</td>
            </tr>
            <tr>
              <td><code>(connect)</code></td>
              <td><code>EventEmitter&lt;Connection&gt;</code></td>
              <td>Fires when a new connection is successfully created.</td>
            </tr>
            <tr>
              <td><code>(beforeDelete)</code></td>
              <td><code>EventEmitter&lt;Selection&gt;</code></td>
              <td>Fires before elements are deleted (allows cancellation).</td>
            </tr>
            <tr>
              <td><code>(contextMenu)</code></td>
              <td><code>EventEmitter&lt;MenuEvent&gt;</code></td>
              <td>Fires on right-click on canvas, node, or edge.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Interaction Events</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="25%">Output</th>
              <th width="30%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>(paneClick)</code></td>
              <td><code>EventEmitter&lt;PointerEvent&gt;</code></td>
              <td>Fires when clicking on the empty canvas background.</td>
            </tr>
            <tr>
              <td><code>(paneScroll)</code></td>
              <td><code>EventEmitter&lt;WheelEvent&gt;</code></td>
              <td>Fires when scrolling/gliding on the canvas.</td>
            </tr>
            <tr>
              <td><code>(connectStart)</code></td>
              <td><code>EventEmitter&lt;Handle&gt;</code></td>
              <td>Fires when the user starts dragging a connection line.</td>
            </tr>
            <tr>
              <td><code>(connectEnd)</code></td>
              <td><code>EventEmitter&lt;Handle&gt;</code></td>
              <td>Fires when the user stops dragging a connection line.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper { overflow-x: auto; margin: 1.5rem 0; border: 1px solid var(--color-border); border-radius: 8px; }
    table { width: 100%; text-align: left; border-collapse: collapse; min-width: 600px; }
    th { background: var(--color-bg-surface); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); font-size: 0.9rem; }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 0.9rem; font-family: var(--font-mono); }
    tr:last-child td { border-bottom: none; }
    code { font-size: 0.85rem; color: var(--color-primary); background: transparent; padding: 0; border: none; }
  `]
})
export class DocOutputsComponent { }
