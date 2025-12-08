# New Features Documentation - ngx-workflow

This document covers 8 new features added to ngx-workflow for enhanced functionality and user experience.

---

## 1. Before Delete Hook

Intercept and control deletion operations with a cancellable event.

### Usage

```typescript
<ngx-workflow-diagram (beforeDelete)="onBeforeDelete($event)">
</ngx-workflow-diagram>

onBeforeDelete(event: BeforeDeleteEvent) {
  const confirmed = confirm(`Delete ${event.nodes.length} nodes and ${event.edges.length} edges?`);
  if (!confirmed) {
    event.cancel();
  }
}
```

### API

**Event**: `beforeDelete`
- `nodes`: Node[] - Nodes to be deleted
- `edges`: Edge[] - Edges to be deleted  
- `cancel()`: Function - Call to prevent deletion

---

## 2. Z-Index Layer Management

Control node stacking order via keyboard shortcuts and context menu.

### Enable

```typescript
<ngx-workflow-diagram [zIndexMode]="'layered'">
</ngx-workflow-diagram>
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + ]` | Bring to front |
| `Ctrl/Cmd + [` | Send to back |
| `Ctrl/Cmd + Shift + ]` | Raise layer |
| `Ctrl/Cmd + Shift + [` | Lower layer |

### Context Menu

Right-click selected nodes to access z-index operations.

---

## 3. Connection Limits

Restrict maximum connections per handle.

### Global Limit

```typescript
<ngx-workflow-diagram [maxConnectionsPerHandle]="1">
</ngx-workflow-diagram>
```

### Per-Handle Configuration

```typescript
node.data = {
  handleConfig: {
    'output-1': { maxConnections: 1 },
    'input-1': { maxConnections: 3 }
  }
}
```

---

## 4. Edge Label Components

Use custom Angular components for edge labels.

### Usage

```typescript
<ngx-workflow-diagram [nodes]="nodes" [edges]="edges">
  <ng-template #edgeLabelTemplate let-edge>
    <div class="custom-label">
      <button (click)="editEdge(edge)">✏️</button>
      <span>{{ edge.label }}</span>
      <span *ngIf="edge.data?.priority" class="badge">
        {{ edge.data.priority }}
      </span>
    </div>
  </ng-template>
</ngx-workflow-diagram>
```

### Features
- Full Angular component support
- Access to edge data
- Interactive elements (buttons, inputs)
- Backward compatible with text labels

---

## 5. Batch Operations

Programmatic bulk operations for productivity.

### API Methods

```typescript
// Selection
this.diagramStateService.selectAll();
this.diagramStateService.deselectAll();

// Alignment
this.diagramStateService.alignNodes('left');
// Options: 'left', 'right', 'center', 'top', 'bottom', 'middle'

// Distribution  
this.diagramStateService.distributeNodes('horizontal');
// Options: 'horizontal', 'vertical'

// Deletion
this.diagramStateService.deleteAll();
```

### Keyboard Shortcuts

- `Ctrl/Cmd + A` - Select all nodes

### Alignment Modes

- **Horizontal**: left, right, center
- **Vertical**: top, bottom, middle

### Distribution

Evenly spaces 3+ selected nodes while keeping first/last positions fixed.

---

## 6. Mini-Map Enhancements

Improved mini-map with better visual feedback.

### Usage

```typescript
<ngx-workflow-minimap [showNodeColors]="true">
</ngx-workflow-minimap>
```

### Features

- **Node Colors**: Display custom colors from `node.data.nodeColor`
- **Selection Highlighting**: Selected nodes glow in minimap
- **Pulse Animation**: Viewport indicator pulses on hover
- **Enhanced Hover**: Better visual feedback

---

## 7. Node Collision Detection

Visual feedback for node overlaps during drag.

### Usage

```typescript
<ngx-workflow-diagram
  [preventNodeOverlap]="true"
  [nodeSpacing]="10">
</ngx-workflow-diagram>
```

### Features

- **AABB Detection**: Fast axis-aligned bounding box algorithm
- **Visual Feedback**: Red border + shake animation on collision
- **Configurable Spacing**: Adjust minimum distance between nodes
- **Auto-Clear**: Collision state cleared on drag end

### API

**Inputs**:
- `preventNodeOverlap`: boolean - Enable collision detection
- `nodeSpacing`: number - Minimum spacing in pixels (default: 10)

---

## 8. Bug Fixes

### Edge Interaction Fix
Fixed `foreignObject` blocking mouse events on edges with custom label components.

### Injection Context Fix
Resolved `toObservable()` injection context error (NG0203).

---

## Complete Example

```typescript
import { Component } from '@angular/core';

@Component({
  template: `
    <ngx-workflow-diagram
      [nodes]="nodes"
      [edges]="edges"
      [zIndexMode]="'layered'"
      [maxConnectionsPerHandle]="2"
      [preventNodeOverlap]="true"
      [nodeSpacing]="10"
      (beforeDelete)="onBeforeDelete($event)">
      
      <ng-template #edgeLabelTemplate let-edge>
        <button (click)="editEdge(edge)">Edit</button>
      </ng-template>
      
      <ngx-workflow-minimap [showNodeColors]="true">
      </ngx-workflow-minimap>
    </ngx-workflow-diagram>
  `
})
export class MyDiagramComponent {
  nodes = [...];
  edges = [...];
  
  onBeforeDelete(event) {
    if (!confirm('Delete?')) event.cancel();
  }
  
  alignSelected() {
    this.diagramStateService.alignNodes('left');
  }
}
```

---

## Summary

All features are:
- ✅ Backward compatible
- ✅ Support undo/redo
- ✅ Fully typed with TypeScript
- ✅ Production ready

Total: **8 features** added for enhanced workflow diagram capabilities!
