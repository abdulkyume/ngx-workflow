# ngx-workflow

[![npm version](https://img.shields.io/npm/v/ngx-workflow.svg)](https://www.npmjs.com/package/ngx-workflow)
[![License](https://img.shields.io/npm/l/ngx-workflow.svg)](https://github.com/abdulkyume/ngx-workflow/blob/main/LICENSE)

A powerful, highly customizable Angular library for building interactive node-based editors, flow charts, and diagrams. Built with Angular Signals for high performance and reactivity.

![Demo Screenshot](https://raw.githubusercontent.com/abdulkyume/ngx-workflow/main/assets/demo.png)

## 🚀 Features

### Core Features
- **Native Angular**: Built from the ground up for Angular, using Signals and OnPush change detection
- **Interactive**: Drag & drop nodes, zoom & pan canvas, connect edges
- **Customizable**: Fully custom node and edge templates
- **Rich UI**: Built-in minimap, background patterns, controls, and alignment tools
- **Layouts**: Automatic layout support via Dagre and ELK
- **History**: Robust Undo/Redo history stack with Ctrl+Z/Ctrl+Shift+Z
- **Theming**: Extensive CSS variables for easy styling with dark mode support

### Advanced Features
- **Snap-to-Grid**: Configurable grid snapping for precise node placement
- **Space Panning**: Professional canvas panning with Space + Drag
- **Export Controls**: Built-in UI for PNG, SVG, and clipboard export
- **Export Options**: Customizable quality, scale, and background for exports
- **Clipboard Operations**: Full copy/paste/cut support with Ctrl+C/V/X
- **Connection Validation**: Prevent invalid connections with custom validators
- **Alignment Guides**: Visual guides for node alignment during dragging
- **Search & Filter**: Built-in search and type filtering
- **Node Grouping**: Create and manage node groups
- **Edge Reconnection**: Drag edge endpoints to reconnect

## 📦 Installation

```bash
npm install ngx-workflow
```

## 🏁 Quick Start

You can use `ngx-workflow` in two ways: **Standalone Component** (recommended for Angular 14+) or **NgModule**.

### Option 1: Standalone Component (Recommended)

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
        [initialNodes]="nodes"
        [initialEdges]="edges"
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
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left' }
  ];

  onNodeClick(node: Node) {
    console.log('Clicked:', node);
  }

  onConnect(connection: any) {
    console.log('Connected:', connection);
  }
}
```

### Option 2: NgModule (Modular Approach)

If you are using NgModules, import `NgxWorkflowModule` in your module.

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxWorkflowModule } from 'ngx-workflow';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgxWorkflowModule // Import the module here
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

Then use it in your component template just like in the standalone example.

## 📖 API Reference

### `<ngx-workflow-diagram>`

The main component for rendering the workflow.

#### Inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `initialNodes` | `Node[]` | `[]` | Initial array of nodes to display. |
| `initialEdges` | `Edge[]` | `[]` | Initial array of edges to display. |
| `initialViewport` | `Viewport` | `undefined` | Initial viewport state `{ x, y, zoom }`. |
| `showZoomControls` | `boolean` | `true` | Whether to show the zoom control buttons (bottom-left). |
| `showMinimap` | `boolean` | `true` | Whether to show the minimap (bottom-right). |
| `showBackground` | `boolean` | `true` | Whether to show the background pattern. |
| `backgroundVariant` | `'dots' \| 'lines' \| 'cross'` | `'dots'` | The pattern style of the background. |
| `backgroundGap` | `number` | `20` | Gap between background pattern elements. |
| `backgroundSize` | `number` | `1` | Size of background pattern elements. |
| `backgroundColor` | `string` | `'#81818a'` | Color of the background pattern dots/lines. |
| `backgroundBgColor` | `string` | `'#f0f0f0'` | Background color of the canvas itself. |
| `connectionValidator` | `(source: string, target: string) => boolean` | `undefined` | Custom function to validate connections. Return `false` to prevent connection. |
| `nodesResizable` | `boolean` | `true` | Global toggle to enable/disable node resizing. |
| `snapToGrid` | `boolean` | `false` | Enable snap-to-grid for node positioning. |
| `gridSize` | `number` | `20` | Grid size in pixels for snap-to-grid. |
| `showExportControls` | `boolean` | `false` | Show export controls UI (PNG, SVG, Clipboard). |
| `colorMode` | `'light' \| 'dark'` | `'light'` | Color theme mode. |

#### Outputs

| Name | Type | Description |
|------|------|-------------|
| `nodeClick` | `EventEmitter<Node>` | Emitted when a node is clicked. |
| `edgeClick` | `EventEmitter<Edge>` | Emitted when an edge is clicked. |
| `connect` | `EventEmitter<Connection>` | Emitted when a new connection is created. |
| `nodesChange` | `EventEmitter<Node[]>` | Emitted when the nodes array changes (move, add, delete). |
| `edgesChange` | `EventEmitter<Edge[]>` | Emitted when the edges array changes. |
| `nodeDoubleClick` | `EventEmitter<Node>` | Emitted when a node is double-clicked. |

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
  class?: string;          // Custom CSS class
  style?: object;          // Custom inline styles
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
  type?: 'bezier' | 'straight' | 'step'; // Path type (default: 'bezier')
  animated?: boolean;      // Show animation (dashed moving line)?
  markerEnd?: 'arrow' | 'arrowclosed'; // Arrowhead type
  style?: object;          // SVG styles (stroke, stroke-width, etc.)
}
```

## 🎨 Customization

### Custom Nodes
You can create your own node types by creating an Angular component and registering it.

1. **Create the Component**:
   It should accept an input `node`.

   ```typescript
   @Component({
     selector: 'app-custom-node',
     template: `
       <div class="custom-node">
         <div class="header">{{ node.data.title }}</div>
         <div class="content">{{ node.data.content }}</div>
         <!-- Add handles -->
         <ngx-workflow-handle type="source" position="right"></ngx-workflow-handle>
         <ngx-workflow-handle type="target" position="left"></ngx-workflow-handle>
       </div>
     `,
     styles: [`
       .custom-node { border: 1px solid #333; background: white; border-radius: 4px; }
       .header { background: #eee; padding: 4px; border-bottom: 1px solid #333; }
       .content { padding: 8px; }
     `]
   })
   export class CustomNodeComponent {
     @Input() node!: Node;
   }
   ```

2. **Register the Component**:
   Provide it in your module configuration using `NGX_WORKFLOW_NODE_TYPES`.

   ```typescript
   import { NGX_WORKFLOW_NODE_TYPES } from 'ngx-workflow';

   providers: [
     {
       provide: NGX_WORKFLOW_NODE_TYPES,
       useValue: {
         'my-custom-type': CustomNodeComponent
       }
     }
   ]
   ```

3. **Use it**:
   ```typescript
   { id: '3', type: 'my-custom-type', position: { x: 0, y: 0 }, data: { title: 'My Node', content: '...' } }
   ```

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

## ⌨️ Keyboard Shortcuts

### Navigation & Selection
| Shortcut | Action |
|----------|--------|
| `Space` + `Drag` | Pan canvas |
| `Shift` + `Drag` | Lasso selection |
| `Ctrl` + `Click` | Multi-select |
| `Mouse Wheel` | Zoom in/out |

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
