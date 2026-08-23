# ngx-workflow - Usage Examples

## Declarative Approach (Recommended)

Use `@Input()` properties to pass initial data directly in the template:

```typescript
import { Component } from '@angular/core';
import { Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-workflow',
  template: `
    <div style="width: 100%; height: 600px;">
      <ngx-workflow-diagram
        [initialNodes]="nodes"
        [initialEdges]="edges"
        (nodeClick)="onNodeClick($event)"
        (connect)="onConnect($event)"
        (nodesChange)="onNodesChange($event)"
      ></ngx-workflow-diagram>
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
import { DiagramStateService } from 'ngx-workflow';

@Component({
  selector: 'app-workflow',
  template: `
    <div style="width: 100%; height: 600px;">
      <ngx-workflow-diagram></ngx-workflow-diagram>
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

## Overlay Panels & Custom Inspectors

```typescript
import { Component, signal } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-panel-usage',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div style="width: 100%; height: 600px;">
      <ngx-workflow-diagram
        [nodes]="nodes()"
        [edges]="edges()"
        [showPropertiesSidebar]="false"
        (nodeDoubleClick)="onNodeDoubleClick($event)"
        (paneClick)="closeInspector()"
      >
        <!-- Overlay Panel -->
        <ngx-workflow-panel position="top-right" [style]="{ minWidth: '240px' }">
          <div class="legend-card">
            <h4>Workflow Legend</h4>
            <p>Custom anchored overlay panel</p>
          </div>
        </ngx-workflow-panel>
      </ngx-workflow-diagram>
    </div>
  `
})
export class PanelUsageComponent {
  nodes = signal<Node[]>([ ... ]);
  edges = signal<Edge[]>([ ... ]);

  onNodeDoubleClick(node: Node) {
    console.log('Double clicked node:', node);
  }

  closeInspector() {
    console.log('Clicked canvas pane');
  }
}
```

## Available Inputs

- `[nodes]` / `[initialNodes]` - Array of nodes to display (Signal-based reactive binding)
- `[edges]` / `[initialEdges]` - Array of edges to display
- `[showPropertiesSidebar]` - Enable or disable built-in properties editing sidebar on double click (default: `false`)
- `[showSearchControls]` - Show search control bar overlay (default: `true`)
- `[showZoomControls]` - Show zoom in / out / fit controls (default: `true`)
- `[showMinimap]` - Show canvas minimap navigation (default: `true`)
- `[showBackground]` - Show canvas background grid/dots (default: `true`)
- `[backgroundVariant]` - `'dots' | 'lines' | 'cross'` (default: `'dots'`)
- `[showLayoutControls]` - Show automatic graph layout controls (default: `false`)
- `[snapToGrid]` - Snap nodes to grid on drag (default: `false`)

## Available Outputs

- `(nodeClick)` - Emitted when a node is clicked
- `(nodeDoubleClick)` - Emitted when a node is double-clicked
- `(edgeClick)` - Emitted when an edge is clicked
- `(edgeDoubleClick)` - Emitted when an edge is double-clicked
- `(paneClick)` - Emitted when empty canvas pane is clicked
- `(connect)` - Emitted when a new edge is created
- `(nodesChange)` - Emitted when nodes change (move, add, delete, resize)
- `(edgesChange)` - Emitted when edges change (create, delete, reconnect)
