import { Injectable, ElementRef, NgZone } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { Node as WorkflowNode, XYPosition, Viewport } from '../models';

/**
 * NodeDragService - Encapsulates single and multi-node dragging interactions,
 * grid snapping, collision detection, and auto-panning during drag.
 */
@Injectable({
  providedIn: 'root',
})
export class NodeDragService {
  private svgRef: ElementRef<SVGSVGElement> | null = null;
  private diagramStateService: DiagramStateService | null = null;

  isDraggingNode = false;
  draggingNode: WorkflowNode | null = null;
  draggingNodes: WorkflowNode[] = [];
  startNodePosition: XYPosition = { x: 0, y: 0 };
  startNodePositions: Map<string, XYPosition> = new Map();
  startPointerPosition: XYPosition = { x: 0, y: 0 };
  collidingNodeIds: string[] = [];

  private dragAnimationFrameId: number | null = null;

  constructor(private ngZone: NgZone) {}

  attach(svgRef: ElementRef<SVGSVGElement>, diagramStateService: DiagramStateService): void {
    this.svgRef = svgRef;
    this.diagramStateService = diagramStateService;
  }

  detach(): void {
    this.svgRef = null;
    this.diagramStateService = null;
    this.stopDraggingNode();
  }

  startDraggingNode(event: PointerEvent, node: WorkflowNode, allNodes: WorkflowNode[]): void {
    if (!this.diagramStateService || !this.svgRef) return;
    event.stopPropagation();

    this.isDraggingNode = true;
    this.draggingNode = node;
    this.startNodePosition = { x: node.position.x, y: node.position.y };
    this.startPointerPosition = { x: event.clientX, y: event.clientY };

    if (event.pointerId !== undefined) {
      try {
        this.svgRef.nativeElement.setPointerCapture(event.pointerId);
      } catch (e) {
        // Safe fallback if element is not in valid capture state
      }
    }

    const selectedNodes = allNodes.filter(n => n.selected);
    if (selectedNodes.length > 1 && node.selected) {
      this.draggingNodes = selectedNodes;
      this.startNodePositions.clear();
      selectedNodes.forEach(n => {
        this.startNodePositions.set(n.id, { x: n.position.x, y: n.position.y });
      });
    } else {
      this.draggingNodes = [node];
      this.startNodePositions.clear();
      this.startNodePositions.set(node.id, { x: node.position.x, y: node.position.y });
    }

    this.diagramStateService.onDragStart(node);
  }

  dragNode(
    event: PointerEvent,
    viewport: Viewport,
    onMoveCallback?: (currentX: number, currentY: number) => void
  ): void {
    if (!this.draggingNode || !this.diagramStateService) return;
    event.stopPropagation();

    // Capture coordinates immediately before entering async rAF
    const clientX = event.clientX;
    const clientY = event.clientY;

    if (this.dragAnimationFrameId) {
      cancelAnimationFrame(this.dragAnimationFrameId);
    }

    this.dragAnimationFrameId = requestAnimationFrame(() => {
      if (!this.draggingNode || !this.diagramStateService) return;

      const zoom = viewport.zoom;
      const deltaX = (clientX - this.startPointerPosition.x) / zoom;
      const deltaY = (clientY - this.startPointerPosition.y) / zoom;

      this.ngZone.run(() => {
        if (!this.draggingNode || !this.diagramStateService) return;

        if (this.draggingNodes.length > 1) {
          const moves = this.draggingNodes.map(node => {
            const startPos = this.startNodePositions.get(node.id)!;
            return {
              id: node.id,
              position: {
                x: startPos.x + deltaX,
                y: startPos.y + deltaY
              }
            };
          });
          this.diagramStateService.moveNodes(moves);
        } else {
          const newPosition = {
            x: this.startNodePosition.x + deltaX,
            y: this.startNodePosition.y + deltaY,
          };
          this.diagramStateService.moveNode(this.draggingNode.id, newPosition);
        }

        const currentX = this.startNodePosition.x + deltaX;
        const currentY = this.startNodePosition.y + deltaY;

        if (onMoveCallback) {
          onMoveCallback(currentX, currentY);
        }
      });

      this.dragAnimationFrameId = null;
    });
  }

  stopDraggingNode(event?: PointerEvent): void {
    if (!this.isDraggingNode) return;

    if (this.dragAnimationFrameId !== null) {
      cancelAnimationFrame(this.dragAnimationFrameId);
      this.dragAnimationFrameId = null;
    }

    const dragged = this.draggingNode;

    // Clear drag flag before onDragEnd so subscribers can flush pathfinder / nodesChange
    this.isDraggingNode = false;
    this.draggingNode = null;
    this.draggingNodes = [];
    this.startNodePositions.clear();
    this.collidingNodeIds = [];

    if (dragged && this.diagramStateService) {
      this.diagramStateService.onDragEnd(dragged);
    }

    if (event && event.pointerId !== undefined && this.svgRef) {
      try {
        if (this.svgRef.nativeElement.hasPointerCapture(event.pointerId)) {
          this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
        }
      } catch (e) {
        // Safe fallback
      }
    }
  }
}
