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
- **Execution Simulator**: Step-by-step graph execution playback (`<ngx-workflow-execution-controls>`) with speed controls & status tracking (`idle`, `running`, `success`, `error`, `skipped`)
- **Format Adapters**: Built-in adapters for **Mermaid.js** (`MermaidAdapter`) and **ReactFlow / xyflow** (`ReactFlowAdapter`)
- **Collapsible Groups**: Nest sub-flows with container grouping, expand/collapse toggles, and group/ungroup actions
- **Node Palette**: Drag-and-drop stencil panel (`<ngx-workflow-palette>`) to drop new nodes directly onto canvas
- **Typed Ports**: Port data type validation (`dataType`) to prevent connecting incompatible handle types
- **Manual Edge Waypoints**: Custom bendpoint support (`waypoints?: Array<{ x: number, y: number }>`) for manual routing
- **Reactive Forms Integration**: Full `ControlValueAccessor` (`formControlName` / `[(ngModel)]`) support with built-in graph validators (`noCycles`, `noOrphanNodes`, `minNodes`)
- **Customizable**: Fully custom node and edge templates
- **Rich UI**: Built-in minimap, background patterns, controls, alignment, and equal distribution tools
- **Parallel Edge Offsetting**: Sibling edges fan along shared handles; set `edge.data.centerAnchors: true` to pin attach points to the handle center and fan paths instead
- **Layouts**: Automatic layout support via ELK (plus force, hierarchical, and circular helpers)
- **History**: Robust Undo/Redo history stack with Ctrl+Z/Ctrl+Shift+Z
- **Theming**: Explicit `colorMode` and CSS variables for easy styling with dark mode support
- **Smart Alignment**: Visual alignment guides and drag snapping
- **True Recursive Sub-flows**: Create nested graph structures with relative positioning and drag-Nest support
- **Performance Virtualization**: Optimizes rendering for large graphs by culling off-screen nodes

### Advanced Features
- **Snap-to-Grid**: Configurable grid snapping for precise node placement
- **Space Panning**: Professional canvas panning with Space + Drag
- **Export Controls**: Built-in UI for PNG, SVG, and clipboard export
- **Clipboard Operations**: Full copy/paste/cut support with Ctrl+C/V/X and localStorage persistence
- **Smart Routing**: Use `type: 'smart'` for edges that automatically route around nodes (obstacle avoidance)
- **Interactive Labels**: Clickable edge labels with pointer events and hover states
- **Connection Validation**: Prevent invalid connections with custom validators
- **Collision Detection**: Optional collision prevention to stop nodes from overlapping
- **Edge Reconnection**: Drag edge endpoints to reconnect them

### Visuals & Motion
- **Edge Animation**: Flow dash animation and/or moving-dot particles (`animated`, `animationType`: `'flow' | 'dot' | 'both'`)
- **RGBA Colors**: Node fill/text/border and edge stroke/label/animation colors support hex, `rgb()`, and `rgba()` (with opacity)
- **Node Motion**: Programmatic API to animate nodes along edge paths
- **Markers**: Built-in `arrow`, `arrowclosed`, `dot` tinted to match the edge stroke; custom SVG markers via `[defsTemplate]`
- **Background Images**: Support for custom background images via `[backgroundImage]`

### Built-in UI Components
- **Search Bar**: Press `Ctrl+F` to search nodes by label/id.
- **Properties Panel**: Sidebar for editing node and edge properties (auto-shows on selection/double-click), including RGBA color pickers and edge animation/marker controls.
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

Peer dependencies: `@angular/core`, `@angular/common`, and `@angular/forms` (**Angular 17.1 through 22**).

> **Compile note:** Ivy partial compilation is **forward**-compatible only. Build/publish the library with the **oldest** Angular you need to support (or with the consumer’s Angular major). A FESM compiled with Angular 22 will not run correctly on Angular 21 (e.g. `NG0203`).

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
| `zoomControlsActionClick` | `output<{id, action, event}>` | Custom or built-in action button clicked in the zoom controls toolbar. |
| `fullscreen` | `output<void>` | Canvas fullscreen toggled via toolbar. |
| `undo` / `redo` | `output<void>` | Undo or redo triggered via toolbar. |
| `zoomIn` / `zoomOut` / `resetZoom` | `output<void>` | Zoom changes triggered via toolbar. |

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
    backgroundColor?: string; // Node fill
    color?: string;           // Label text
    borderColor?: string;     // Border (also via borderColor)
    [key: string]: any;
  };
  shadow?: boolean | string;   // Drop shadow
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;        // Prefer rgba for opacity
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
  type?: 'bezier' | 'straight' | 'step' | 'smoothstep' | 'smart' | 'dashed'; // Path type
  animated?: boolean;      // Enable animation (defaults animationType to 'flow' when unset)
  animationType?: 'flow' | 'dot' | 'both'; // flow = dashed march; dot = moving circle
  animationDuration?: string; // CSS duration (e.g. '0.5s', '1s', '2s')
  animationStyle?: { fill?: string }; // Dot color (hex / rgba)
  markerStart?: 'arrow' | 'arrowclosed' | 'dot' | string;
  markerEnd?: 'arrow' | 'arrowclosed' | 'dot' | string; // Built-ins match stroke color
  style?: {
    stroke?: string;           // Edge color (hex / rgba)
    strokeWidth?: string | number;
    strokeDasharray?: string;  // e.g. '5,5'
    [key: string]: any;
  };
  labelStyle?: { fill?: string; color?: string; [key: string]: any };
  waypoints?: Array<{ x: number; y: number }>; // Custom manual bendpoints
}
```

#### Properties sidebar (`ngx-workflow-properties-sidebar`)

Built into the diagram; you can also use it standalone:

```html
<ngx-workflow-properties-sidebar
  [node]="selectedNode"
  [edge]="selectedEdge"
  (nodeChange)="onNodePatch($event)"
  (edgeChange)="onEdgePatch($event)"
  (close)="closeSidebar()">
</ngx-workflow-properties-sidebar>
```

| Output | Payload | Notes |
|--------|---------|--------|
| `nodeChange` | `Partial<Node>` | Was previously named `change` — renamed so native color-input `change` events do not collide |
| `edgeChange` | `Partial<Edge>` | Edge style / animation / marker patches |

Color fields emit `rgba(...)` when opacity is adjusted. Partial `style` / `animationStyle` / `labelStyle` updates are deep-merged in the store.

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
      { id: 'fullscreen', type: 'action', action: 'fullscreen', icon: 'fullscreen' },
      { id: 'custom', type: 'action', action: 'export', label: 'Export', title: 'Export Diagram' }
    ]
  }"
  (fullscreen)="toggleFullscreen()"
/>
```

| Config Property | Type | Default | Description |
|-----------------|------|---------|-------------|
| `position` | `ZoomControlsPosition` | `'bottom-left'` | 8 anchor presets: `'top-left' \| 'top-center' \| 'top-right' \| 'center-left' \| 'center-right' \| 'bottom-left' \| 'bottom-center' \| 'bottom-right'`. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction of the toolbar buttons and dividers. |
| `style` | `string \| Record<string, string \| number>` | `undefined` | Custom inline CSS styles for the toolbar pill (e.g. background, border, shadow). |
| `className` | `string` | `undefined` | Custom CSS class applied to the container. |
| `items` | `ZoomControlItem[]` | `[...]` | Full array controlling slot order, built-in/custom actions, views, labels, custom SVGs, and separators. |

| Built-in Actions / Views | Type | Description |
|--------------------------|------|-------------|
| `zoomIn` | `action` | Increments zoom level by 20% (icon: `'plus'`). |
| `zoomOut` | `action` | Decrements zoom level by 20% (icon: `'minus'`). |
| `zoomPercent` | `view` | Displays current zoom level percentage (e.g. `100%`). |
| `fitView` | `action` | Fits all nodes into viewport (icon: `'fit'`). |
| `resetZoom` | `action` | Resets zoom to 100% (icon: `'reset'`). |
| `fullscreen` / `exitFullscreen` | `action` | Toggles canvas fullscreen. |
| `undo` / `redo` | `action` | Built-in undo and redo with automated disabled state handling. |
| `separator` | `separator` | Divider bar adjusted to horizontal/vertical orientation. |
| Custom action | `action` | Any custom ID/action emitting `(actionClick)` with `{ id, action, event }`. |

#### `<ngx-workflow-palette>` (Component)

Use `<ngx-workflow-palette>` to add a drag-and-drop stencil panel alongside your diagram.

```html
<div class="editor-container" style="display: flex; gap: 16px; height: 100vh;">
  <ngx-workflow-palette
    title="Node Stencil"
    orientation="vertical"
    [items]="customItems"
  ></ngx-workflow-palette>

  <div style="flex: 1;">
    <ngx-workflow-diagram [nodes]="nodes" [edges]="edges"></ngx-workflow-diagram>
  </div>
</div>
```

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `'Node Palette'` | Header title for the palette panel. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Layout direction of the palette items. |
| `items` | `PaletteItem[]` | `[...]` | Preset node items available for dragging. |

#### `<ngx-workflow-handle>` (Component)

Use `<ngx-workflow-handle>` inside your custom node templates to declare input/output connection ports.

```html
<ngx-workflow-handle
    type="source"
    handleId="out-number"
    dataType="number"
    [isConnectable]="true"
></ngx-workflow-handle>
```

| Input | Type | Description |
|-------|------|-------------|
| `type` | `'source' \| 'target'` | Type of handle (Output or Input). |
| `handleId` | `string` | Unique handle identifier within the node. |
| `dataType` | `string` | Data type of the port (e.g. `'number'`, `'string'`, `'boolean'`). Prevents invalid cross-type connections automatically. |
| `isConnectable` | `ConnectableLimit` | Max connection count or connection predicate function. |
| `isValidConnection` | `(connection) => boolean` | Custom function to validate connections for this handle. |

### 📝 Angular Reactive Forms & Validation

`<ngx-workflow-diagram>` implements `ControlValueAccessor`, allowing seamless integration with Angular Reactive Forms (`formControlName`) and Template-driven Forms (`[(ngModel)]`).

```typescript
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgxWorkflowModule, NgxWorkflowValidators } from 'ngx-workflow';

@Component({
  standalone: true,
  imports: [NgxWorkflowModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <ngx-workflow-diagram formControlName="workflow"></ngx-workflow-diagram>
    </form>
  `
})
export class FormDemoComponent {
  form = new FormGroup({
    workflow: new FormControl(
      { nodes: initialNodes, edges: initialEdges },
      [
        NgxWorkflowValidators.noCycles(),
        NgxWorkflowValidators.noOrphanNodes(),
        NgxWorkflowValidators.minNodes(2)
      ]
    )
  });
}
```

### Custom Edges
Similar to nodes, you can register custom edge components via the edge types token. Built-in path types include `bezier`, `straight`, `step`, `smoothstep`, and `smart` (obstacle-avoiding).

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
Built-in markers (`arrow`, `arrowclosed`, `dot`) are tinted to match `edge.style.stroke` (including `rgba`).

```typescript
{ id: 'e1', source: 'a', target: 'b', markerEnd: 'arrow', style: { stroke: 'rgba(239, 68, 68, 1)' } }
```

For fully custom SVG markers, pass a template to `[defsTemplate]`:

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
