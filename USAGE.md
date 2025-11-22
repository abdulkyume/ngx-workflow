# ngx-flow - Usage Examples

## Declarative Approach (Recommended)

Use `@Input()` properties to pass initial data directly in the template:

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
        (nodesChange)="onNodesChange($event)"
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
  }

  onNodesChange(nodes: Node[]) {
    console.log('Nodes changed:', nodes);
    this.nodes = nodes; // Update local state
  }
}
```

## Imperative Approach (Service Injection)

Use `DiagramStateService` for programmatic control:

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
    <button (click)="undo()">Undo</button>
    <button (click)="redo()">Redo</button>
  `
})
export class WorkflowComponent {
  constructor(private diagramState: DiagramStateService) {
    // Add initial nodes
    this.diagramState.addNode({
      id: '1',
      position: { x: 50, y: 50 },
      data: { label: 'Start' },
      draggable: true
    });

    // Subscribe to events
    this.diagramState.connect.subscribe(connection => {
      console.log('New connection:', connection);
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

  undo() {
    this.diagramState.undo();
  }

  redo() {
    this.diagramState.redo();
  }
}
```

## Available Inputs

- `[initialNodes]` - Array of nodes to display
- `[initialEdges]` - Array of edges to display
- `[initialViewport]` - Initial viewport state `{ x, y, zoom }`

## Available Outputs

- `(nodeClick)` - Emitted when a node is clicked
- `(edgeClick)` - Emitted when an edge is clicked
- `(connect)` - Emitted when a new edge is created
- `(nodesChange)` - Emitted when nodes change
- `(edgesChange)` - Emitted when edges change
