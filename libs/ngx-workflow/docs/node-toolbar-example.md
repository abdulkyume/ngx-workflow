# Node Toolbar Component - Quick Example

This is a minimal working example demonstrating the Node Toolbar Component.

## Example Code

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxWorkflowModule],
  template: `
    <div style="height: 100vh; width: 100%; background: #f5f5f5;">
      <ngx-workflow-diagram
        [initialNodes]="nodes"
        [initialEdges]="edges"
        (nodesChange)="onNodesChange($event)">
        
        <!-- Toolbar for each selected node -->
        <ngx-workflow-node-toolbar 
          *ngFor="let node of selectedNodes"
          [nodeId]="node.id" 
          position="top"
          align="center">
          <button (click)="deleteNode(node.id)" title="Delete Node">🗑️</button>
          <button (click)="duplicateNode(node.id)" title="Duplicate Node">📋</button>
          <button (click)="editNode(node.id)" title="Edit Node">✏️</button>
        </ngx-workflow-node-toolbar>

      </ngx-workflow-diagram>
    </div>
  `
})
export class AppComponent {
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, label: 'Start' },
    { id: '2', position: { x: 300, y: 100 }, label: 'Process' },
    { id: '3', position: { x: 500, y: 100 }, label: 'End' },
  ];

  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  get selectedNodes() {
    return this.nodes.filter(n => n.selected);
  }

  onNodesChange(nodes: Node[]) {
    this.nodes = nodes;
  }

  deleteNode(nodeId: string) {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    console.log('Deleted node:', nodeId);
  }

  duplicateNode(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: Node = {
        ...node,
        id: `${node.id}-copy-${Date.now()}`,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        label: `${node.label} (Copy)`,
        selected: false
      };
      this.nodes = [...this.nodes, newNode];
      console.log('Duplicated node:', nodeId);
    }
  }

  editNode(nodeId: string) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const newLabel = prompt('Enter new label:', node.label);
      if (newLabel) {
        this.nodes = this.nodes.map(n => 
          n.id === nodeId ? { ...n, label: newLabel } : n
        );
        console.log('Edited node:', nodeId, 'New label:', newLabel);
      }
    }
  }
}
```

## How to Test

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Open browser**: Navigate to `http://localhost:4200`

3. **Test the toolbar**:
   - Click on any node to select it
   - The toolbar should appear above the node
   - Try the buttons:
     - 🗑️ Delete: Removes the node
     - 📋 Duplicate: Creates a copy of the node
     - ✏️ Edit: Prompts for a new label

4. **Test positioning**:
   - Select a node
   - Zoom in/out (mouse wheel)
   - Toolbar should remain readable and positioned correctly
   - Pan the canvas (drag background)
   - Toolbar should move with the node

5. **Test multi-selection**:
   - Hold Ctrl and click multiple nodes
   - Each selected node should show its own toolbar

## Expected Behavior

✅ Toolbar appears when node is selected  
✅ Toolbar disappears when node is deselected  
✅ Toolbar stays with node during pan/zoom  
✅ Toolbar doesn't scale with zoom  
✅ Buttons are clickable and functional  
✅ Multiple toolbars for multi-selection  

## Troubleshooting

If the toolbar doesn't appear:
1. Check browser console for errors
2. Verify the build completed successfully
3. Ensure Angular version is 17+
4. Clear browser cache and reload

## Next Steps

- Try different `position` values: 'bottom', 'left', 'right'
- Try different `align` values: 'start', 'end'
- Customize button styles
- Add more toolbar actions
