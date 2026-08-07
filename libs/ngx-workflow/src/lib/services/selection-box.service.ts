import { Injectable, ElementRef } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { XYPosition, Viewport } from '../models';

/** Minimum drag distance (canvas px) before a click becomes a selection box. */
const SELECTION_DRAG_THRESHOLD = 4;

/**
 * SelectionBoxService - Encapsulates rubber-band selection box state and calculations.
 */
@Injectable({
  providedIn: 'root',
})
export class SelectionBoxService {
  private svgRef: ElementRef<SVGSVGElement> | null = null;
  private diagramStateService: DiagramStateService | null = null;

  /** True only after the pointer has dragged past the threshold. */
  isBoxSelecting = false;

  /** Pointer is down on empty canvas; box not visible until threshold. */
  private pendingSelection = false;

  get isPendingSelection(): boolean {
    return this.pendingSelection;
  }

  selectionBoxStart: XYPosition = { x: 0, y: 0 };
  selectionBoxEnd: XYPosition = { x: 0, y: 0 };

  // Legacy aliases used by older call sites / tests
  isSelecting = false;
  selectionStart: XYPosition = { x: 0, y: 0 };
  selectionEnd: XYPosition = { x: 0, y: 0 };

  attach(svgRef: ElementRef<SVGSVGElement>, diagramStateService: DiagramStateService): void {
    this.svgRef = svgRef;
    this.diagramStateService = diagramStateService;
  }

  detach(): void {
    this.svgRef = null;
    this.diagramStateService = null;
    this.reset();
  }

  /**
   * Begin a potential box selection (pointer down on empty canvas).
   * Does not show the box until {@link moveTo} exceeds the drag threshold.
   */
  begin(canvasX: number, canvasY: number, pointerId?: number): void {
    this.pendingSelection = true;
    this.isBoxSelecting = false;
    this.isSelecting = false;
    this.selectionBoxStart = { x: canvasX, y: canvasY };
    this.selectionBoxEnd = { x: canvasX, y: canvasY };
    this.selectionStart = { x: canvasX, y: canvasY };
    this.selectionEnd = { x: canvasX, y: canvasY };

    if (pointerId !== undefined && this.svgRef) {
      try {
        this.svgRef.nativeElement.setPointerCapture(pointerId);
      } catch {
        // Safe fallback
      }
    }
  }

  /**
   * Update selection from canvas coordinates.
   * @returns true when the selection box is active (past threshold)
   */
  moveTo(canvasX: number, canvasY: number): boolean {
    if (!this.pendingSelection && !this.isBoxSelecting) return false;
    if (!this.diagramStateService) return false;

    this.selectionBoxEnd = { x: canvasX, y: canvasY };
    this.selectionEnd = { x: canvasX, y: canvasY };

    if (!this.isBoxSelecting) {
      const dx = canvasX - this.selectionBoxStart.x;
      const dy = canvasY - this.selectionBoxStart.y;
      if (Math.hypot(dx, dy) < SELECTION_DRAG_THRESHOLD) {
        return false;
      }
      this.isBoxSelecting = true;
      this.isSelecting = true;
      this.diagramStateService.startBoxSelection(
        this.selectionBoxStart.x,
        this.selectionBoxStart.y
      );
    }

    this.diagramStateService.updateBoxSelection(canvasX, canvasY);
    return true;
  }

  /**
   * Finish selection. Applies node selection when a box was dragged; no-op for a plain click.
   * @returns true if a box selection was committed
   */
  end(pointerId?: number): boolean {
    const wasSelecting = this.isBoxSelecting;

    if (pointerId !== undefined && this.svgRef) {
      try {
        if (this.svgRef.nativeElement.hasPointerCapture(pointerId)) {
          this.svgRef.nativeElement.releasePointerCapture(pointerId);
        }
      } catch {
        // Safe fallback
      }
    }

    if (wasSelecting && this.diagramStateService) {
      this.diagramStateService.endBoxSelection();
    } else if (this.diagramStateService) {
      this.diagramStateService.cancelBoxSelection();
    }

    this.reset();
    return wasSelecting;
  }

  cancel(pointerId?: number): void {
    if (pointerId !== undefined && this.svgRef) {
      try {
        if (this.svgRef.nativeElement.hasPointerCapture(pointerId)) {
          this.svgRef.nativeElement.releasePointerCapture(pointerId);
        }
      } catch {
        // Safe fallback
      }
    }
    this.diagramStateService?.cancelBoxSelection();
    this.reset();
  }

  getSelectionBox(): { x: number; y: number; width: number; height: number } {
    const x = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
    const y = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
    const width = Math.abs(this.selectionBoxEnd.x - this.selectionBoxStart.x);
    const height = Math.abs(this.selectionBoxEnd.y - this.selectionBoxStart.y);
    return { x, y, width, height };
  }

  // --- Legacy API (kept for existing tests / call sites) ---

  startSelecting(event: PointerEvent, viewport: Viewport): void {
    if (!this.svgRef) return;
    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;
    this.begin(x, y, event.pointerId);
    // Legacy tests expect immediate start on diagram state
    this.isBoxSelecting = true;
    this.isSelecting = true;
    this.diagramStateService?.startBoxSelection(x, y);
  }

  updateSelection(event: PointerEvent, viewport: Viewport): void {
    if ((!this.isSelecting && !this.pendingSelection) || !this.svgRef) return;
    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;
    this.moveTo(x, y);
  }

  endSelecting(event: PointerEvent): void {
    this.end(event?.pointerId);
  }

  startBoxSelection(canvasX: number, canvasY: number): void {
    this.begin(canvasX, canvasY);
    this.isBoxSelecting = true;
    this.isSelecting = true;
    this.diagramStateService?.startBoxSelection(canvasX, canvasY);
  }

  updateBoxSelection(event: PointerEvent, viewport: Viewport): void {
    if (!this.svgRef) return;
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const canvasX = (event.clientX - svgRect.left - viewport.x) / viewport.zoom;
    const canvasY = (event.clientY - svgRect.top - viewport.y) / viewport.zoom;
    this.moveTo(canvasX, canvasY);
  }

  stopBoxSelection(): void {
    this.end();
  }

  private reset(): void {
    this.pendingSelection = false;
    this.isBoxSelecting = false;
    this.isSelecting = false;
  }
}
