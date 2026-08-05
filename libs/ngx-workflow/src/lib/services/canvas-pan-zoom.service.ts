import { Injectable, NgZone, ElementRef } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { Viewport, XYPosition } from '../models';

/**
 * CanvasPanZoomService - Manages canvas zoom and pan interactions.
 *
 * Encapsulates:
 * - Mouse wheel zooming anchored around mouse position.
 * - Space key + Drag panning.
 * - Viewport transform calculations and helper methods (zoomIn, zoomOut, fitView, setCenter).
 */
@Injectable({
  providedIn: 'root',
})
export class CanvasPanZoomService {
  private svgRef: ElementRef<SVGSVGElement> | null = null;
  private diagramStateService: DiagramStateService | null = null;

  // Space + Drag Panning state
  isSpacePressed = false;
  isSpacePanning = false;
  panStartPosition: XYPosition = { x: 0, y: 0 };
  viewportStartPosition: Viewport = { x: 0, y: 0, zoom: 1 };

  private isPanning = false;
  private lastPanPosition: XYPosition = { x: 0, y: 0 };

  constructor(private ngZone: NgZone) {}

  attach(svgRef: ElementRef<SVGSVGElement>, diagramStateService: DiagramStateService): void {
    this.svgRef = svgRef;
    this.diagramStateService = diagramStateService;
  }

  detach(): void {
    this.svgRef = null;
    this.diagramStateService = null;
    this.isSpacePressed = false;
    this.isSpacePanning = false;
    this.isPanning = false;
  }

  /**
   * Handle wheel zoom events anchored to pointer location
   */
  handleWheel(event: WheelEvent): void {
    if (!this.diagramStateService || !this.svgRef) return;
    event.preventDefault();

    const svgEl = this.svgRef.nativeElement;
    const svgRect = svgEl.getBoundingClientRect();
    const clientX = event.clientX;
    const clientY = event.clientY;

    const viewportBefore = this.diagramStateService.viewport();
    const pointX = (clientX - svgRect.left - viewportBefore.x) / viewportBefore.zoom;
    const pointY = (clientY - svgRect.top - viewportBefore.y) / viewportBefore.zoom;

    const scaleFactor = 1.05;
    const newZoom = event.deltaY < 0 ? viewportBefore.zoom * scaleFactor : viewportBefore.zoom / scaleFactor;
    const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

    const newX = clientX - svgRect.left - pointX * clampedZoom;
    const newY = clientY - svgRect.top - pointY * clampedZoom;

    this.diagramStateService.setViewport({ x: newX, y: newY, zoom: clampedZoom });
  }

  /**
   * Start canvas panning via drag
   */
  startPanning(event: PointerEvent): void {
    if (!this.svgRef) return;
    this.isPanning = true;
    this.lastPanPosition = { x: event.clientX, y: event.clientY };
    this.svgRef.nativeElement.style.cursor = 'grabbing';
    if (event.pointerId !== undefined) {
      try {
        this.svgRef.nativeElement.setPointerCapture(event.pointerId);
      } catch (e) {
        // Safe fallback
      }
    }
  }

  /**
   * Update canvas position during pan drag
   */
  pan(event: PointerEvent): void {
    if (!this.isPanning || !this.diagramStateService) return;

    const dx = event.clientX - this.lastPanPosition.x;
    const dy = event.clientY - this.lastPanPosition.y;
    this.lastPanPosition = { x: event.clientX, y: event.clientY };

    const currentViewport = this.diagramStateService.viewport();
    this.diagramStateService.setViewport({
      ...currentViewport,
      x: currentViewport.x + dx,
      y: currentViewport.y + dy
    });
  }

  /**
   * Stop canvas panning
   */
  stopPanning(event: PointerEvent): void {
    if (!this.isPanning || !this.svgRef) return;
    this.isPanning = false;
    this.svgRef.nativeElement.style.cursor = 'grab';
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

  /**
   * Handle space key down / up for space-panning mode
   */
  handleSpaceKey(isDown: boolean): void {
    this.isSpacePressed = isDown;
    if (this.svgRef) {
      this.svgRef.nativeElement.style.cursor = isDown ? 'grab' : 'default';
    }
  }

  // Viewport Control Helpers
  zoomIn(step: number = 1.2, maxZoom: number = 10): void {
    if (!this.diagramStateService) return;
    const current = this.diagramStateService.viewport();
    const newZoom = Math.min(current.zoom * step, maxZoom);
    this.diagramStateService.setViewport({ ...current, zoom: newZoom });
  }

  zoomOut(step: number = 1.2, minZoom: number = 0.1): void {
    if (!this.diagramStateService) return;
    const current = this.diagramStateService.viewport();
    const newZoom = Math.max(current.zoom / step, minZoom);
    this.diagramStateService.setViewport({ ...current, zoom: newZoom });
  }

  resetZoom(): void {
    if (!this.diagramStateService) return;
    const current = this.diagramStateService.viewport();
    this.diagramStateService.setViewport({ ...current, zoom: 1 });
  }

  fitView(): void {
    if (this.diagramStateService) {
      this.diagramStateService.fitView();
    }
  }
}
