# ngx-workflow

[![npm version](https://img.shields.io/npm/v/ngx-workflow.svg)](https://www.npmjs.com/package/ngx-workflow)
[![License](https://img.shields.io/npm/l/ngx-workflow.svg)](https://github.com/yourusername/ngx-workflow/blob/main/LICENSE)

A powerful, highly customizable Angular library for building interactive node-based editors, flow charts, and diagrams. Built with Angular Signals for high performance and reactivity.

![Demo Screenshot](https://raw.githubusercontent.com/yourusername/ngx-workflow/main/assets/demo.png)

## 🚀 Features

- **Native Angular**: Built from the ground up for Angular, using Signals and OnPush change detection.
- **Interactive**: Drag & drop nodes, zoom & pan canvas, connect edges.
- **Customizable**: Fully custom node and edge templates.
- **Rich UI**: Built-in minimap, background patterns, controls, and alignment tools.
- **Layouts**: Automatic layout support via Dagre and ELK.
- **History**: Robust Undo/Redo history stack.
- **Export**: Export to JSON, PNG, or SVG.
- **Theming**: Extensive CSS variables for easy styling.

## 📦 Installation

```bash
npm install ngx-workflow
```

## 🏁 Quick Start

### 1. Import the Module

In your `app.config.ts` (for standalone apps) or `app.module.ts`:

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { NgxWorkflowModule } from 'ngx-workflow';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(NgxWorkflowModule)
  ]
};
```

### 2. Use the Component

Add the `<ngx-workflow-diagram>` component to your template. You can use the **Declarative** approach (recommended) or the **Imperative** approach.

#### Declarative Approach (Recommended)

Bind directly to your data. The diagram updates when your data changes.

```typescript
import { Component } from '@angular/core';
import { Node, Edge, Viewport } from 'ngx-workflow';

@Component({
  selector: 'app-root',
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

## 📖 Core Concepts

### Nodes
Nodes are the building blocks of your diagram. They are defined by the `Node` interface.

```typescript
interface Node {
  id: string;              // Unique identifier
  position: { x: number; y: number }; // Position on canvas
  label?: string;          // Default label
  data?: any;              // Custom data passed to your custom node component
  type?: string;           // 'default', 'group', or your custom type
  width?: number;          // Width in pixels
  height?: number;         // Height in pixels
  draggable?: boolean;     // Is the node draggable? (default: true)
  selectable?: boolean;    // Is the node selectable? (default: true)
  connectable?: boolean;   // Can edges be connected? (default: true)
  class?: string;          // Custom CSS class
  style?: object;          // Custom inline styles
}
```

### Edges
Edges connect two nodes. They are defined by the `Edge` interface.

```typescript
interface Edge {
  id: string;
  source: string;          // ID of source node
  target: string;          // ID of target node
  sourceHandle?: string;   // ID of source handle (optional)
  targetHandle?: string;   // ID of target handle (optional)
  label?: string;          // Label text
  type?: 'bezier' | 'straight' | 'step'; // Path type
  animated?: boolean;      // Show animation?
  markerEnd?: 'arrow' | 'arrowclosed'; // Arrowhead type
  style?: object;          // SVG styles (stroke, stroke-width, etc.)
}
```

### Handles
Handles are the connection points on a node. By default, nodes have 4 handles: `top`, `right`, `bottom`, `left`. You can define custom handles in your custom node components.

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

| Shortcut | Action |
|----------|--------|
| `Delete` / `Backspace` | Delete selected nodes/edges |
| `Ctrl` + `Z` | Undo |
| `Ctrl` + `Shift` + `Z` | Redo |
| `Shift` + `Drag` | Lasso Selection |
| `Ctrl` + `Click` | Multi-select |

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
