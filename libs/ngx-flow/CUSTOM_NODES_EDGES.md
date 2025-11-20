# Custom Node and Edge Types in ngx-flow

`ngx-flow` provides a flexible way to define and use your own custom node and edge components, allowing you to tailor the visual representation and interactivity of your diagrams.

---

## Custom Node Components

### 1. Create your Custom Node Component

A custom node component is a standard Angular component that implements the `Node` interface as an `@Input()`. It should be a standalone component for easier integration.

```typescript
// src/app/custom-nodes/my-custom-node.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from 'ngx-flow'; // Import Node interface

@Component({
  selector: 'app-my-custom-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="my-custom-node">
      <rect
        [attr.x]="0"
        [attr.y]="0"
        [attr.width]="node.width || 200"
        [attr.height]="node.height || 75"
        rx="5" ry="5"
        fill="#ffeedd"
        stroke="#cc8844"
        stroke-width="2"
      ></rect>
      <text
        [attr.x]="(node.width || 200) / 2"
        [attr.y]="(node.height || 75) / 2"
        text-anchor="middle"
        alignment-baseline="middle"
        fill="#cc8844"
        font-size="16px"
      >
        {{ node.data?.title || 'Custom Title' }}
      </text>
      <!-- Add more SVG elements or ng-content here -->
    </svg:g>
  `,
  styles: [`
    .my-custom-node {
      /* Specific styles for your custom node */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCustomNodeComponent {
  @Input() node!: Node; // The node data will be passed here
}
```

**Key Points for Custom Nodes:**
-   The root element of your custom node component should ideally be an `<svg:g>` element.
-   The component will receive the `Node` object as an `@Input()`. Use `node.width`, `node.height`, `node.data`, etc. to render its content.
-   The `NodeComponent` wrapper will handle the `transform="translate(x,y)"` for positioning, so your custom component should render its contents relative to `(0,0)`.
-   `NodeComponent` also handles the selection outline and drag interactions.

### 2. Register your Custom Node Type

To tell `ngx-flow` about your custom node component, you need to provide it via the `NGX_FLOW_NODE_TYPES` Injection Token. This is typically done in your `app.config.ts` (for standalone apps) or your `AppModule`/feature module.

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxFlowModule, NGX_FLOW_NODE_TYPES } from 'ngx-flow';
import { MyCustomNodeComponent } from './custom-nodes/my-custom-node.component'; // Import your custom node

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(CommonModule, NgxFlowModule),
    {
      provide: NGX_FLOW_NODE_TYPES,
      useValue: {
        'my-special-node': MyCustomNodeComponent, // Map a string type to your component
        'another-custom': AnotherCustomNodeComponent,
      },
    },
  ]
};
```

### 3. Use your Custom Node Type

When creating a node, simply set its `type` property to the string key you registered.

```typescript
// In your component using DiagramStateService
import { DiagramStateService, Node } from 'ngx-flow';

// ...
constructor(private diagramStateService: DiagramStateService) {}

addMyCustomNode(): void {
  const newNode: Node = {
    id: 'node-custom-1',
    position: { x: 100, y: 100 },
    data: { title: 'My Awesome Node' },
    type: 'my-special-node', // This matches the key in NGX_FLOW_NODE_TYPES
    width: 200, // Optional: specify width/height for layout calculations
    height: 75,
  };
  this.diagramStateService.addNode(newNode);
}
```

---

## Custom Edge Types

`ngx-flow` currently supports different *types* of edge paths (straight, bezier, step) based on the `edge.type` property. You can extend this by adding your own path-generating functions.

### 1. Create a Custom Path Getter Function

In `libs/ngx-flow/src/lib/utils/path-getters.ts` (or a similar utility file), you can define a new function that takes `source` and `target` `XYPosition` and returns an SVG path string.

```typescript
// libs/ngx-flow/src/lib/utils/path-getters.ts (example)
import { XYPosition } from '../models';

export function getDiagonalPath(source: XYPosition, target: XYPosition): string {
  // Simple diagonal path
  return `M ${source.x},${source.y} L ${target.x},${target.y}`;
}

export function getCustomStepPath(source: XYPosition, target: XYPosition): string {
  // A more complex step path, perhaps with different offsets
  const xOffset = Math.abs(source.x - target.x) / 2;
  const yOffset = Math.abs(source.y - target.y) / 2;
  return `M ${source.x},${source.y} L ${source.x + xOffset},${source.y} L ${target.x - xOffset},${target.y} L ${target.x},${target.y}`;
}
```

### 2. Update `EdgeComponent` to use the new path type

You would need to modify `libs/ngx-flow/src/lib/components/edge/edge.component.ts` to include your new path getters in the `switch` statement for `this.edge.type`.

```typescript
// libs/ngx-flow/src/lib/components/edge/edge.component.ts (snippet)
// ...imports
import { getBezierPath, getStraightPath, getStepPath, getDiagonalPath, getCustomStepPath } from '../../utils/path-getters';

// ...inside EdgeComponent path computed signal
    let path: string;
    switch (this.edge.type) {
      case 'bezier':
        path = getBezierPath(sourcePos, targetPos);
        break;
      case 'step':
        path = getStepPath(sourcePos, targetPos);
        break;
      case 'straight':
        path = getStraightPath(sourcePos, targetPos);
        break;
      case 'diagonal': // Your new custom type
        path = getDiagonalPath(sourcePos, targetPos);
        break;
      case 'custom-step': // Another custom type
        path = getCustomStepPath(sourcePos, targetPos);
        break;
      default:
        path = getStraightPath(sourcePos, targetPos); // Fallback
        break;
    }
    return path;
```

### 3. Use your Custom Edge Type

Set the `type` property of your edge to match the key you added in the `switch` statement.

```typescript
// In your component using DiagramStateService
import { DiagramStateService, Edge } from 'ngx-flow';

// ...
constructor(private diagramStateService: DiagramStateService) {}

addCustomEdge(): void {
  const newEdge: Edge = {
    id: 'e-custom-1',
    source: 'node1',
    target: 'node2',
    type: 'diagonal', // This matches the type in the EdgeComponent switch
    animated: true,
  };
  this.diagramStateService.addEdge(newEdge);
}
```

For custom edge *components* (if you need to render something more complex than an SVG path for an edge), you would use a similar `InjectionToken` and `ngComponentOutlet` pattern as with custom nodes, providing `NGX_FLOW_EDGE_TYPES`.
