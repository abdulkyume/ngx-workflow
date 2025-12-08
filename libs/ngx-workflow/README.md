# ngx-workflow

[![npm version](https://img.shields.io/npm/v/ngx-workflow.svg)](https://www.npmjs.com/package/ngx-workflow)
[![License](https://img.shields.io/npm/l/ngx-workflow.svg)](https://github.com/abdulkyume/ngx-workflow/blob/main/LICENSE)

A powerful, highly customizable Angular library for building interactive node-based editors, flow charts, and diagrams. Built with Angular Signals for high performance and reactivity.

![Demo Screenshot](https://raw.githubusercontent.com/abdulkyume/ngx-workflow/main/assets/demo.png)

## 🚀 Features

- **Native Angular**: Built from the ground up for Angular, using Signals and OnPush change detection.
- **Interactive**: Drag & drop nodes, zoom & pan canvas, connect edges.
- **Customizable**: Fully custom node and edge templates.
- **Rich UI**: Built-in minimap, background patterns, controls, and alignment tools.
- **Layouts**: Automatic layout support via Dagre and ELK.
- **History**: Robust Undo/Redo history stack.
- **Export**: Export to JSON, PNG, or SVG.
- **Theming**: Extensive CSS variables for easy styling.

## ✨ New Features (Latest Release)

We've added **8 powerful new features** to enhance your workflow experience:

1. **Before Delete Hook** - Control deletion with cancellable events
2. **Z-Index Layer Management** - Keyboard shortcuts + context menu for node stacking
3. **Connection Limits** - Restrict connections per handle (global or per-handle)
4. **Edge Label Components** - Use custom Angular components for rich edge labels
5. **Batch Operations** - `selectAll()`, `alignNodes()`, `distributeNodes()` methods
6. **Mini-Map Enhancements** - Node colors, selection highlighting, pulse animations
7. **Node Collision Detection** - Visual feedback when nodes overlap during drag
8. **Bug Fixes** - Edge interaction & injection context improvements

📖 **[View complete feature documentation →](./FEATURES.md)**

## 📦 Installation

```bash
npm install ngx-workflow
```

## 🏁 Quick Start

### Standalone Component (Recommended)

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
        [initialNodes]="nodes"
        [initialEdges]="edges"
        [zIndexMode]="'layered'"
        [preventNodeOverlap]="true"
        (nodeClick)="onNodeClick($event)"
        (beforeDelete)="onBeforeDelete($event)">
        
        <ngx-workflow-minimap [showNodeColors]="true">
        </ngx-workflow-minimap>
      </ngx-workflow-diagram>
    </div>
  `
})
export class AppComponent {
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, label: 'Start' },
    { id: '2', position: { x: 300, y: 100 }, label: 'End' }
  ];

  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' }
  ];

  onNodeClick(node: Node) {
    console.log('Clicked:', node);
  }

  onBeforeDelete(event: any) {
    if (!confirm('Delete selected items?')) {
      event.cancel();
    }
  }
}
```

---

## 📖 Complete API Reference

### `<ngx-workflow-diagram>` Inputs

#### Core Configuration

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `initialNodes` | `Node[]` | `[]` | Initial nodes array |
| `initialEdges` | `Edge[]` | `[]` | Initial edges array |
| `initialViewport` | `Viewport` | `undefined` | Initial viewport `{ x, y, zoom }` |

#### Display Options

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `showZoomControls` | `boolean` | `true` | Show zoom controls (bottom-left) |
| `showMinimap` | `boolean` | `true` | Show minimap (bottom-right) |
| `showBackground` | `boolean` | `true` | Show background pattern |
| `showGrid` | `boolean` | `false` | Show grid overlay |
| `showExportControls` | `boolean` | `false` | Show export controls |
| `showLayoutControls` | `boolean` | `false` | Show layout controls |

#### Background Configuration

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `backgroundVariant` | `'dots' \| 'lines' \| 'cross'` | `'dots'` | Background pattern style |
| `backgroundGap` | `number` | `20` | Gap between pattern elements |
| `backgroundSize` | `number` | `1` | Size of pattern elements |
| `backgroundColor` | `string` | `'#81818a'` | Pattern color |
| `backgroundBgColor` | `string` | `'#f0f0f0'` | Canvas background color |

#### Grid Configuration

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `gridSize` | `number` | `20` | Grid cell size in pixels |
| `snapToGrid` | `boolean` | `false` | Snap nodes to grid |

#### Node & Edge Behavior

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `nodesResizable` | `boolean` | `true` | Global toggle for node resizing |
| `nodeDraggable` | `boolean` | `true` | Can nodes be dragged |
| `edgeReconnectable` | `boolean` | `false` | Can edges be reconnected |
| `validateConnection` | `Function` | `undefined` | Custom connection validation |
| `maxConnectionsPerHandle` | `number` | `undefined` | Global connection limit per handle |

#### Z-Index & Layer Management

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `zIndexMode` | `'default' \| 'layered'` | `'default'` | Enable z-index layer management |

#### Collision Detection

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `preventNodeOverlap` | `boolean` | `false` | Enable collision detection |
| `nodeSpacing` | `number` | `10` | Minimum spacing between nodes (px) |

#### Auto-Panning

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `autoPanOnNodeDrag` | `boolean` | `true` | Auto-pan when dragging near edge |
| `autoPanOnConnect` | `boolean` | `true` | Auto-pan when connecting near edge |
| `autoPanSpeed` | `number` | `15` | Pan speed (pixels per frame) |
| `autoPanEdgeThreshold` | `number` | `50` | Distance from edge to trigger (px) |

#### Auto-Save

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `autoSave` | `boolean` | `false` | Enable auto-save |
| `autoSaveInterval` | `number` | `1000` | Auto-save interval (milliseconds) |
| `maxVersions` | `number` | `10` | Maximum saved versions |

---

### `<ngx-workflow-diagram>` Outputs

#### Basic Events

| Output | Type | Description |
|--------|------|-------------|
| `nodeClick` | `EventEmitter<Node>` | Node clicked |
| `nodeDoubleClick` | `EventEmitter<Node>` | Node double-clicked |
| `edgeClick` | `EventEmitter<Edge>` | Edge clicked |
| `connect` | `EventEmitter<Connection>` | New connection created |
| `nodesChange` | `EventEmitter<Node[]>` | Nodes array changed |
| `edgesChange` | `EventEmitter<Edge[]>` | Edges array changed |

#### Mouse Interaction Events

| Output | Type | Description |
|--------|------|-------------|
| `nodeMouseEnter` | `EventEmitter<Node>` | Mouse entered node |
| `nodeMouseLeave` | `EventEmitter<Node>` | Mouse left node |
| `nodeMouseMove` | `EventEmitter<{node, event}>` | Mouse moved over node |
| `edgeMouseEnter` | `EventEmitter<Edge>` | Mouse entered edge |
| `edgeMouseLeave` | `EventEmitter<Edge>` | Mouse left edge |

#### Canvas Events

| Output | Type | Description |
|--------|------|-------------|
| `paneClick` | `EventEmitter<{event, position}>` | Empty canvas clicked |
| `paneScroll` | `EventEmitter<WheelEvent>` | Canvas scrolled/zoomed |
| `contextMenu` | `EventEmitter<{type, item, event}>` | Right-click context menu |

#### Connection Events

| Output | Type | Description |
|--------|------|-------------|
| `connectStart` | `EventEmitter<{nodeId, handleId}>` | Connection drag started |
| `connectEnd` | `EventEmitter<{nodeId, handleId}>` | Connection drag ended |
| `connectionDrop` | `EventEmitter<{position, event, sourceNodeId, sourceHandleId}>` | Connection dropped |

#### Control Events

| Output | Type | Description |
|--------|------|-------------|
| `beforeDelete` | `EventEmitter<{nodes, edges, cancel}>` | Before deletion (cancellable) |

---

## 🎯 Interfaces

### `Node`

```typescript
interface Node {
  id: string;              // Unique identifier
  position: XYPosition;    // { x: number, y: number }
  label?: string;          // Display label
  type?: string;           // 'default', 'group', or custom
  data?: any;              // Custom data for your components
  width?: number;          // Width in pixels (default: 150)
  height?: number;         // Height in pixels (default: 40)
  zIndex?: number;         // Stacking order (when zIndexMode='layered')
  draggable?: boolean;     // Can be dragged (default: true)
  selectable?: boolean;    // Can be selected (default: true)
  connectable?: boolean;   // Can connect edges (default: true)
  resizable?: boolean;     // Can be resized (default: true)
  selected?: boolean;      // Currently selected
  className?: string;      // Custom CSS class
  style?: CSSStyleDeclaration; // Inline styles
  parentId?: string;       // Parent node ID (for grouping)
}
```

### `Edge`

```typescript
interface Edge {
  id: string;              // Unique identifier
  source: string;          // Source node ID
  target: string;          // Target node ID
  sourceHandle?: string;   // Source handle ID
  targetHandle?: string;   // Target handle ID
  label?: string;          // Label text
  type?: 'bezier' | 'straight' | 'step'; // Path type
  animated?: boolean;      // Animated dashed line
  markerEnd?: 'arrow' | 'arrowclosed';   // Arrow type
  selected?: boolean;      // Currently selected
  style?: CSSStyleDeclaration; // SVG styles
  data?: any;              // Custom data
}
```

### `Viewport`

```typescript
interface Viewport {
  x: number;    // Pan X offset
  y: number;    // Pan Y offset
  zoom: number; // Zoom level (1 = 100%)
}
```

### `Connection`

```typescript
interface Connection {
  source: string;          // Source node ID
  sourceHandle?: string;   // Source handle ID
  target: string;          // Target node ID
  targetHandle?: string;   // Target handle ID
}
```

---

## ⌨️ Keyboard Shortcuts

### Selection & Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + A` | Select all nodes |
| `Ctrl/Cmd + Click` | Multi-select nodes |
| `Shift + Drag` | Lasso selection |
| `Escape` | Clear selection |

### Editing

| Shortcut | Action |
|----------|--------|
| `Delete / Backspace` | Delete selected |
| `Ctrl/Cmd + C` | Copy |
| `Ctrl/Cmd + V` | Paste |
| `Ctrl/Cmd + X` | Cut |
| `Ctrl/Cmd + D` | Duplicate |

### History

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

### Z-Index (Layer Management)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ]` | Bring to front |
| `Ctrl/Cmd + [` | Send to back |
| `Ctrl/Cmd + Shift + ]` | Raise layer |
| `Ctrl/Cmd + Shift + [` | Lower layer |

### Grouping

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + G` | Group selected nodes |
| `Ctrl/Cmd + Shift + G` | Ungroup |

---

## 🎨 Customization

### Custom Node Components

Create custom node types:

```typescript
@Component({
  selector: 'app-custom-node',
  template: `
    <div class="custom-node">
      <h3>{{ node.data.title }}</h3>
      <p>{{ node.data.description }}</p>
      <ngx-workflow-handle type="source" position="right">
      </ngx-workflow-handle>
      <ngx-workflow-handle type="target" position="left">
      </ngx-workflow-handle>
    </div>
  `,
  styles: [`
    .custom-node {
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 12px;
      min-width: 200px;
    }
  `]
})
export class CustomNodeComponent {
  @Input() node!: Node;
}
```

Register it:

```typescript
import { NGX_WORKFLOW_NODE_TYPES } from 'ngx-workflow';

providers: [
  {
    provide: NGX_WORKFLOW_NODE_TYPES,
    useValue: {
      'custom': CustomNodeComponent
    }
  }
]
```

Use it:

```typescript
{ 
  id: '1', 
  type: 'custom', 
  position: { x: 0, y: 0 },
  data: { title: 'My Node', description: 'Details...' }
}
```

### Custom Edge Labels

Use Angular components for edge labels:

```typescript
<ngx-workflow-diagram [nodes]="nodes" [edges]="edges">
  <ng-template #edgeLabelTemplate let-edge>
    <div class="custom-label">
      <button (click)="editEdge(edge)">✏️</button>
      <span>{{ edge.label }}</span>
      <span class="badge">{{ edge.data?.priority }}</span>
    </div>
  </ng-template>
</ngx-workflow-diagram>
```

### Theming

Override CSS variables:

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

---

## 🔧 Programmatic API

Access via `DiagramStateService`:

```typescript
constructor(private diagramState: DiagramStateService) {}

// Selection
this.diagramState.selectAll();
this.diagramState.deselectAll();
this.diagramState.selectNodes(['node-1', 'node-2']);

// Alignment
this.diagramState.alignNodes('left');
// Options: 'left', 'right', 'center', 'top', 'bottom', 'middle'

// Distribution
this.diagramState.distributeNodes('horizontal');
// Options: 'horizontal', 'vertical'

// Deletion
this.diagramState.deleteAll();

// Z-Index
this.diagramState.bringToFront('node-1');
this.diagramState.sendToBack('node-1');
this.diagramState.raiseLayer('node-1');
this.diagramState.lowerLayer('node-1');

// Viewport
this.diagramState.setViewport({ x: 0, y: 0, zoom: 1 });
this.diagramState.fitView();

// Nodes & Edges
this.diagramState.addNode(node);
this.diagramState.updateNode('node-1', { label: 'Updated' });
this.diagramState.deleteNode('node-1');
this.diagramState.addEdge(edge);
this.diagramState.deleteEdge('edge-1');
```

---

## 📋 Examples

### With Connection Limits

```typescript
<ngx-workflow-diagram
  [maxConnectionsPerHandle]="1">
</ngx-workflow-diagram>

// Or per-handle:
node.data = {
  handleConfig: {
    'output': { maxConnections: 1 }
  }
}
```

### With Collision Detection

```typescript
<ngx-workflow-diagram
  [preventNodeOverlap]="true"
  [nodeSpacing]="10">
</ngx-workflow-diagram>
```

### With Before Delete Hook

```typescript
<ngx-workflow-diagram
  (beforeDelete)="onBeforeDelete($event)">
</ngx-workflow-diagram>

onBeforeDelete(event: any) {
  if (!confirm('Delete?')) {
    event.cancel();
  }
}
```

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 License

MIT License - see [LICENSE](LICENSE).
