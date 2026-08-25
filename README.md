# ngx-workflow

[![npm version](https://img.shields.io/npm/v/ngx-workflow.svg)](https://www.npmjs.com/package/ngx-workflow)
[![License](https://img.shields.io/npm/l/ngx-workflow.svg)](https://github.com/abdulkyume/ngx-workflow/blob/main/LICENSE)

A powerful, highly customizable Angular library for building interactive node-based editors, flow charts, and diagrams. Built with Angular Signals for high performance and reactivity.

> Live demo & docs: [ngx-workflow.vercel.app](https://ngx-workflow.vercel.app) · local: `npm start` then **Examples** or **Canvas Studio** (`/sandbox`).
>
> AI / LLM index: [llms.txt](https://ngx-workflow.vercel.app/llms.txt) · [llms-full.txt](https://ngx-workflow.vercel.app/llms-full.txt)

## 🚀 Features

### Core Features
- **Native Angular**: Built from the ground up for Angular, using Signals and OnPush change detection
- **Interactive**: Drag & drop nodes, zoom & pan canvas, connect edges
- **Node Palette**: Drag-and-drop stencil panel (`<ngx-workflow-palette>`) to drop new nodes directly onto canvas
- **Typed Ports**: Port data type validation (`dataType`) to prevent connecting incompatible handle types
- **Manual Edge Waypoints**: Custom bendpoint support (`waypoints?: Array<{ x: number, y: number }>`) for manual routing
- **Reactive Forms Integration**: Full `ControlValueAccessor` (`formControlName` / `[(ngModel)]`) support with built-in graph validators (`noCycles`, `noOrphanNodes`, `minNodes`)
- **Customizable**: Fully custom node and edge templates
- **Rich UI**: Built-in minimap, background patterns, controls, alignment, and equal distribution tools
- **Parallel Edge Offsetting**: Automatic curvature spacing for multi-edges between identical node pairs
- **Layouts**: Automatic layout support via ELK (plus force, hierarchical, and circular helpers)
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
- **Edge Animation**: Flow dash and/or moving-dot particles (`animated`, `animationType`: `'flow' | 'dot' | 'both'`)
- **RGBA Colors**: Node fill/text/border and edge stroke/label/animation colors support hex, `rgb()`, and `rgba()`
- **Node Motion**: Programmatic API to animate nodes along edge paths
- **Markers**: Built-in `arrow`, `arrowclosed`, `dot` tinted to match the edge stroke; custom SVG via `[defsTemplate]`
- **Background Images**: Support for custom background images via `[backgroundImage]`

### Built-in UI Components
- **Search Bar**: Press `Ctrl+F` to search nodes by label/id.
- **Properties Panel**: Sidebar for node/edge editing (RGBA pickers, animation, markers); auto-shows on selection.
- **Context Menu**: Right-click canvas/nodes/edges for actions.
- **Layout Alignment**: Auto-align selected nodes (if `showLayoutControls` is true).
- **Minimap**: Navigable overview of complex flows.

### Content Projection (Slots)
- **Node Toolbars**: Show contextual buttons above selected nodes (`<ngx-workflow-node-toolbar>`).
- **Overlay Panels**: Add anchored overlays to the canvas with 9-point positioning and inline dynamic styling (`<ngx-workflow-panel>`).

```html
<ngx-workflow-diagram [nodes]="nodes()" [edges]="edges()" [showPropertiesSidebar]="false" (nodeDoubleClick)="onNodeDoubleClick($event)">
  <!-- Shows above selected node -->
  <ngx-workflow-node-toolbar [nodeId]="selectedNodeId">
    <button (click)="deleteNode()">Delete</button>
  </ngx-workflow-node-toolbar>

  <!-- Anchored Workflow Legend Panel -->
  <ngx-workflow-panel position="top-right" [style]="{ minWidth: '280px', background: 'rgba(15, 23, 42, 0.94)', color: '#f8fafc' }">
    <div class="legend-card">
      <h4>Workflow Legend</h4>
      <div class="legend-item"><span class="dot bg-blue"></span> Active / Ingestion</div>
      <div class="legend-item"><span class="dot bg-emerald"></span> Database Sink</div>
    </div>
  </ngx-workflow-panel>

  <!-- Custom Node Double-Click API Inspector -->
  @if (inspectorOpen()) {
    <ngx-workflow-panel position="center-right" [style]="{ zIndex: 30 }">
      <div class="inspector-card glass-panel">
        <h4>{{ activeNode()?.label }} API Config</h4>
        <input [(ngModel)]="activeEndpoint" placeholder="API endpoint" />
        <button (click)="syncApi()">Save & Sync API</button>
      </div>
    </ngx-workflow-panel>
  }
</ngx-workflow-diagram>
```

## 📦 Installation

```bash
npm install ngx-workflow
```

Peer dependencies: `@angular/core`, `@angular/common`, and `@angular/forms` (**Angular 17.1 through 22**).

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
| `zoomControlsConfig` | `ZoomControlsConfig` | `undefined` | Custom slots, positions (bottom-left, top-right, etc.), actions, and icons for zoom controls. |
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
| `connectionValidator` | `(source: string, target: string) => boolean` | `undefined` | Custom function to validate connections globally. |
| `validateConnection` | `(connection) => boolean` | `undefined` | Richer connection validation including handle ids. |
| `nodesResizable` | `boolean` | `true` | Global toggle to enable/disable node resizing. |
| `snapToGrid` | `boolean` | `false` | Enable snap-to-grid for node positioning. |
| `gridSize` | `number` | `20` | Grid size in pixels for snap-to-grid. |
| `showExportControls` | `boolean` | `false` | Show export controls UI (PNG, SVG, Clipboard). |
| `showUndoRedoControls` | `boolean` | `true` | Show history controls UI. |
| `showLayoutControls` | `boolean` | `false` | Show auto-layout controls. |
| `showSearchControls` | `boolean` | `true` | Show floating Ctrl+F search controls. |
| `showPropertiesSidebar` | `boolean` | `false` | Enable/disable built-in node/edge properties sidebar on double-click. |
| `colorMode` | `'light' \| 'dark'` | `'light'` | Color theme mode. |
| `zIndexMode` | `'default' \| 'layered'` | `'default'` | Strategy for node z-indexing. |
| `preventNodeOverlap` | `boolean` | `false` | Enable collision detection to prevent partial overlaps. |
| `nodeSpacing` | `number` | `10` | Minimum spacing between nodes when `preventNodeOverlap` is true. |
| `edgeReconnectable` | `boolean` | `false` | Allow dragging edge endpoints to reconnect them. |
| `optimization` | `FlowOptimization` | `{ ... }` | Performance tuning (spatial index culling, `hideEdgesBelowZoom`, adaptive buffer). |
| `autoSave` | `boolean` | `false` | Enable auto-saving of diagram state to localStorage. |
| `autoSaveInterval` | `number` | `1000` | throttled auto-save interval in ms. |
| `autoPanOnNodeDrag` | `boolean` | `true` | Pan canvas automatically when dragging node near edge. |
| `autoPanOnConnect` | `boolean` | `true` | Pan canvas automatically when connecting edges near boundary. |
| `autoPanSpeed` | `number` | `15` | Pixels per frame for auto-pan. |
| `autoPanEdgeThreshold` | `number` | `50` | Distance in pixels from edge to trigger auto-pan. |
| `defsTemplate` | `TemplateRef<any>` | `undefined` | Angular template containing SVG `<defs>` (markers, etc). |
| `edgeTemplate` | `TemplateRef<any>` | `undefined` | Custom template for rendering edges. |
| `maxConnectionsPerHandle` | `number` | `undefined` | Global max edges per port. Overridden by `node.maxConnectionsPerPort` and `handleConfig[port].maxConnections`. |
| `proximityThreshold` | `number` | `200` | Distance for auto-connect when dragging nodes near each other. |
| `showGrid` | `boolean` | `false` | Show grid overlay. |
| `nodeTypes` | `Record<string, Type>` | `{}` | Custom node type → component map. |
| `initialNodes` / `initialEdges` | `Node[]` / `Edge[]` | `[]` | Seed graph on first init (uncontrolled). |
| `maxVersions` | `number` | `10` | Max auto-save version snapshots. |

#### Connection limits example

```typescript
<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [maxConnectionsPerHandle]="2"
  (nodesChange)="nodes.set($event)"
  (edgesChange)="edges.set($event)"
  (connect)="onConnect($event)"
/>

nodes.set([{
  id: 'a',
  position: { x: 0, y: 0 },
  ports: 4,
  maxConnectionsPerPort: 1,
  handleConfig: { bottom: { maxConnections: 3 } }
}]);
```

Priority: `handleConfig[port].maxConnections` → `maxConnectionsPerPort` → `[maxConnectionsPerHandle]`. Also editable in the properties sidebar.

#### Methods

You can access these methods via `@ViewChild(DiagramComponent)`:

| Method | Return | Description |
|--------|--------|-------------|
| `fitView(options?)` | `void` | Fits all nodes in viewport. Options: `{ zoom?: number, align?: 'center' \| 'top-center', paddingTop?: number }`. |
| `zoomIn()` | `void` | Increases zoom level by 20%. |
| `zoomOut()` | `void` | Decreases zoom level by 20%. |
| `resetZoom()` | `void` | Resets zoom to 100%. |
| `exportToPNG(filename, options)` | `void` | Export canvas as PNG. |
| `exportToSVG(filename, options)` | `void` | Export canvas as SVG. |
| `copyToClipboard(options)` | `void` | Copy diagram image to clipboard. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `nodeClick` | `output<Node>` | Emitted when a node is clicked. |
| `nodeDoubleClick` | `output<Node>` | Emitted when a node is double-clicked. |
| `edgeClick` | `output<Edge>` | Emitted when an edge is clicked. |
| `edgeDoubleClick` | `output<Edge>` | Emitted when an edge is double-clicked. |
| `connect` | `output<{source, target, sourceHandle?, targetHandle?}>` | New port-to-port connection created. |
| `connectStart` / `connectEnd` | `output<{nodeId, handleId?}>` | Connection drag lifecycle. |
| `edgeDrop` | `output<{sourceNodeId, sourceHandleId, position}>` | Connection dropped on empty canvas. |
| `connectionDrop` | `output<{position, event, sourceNodeId, sourceHandleId?}>` | Connection drop with pointer details. |
| `nodesChange` | `output<Node[]>` | Nodes moved, added, deleted, or edited. |
| `edgesChange` | `output<Edge[]>` | Edges added, reconnected, or deleted. |
| `paneClick` | `output<{event, position}>` | Empty canvas click (graph-space position). |
| `paneScroll` | `output<WheelEvent>` | Wheel scroll on the canvas. |
| `contextMenu` | `output<{type, item?, event}>` | Right-click on canvas / node / edge. |
| `beforeDelete` | `output<{nodes, edges, cancel}>` | Cancellable delete. |
| `importError` | `output<{message, error?}>` | JSON import failure. |
| `nodeMouseEnter` / `nodeMouseLeave` | `output<Node>` | Pointer enter/leave node. |
| `nodeMouseMove` | `output<{node, event}>` | Pointer move over a node. |
| `edgeMouseEnter` / `edgeMouseLeave` | `output<Edge>` | Pointer enter/leave edge. |

### `<ngx-workflow-panel>`

An anchored overlay container projected inside `<ngx-workflow-diagram>` for building floating legends, control panels, stats HUDs, or inspection cards.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `PanelPosition` | `'top-left'` | 9 anchor presets: `'top-left' \| 'top-center' \| 'top-right' \| 'center-left' \| 'center' \| 'center-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'`. |
| `className` | `string` | `undefined` | Custom CSS class applied to the panel container. |
| `style` | `string \| Record<string, string \| number>` | `undefined` | Dynamic inline styles (e.g. `minWidth`, `background`, `boxShadow`, `zIndex`). |

### `<ngx-workflow-node-toolbar>`

A floating contextual action toolbar that anchors directly above/below an active node.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `nodeId` | `string` | `required` | ID of the node to attach this floating toolbar to. |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Side of the node where the toolbar floats. |
| `offset` | `number` | `10` | Offset distance in pixels from the node boundary. |

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
  // Styling — colors accept hex / rgb() / rgba()
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
    [key: string]: any;
  };
  shadow?: boolean | string;   // Drop shadow
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  borderWidth?: number;

  // Behavior
  ports?: 0 | 1 | 2 | 3 | 4; // 0=None, 1=Top, 2=Top/Bottom, 3=Left/Right, 4=All
  maxConnectionsPerPort?: number; // Default max edges per port on this node
  handleConfig?: {
    [handleId: string]: {
      isConnectable?: boolean | number | ((node: Node, edges: Edge[]) => boolean);
      maxConnections?: number; // Override for this port
    };
  };
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
  type?: 'bezier' | 'straight' | 'step' | 'smoothstep' | 'smart' | 'dashed';
  animated?: boolean;      // Defaults animationType to 'flow' when unset
  animationType?: 'flow' | 'dot' | 'both';
  animationDuration?: string; // e.g. '1s'
  animationStyle?: { fill?: string };
  markerStart?: 'arrow' | 'arrowclosed' | 'dot' | string;
  markerEnd?: 'arrow' | 'arrowclosed' | 'dot' | string; // Built-ins match stroke
  style?: { stroke?: string; strokeWidth?: string | number; strokeDasharray?: string; [key: string]: any };
  labelStyle?: { fill?: string; [key: string]: any };
}
```

Standalone properties sidebar: bind `(nodeChange)` / `(edgeChange)` (not `(change)` for nodes).

#### `<ngx-workflow-zoom-controls>` & `[zoomControlsConfig]`

Configure the floating zoom and workflow toolbar on `<ngx-workflow-diagram>` or mount standalone:

```html
<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [zoomControlsConfig]="{
    position: 'bottom-left',
    orientation: 'horizontal',
    items: [
      { id: 'undo', type: 'action', action: 'undo' },
      { id: 'redo', type: 'action', action: 'redo' },
      { id: 'sep1', type: 'separator' },
      { id: 'zoomIn', type: 'action', action: 'zoomIn', icon: 'plus' },
      { id: 'zoomPercent', type: 'view', view: 'zoomPercent' },
      { id: 'zoomOut', type: 'action', action: 'zoomOut', icon: 'minus' },
      { id: 'sep2', type: 'separator' },
      { id: 'fitView', type: 'action', action: 'fitView', icon: 'fit' },
      { id: 'fullscreen', type: 'action', action: 'fullscreen', icon: 'fullscreen' }
    ]
  }"
  (fullscreen)="toggleFullscreen()"
/>
```

| Config Property | Type | Default | Description |
|-----------------|------|---------|-------------|
| `position` | `ZoomControlsPosition` | `'bottom-left'` | 8 anchor presets: `'top-left' \| 'top-center' \| 'top-right' \| 'center-left' \| 'center-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction of toolbar buttons and dividers. |
| `style` | `string \| Record<string, string \| number>` | `undefined` | Custom inline CSS styles for toolbar container. |
| `className` | `string` | `undefined` | Custom CSS class applied to container. |
| `items` | `ZoomControlItem[]` | `[...]` | Full array controlling slot order, built-in/custom actions, views, labels, custom SVGs, and separators. |

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
Similar to nodes, you can register custom edge components via the edge types token. Built-in path types include `bezier`, `straight`, `step`, `smoothstep`, and `smart`.

1.  **Create Edge Component**: A standalone component that accepts an `edge` input (`EdgeComponentType`).
2.  **Register Token**:
    ```typescript
    import { NGX_WORKFLOW_EDGE_TYPES } from 'ngx-workflow';
    providers: [
      { provide: NGX_WORKFLOW_EDGE_TYPES, useValue: { 'my-edge': CustomEdgeComponent } }
    ]
    ```

## 🎨 Custom Customization

### Edge Markers
Built-in markers (`arrow`, `arrowclosed`, `dot`) match `edge.style.stroke` (including `rgba`). For custom SVG markers, pass a template to `[defsTemplate]`:

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

### Mobile & Touch Support
- **Pinch-to-Zoom**: Two-finger pinch gesture scales the diagram centered at the focal midpoint.
- **Two-Finger Pan**: Dragging with two fingers smoothly pans the canvas.
- **Touch Action Guard**: Blocks default browser scrolling and gestures automatically.

### Accessibility (a11y)
- Full ARIA markup (`role="application"`, `role="graphics-document"`, `role="button"`, `role="img"`, `tabindex="0"`, and `aria-label`).
- Full screen reader navigation for nodes, edges, minimap, and zoom controls.

## ⌨️ Keyboard Shortcuts

### Navigation & Focus Traversal
| Shortcut | Action |
|----------|--------|
| `Tab` / `Shift` + `Tab` | Cycle keyboard focus through nodes |
| `Arrow Keys` | Follow connected edges to focus upstream/downstream nodes |
| `Shift` + `Arrow Keys` | Nudge selected node(s) by grid steps (10px / `gridSize`) |
| `Space` + `Drag` | Pan canvas |
| `Shift` + `Drag` | Lasso selection |
| `Ctrl` + `Click` | Multi-select |
| `Mouse Wheel` | Zoom in/out |
| `Enter` / `Space` | Select/toggle focused node |
| `Escape` | Clear selection and node focus |

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
