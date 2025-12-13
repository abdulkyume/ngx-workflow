# ngx-workflow

[![npm version](https://img.shields.io/npm/v/ngx-workflow.svg)](https://www.npmjs.com/package/ngx-workflow)
[![License](https://img.shields.io/npm/l/ngx-workflow.svg)](https://github.com/abdulkyume/ngx-workflow/blob/main/LICENSE)

A powerful, highly customizable Angular library for building interactive node-based editors, flow charts, and diagrams. Built with Angular Signals for high performance and reactivity.

![Demo Screenshot](https://raw.githubusercontent.com/abdulkyume/ngx-workflow/main/assets/demo.png)

## 🚀 Features

### Core Features
- **Native Angular**: Built from the ground up for Angular, using Signals and OnPush change detection
- **Interactive**: Drag & drop nodes, zoom & pan canvas, connect edges
- **Customizable**: Fully custom node and edge templates
- **Rich UI**: Built-in minimap, background patterns, controls, and alignment tools
- **Layouts**: Automatic layout support via Dagre and ELK
- **History**: Robust Undo/Redo history stack with Ctrl+Z/Ctrl+Shift+Z
- **Theming**: Explicit `colorMode` and CSS variables for easy styling with dark mode support
- **Smart Alignment**: Visual alignment guides and drag snapping

### Advanced Features
- **Snap-to-Grid**: Configurable grid snapping for precise node placement
- **Space Panning**: Professional canvas panning with Space + Drag
- **Export Controls**: Built-in UI for PNG, SVG, and clipboard export
- **Clipboard Operations**: Full copy/paste/cut support with Ctrl+C/V/X and localStorage persistence
- **Connection Validation**: Prevent invalid connections with custom validators
- **Collision Detection**: Optional collision prevention to stop nodes from overlapping
- **Edge Reconnection**: Drag edge endpoints to reconnect them

### Visuals & Motion
- **Edge Animation**: SVG motion particles on edges (`animated: true`)
- **Node Motion**: Programmatic API to animate nodes along edge paths
- **Custom Markers**: Support for `arrow`, `arrowclosed`, `dot`, or fully custom SVG definitions via `[defsTemplate]`
- **Background Images**: Support for custom background images via `[backgroundImage]`

### Built-in UI Components
- **Search Bar**: Press `Ctrl+F` to search nodes by label/id.
- **Properties Panel**: Sidebar for editing node properties (auto-shows on selection).
- **Context Menu**: Right-click canvas/nodes/edges for actions.
- **Layout Alignment**: Auto-align selected nodes (if `showLayoutControls` is true).
- **Minimap**: Navigable overview of complex flows.

### Content Projection (Slots)
- **Node Toolbars**: Show contextual buttons above selected nodes.
- **Panels**: Add fixed overlays to the canvas (e.g., top-right controls).

```html
<ngx-workflow-diagram ...>
  <!-- Shows above selected node -->
  <ngx-workflow-node-toolbar [nodeId]="selectedNodeId">
    <button (click)="deleteNode()">Delete</button>
  </ngx-workflow-node-toolbar>

  <!-- Fixed panel -->
  <ngx-workflow-panel position="top-right">
    <button>Save</button>
  </ngx-workflow-panel>
</ngx-workflow-diagram>
```

## 📦 Installation

```bash
npm install ngx-workflow
```

```bash
npm install ngx-workflow
```

## 🏁 Quick Start

Import `NgxWorkflowModule` directly into your standalone component's `imports` array.

```typescript
import { Component } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div style="height: 100vh; width: 100%;">
      <ngx-workflow-diagram
        [nodes]="nodes"
        [edges]="edges"
        (nodeClick)="onNodeClick($event)"
        (connect)="onConnect($event)"
      ></ngx-workflow-diagram>
    </div>
  `
})
export class AppComponent {
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, label: 'Start', type: 'default' },
    { id: '2', position: { x: 300, y: 100 }, label: 'End', type: 'default' }
  ];

  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true }
  ];

  onNodeClick(node: Node) {
    console.log('Clicked:', node);
  }

  onConnect(connection: any) {
    console.log('Connected:', connection);
  }
}
```

## 📖 API Reference

### `<ngx-workflow-diagram>`

The main component for rendering the workflow.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node[]` | `[]` | Array of nodes to display (Signal-based sync). |
| `edges` | `Edge[]` | `[]` | Array of edges to display. |
| `initialViewport` | `Viewport` | `undefined` | Initial viewport state `{ x, y, zoom }`. |
| `showZoomControls` | `boolean` | `true` | Whether to show the zoom control buttons (bottom-left). |
| `minZoom` | `number` | `0.1` | Minimum zoom level. |
| `maxZoom` | `number` | `4` | Maximum zoom level. |
| `showMinimap` | `boolean` | `true` | Whether to show the minimap (bottom-right). |
| `showBackground` | `boolean` | `true` | Whether to show the background pattern. |
| `backgroundVariant` | `'dots' \| 'lines' \| 'cross'` | `'dots'` | The pattern style of the background. |
| `backgroundImage` | `string \| null` | `null` | URL for a custom background image. |
| `backgroundGap` | `number` | `20` | Gap between background pattern elements. |
| `backgroundSize` | `number` | `1` | Size of background pattern elements. |
| `backgroundColor` | `string` | `'#81818a'` | Color of the background pattern dots/lines. |
| `backgroundBgColor` | `string` | `'#f0f0f0'` | Background color of the canvas itself. |
| `fitView` | `boolean` | `false` | Automatically fit all nodes in view on load. |
| `connectionValidator` | `(source: string, target: string) => boolean` | `undefined` | Custom function to validate connections globally. |
| `nodesResizable` | `boolean` | `true` | Global toggle to enable/disable node resizing. |
| `snapToGrid` | `boolean` | `false` | Enable snap-to-grid for node positioning. |
| `gridSize` | `number` | `20` | Grid size in pixels for snap-to-grid. |
| `showExportControls` | `boolean` | `false` | Show export controls UI (PNG, SVG, Clipboard). |
| `showUndoRedoControls` | `boolean` | `true` | Show history controls UI. |
| `showLayoutControls` | `boolean` | `false` | Show auto-layout controls. |
| `colorMode` | `'light' \| 'dark'` | `'light'` | Color theme mode. |
| `zIndexMode` | `'default' \| 'layered'` | `'default'` | Strategy for node z-indexing. |
| `preventNodeOverlap` | `boolean` | `false` | Enable collision detection to prevent partial overlaps. |
| `nodeSpacing` | `number` | `10` | Minimum spacing between nodes when `preventNodeOverlap` is true. |
| `edgeReconnection` | `boolean` | `false` | Allow dragging edge endpoints to reconnect them. |
| `autoSave` | `boolean` | `false` | Enable auto-saving of diagram state to localStorage. |
| `autoSaveInterval` | `number` | `1000` | throttled auto-save interval in ms. |
| `autoPanOnNodeDrag` | `boolean` | `true` | Pan canvas automatically when dragging node near edge. |
| `autoPanOnConnect` | `boolean` | `true` | Pan canvas automatically when connecting edges near boundary. |
| `autoPanSpeed` | `number` | `15` | Pixels per frame for auto-pan. |
| `autoPanEdgeThreshold` | `number` | `50` | Distance in pixels from edge to trigger auto-pan. |
| `defsTemplate` | `TemplateRef<any>` | `undefined` | Angular template containing SVG `<defs>` (markers, etc). |
| `edgeTemplate` | `TemplateRef<any>` | `undefined` | Custom template for rendering edges. |
| `maxConnectionsPerHandle` | `number` | `undefined` | Global limit for connections per handle. |

#### Methods

You can access these methods via `@ViewChild(DiagramComponent)`:

| Method | Return | Description |
|--------|--------|-------------|
| `fitView()` | `void` | Fits all nodes within the viewport. |
| `zoomIn()` | `void` | Increases zoom level by 20%. |
| `zoomOut()` | `void` | Decreases zoom level by 20%. |
| `resetZoom()` | `void` | Resets zoom to 100%. |
| `exportToPNG(filename, options)` | `void` | Export canvas as PNG. |
| `exportToSVG(filename, options)` | `void` | Export canvas as SVG. |
| `copyToClipboard(options)` | `void` | Copy diagram image to clipboard. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `nodeClick` | `EventEmitter<Node>` | Emitted when a node is clicked. |
| `nodeDoubleClick` | `EventEmitter<Node>` | Emitted when a node is double-clicked. |
| `edgeClick` | `EventEmitter<Edge>` | Emitted when an edge is clicked. |
| `connect` | `EventEmitter<Connection>` | Emitted when a new connection is created. |
| `nodesChange` | `EventEmitter<Node[]>` | Emitted when the nodes array changes (move, add, delete). |
| `edgesChange` | `EventEmitter<Edge[]>` | Emitted when the edges array changes. |
| `paneClick` | `EventEmitter<MouseEvent>` | Emitted when the empty canvas is clicked. |
| `contextMenu` | `EventEmitter<Event>` | Emitted on right-click. |
| `beforeDelete` | `EventEmitter<{nodes, edges, cancel}>` | cancellable event before deletion. |
| `nodeMouseEnter` | `EventEmitter<Node>` | Emitted when mouse enters a node. |
| `nodeMouseLeave` | `EventEmitter<Node>` | Emitted when mouse leaves a node. |
| `edgeMouseEnter` | `EventEmitter<Edge>` | Emitted when mouse enters an edge. |
| `edgeMouseLeave` | `EventEmitter<Edge>` | Emitted when mouse leaves an edge. |

### Interfaces

#### `Node`

```typescript
interface Node {
  id: string;              // Unique identifier
  position: { x: number; y: number }; // Position on canvas
  label?: string;          // Default label
  data?: any;              // Custom data passed to your custom node component
  type?: string;           // 'default', 'group', or your custom type
  width?: number;          // Width in pixels (default: 170)
  height?: number;         // Height in pixels (default: 60)
  draggable?: boolean;     // Is the node draggable? (default: true)
  selectable?: boolean;    // Is the node selectable? (default: true)
  connectable?: boolean;   // Can edges be connected? (default: true)
  resizable?: boolean;     // Is this specific node resizable? (default: true)
  zIndex?: number;         // Manual Z-Index
  class?: string;          // Custom CSS class
  style?: object;          // Custom inline styles
  
  // Styling
  shadow?: boolean | string;   // Drop shadow
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  borderWidth?: number;

  // Behavior
  ports?: 1 | 2 | 3 | 4;   // Default handle configuration (1=Top, 4=All)
  easyConnect?: boolean;   // Drag from node body to connect
  
  // Visuals
  badges?: Array<{
    content: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }>;
}
```

#### `Edge`

```typescript
interface Edge {
  id: string;
  source: string;          // ID of source node
  target: string;          // ID of target node
  sourceHandle?: string;   // ID of source handle (optional)
  targetHandle?: string;   // ID of target handle (optional)
  label?: string;          // Label text displayed on the edge
  type?: 'bezier' | 'straight' | 'step'; // Path type (default: 'bezier')
  animated?: boolean;      // Show animation (dashed moving line)?
  markerStart?: string;    // Start marker ID (e.g., 'arrow', 'dot')
  markerEnd?: string;      // End marker ID
  style?: object;          // SVG styles (stroke, stroke-width, etc.)
}
```

#### `Handle` (Component)

Use `<ngx-workflow-handle>` inside your custom nodes.

```html
<ngx-workflow-handle
    type="source"
    position="right"
    [isConnectable]="true"
    [isValidConnection]="validateConnectionFn"
></ngx-workflow-handle>
```

| Input | Type | Description |
|-------|------|-------------|
| `type` | `'source' \| 'target'` | Type of handle. |
| `position` | `'top' \| 'right' \| 'bottom' \| 'left'` | Position on the node boundary. |
| `isValidConnection` | `(connection) => boolean` | Function to validate connections for this specific handle. |

### Custom Edges
Similar to nodes, you can register custom edge types.

1.  **Create Edge Component**: It must extend `BaseEdge`.
2.  **Register Token**:
    ```typescript
    import { NGX_WORKFLOW_EDGE_TYPES } from 'ngx-workflow';
    providers: [
      { provide: NGX_WORKFLOW_EDGE_TYPES, useValue: { 'my-edge': CustomEdgeComponent } }
    ]
    ```

## 🎨 Custom Customization

### Edge Markers
To use custom SVG markers, pass a template to `[defsTemplate]`:

```html
<ng-template #defs>
  <svg:marker id="my-marker" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5">
    <circle cx="5" cy="5" r="5" fill="red" />
  </svg:marker>
</ng-template>

<ngx-workflow-diagram [defsTemplate]="defs" ...></ngx-workflow-diagram>
```

Then use it in your edge: `{ id: 'e1', ..., markerEnd: 'my-marker' }`.

### Styling
`ngx-workflow` uses CSS variables for easy theming. Override these in your global styles:

```css
:root {
  --ngx-workflow-primary: #3b82f6;
  --ngx-workflow-bg: #f8fafc;
  --ngx-workflow-grid-color: #e2e8f0;
  --ngx-workflow-node-bg: #ffffff;
  --ngx-workflow-node-border: #cbd5e1;
  --ngx-workflow-handle-color: #3b82f6;
  --ngx-workflow-edge-stroke: #64748b;
  --ngx-workflow-selection-stroke: #3b82f6;
}
```

## ⌨️ Keyboard Shortcuts

### Navigation & Selection
| Shortcut | Action |
|----------|--------|
| `Space` + `Drag` | Pan canvas |
| `Shift` + `Drag` | Lasso selection |
| `Ctrl` + `Click` | Multi-select |
| `Mouse Wheel` | Zoom in/out |

### Editing
| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Shift` + `Z` / `Ctrl` + `Y` | Redo |

### Clipboard Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl` + `C` | Copy selected nodes |
| `Ctrl` + `V` | Paste copied nodes |
| `Ctrl` + `X` | Cut selected nodes |
| `Ctrl` + `D` | Duplicate selected nodes |

### Export
| Shortcut | Action |
|----------|--------|
| `Ctrl` + `Shift` + `E` | Export as PNG |
| `Ctrl` + `Shift` + `S` | Export as SVG |
| `Ctrl` + `Shift` + `C` | Copy to clipboard |

### Grouping
| Shortcut | Action |
|----------|--------|
| `Ctrl` + `G` | Group selected nodes |
| `Ctrl` + `Shift` + `G` | Ungroup selected group |

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

See [ADVANCED_FEATURES.md](ADVANCED_FEATURES.md) for details on Space Panning, Exports, Grid Snapping, and more.
