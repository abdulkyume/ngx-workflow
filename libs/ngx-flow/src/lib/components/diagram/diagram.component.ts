import { Component, ChangeDetectionStrategy, ElementRef, OnInit, Renderer2, NgZone, OnDestroy, HostListener, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Viewport, XYPosition, Node, Edge, TempEdge } from '../../models';
import { Subscription } from 'rxjs';
import { NodeComponent } from '../node/node.component';
import { EdgeComponent } from '../edge/edge.component';

@Component({
  selector: 'ngx-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, NodeComponent, EdgeComponent]
})
export class DiagramComponent implements OnInit, OnDestroy {
  viewport!: WritableSignal<Viewport>;
  nodes!: WritableSignal<Node[]>;
  edges!: WritableSignal<Edge[]>;
  tempEdges!: WritableSignal<TempEdge[]>;

  // Expose Math to the template
  Math = Math;

  private isPanning = false;
  private lastPanPosition: XYPosition = { x: 0, y: 0 };
  private subscriptions = new Subscription();

  // Lasso selection properties
  isSelecting = false;
  selectionStart: XYPosition = { x: 0, y: 0 };
  selectionEnd: XYPosition = { x: 0, y: 0 };

  constructor(
    private el: ElementRef<SVGSVGElement>,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private diagramStateService: DiagramStateService
  ) {}

  ngOnInit(): void {
    this.diagramStateService.el = this.el;
    this.viewport = this.diagramStateService.viewport;
    this.nodes = this.diagramStateService.nodes;
    this.edges = this.diagramStateService.edges;
    this.tempEdges = this.diagramStateService.tempEdges;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get transform(): string {
    const v = this.viewport();
    return `translate(${v.x}, ${v.y}) scale(${v.zoom})`;
  }

  trackByNodeId(index: number, node: Node): string {
    return node.id;
  }

  trackByEdgeId(index: number, edge: Edge): string {
    return edge.id;
  }

  @HostListener('window:keydown.delete', ['$event'])
  onDeleteKeyPress(event: any): void {
    this.diagramStateService.deleteSelectedElements();
  }

  @HostListener('window:keydown.control.z', ['$event'])
  @HostListener('window:keydown.meta.z', ['$event']) // For macOS
  onUndoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser undo
    this.diagramStateService.undo();
  }

  @HostListener('window:keydown.control.shift.z', ['$event'])
  @HostListener('window:keydown.meta.shift.z', ['$event']) // For macOS
  onRedoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser redo
    this.diagramStateService.redo();
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.ngZone.runOutsideAngular(() => {
      const svgRect = this.el.nativeElement.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;

      const viewportBefore = this.viewport();

      const pointX = (clientX - svgRect.left - viewportBefore.x) / viewportBefore.zoom;
      const pointY = (clientY - svgRect.top - viewportBefore.y) / viewportBefore.zoom;

      const scaleFactor = 1.05;
      const newZoom = event.deltaY < 0 ? viewportBefore.zoom * scaleFactor : viewportBefore.zoom / scaleFactor;

      const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

      const newX = clientX - svgRect.left - pointX * clampedZoom;
      const newY = clientY - svgRect.top - pointY * clampedZoom;

      this.diagramStateService.setViewport({ x: newX, y: newY, zoom: clampedZoom });
    });
  }

  onPointerDown(event: PointerEvent): void {
    // Check if the event target is a descendant of a node or handle
    const targetElement = event.target as HTMLElement;
    const isNodeOrHandle = targetElement.closest('.ngx-flow__node, .ngx-flow__handle');

    if (event.button === 0 && !isNodeOrHandle) { // Only left mouse button and not on a node or handle
      const target = event.target as Element;
      const isClickingOnCanvas = target === this.el.nativeElement || target.classList.contains('ngx-flow__background');

      if (isClickingOnCanvas) {
        if (event.shiftKey) {
          // Start lasso selection
          this.isSelecting = true;
          this.selectionStart = this.getDiagramCoordinates(event.clientX, event.clientY);
          this.selectionEnd = { ...this.selectionStart };
          this.el.nativeElement.setPointerCapture(event.pointerId);
        } else {
          // Start panning
          this.isPanning = true;
          this.lastPanPosition = { x: event.clientX, y: event.clientY };
          this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grabbing');
          this.el.nativeElement.setPointerCapture(event.pointerId);
          this.diagramStateService.clearSelection(); // Clear selection when starting pan
        }
      }
    } else if (event.button === 0 && isNodeOrHandle) {
      // If clicking on a node or handle, ensure selection is handled by the component itself,
      // but clear other selections if not multi-selecting
      if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
        // Clear selection only if not trying to multi-select and not a handle
        if (!targetElement.closest('.ngx-flow__handle')) {
          this.diagramStateService.clearSelection();
        }
      }
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (this.isPanning) {
      this.ngZone.runOutsideAngular(() => {
        const deltaX = event.clientX - this.lastPanPosition.x;
        const deltaY = event.clientY - this.lastPanPosition.y;

        const currentViewport = this.viewport();
        this.diagramStateService.setViewport({
          x: currentViewport.x + deltaX,
          y: currentViewport.y + deltaY,
          zoom: currentViewport.zoom,
        });

        this.lastPanPosition = { x: event.clientX, y: event.clientY };
      });
    } else if (this.isSelecting) {
      this.ngZone.runOutsideAngular(() => {
        this.selectionEnd = this.getDiagramCoordinates(event.clientX, event.clientY);
      });
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.isPanning) {
      this.isPanning = false;
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'grab');
      this.el.nativeElement.releasePointerCapture(event.pointerId);
    } else if (this.isSelecting) {
      this.isSelecting = false;
      this.el.nativeElement.releasePointerCapture(event.pointerId);
      this.performLassoSelection();
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (this.isPanning || this.isSelecting) {
      this.onPointerUp(event);
    }
  }

  private getDiagramCoordinates(clientX: number, clientY: number): XYPosition {
    const svgRect = this.el.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();

    const x = (clientX - svgRect.left - viewport.x) / viewport.zoom;
    const y = (clientY - svgRect.top - viewport.y) / viewport.zoom;
    return { x, y };
  }

  private performLassoSelection(): void {
    const minX = Math.min(this.selectionStart.x, this.selectionEnd.x);
    const maxX = Math.max(this.selectionStart.x, this.selectionEnd.x);
    const minY = Math.min(this.selectionStart.y, this.selectionEnd.y);
    const maxY = Math.max(this.selectionStart.y, this.selectionEnd.y);

    const selectedNodeIds: string[] = [];
    this.nodes().forEach((node: Node) => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      // Using values from NodeComponent's defaultWidth/Height
      const nodeWidth = node.width || 170;
      const nodeHeight = node.height || 60;

      if (
        nodeX < maxX &&
        nodeX + nodeWidth > minX &&
        nodeY < maxY &&
        nodeY + nodeHeight > minY
      ) {
        selectedNodeIds.push(node.id);
      }
    });

    this.diagramStateService.clearSelection(); // Clear existing selections
    this.diagramStateService.selectNodes(selectedNodeIds, false); // Select new nodes
  }

  /**
   * @description
   * Placeholder for virtual rendering. To optimize performance for very large diagrams,
   * this method (or a computed signal in the template) would filter the `nodes()` and `edges()`
   * arrays to only include elements that are currently within the viewport, plus an optional margin.
   * This would involve calculating the bounding box of the viewport in diagram coordinates
   * and performing a spatial intersection test for each element.
   * Example:
   * const visibleNodes = this.nodes().filter(node => isNodeVisible(node, currentViewportBounds));
   */
  fitView(): void {
    console.log('fitView not yet implemented');
  }
}