# Custom Node and Edge Types in ngx-workflow

`ngx-workflow` provides a flexible way to define and use your own custom node and edge components, allowing you to tailor the visual representation and interactivity of your diagrams.

---

## Custom Node Components

### 1. Create your Custom Node Component

A custom node component is a standard Angular standalone component that accepts a `node` input (preferred). Flat inputs (`id`, `data`, `selected`, …) are also provided for convenience. Custom nodes render inside an HTML `foreignObject` host.

```typescript
// src/app/custom-nodes/my-custom-node.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node, HandleComponent, DragHandleDirective, ComponentNodeEventService } from 'ngx-workflow';

@Component({
  selector: 'app-my-custom-node',
  standalone: true,
  imports: [CommonModule, HandleComponent, DragHandleDirective],
  template: `
    <div class="my-custom-node" [class.selected]="node.selected">
      <header class="drag-handle" ngxWorkflowDragHandle>{{ node.data?.title || 'Custom' }}</header>
      <ngx-workflow-handle type="target" handleId="in" [nodeId]="node.id"></ngx-workflow-handle>
      <ngx-workflow-handle type="source" handleId="out" [nodeId]="node.id"></ngx-workflow-handle>
      <button type="button" (click)="remove()">Delete</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyCustomNodeComponent {
  @Input() node!: Node;

  constructor(private events: ComponentNodeEventService) {}

  remove(): void {
    this.events.emit({ eventName: 'deleted', nodeId: this.node.id, eventPayload: this.node });
  }
}
```

Listen on the diagram with `(componentNodeEvent)="..."`.

### 2. Register your Custom Node Type

Provide your component via the `NGX_WORKFLOW_NODE_TYPES` injection token or the `[nodeTypes]` input:

```typescript
providers: [
  {
    provide: NGX_WORKFLOW_NODE_TYPES,
    useValue: {
      'my-special-node': MyCustomNodeComponent,
    },
  },
]
```

Lazy-load with a factory (used with `[optimization]="{ lazyLoadTrigger: 'viewport' }"`):

```typescript
nodeTypes = {
  heavy: () => import('./heavy-node.component').then(m => m.HeavyNodeComponent),
};
```

### 3. HTML / SVG template nodes

Project templates into the diagram:

```html
<ngx-workflow-diagram [nodes]="nodes" [edges]="edges">
  <ng-template #nodeHtmlTemplate let-ctx>
    <div class="html-node">{{ ctx.data?.title }}</div>
  </ng-template>
  <ng-template #nodeSvgTemplate let-ctx>
    <svg:rect [attr.width]="ctx.width" [attr.height]="ctx.height" rx="8" />
    <svg:text [attr.x]="ctx.width/2" [attr.y]="ctx.height/2" text-anchor="middle">{{ ctx.data?.title }}</svg:text>
  </ng-template>
</ngx-workflow-diagram>
```

Set `type: 'html-template'` or `type: 'svg-template'` on nodes.

### 4. Node flags

- `selectable: false` — cannot be selected
- `connectable: false` — rejects new connections
- `draggable: false` — cannot be dragged
- `easyConnect: true` — body drag starts a connection unless the pointer is on `[ngxWorkflowDragHandle]` / `.drag-handle`

---

## Custom Edge Types

Built-in edge path types include `bezier`, `straight`, `step`, `smoothstep`, `smart`, and `dashed`.

### Register a custom edge component

Custom edge components should accept an `edge` input (and optionally `path`) and can be registered with `NGX_WORKFLOW_EDGE_TYPES` or `[edgeTypes]`:

```typescript
providers: [
  {
    provide: NGX_WORKFLOW_EDGE_TYPES,
    useValue: {
      'my-edge': CustomEdgeComponent,
    },
  },
]
```

Then set `edge.type` to `'my-edge'`.

### Edge template input

```html
<ngx-workflow-diagram [nodes]="nodes" [edges]="edges" [edgeTemplate]="customEdge">
  <ng-template #customEdge let-ctx>
    <svg:path [attr.d]="ctx.path" stroke="#8b5cf6" fill="none" stroke-width="2" />
  </ng-template>
</ngx-workflow-diagram>
```

The template context includes `$implicit.edge`, `$implicit.path()`, and marker helpers.

### Multi-position labels

```typescript
{
  id: 'e1',
  source: 'a',
  target: 'b',
  edgeLabels: {
    start: 'in',
    center: 'process',
    end: 'out',
  },
}
```

### Path helpers

Exported path utilities (`getBezierPath`, `getStraightPath`, `getStepPath`, `getSmoothStepPath`, `getSmartEdgePath`, etc.) can be used inside custom edge templates.
