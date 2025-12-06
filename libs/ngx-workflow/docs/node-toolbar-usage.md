# Node Toolbar Component - Usage Guide

## Overview

The **Node Toolbar Component** provides context-sensitive toolbars for individual nodes in your ngx-workflow diagrams. Toolbars appear when nodes are selected and can contain custom actions, buttons, or any HTML content.

## Features

- ✅ Appears when node is selected (auto-show)
- ✅ Positions relative to node (top, bottom, left, right)
- ✅ Doesn't scale with zoom (always readable)
- ✅ Supports custom content via content projection
- ✅ Fully themeable with CSS variables
- ✅ Dark mode support
- ✅ Flexible alignment options

---

## Basic Usage

### 1. Import the Component

The component is already exported from `ngx-workflow`, so you can use it directly:

```typescript
import { Component } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxWorkflowModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, label: 'Node 1' },
    { id: '2', position: { x: 300, y: 100 }, label: 'Node 2' },
  ];

  edges: Edge[] = [];

  deleteNode(nodeId: string) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
  }

  duplicateNode(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode = {
        ...node,
        id: `${node.id}-copy`,
        position: { x: node.position.x + 20, y: node.position.y + 20 }
      };
      this.nodes = [...this.nodes, newNode];
    }
  }
}
```

### 2. Add Toolbar to Template

```html
<div style="height: 100vh; width: 100%;">
  <ngx-workflow-diagram
    [initialNodes]="nodes"
    [initialEdges]="edges">
    
    <!-- Toolbar for Node 1 -->
    <ngx-workflow-node-toolbar 
      nodeId="1" 
      position="top">
      <button (click)="deleteNode('1')">Delete</button>
      <button (click)="duplicateNode('1')">Duplicate</button>
    </ngx-workflow-node-toolbar>

    <!-- Toolbar for Node 2 -->
    <ngx-workflow-node-toolbar 
      nodeId="2" 
      position="bottom">
      <button (click)="deleteNode('2')">🗑️ Delete</button>
      <button (click)="duplicateNode('2')">📋 Copy</button>
    </ngx-workflow-node-toolbar>

  </ngx-workflow-diagram>
</div>
```

---

## Advanced Usage

### Dynamic Toolbars for All Selected Nodes

```html
<ngx-workflow-diagram
  [initialNodes]="nodes"
  [initialEdges]="edges">
  
  <!-- Toolbar for each selected node -->
  <ngx-workflow-node-toolbar 
    *ngFor="let node of selectedNodes"
    [nodeId]="node.id" 
    position="top"
    align="center">
    <button (click)="deleteNode(node.id)">🗑️</button>
    <button (click)="duplicateNode(node.id)">📋</button>
    <button (click)="editNode(node.id)">✏️</button>
  </ngx-workflow-node-toolbar>

</ngx-workflow-diagram>
```

```typescript
// In component
get selectedNodes() {
  return this.diagramStateService.selectedNodes();
}
```

---

## API Reference

### Input Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodeId` | `string` | **required** | ID of the node this toolbar belongs to |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Position of toolbar relative to node |
| `offset` | `number` | `10` | Distance from node in pixels |
| `visible` | `boolean \| undefined` | `undefined` | Control visibility. `undefined` = auto-show when selected |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Alignment along the edge |

---

## Position Examples

### Top Position (Default)

```html
<ngx-workflow-node-toolbar nodeId="1" position="top">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

Toolbar appears above the node.

### Bottom Position

```html
<ngx-workflow-node-toolbar nodeId="1" position="bottom">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

Toolbar appears below the node.

### Left Position

```html
<ngx-workflow-node-toolbar nodeId="1" position="left">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

Toolbar appears to the left of the node (vertical layout).

### Right Position

```html
<ngx-workflow-node-toolbar nodeId="1" position="right">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

Toolbar appears to the right of the node (vertical layout).

---

## Alignment Examples

### Start Alignment

```html
<ngx-workflow-node-toolbar nodeId="1" position="top" align="start">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

For top/bottom: aligns to left edge of node  
For left/right: aligns to top edge of node

### Center Alignment (Default)

```html
<ngx-workflow-node-toolbar nodeId="1" position="top" align="center">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

Centers toolbar relative to node.

### End Alignment

```html
<ngx-workflow-node-toolbar nodeId="1" position="top" align="end">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

For top/bottom: aligns to right edge of node  
For left/right: aligns to bottom edge of node

---

## Visibility Control

### Auto-Show (Default)

```html
<!-- Shows when node is selected, hides when deselected -->
<ngx-workflow-node-toolbar nodeId="1">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

### Always Visible

```html
<ngx-workflow-node-toolbar nodeId="1" [visible]="true">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

### Always Hidden

```html
<ngx-workflow-node-toolbar nodeId="1" [visible]="false">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

### Conditional Visibility

```html
<ngx-workflow-node-toolbar 
  nodeId="1" 
  [visible]="showToolbar">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

---

## Custom Styling

### Using CSS Variables

Override the default theme in your global styles:

```css
:root {
  /* Background and border */
  --ngx-workflow-node-toolbar-bg: #ffffff;
  --ngx-workflow-node-toolbar-border: #d1d5db;
  --ngx-workflow-node-toolbar-radius: 6px;
  --ngx-workflow-node-toolbar-padding: 4px;
  --ngx-workflow-node-toolbar-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --ngx-workflow-node-toolbar-gap: 4px;

  /* Button styles */
  --ngx-workflow-node-toolbar-button-bg: #f3f4f6;
  --ngx-workflow-node-toolbar-button-border: #d1d5db;
  --ngx-workflow-node-toolbar-button-color: #374151;
  --ngx-workflow-node-toolbar-button-hover-bg: #e5e7eb;
  --ngx-workflow-node-toolbar-button-hover-border: #9ca3af;
  --ngx-workflow-node-toolbar-button-active-bg: #d1d5db;

  /* Separator */
  --ngx-workflow-node-toolbar-separator: #d1d5db;
}
```

### Dark Mode

```css
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-workflow-node-toolbar-bg: #1f2937;
    --ngx-workflow-node-toolbar-border: #374151;
    --ngx-workflow-node-toolbar-button-bg: #374151;
    --ngx-workflow-node-toolbar-button-color: #f9fafb;
  }
}
```

### Custom Button Styles

```html
<ngx-workflow-node-toolbar nodeId="1">
  <button class="danger-button" (click)="deleteNode('1')">Delete</button>
  <button class="primary-button" (click)="saveNode('1')">Save</button>
</ngx-workflow-node-toolbar>
```

```css
.danger-button {
  background: #ef4444 !important;
  color: white !important;
  border-color: #dc2626 !important;
}

.primary-button {
  background: #3b82f6 !important;
  color: white !important;
  border-color: #2563eb !important;
}
```

---

## Common Use Cases

### 1. Node Actions Toolbar

```html
<ngx-workflow-node-toolbar nodeId="{{node.id}}" position="top">
  <button (click)="editNode(node.id)" title="Edit">✏️</button>
  <button (click)="duplicateNode(node.id)" title="Duplicate">📋</button>
  <button (click)="deleteNode(node.id)" title="Delete">🗑️</button>
</ngx-workflow-node-toolbar>
```

### 2. Node Type Selector

```html
<ngx-workflow-node-toolbar nodeId="{{node.id}}" position="top">
  <select (change)="changeNodeType(node.id, $event)">
    <option value="default">Default</option>
    <option value="input">Input</option>
    <option value="output">Output</option>
  </select>
</ngx-workflow-node-toolbar>
```

### 3. Quick Settings

```html
<ngx-workflow-node-toolbar nodeId="{{node.id}}" position="right">
  <button (click)="toggleNodeLock(node.id)">
    {{ node.locked ? '🔒' : '🔓' }}
  </button>
  <button (click)="toggleNodeVisibility(node.id)">
    {{ node.visible ? '👁️' : '👁️‍🗨️' }}
  </button>
</ngx-workflow-node-toolbar>
```

### 4. Toolbar with Separator

```html
<ngx-workflow-node-toolbar nodeId="{{node.id}}">
  <button (click)="editNode(node.id)">Edit</button>
  <div class="ngx-workflow__node-toolbar-separator"></div>
  <button (click)="deleteNode(node.id)">Delete</button>
</ngx-workflow-node-toolbar>
```

### 5. Icon-Only Toolbar

```html
<ngx-workflow-node-toolbar nodeId="{{node.id}}" position="top">
  <button (click)="editNode(node.id)">
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M12 4l-8 8v4h4l8-8-4-4z" fill="currentColor"/>
    </svg>
  </button>
  <button (click)="deleteNode(node.id)">
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M5 3h6v1H5V3zm-1 2h8v9H4V5z" fill="currentColor"/>
    </svg>
  </button>
</ngx-workflow-node-toolbar>
```

---

## Tips & Best Practices

### 1. Use Icon Buttons for Compact Toolbars

Icon-only buttons take less space and work well at all zoom levels:

```html
<ngx-workflow-node-toolbar nodeId="1">
  <button (click)="delete()">🗑️</button>
  <button (click)="copy()">📋</button>
  <button (click)="edit()">✏️</button>
</ngx-workflow-node-toolbar>
```

### 2. Position Based on Node Type

```html
<!-- Input nodes: toolbar on right -->
<ngx-workflow-node-toolbar 
  *ngIf="node.type === 'input'"
  [nodeId]="node.id" 
  position="right">
  ...
</ngx-workflow-node-toolbar>

<!-- Output nodes: toolbar on left -->
<ngx-workflow-node-toolbar 
  *ngIf="node.type === 'output'"
  [nodeId]="node.id" 
  position="left">
  ...
</ngx-workflow-node-toolbar>
```

### 3. Adjust Offset for Better Spacing

```html
<!-- More space from node -->
<ngx-workflow-node-toolbar 
  nodeId="1" 
  [offset]="20">
  <button>Action</button>
</ngx-workflow-node-toolbar>
```

### 4. Combine with Node Selection

```typescript
// Component
constructor(public diagramStateService: DiagramStateService) {}

get selectedNodes() {
  return this.diagramStateService.selectedNodes();
}
```

```html
<!-- Template -->
<ngx-workflow-node-toolbar 
  *ngFor="let node of selectedNodes"
  [nodeId]="node.id">
  <button (click)="performAction(node.id)">Action</button>
</ngx-workflow-node-toolbar>
```

---

## Troubleshooting

### Toolbar Not Appearing

**Problem**: Toolbar doesn't show when node is selected.

**Solutions**:
1. Verify `nodeId` matches an actual node ID
2. Check if `visible` is set to `false`
3. Ensure node is actually selected
4. Check z-index conflicts with other UI elements

### Toolbar Position is Wrong

**Problem**: Toolbar appears in wrong location.

**Solutions**:
1. Verify the diagram component has proper dimensions
2. Check if viewport calculations are correct
3. Try different `position` values
4. Adjust `offset` value

### Toolbar Scales with Zoom

**Problem**: Toolbar content becomes too large/small when zooming.

**Solution**: This shouldn't happen as the toolbar uses `position: fixed`. If it does, check for conflicting CSS.

### Toolbar Blocks Node Interactions

**Problem**: Can't click on node because toolbar is in the way.

**Solutions**:
1. Change toolbar `position` (e.g., from 'top' to 'bottom')
2. Increase `offset` value
3. Use different `align` setting

---

## Migration from Properties Sidebar

If you were using the properties sidebar for node actions, you can migrate to toolbars:

**Before** (Properties Sidebar):
```html
<ngx-workflow-properties-sidebar 
  [node]="selectedNode"
  (close)="closeSidebar()">
</ngx-workflow-properties-sidebar>
```

**After** (Node Toolbar):
```html
<ngx-workflow-node-toolbar 
  *ngFor="let node of selectedNodes"
  [nodeId]="node.id"
  position="top">
  <button (click)="editNode(node.id)">Edit</button>
  <button (click)="deleteNode(node.id)">Delete</button>
</ngx-workflow-node-toolbar>
```

**Benefits**:
- ✅ Toolbar stays with the node
- ✅ Multiple toolbars for multi-selection
- ✅ Less intrusive than sidebar
- ✅ Faster access to common actions

---

## Browser Compatibility

The Node Toolbar Component works in all modern browsers:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## Performance Considerations

- Toolbars use `OnPush` change detection for optimal performance
- Positioning calculations are done with computed signals (reactive)
- Only visible toolbars are rendered (conditional with `*ngIf`)
- No performance impact when toolbars are hidden

**Recommendation**: For diagrams with 100+ nodes, use `*ngFor` with `selectedNodes` instead of creating a toolbar for every node.

---

## Examples Repository

For more examples and live demos, check out the examples in the ngx-workflow repository:

- Basic toolbar usage
- Dynamic toolbars
- Custom styling
- Advanced positioning
- Integration with other features

---

## Support

If you encounter issues or have questions:

1. Check this documentation
2. Review the examples
3. Open an issue on GitHub: https://github.com/abdulkyume/ngx-workflow/issues

---

## License

MIT License - same as ngx-workflow
