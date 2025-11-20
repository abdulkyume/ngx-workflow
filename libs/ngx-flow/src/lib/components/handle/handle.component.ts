import { Component, ChangeDetectionStrategy, Input, HostListener, NgZone, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services';
import { XYPosition, TempEdge, Node, Edge } from '../../models';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'ngx-handle',
  templateUrl: './handle.component.html',
  styleUrls: ['./handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class HandleComponent implements OnDestroy {
  @Input() type: 'source' | 'target' = 'source';
  @Input() position: 'top' | 'right' | 'bottom' | 'left' = 'bottom';
  @Input() id?: string;
  @Input() nodeId!: string;

  private isConnecting = false;
  private currentPreviewEdgeId: string | null = null;
  private currentTargetHandle: { nodeId: string; handleId?: string; type: 'source' | 'target' } | null = null;

  constructor(
    private el: ElementRef<SVGGElement>,
    private ngZone: NgZone,
    private diagramStateService: DiagramStateService,
    private renderer: Renderer2
  ) {
    this.ngZone.runOutsideAngular(() => {
      this.renderer.listen('document', 'pointermove', this.onPointerMove.bind(this));
      this.renderer.listen('document', 'pointerup', this.onPointerUp.bind(this));
    });
  }

  ngOnDestroy(): void {
    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
    }
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.type !== 'source') {
      return;
    }
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = true;
    this.el.nativeElement.setPointerCapture(event.pointerId);

    const previewEdgeId = `preview-${uuidv4()}`;
    this.currentPreviewEdgeId = previewEdgeId;

    const sourceNode = this.diagramStateService.nodes().find(n => n.id === this.nodeId);
    if (!sourceNode) {
      console.error(`Source node ${this.nodeId} not found for handle!`);
      this.isConnecting = false;
      return;
    }

    const viewport = this.diagramStateService.viewport();
    const diagramSvgEl = this.diagramStateService.el.nativeElement;
    const handleScreenCoords = this.el.nativeElement.getBoundingClientRect();
    const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();

    // Calculate source handle position relative to diagram content, accounting for pan and zoom
    const sourceX = (handleScreenCoords.x + handleScreenCoords.width / 2 - diagramScreenCoords.x - viewport.x) / viewport.zoom;
    const sourceY = (handleScreenCoords.y + handleScreenCoords.height / 2 - diagramScreenCoords.y - viewport.y) / viewport.zoom;

    const newTempEdge: TempEdge = {
      id: previewEdgeId,
      source: this.nodeId,
      sourceHandle: this.id,
      target: 'preview-target', // Special ID for preview, will be replaced
      targetHandle: undefined,
      type: 'straight', // Default preview edge type
      animated: true,
      style: { stroke: 'blue', strokeWidth: '2' },
      sourceX: sourceX,
      sourceY: sourceY,
      targetX: sourceX, // Start target at source
      targetY: sourceY,
    };
    this.diagramStateService.addTempEdge(newTempEdge);
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.isConnecting || !this.currentPreviewEdgeId) {
      return;
    }
    this.ngZone.runOutsideAngular(() => {
      const diagramSvgEl = this.diagramStateService.el.nativeElement;
      const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();
      const viewport = this.diagramStateService.viewport();

      // Calculate current pointer position relative to diagram content
      const currentPointerX = (event.clientX - diagramScreenCoords.x - viewport.x) / viewport.zoom;
      const currentPointerY = (event.clientY - diagramScreenCoords.y - viewport.y) / viewport.zoom;

      if (this.currentPreviewEdgeId) {
        this.diagramStateService.updateTempEdgeTarget(this.currentPreviewEdgeId, { x: currentPointerX, y: currentPointerY });
      }

      // Check for potential target handles and highlight them
      const targetHandleEl = event.target as HTMLElement;
      const closestHandle = targetHandleEl.closest('.ngx-flow__handle') as SVGGElement;

      // Clear previous highlights
      this.clearTargetHandleHighlight();

      if (closestHandle) {
        const targetNodeId = closestHandle.dataset['nodeid'];
        const targetHandleId = closestHandle.dataset['handleid'];
        const targetHandleType = closestHandle.dataset['handletype'] as 'source' | 'target';

        // A target handle is valid if:
        // 1. It's a target type handle
        // 2. It belongs to a different node than the source handle
        if (targetHandleType === 'target' && targetNodeId && targetNodeId !== this.nodeId) {
          this.currentTargetHandle = { nodeId: targetNodeId, handleId: targetHandleId, type: targetHandleType };
          this.renderer.addClass(closestHandle, 'ngx-flow__handle--valid-target');
        } else {
          this.currentTargetHandle = null;
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.isConnecting || !this.currentPreviewEdgeId) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = false;
    this.el.nativeElement.releasePointerCapture(event.pointerId);
    this.clearTargetHandleHighlight();

    // Remove the preview edge
    this.diagramStateService.removeEdge(this.currentPreviewEdgeId);

    // If a valid target handle was found, add the real edge
    if (this.currentTargetHandle) {
      const newEdge: Edge = {
        id: uuidv4(),
        source: this.nodeId,
        sourceHandle: this.id,
        target: this.currentTargetHandle.nodeId,
        targetHandle: this.currentTargetHandle.handleId,
        type: 'bezier', // Default edge type for new connections
      };
      this.diagramStateService.addEdge(newEdge);
    }

    this.currentPreviewEdgeId = null;
    this.currentTargetHandle = null;
  }

  private clearTargetHandleHighlight(): void {
    const activeHighlights = document.querySelectorAll('.ngx-flow__handle--valid-target');
    activeHighlights.forEach(el => this.renderer.removeClass(el, 'ngx-flow__handle--valid-target'));
  }
}