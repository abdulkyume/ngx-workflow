# Examples

This directory contains working examples demonstrating various features of ngx-workflow.

## Quick Start Example

### Basic Flow Diagram

```typescript
import { Component } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-basic-example',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div style="height: 600px; width: 100%;">
      <ngx-workflow-diagram
        [initialNodes]="nodes"
        [initialEdges]="edges"
        [snapToGrid]="true"
        [gridSize]="20"
        [showExportControls]="true"
        (nodeClick)="onNodeClick($event)"
      >
      </ngx-workflow-diagram>
    </div>
  `
})
export class BasicExampleComponent {
  nodes: Node[] = [
    {
      id: '1',
      position: { x: 100, y: 100 },
      data: { label: 'Start' },
      type: 'default'
    },
    {
      id: '2',
      position: { x: 300, y: 100 },
      data: { label: 'Process' },
      type: 'default'
    },
    {
      id: '3',
      position: { x: 500, y: 100 },
      data: { label: 'End' },
      type: 'default'
    }
  ];

  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' }
  ];

  onNodeClick(node: Node) {
    console.log('Clicked:', node);
  }
}
```

## Feature Examples

### 1. Snap-to-Grid Example

```typescript
<ngx-workflow-diagram
  [snapToGrid]="true"
  [gridSize]="25"
  [showBackground]="true"
  [backgroundVariant]="'dots'"
  [backgroundGap]="25"
>
</ngx-workflow-diagram>
```

### 2. Export with Custom Options

```typescript
import { Component, ViewChild } from '@angular/core';
import { DiagramComponent } from 'ngx-workflow';

@Component({...})
export class ExportExampleComponent {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  exportHighRes() {
    this.diagram.exportToPNG('high-res.png', {
      quality: 1.0,
      scale: 3,
      backgroundColor: '#ffffff'
    });
  }

  exportTransparent() {
    this.diagram.exportToPNG('transparent.png', {
      backgroundColor: 'transparent',
      scale: 2
    });
  }

  copyToClipboard() {
    this.diagram.copyToClipboard({
      quality: 0.95,
      scale: 2
    });
  }
}
```

### 3. Connection Validation Example

```typescript
@Component({
  template: `
    <ngx-workflow-diagram
      [connectionValidator]="validateConnection"
      [initialNodes]="nodes"
    >
    </ngx-workflow-diagram>
  `
})
export class ValidationExampleComponent {
  nodes: Node[] = [
    { id: '1', type: 'input', position: { x: 100, y: 100 }, data: { label: 'Input' } },
    { id: '2', type: 'process', position: { x: 300, y: 100 }, data: { label: 'Process' } },
    { id: '3', type: 'output', position: { x: 500, y: 100 }, data: { label: 'Output' } }
  ];

  validateConnection = (sourceId: string, targetId: string): boolean => {
    // Prevent self-connections
    if (sourceId === targetId) return false;

    const source = this.nodes.find(n => n.id === sourceId);
    const target = this.nodes.find(n => n.id === targetId);

    // Enforce flow: input -> process -> output
    if (source?.type === 'output') return false; // Output can't be source
    if (target?.type === 'input') return false;  // Input can't be target
    if (source?.type === 'process' && target?.type === 'input') return false;

    return true;
  }
}
```

### 4. Dark Mode Example

```typescript
<ngx-workflow-diagram
  [colorMode]="'dark'"
  [initialNodes]="nodes"
  [showExportControls]="true"
>
</ngx-workflow-diagram>
```

### 5. Complete Feature Showcase

```typescript
import { Component, ViewChild } from '@angular/core';
import { DiagramComponent, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-showcase',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div style="height: 100vh; width: 100%;">
      <ngx-workflow-diagram
        [initialNodes]="nodes"
        [initialEdges]="edges"
        [snapToGrid]="true"
        [gridSize]="20"
        [showExportControls]="true"
        [showMinimap]="true"
        [showZoomControls]="true"
        [connectionValidator]="validateConnection"
        [colorMode]="darkMode ? 'dark' : 'light'"
        (nodeClick)="onNodeClick($event)"
        (connect)="onConnect($event)"
      >
      </ngx-workflow-diagram>

      <div class="controls">
        <button (click)="toggleDarkMode()">Toggle Dark Mode</button>
        <button (click)="exportHighQuality()">Export High Quality</button>
        <button (click)="copyDiagram()">Copy to Clipboard</button>
      </div>
    </div>
  `,
  styles: [`
    .controls {
      position: absolute;
      top: 20px;
      left: 20px;
      display: flex;
      gap: 10px;
    }
    button {
      padding: 8px 16px;
      border-radius: 4px;
      border: 1px solid #ccc;
      background: white;
      cursor: pointer;
    }
    button:hover {
      background: #f0f0f0;
    }
  `]
})
export class ShowcaseComponent {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  darkMode = false;
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'Start' } },
    { id: '2', position: { x: 300, y: 100 }, data: { label: 'Process' } },
    { id: '3', position: { x: 500, y: 100 }, data: { label: 'End' } }
  ];

  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' }
  ];

  validateConnection = (sourceId: string, targetId: string): boolean => {
    return sourceId !== targetId; // Prevent self-connections
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;
  }

  exportHighQuality() {
    this.diagram.exportToPNG('diagram.png', {
      quality: 1.0,
      scale: 3
    });
  }

  copyDiagram() {
    this.diagram.copyToClipboard({
      scale: 2
    });
  }

  onNodeClick(node: Node) {
    console.log('Node clicked:', node);
  }

  onConnect(connection: any) {
    console.log('Connected:', connection);
    this.edges = [...this.edges, {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target
    }];
  }
}
```

### 7. Workflow Legend & Node API Inspector Example

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxWorkflowModule, Node, Edge, PanelPosition } from 'ngx-workflow';

@Component({
  selector: 'app-workflow-legend-example',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div style="height: 700px; width: 100%;">
      <ngx-workflow-diagram
        [nodes]="nodes()"
        [edges]="edges()"
        [showPropertiesSidebar]="false"
        (nodeDoubleClick)="onNodeDoubleClick($event)"
        (paneClick)="closeInspector()"
      >
        <!-- Anchored Legend Overlay -->
        <ngx-workflow-panel
          [position]="'top-right'"
          [style]="{
            minWidth: '280px',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f8fafc',
            borderRadius: '8px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }"
        >
          <div class="legend-card">
            <h4>Workflow Legend</h4>
            <div class="item"><span class="dot bg-blue"></span> Active Ingestion</div>
            <div class="item"><span class="dot bg-amber"></span> Schema Validator</div>
            <div class="item"><span class="dot bg-green"></span> Database Sink</div>
          </div>
        </ngx-workflow-panel>

        <!-- Projected API Inspector Panel -->
        @if (inspectorOpen()) {
          <ngx-workflow-panel [position]="'center-right'">
            <div class="inspector-card">
              <h4>{{ selectedNode()?.label }} API Details</h4>
              @if (loading()) {
                <p>Fetching API schema...</p>
              } @else {
                <pre>{{ apiConfig() | json }}</pre>
              }
              <button (click)="closeInspector()">Close</button>
            </div>
          </ngx-workflow-panel>
        }
      </ngx-workflow-diagram>
    </div>
  `
})
export class WorkflowLegendExampleComponent {
  inspectorOpen = signal(false);
  loading = signal(false);
  selectedNode = signal<Node | null>(null);
  apiConfig = signal<any>(null);

  nodes = signal<Node[]>([
    {
      id: 'leg-1',
      label: 'HTTP Ingestion',
      position: { x: 80, y: 140 },
      ports: 4,
      style: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6' }
    },
    {
      id: 'leg-2',
      label: 'Schema Validator',
      position: { x: 380, y: 140 },
      ports: 4,
      style: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b' }
    },
    {
      id: 'leg-3',
      label: 'PostgreSQL Sink',
      position: { x: 680, y: 140 },
      ports: 4,
      style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981' }
    }
  ]);

  edges = signal<Edge[]>([
    { id: 'e1', source: 'leg-1', target: 'leg-2', animated: true },
    { id: 'e2', source: 'leg-2', target: 'leg-3', animated: true }
  ]);

  constructor(private http: HttpClient) {}

  async onNodeDoubleClick(node: Node) {
    this.selectedNode.set(node);
    this.inspectorOpen.set(true);
    this.loading.set(true);

    try {
      const data = await this.http.get(\`/api/nodes/\${node.id}/config\`).toPromise();
      this.apiConfig.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  closeInspector() {
    this.inspectorOpen.set(false);
    this.selectedNode.set(null);
  }
}
```

## Running Examples

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the demo app: `npm start`
4. Open `http://localhost:4200`

## More Examples

Check out the `/src/app` directory in this repository for the full demo application showcasing all features.
