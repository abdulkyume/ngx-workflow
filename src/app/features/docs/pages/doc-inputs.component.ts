import { Component } from '@angular/core';

@Component({
  selector: 'app-doc-inputs',
  standalone: true,
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Inputs</h1>
        <p class="lead">
          Configuration options for the <code>&lt;ngx-workflow-diagram&gt;</code> component.
        </p>
      </div>

      <h2>Data Binding</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="20%">Input</th>
              <th width="25%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>[nodes]</code></td>
              <td><code>WorkflowNode[]</code></td>
              <td>Array of nodes to render. This is the source of truth for the graph.</td>
            </tr>
            <tr>
              <td><code>[edges]</code></td>
              <td><code>Edge[]</code></td>
              <td>Array of connections between nodes.</td>
            </tr>
            <tr>
              <td><code>[initialViewport]</code></td>
              <td><code>Viewport</code></td>
              <td>Initial x, y, and zoom level of the canvas.</td>
            </tr>
            <tr>
              <td><code>[connectionValidator]</code></td>
              <td><code>(source, target) => boolean</code></td>
              <td>Custom function to validate connections between nodes.</td>
            </tr>
             <tr>
              <td><code>[validateConnection]</code></td>
              <td><code>(params) => boolean</code></td>
              <td>More granular validation callback including handles.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>View & Controls</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="20%">Input</th>
              <th width="25%">Type</th>
              <th width="15%">Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>[showZoomControls]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Shows the +/- zoom buttons.</td></tr>
            <tr><td><code>[minZoom]</code></td><td><code>number</code></td><td><code>0.1</code></td><td>Minimum zoom level.</td></tr>
            <tr><td><code>[maxZoom]</code></td><td><code>number</code></td><td><code>4</code></td><td>Maximum zoom level.</td></tr>
            <tr><td><code>[showMinimap]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Shows the map in the bottom corner.</td></tr>
            <tr><td><code>[showUndoRedoControl]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Shows history controls (undo/redo).</td></tr>
            <tr><td><code>[showGrid]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Displays a grid overlay.</td></tr>
            <tr><td><code>[snapToGrid]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Snaps nodes to the grid.</td></tr>
            <tr><td><code>[gridSize]</code></td><td><code>number</code></td><td><code>20</code></td><td>Size of the grid squares in pixels.</td></tr>
            <tr><td><code>[colorMode]</code></td><td><code>'light' | 'dark'</code></td><td><code>'light'</code></td><td>Sets the theme of the canvas.</td></tr>
            <tr><td><code>[zIndexMode]</code></td><td><code>'default' | 'layered'</code></td><td><code>'default'</code></td><td>Controls how node stacking order is handled.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Background</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="20%">Input</th>
              <th width="25%">Type</th>
              <th width="15%">Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>[showBackground]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Whether to render the background pattern.</td></tr>
            <tr><td><code>[backgroundVariant]</code></td><td><code>'dots' | 'lines' | 'cross'</code></td><td><code>'dots'</code></td><td>Pattern style.</td></tr>
            <tr><td><code>[backgroundColor]</code></td><td><code>string</code></td><td><code>'#81818a'</code></td><td>Color of the pattern elements.</td></tr>
             <tr><td><code>[backgroundGap]</code></td><td><code>number</code></td><td><code>20</code></td><td>Distance between pattern elements.</td></tr>
            <tr><td><code>[backgroundSize]</code></td><td><code>number</code></td><td><code>1</code></td><td>Size of pattern elements (radius/width).</td></tr>
            <tr><td><code>[backgroundBgColor]</code></td><td><code>string</code></td><td><code>'#f0f0f0'</code></td><td>Base background color.</td></tr>
            <tr><td><code>[backgroundImage]</code></td><td><code>string | null</code></td><td><code>null</code></td><td>URL for a background image.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Interaction & Behavior</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="20%">Input</th>
              <th width="25%">Type</th>
              <th width="15%">Default</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>[nodesResizable]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Allows resizing nodes via handles.</td></tr>
            <tr><td><code>[edgeReconnectable]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Allows dragging existing edges to new targets.</td></tr>
            <tr><td><code>[preventNodeOverlap]</code></td><td><code>boolean</code></td><td><code>false</code></td><td>Physically prevents dragging nodes on top of others.</td></tr>
             <tr><td><code>[nodeSpacing]</code></td><td><code>number</code></td><td><code>10</code></td><td>Minimum distance between nodes when overlap inhibited.</td></tr>
            <tr><td><code>[autoPanOnNodeDrag]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Pans canvas when dragging node to the edge.</td></tr>
            <tr><td><code>[autoPanOnConnect]</code></td><td><code>boolean</code></td><td><code>true</code></td><td>Pans canvas when dragging connection wire to edge.</td></tr>
             <tr><td><code>[autoPanSpeed]</code></td><td><code>number</code></td><td><code>15</code></td><td>Speed of auto-panning (pixels/frame).</td></tr>
              <tr><td><code>[autoPanEdgeThreshold]</code></td><td><code>number</code></td><td><code>50</code></td><td>Distance from edge to trigger panning.</td></tr>
            <tr><td><code>[maxConnectionsPerHandle]</code></td><td><code>number</code></td><td><code>undefined</code></td><td>Global connection limit per handle.</td></tr>
             <tr><td><code>[proximityThreshold]</code></td><td><code>number</code></td><td><code>200</code></td><td>Distance to snap-connect nodes automatically.</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Advanced & Customization</h2>
       <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th width="20%">Input</th>
              <th width="25%">Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>[edgeTemplate]</code></td>
              <td><code>TemplateRef</code></td>
              <td>Custom template for rendering edges.</td>
            </tr>
            <tr>
              <td><code>[defsTemplate]</code></td>
              <td><code>TemplateRef</code></td>
              <td>SVG definitions (markers, filters) to include.</td>
            </tr>
            <tr>
              <td><code>[autoSave]</code></td>
              <td><code>boolean</code></td>
              <td>Automatically serializes state to local storage.</td>
            </tr>
            <tr>
              <td><code>[autoSaveInterval]</code></td>
              <td><code>number (ms)</code></td>
              <td>Frequency of auto-save (default: 1000).</td>
            </tr>
            <tr>
              <td><code>[maxVersions]</code></td>
              <td><code>number</code></td>
              <td>Number of historical states to keep (default: 10).</td>
            </tr>
             <tr>
              <td><code>[showExportControls]</code></td>
              <td><code>boolean</code></td>
              <td>Show built-in PNG/JSON export buttons.</td>
            </tr>
             <tr>
              <td><code>[showLayoutControls]</code></td>
              <td><code>boolean</code></td>
              <td>Show built-in alignment tools.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .table-wrapper { margin: 1.5rem 0; border: 1px solid var(--color-border); border-radius: 8px; box-shadow: var(--shadow-sm); overflow: hidden; }
    table { width: 100%; text-align: left; border-collapse: collapse; table-layout: fixed; }
    th { background: var(--color-bg-surface); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); font-size: 0.9rem; white-space: nowrap; word-wrap: break-word; }
    td { padding: 14px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); font-size: 0.9rem; font-family: var(--font-mono); vertical-align: top; word-wrap: break-word; overflow-wrap: break-word; }
    tr:last-child td { border-bottom: none; }
    code { font-size: 0.85rem; color: var(--color-primary); background: rgba(37, 99, 235, 0.05); padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(37, 99, 235, 0.1); white-space: pre-wrap; word-break: break-all; }
    
    /* Override prose width for API pages to fit tables */
    :host ::ng-deep .prose { max-width: 100%; }
  `]
})
export class DocInputsComponent { }
