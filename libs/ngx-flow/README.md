# ngx-flow

An Angular library for building interactive workflow diagrams with drag-and-drop nodes and connectable edges.

## Features

- 🎯 **Drag & Drop Nodes** - Reposition nodes by dragging
- 🔗 **Connect Edges** - Connect nodes via handles with bezier/straight/step paths
- 🔍 **Pan & Zoom** - Navigate large diagrams with mouse wheel zoom and canvas panning
- 🎨 **Customizable** - Style nodes and edges via CSS variables or custom components
- ↩️ **Undo/Redo** - Full undo/redo support for all diagram changes
- ⌨️ **Keyboard Shortcuts** - Delete, undo (Ctrl+Z), redo (Ctrl+Shift+Z)
- 📦 **Lasso Selection** - Select multiple nodes (Shift + drag)

## Installation

```bash
npm install ngx-flow
```

## Quick Start

### Declarative Approach (Recommended)

Use `@Input()` and `@Output()` properties for a more Angular-friendly, template-driven approach:

```typescript
import { Component } from '@angular/core';
import { Node, Edge } from 'ngx-flow';

@Component({
  selector: 'app-workflow',
  template: `
    <div style="width: 100%; height: 600px;">
      <ngx-diagram
        [initialNodes]="nodes"
        [initialEdges]="edges"
        (nodeClick)="onNodeClick($event)"
        (connect)="onConnect($event)"
      ></ngx-diagram>
    </div>
  `
})
export class WorkflowComponent {
  nodes: Node[] = [
    {
      id: '1',
      position: { x: 50, y: 50 },
      data: { label: 'Start' },
      draggable: true
    },
    {
      id: '2',
      position: { x: 300, y: 50 },
      data: { label: 'Process' },
      draggable: true
    }
  ];

  edges: Edge[] = [
    {
      id: 'e1',
      source: '1',
      sourceHandle: 'right',
      target: '2',
      targetHandle: 'left',
      type: 'bezier'
    }
  ];

  onNodeClick(node: Node) {
    console.log('Node clicked:', node);
  }

  onConnect(connection: { source: string; target: string }) {
    console.log('New connection:', connection);
    // Add new edge to your data
    this.edges = [...this.edges, {
      id: Date.now().toString(),
      ...connection,
      type: 'bezier'
    }];
  }
}
```

### Imperative Approach (Service Injection)

Use `DiagramStateService` for programmatic control:

```typescript
import { NgxFlowModule } from 'ngx-flow';

@NgModule({
  imports: [NgxFlowModule],
})
export class AppModule {}
```

### 2. Use the Component

```typescript
import { Component } from '@angular/core';
import { DiagramStateService } from 'ngx-flow';

@Component({
  selector: 'app-workflow',
  template: `
    <div style="width: 100%; height: 600px;">
      <ngx-diagram></ngx-diagram>
    </div>
    <button (click)="addNode()">Add Node</button>
  `
})
export class WorkflowComponent {
  constructor(private diagramState: DiagramStateService) {
    // Add initial nodes
    this.diagramState.addNode({
      id: '1',
      position: { x: 50, y: 50 },
      data: { label: 'Start' },
      draggable: true,
      width: 170,
      height: 60
    });

    this.diagramState.addNode({
      id: '2',
      position: { x: 300, y: 50 },
      data: { label: 'Process' },
      draggable: true,
      width: 170,
      height: 60
    });

    // Add an edge
    this.diagramState.addEdge({
      id: 'e1',
      source: '1',
      sourceHandle: 'right',
      target: '2',
      targetHandle: 'left',
      type: 'bezier'
    });
  }

  addNode() {
    this.diagramState.addNode({
      id: Date.now().toString(),
      position: { x: 200, y: 200 },
      data: { label: 'New Node' },
      draggable: true
    });
  }
}
```

## API Reference

### DiagramComponent

#### Inputs

- `[initialNodes]` - Initial array of nodes to display
- `[initialEdges]` - Initial array of edges to display
- `[initialViewport]` - Initial viewport state `{ x: number, y: number, zoom: number }`

#### Outputs

- `(nodeClick)` - Emitted when a node is clicked. Payload: `Node`
- `(edgeClick)` - Emitted when an edge is clicked. Payload: `Edge`
- `(connect)` - Emitted when a new edge is created. Payload: `{ source: string, sourceHandle?: string, target: string, targetHandle?: string }`
- `(nodesChange)` - Emitted when nodes change. Payload: `Node[]`
- `(edgesChange)` - Emitted when edges change. Payload: `Edge[]`

### DiagramStateService

The main service for managing diagram state.

#### Methods

- `addNode(node: Node): void` - Add a new node
- `removeNode(nodeId: string): void` - Remove a node
- `moveNode(nodeId: string, position: XYPosition): void` - Move a node
- `addEdge(edge: Edge): void` - Add a new edge
- `removeEdge(edgeId: string): void` - Remove an edge
- `selectNodes(nodeIds: string[], append?: boolean): void` - Select nodes
- `undo(): void` - Undo last change
- `redo(): void` - Redo last undone change

#### Signals

- `nodes()` - Current nodes array
- `edges()` - Current edges array
- `viewport()` - Current viewport state (x, y, zoom)

#### Events

- `nodeClick` - Emitted when a node is clicked
- `edgeClick` - Emitted when an edge is clicked
- `connect` - Emitted when a new edge is created
- `nodesChange` - Emitted when nodes change
- `edgesChange` - Emitted when edges change

### Node Interface

```typescript
interface Node {
  id: string;
  position: { x: number; y: number };
  data?: any;
  width?: number;  // Default: 170
  height?: number; // Default: 60
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean; // Default: true
  type?: string;
}
```

### Edge Interface

```typescript
interface Edge {
  id: string;
  source: string;
  sourceHandle?: string; // 'top' | 'right' | 'bottom' | 'left'
  target: string;
  targetHandle?: string; // 'top' | 'right' | 'bottom' | 'left'
  type?: 'bezier' | 'straight' | 'step'; // Default: 'bezier'
  animated?: boolean;
  style?: { [key: string]: any };
}
```

## Interactions

### Node Dragging
- Click and drag on a node's body to move it
- Nodes must have `draggable: true` to be draggable

### Creating Edges
1. Click on a handle (small blue circle at node edges)
2. Drag to another node's handle
3. Release to create the connection

### Panning
- Click and drag on empty canvas to pan
- Or use middle mouse button

### Zooming
- Use mouse wheel to zoom in/out
- Zoom is centered on mouse position

### Selection
- Click a node to select it
- Ctrl/Cmd + click to add to selection
- Shift + drag on canvas for lasso selection
- Press Delete to remove selected nodes/edges

### Undo/Redo
- Ctrl/Cmd + Z to undo
- Ctrl/Cmd + Shift + Z to redo

## Customization

### CSS Variables

```css
:host {
  --ngx-flow-primary: #3b82f6;
  --ngx-flow-primary-hover: #2563eb;
  --ngx-flow-bg: #f8fafc;
  --ngx-flow-surface: #ffffff;
  --ngx-flow-border: #e2e8f0;
  --ngx-flow-text-primary: #1e293b;
  --ngx-flow-text-secondary: #64748b;
  --ngx-flow-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --ngx-flow-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --ngx-flow-glass-bg: rgba(255, 255, 255, 0.8);
  --ngx-flow-glass-blur: blur(12px);
}
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
