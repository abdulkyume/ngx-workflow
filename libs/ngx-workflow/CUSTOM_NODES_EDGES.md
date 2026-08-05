# Custom Node and Edge Types in ngx-workflow

`ngx-workflow` provides a flexible way to define and use your own custom node and edge components, allowing you to tailor the visual representation and interactivity of your diagrams.

---

## Custom Node Components

### 1. Create your Custom Node Component

A custom node component is a standard Angular standalone component that accepts a `node` input. Use `<ngx-workflow-handle>` for connection ports.

```typescript
// src/app/custom-nodes/my-custom-node.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, HandleComponent } from 'ngx-workflow';

@Component({
  selector: 'app-my-custom-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
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
        dominant-baseline="middle"
        fill="#cc8844"
        font-size="16px"
      >
        {{ node.data?.title || 'Custom Title' }}
      </text>
      <ngx-workflow-handle
        type="target"
        handleId="in"
        [nodeId]="node.id"
      ></ngx-workflow-handle>
      <ngx-workflow-handle
        type="source"
        handleId="out"
        [nodeId]="node.id"
      ></ngx-workflow-handle>
    </svg:g>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCustomNodeComponent {
  @Input() node!: Node;
}
```

### 2. Register your Custom Node Type

Provide your component via the `NGX_WORKFLOW_NODE_TYPES` injection token:

```typescript
// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxWorkflowModule, NGX_WORKFLOW_NODE_TYPES } from 'ngx-workflow';
import { MyCustomNodeComponent } from './custom-nodes/my-custom-node.component';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(CommonModule, NgxWorkflowModule),
    {
      provide: NGX_WORKFLOW_NODE_TYPES,
      useValue: {
        'my-special-node': MyCustomNodeComponent,
      },
    },
  ]
};
```

### 3. Use your Custom Node Type

```typescript
import { DiagramStateService, Node } from 'ngx-workflow';

addMyCustomNode(): void {
  const newNode: Node = {
    id: 'node-custom-1',
    position: { x: 100, y: 100 },
    data: { title: 'My Awesome Node' },
    type: 'my-special-node',
    width: 200,
    height: 75,
  };
  this.diagramStateService.addNode(newNode);
}
```

---

## Custom Edge Types

Built-in edge path types include `bezier`, `straight`, `step`, `smoothstep`, and `smart` (obstacle-avoiding routing).

### Register a custom edge component

Custom edge components should accept an `edge` input (`EdgeComponentType`) and can be registered with `NGX_WORKFLOW_EDGE_TYPES`:

```typescript
import { NGX_WORKFLOW_EDGE_TYPES } from 'ngx-workflow';

providers: [
  {
    provide: NGX_WORKFLOW_EDGE_TYPES,
    useValue: {
      'my-edge': CustomEdgeComponent,
    },
  },
]
```

Then set `edge.type` to `'my-edge'` when creating edges.

### Path helpers

You can also use exported path utilities (`getBezierPath`, `getStraightPath`, `getStepPath`, `getSmoothStepPath`, `getSmartEdgePath`, etc.) inside custom edge templates without modifying library internals.
