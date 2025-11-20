# Usage Guide for ngx-flow

This guide provides examples on how to integrate and use the `ngx-flow` library in your Angular components.

## 1. Basic Diagram Setup

To display a diagram, use the `<ngx-diagram>` component in your template. This component acts as the main container for your flow.

```typescript
// src/app/my-flow-component/my-flow.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramComponent, DiagramStateService, Node, Edge } from 'ngx-flow'; // Import from ngx-flow
import { v4 as uuidv4 } from 'uuid'; // Don't forget to install uuid

@Component({
  selector: 'app-my-flow',
  standalone: true,
  imports: [CommonModule, DiagramComponent], // Import DiagramComponent as it's standalone
  template: `
    <div style="height: 500px; width: 100%;">
      <ngx-diagram></ngx-diagram>
    </div>
  `,
  styleUrls: ['./my-flow.component.css']
})
export class MyFlowComponent implements OnInit {
  constructor(private diagramStateService: DiagramStateService) {}

  ngOnInit(): void {
    // Initialize nodes and edges
    const initialNodes: Node[] = [
      { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' }, draggable: true },
      { id: '2', position: { x: 300, y: 200 }, data: { label: 'Node 2' }, draggable: true },
    ];

    const initialEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2', type: 'bezier', animated: true },
    ];

    initialNodes.forEach(node => this.diagramStateService.addNode(node));
    initialEdges.forEach(edge => this.diagramStateService.addEdge(edge));

    // Subscribe to events (optional)
    this.diagramStateService.nodeClick.subscribe(node => console.log('Node clicked:', node));
    this.diagramStateService.edgeClick.subscribe(edge => console.log('Edge clicked:', edge));
    this.diagramStateService.connect.subscribe(connection => console.log('New connection:', connection));
  }

  // Example of adding a new node dynamically
  addAnotherNode(): void {
    const newNode: Node = {
      id: uuidv4(),
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { label: 'New Node' },
      draggable: true,
    };
    this.diagramStateService.addNode(newNode);
  }
}
```

## 2. Accessing and Modifying Diagram State

The `DiagramStateService` is your primary interface for interacting with the diagram's nodes, edges, and viewport.

```typescript
// In your component constructor
constructor(private diagramStateService: DiagramStateService) {}

// Get current nodes (as a Signal)
const nodes = this.diagramStateService.nodes();

// Get current viewport (as a Signal)
const viewport = this.diagramStateService.viewport();

// Add a node
this.diagramStateService.addNode({ id: 'new', position: { x: 50, y: 50 }, data: { label: 'New' } });

// Update a node's position
this.diagramStateService.updateNode('node-id', { position: { x: 100, y: 100 } });

// Remove a node
this.diagramStateService.removeNode('node-id');

// Add an edge
this.diagramStateService.addEdge({ id: 'e-new', source: 'node1', target: 'node2' });

// Remove an edge
this.diagramStateService.removeEdge('edge-id');

// Set viewport (pan and zoom)
this.diagramStateService.setViewport({ x: 10, y: 20, zoom: 1.5 });

// Clear selection
this.diagramStateService.clearSelection();

// Delete selected elements
this.diagramStateService.deleteSelectedElements();

// Undo/Redo
this.diagramStateService.undo();
this.diagramStateService.redo();
```

## 3. Listening to Diagram Events

The `DiagramStateService` exposes `EventEmitter`s for various user interactions:

```typescript
this.diagramStateService.nodeClick.subscribe(node => {
  console.log('Node clicked:', node.id, node.data?.label);
});

this.diagramStateService.edgeClick.subscribe(edge => {
  console.log('Edge clicked:', edge.id);
});

this.diagramStateService.connect.subscribe(connection => {
  console.log('New connection established:', connection.source, '->', connection.target);
});

this.diagramStateService.dragStart.subscribe(node => {
  console.log('Node drag started:', node.id);
});

this.diagramStateService.dragEnd.subscribe(node => {
  console.log('Node drag ended:', node.id, 'at', node.position);
});

// These are useful for reacting to changes in the underlying data
this.diagramStateService.nodesChange.subscribe(nodes => {
  console.log('Nodes array changed:', nodes.length);
});

this.diagramStateService.edgesChange.subscribe(edges => {
  console.log('Edges array changed:', edges.length);
});

this.diagramStateService.viewportChange.subscribe(viewport => {
  console.log('Viewport changed:', viewport);
});
```

For more advanced topics, refer to the [Custom Nodes & Edges Guide](CUSTOM_NODES_EDGES.md) and [Layout Guide](LAYOUT.md).