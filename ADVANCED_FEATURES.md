# Advanced Features Guide

This guide covers the advanced features available in ngx-workflow.

## Table of Contents
- [Snap-to-Grid](#snap-to-grid)
- [Space Panning](#space-panning)
- [Export Controls](#export-controls)
- [Export Options](#export-options)
- [Clipboard Operations](#clipboard-operations)
- [Connection Validation](#connection-validation)
- [Overlay Panels & Workflow Legends](#overlay-panels--workflow-legends)
- [Custom Double-Click & REST API Inspector](#custom-double-click--rest-api-inspector)

---

## Snap-to-Grid

Enable precise node placement with configurable grid snapping.

### Basic Usage

```typescript
<ngx-workflow-diagram
  [snapToGrid]="true"
  [gridSize]="20"
  [initialNodes]="nodes"
>
</ngx-workflow-diagram>
```

### Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `snapToGrid` | `boolean` | `false` | Enable/disable grid snapping |
| `gridSize` | `number` | `20` | Grid size in pixels |

### Features
- ✅ Snaps nodes during drag
- ✅ Snaps pasted nodes
- ✅ Configurable grid size
- ✅ Works with alignment guides

---

## Space Panning

Professional canvas panning using Space + Drag.

### Usage

Simply hold **Space** and drag to pan the canvas. No configuration needed!

### Features
- ✅ Smooth panning experience
- ✅ Cursor changes to indicate pan mode
- ✅ Works alongside other interactions
- ✅ Standard UX pattern (like Figma, Photoshop)

---

## Export Controls

Built-in UI for exporting diagrams.

### Basic Usage

```typescript
<ngx-workflow-diagram
  [showExportControls]="true"
  [initialNodes]="nodes"
>
</ngx-workflow-diagram>
```

### Features
- 📸 **Export as PNG**: High-quality raster image
- 📄 **Export as SVG**: Scalable vector graphics
- 📋 **Copy to Clipboard**: Quick sharing

### Keyboard Shortcuts
- `Ctrl+Shift+E`: Export as PNG
- `Ctrl+Shift+S`: Export as SVG
- `Ctrl+Shift+C`: Copy to clipboard

---

## Export Options

Customize export quality and appearance programmatically.

### Interface

```typescript
interface ExportOptions {
  backgroundColor?: string;  // Default: '#ffffff'
  quality?: number;          // 0-1, default: 0.92
  scale?: number;            // 1x, 2x, 3x, default: 2
}
```

### Usage

```typescript
import { DiagramComponent } from 'ngx-workflow';

@Component({...})
export class MyComponent {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  exportHighQuality() {
    // Export at 3x resolution with max quality
    this.diagram.exportToPNG('diagram.png', {
      quality: 1.0,
      scale: 3,
      backgroundColor: '#ffffff'
    });
  }

  exportTransparent() {
    // Export with transparent background
    this.diagram.copyToClipboard({
      backgroundColor: 'transparent',
      scale: 2
    });
  }
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backgroundColor` | `string` | `'#ffffff'` | Background color or `'transparent'` |
| `quality` | `number` | `0.92` | JPEG quality (0-1) |
| `scale` | `number` | `2` | Resolution multiplier (1x, 2x, 3x) |

---

## Clipboard Operations

Full copy/paste/cut support with keyboard shortcuts.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Copy selected nodes |
| `Ctrl+V` | Paste copied nodes |
| `Ctrl+X` | Cut selected nodes |
| `Ctrl+D` | Duplicate selected nodes |

### Programmatic Usage

```typescript
import { DiagramStateService } from 'ngx-workflow';

@Component({...})
export class MyComponent {
  constructor(private diagramState: DiagramStateService) {}

  copyNodes() {
    this.diagramState.copy();
  }

  pasteNodes() {
    this.diagramState.paste();
  }

  cutNodes() {
    this.diagramState.cut();
  }

  duplicateNodes() {
    this.diagramState.duplicate();
  }
}
```

### Features
- ✅ Preserves edges between copied nodes
- ✅ Auto-selects pasted nodes
- ✅ 20px offset on paste
- ✅ Multiple paste support
- ✅ LocalStorage persistence

---

## Connection Validation

Prevent invalid connections with custom validation logic.

### Basic Usage

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
export class MyComponent {
  validateConnection(sourceId: string, targetId: string): boolean {
    // Prevent self-connections
    if (sourceId === targetId) {
      return false;
    }

    // Get node types
    const sourceNode = this.nodes.find(n => n.id === sourceId);
    const targetNode = this.nodes.find(n => n.id === targetId);

    // Only allow connections between compatible types
    if (sourceNode?.type === 'input' && targetNode?.type === 'input') {
      return false;
    }

    return true;
  }
}
```

### Built-in Validation
The library automatically prevents:
- ✅ Duplicate connections between same nodes
- ✅ Any connection rejected by custom validator

### Use Cases
- Type compatibility checking
- Preventing cycles
- Enforcing workflow rules
- Custom business logic

---

## Overlay Panels & Workflow Legends

Project custom anchored overlays (`<ngx-workflow-panel>`) into the diagram viewport with 9 anchor points and dynamic style customization.

### Anchor Presets (`position`)
- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

### Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, PanelPosition } from 'ngx-workflow';

@Component({
  selector: 'app-legend-demo',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <ngx-workflow-diagram [nodes]="nodes()" [edges]="edges()">
      <ngx-workflow-panel
        [position]="legendPosition()"
        [style]="legendStyle()"
        className="custom-legend-wrap"
      >
        <div class="legend-card">
          <h4>Workflow Legend</h4>
          <div class="item"><span class="badge blue"></span> Ingestion Source</div>
          <div class="item"><span class="badge amber"></span> Validator</div>
          <div class="item"><span class="badge green"></span> Database Sink</div>
        </div>
      </ngx-workflow-panel>
    </ngx-workflow-diagram>
  `
})
export class LegendDemoComponent {
  legendPosition = signal<PanelPosition>('top-right');
  legendStyle = signal<Record<string, string>>({
    minWidth: '280px',
    background: 'rgba(15, 23, 42, 0.94)',
    color: '#f8fafc',
    borderRadius: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
  });

  nodes = signal<Node[]>([ ... ]);
  edges = signal<Edge[]>([ ... ]);
}
```

---

## Custom Double-Click & REST API Inspector

Disable the default built-in properties sidebar (`[showPropertiesSidebar]="false"`) and connect node/edge double-clicks to your own REST API data fetchers, schemas, or modals.

### Usage Example

```typescript
import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-api-inspector-demo',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <ngx-workflow-diagram
      [nodes]="nodes()"
      [edges]="edges()"
      [showPropertiesSidebar]="false"
      (nodeDoubleClick)="onNodeDoubleClick($event)"
      (paneClick)="closeInspector()"
    >
      @if (inspectorOpen()) {
        <ngx-workflow-panel position="center-right">
          <div class="inspector-panel">
            <h3>{{ activeNode()?.label }}</h3>
            @if (loading()) {
              <p>Fetching API config...</p>
            } @else {
              <pre>{{ apiConfig() | json }}</pre>
            }
            <button (click)="closeInspector()">Close</button>
          </div>
        </ngx-workflow-panel>
      }
    </ngx-workflow-diagram>
  `
})
export class ApiInspectorDemoComponent {
  inspectorOpen = signal(false);
  loading = signal(false);
  activeNode = signal<Node | null>(null);
  apiConfig = signal<any>(null);

  nodes = signal<Node[]>([ ... ]);
  edges = signal<Edge[]>([ ... ]);

  constructor(private http: HttpClient) {}

  async onNodeDoubleClick(node: Node) {
    this.activeNode.set(node);
    this.inspectorOpen.set(true);
    this.loading.set(true);

    try {
      const config = await this.http.get(\`/api/nodes/\${node.id}/schema\`).toPromise();
      this.apiConfig.set(config);
    } finally {
      this.loading.set(false);
    }
  }

  closeInspector() {
    this.inspectorOpen.set(false);
    this.activeNode.set(null);
  }
}
```

---

## Best Practices

### Performance
- Use `snapToGrid` for large diagrams to reduce calculations
- Set appropriate `gridSize` for your use case (10-50px)
- Use lower `scale` for quick exports, higher for print

### UX
- Enable `showExportControls` for end-user applications
- Provide `connectionValidator` for guided workflows
- Use Space panning for professional feel

### Export
- Use `quality: 1.0` and `scale: 3` for print-quality exports
- Use `backgroundColor: 'transparent'` for overlays
- Use clipboard export for quick sharing

---

## Examples

See the [examples directory](../examples/) for complete working examples of each feature.
