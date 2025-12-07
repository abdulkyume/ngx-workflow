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

## Running Examples

1. Clone the repository
2. Install dependencies: `npm install`
3. Run the demo app: `npm start`
4. Open `http://localhost:4200`

## More Examples

Check out the `/src/app` directory in this repository for the full demo application showcasing all features.
