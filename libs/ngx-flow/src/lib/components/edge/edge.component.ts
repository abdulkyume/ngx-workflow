import { Component, ChangeDetectionStrategy, Input, HostListener, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Edge, TempEdge, XYPosition, Node } from '../../models';
import { getBezierPath, getStraightPath, getStepPath } from '../../utils';
import { DiagramStateService } from '../../services';
import { Subscription } from 'rxjs';

// Helper function to get a node from the array
function getNode(id: string, nodes: Node[]): Node | undefined {
  return nodes.find(n => n.id === id);
}

// Helper function to determine handle position based on node and handle id/type
function getHandleAbsolutePosition(node: Node, handleId: string | undefined): XYPosition {
  const nodeWidth = node.width || 170;
  const nodeHeight = node.height || 60;
  let offsetX = 0;
  let offsetY = 0;

  switch (handleId) {
    case 'top':
      offsetX = nodeWidth / 2;
      offsetY = 0;
      break;
    case 'right':
      offsetX = nodeWidth;
      offsetY = nodeHeight / 2;
      break;
    case 'bottom':
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight;
      break;
    case 'left':
      offsetX = 0;
      offsetY = nodeHeight / 2;
      break;
    default: // Center of the node if no specific handle
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight / 2;
  }
  return {
    x: node.position.x + offsetX,
    y: node.position.y + offsetY
  };
}


@Component({
  selector: 'ngx-edge',
  templateUrl: './edge.component.html',
  styleUrls: ['./edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class EdgeComponent implements OnDestroy {
  @Input() edge!: Edge | TempEdge; // Can now accept TempEdge
  @Input() isTemporary: boolean = false; // New input to distinguish temp edges

  private subscriptions = new Subscription();

  // Reactive path calculation based on nodes and viewport
  path = computed(() => {
    const nodes = this.diagramStateService.nodes();

    let sourcePos: XYPosition;
    let targetPos: XYPosition;

    if (this.isTemporary && 'sourceX' in this.edge && 'sourceY' in this.edge && 'targetX' in this.edge && 'targetY' in this.edge) {
      // If it's a temporary edge, use its direct coordinates
      sourcePos = { x: this.edge.sourceX, y: this.edge.sourceY };
      targetPos = { x: this.edge.targetX, y: this.edge.targetY };
    } else {
      // For regular edges, calculate positions from nodes
      const sourceNode = getNode(this.edge.source, nodes);
      const targetNode = getNode(this.edge.target, nodes);

      if (!sourceNode || !targetNode) {
        console.warn(`Source or target node not found for edge ${this.edge.id}`);
        return 'M 0 0'; // Return an empty path
      }

      sourcePos = getHandleAbsolutePosition(sourceNode, this.edge.sourceHandle);
      targetPos = getHandleAbsolutePosition(targetNode, this.edge.targetHandle);
    }


    let path: string;
    switch (this.edge.type) {
      case 'bezier':
        path = getBezierPath(sourcePos, targetPos);
        break;
      case 'step':
        path = getStepPath(sourcePos, targetPos);
        break;
      case 'straight':
      default:
        path = getStraightPath(sourcePos, targetPos);
        break;
    }
    return path;
  });

  constructor(private diagramStateService: DiagramStateService) {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('click', ['$event'])
  onClick(event: PointerEvent): void {
    if (this.isTemporary) return; // Don't allow clicking temp edges
    event.stopPropagation();
    this.diagramStateService.onEdgeClick(this.edge);
    this.diagramStateService.edges.update(edges =>
      edges.map(e => ({ ...e, selected: e.id === this.edge.id ? !e.selected : e.selected }))
    );
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    if (this.isTemporary) return; // Don't allow context menu on temp edges
    event.preventDefault();
    event.stopPropagation();
    console.log('Edge context menu:', this.edge);
  }
}