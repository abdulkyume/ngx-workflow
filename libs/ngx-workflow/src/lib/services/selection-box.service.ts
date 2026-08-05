import { Injectable, ElementRef } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { XYPosition, Viewport } from '../models';

/**
 * SelectionBoxService - Encapsulates rubber-band selection box state and calculations.
 */
@Injectable({
  providedIn: 'root',
})
export class SelectionBoxService {
  private svgRef: ElementRef<SVGSVGElement> | null = null;
  private diagramStateService: DiagramStateService | null = null;

  isBoxSelecting = false;
  selectionBoxStart: XYPosition = { x: 0, y: 0 };
  selectionBoxEnd: XYPosition = { x: 0, y: 0 };

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
    this.isBoxSelecting = false;
    this.isSelecting = false;
  }

  startSelecting(event: PointerEvent, viewport: Viewport): void {
    if (!this.svgRef || !this.diagramStateService) return;

    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

    this.isSelecting = true;
    this.selectionStart = { x, y };
    this.selectionEnd = { x, y };
    this.diagramStateService.startBoxSelection(x, y);

    if (event.pointerId !== undefined) {
      try {
        this.svgRef.nativeElement.setPointerCapture(event.pointerId);
      } catch (e) {
        // Safe fallback
      }
    }
  }

  updateSelection(event: PointerEvent, viewport: Viewport): void {
    if (!this.isSelecting || !this.svgRef || !this.diagramStateService) return;

    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

    this.selectionEnd = { x, y };
    this.diagramStateService.updateBoxSelection(x, y);
  }

  endSelecting(event: PointerEvent): void {
    if (!this.isSelecting || !this.diagramStateService) return;

    this.isSelecting = false;
    if (event && event.pointerId !== undefined && this.svgRef) {
      try {
        if (this.svgRef.nativeElement.hasPointerCapture(event.pointerId)) {
          this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
        }
      } catch (e) {
        // Safe fallback
      }
    }
    this.diagramStateService.endBoxSelection();
  }

  startBoxSelection(canvasX: number, canvasY: number): void {
    this.isBoxSelecting = true;
    this.selectionBoxStart = { x: canvasX, y: canvasY };
    this.selectionBoxEnd = { x: canvasX, y: canvasY };
  }

  updateBoxSelection(event: PointerEvent, viewport: Viewport): void {
    if (!this.isBoxSelecting || !this.svgRef || !this.diagramStateService) return;

    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const canvasX = (event.clientX - svgRect.left - viewport.x) / viewport.zoom;
    const canvasY = (event.clientY - svgRect.top - viewport.y) / viewport.zoom;

    this.selectionBoxEnd = { x: canvasX, y: canvasY };
    this.diagramStateService.updateBoxSelection(canvasX, canvasY);
  }

  stopBoxSelection(): void {
    if (!this.isBoxSelecting || !this.diagramStateService) return;
    this.isBoxSelecting = false;
    this.diagramStateService.endBoxSelection();
  }

  getSelectionBox(): { x: number; y: number; width: number; height: number } {
    const x = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
    const y = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
    const width = Math.abs(this.selectionBoxStart.x - this.selectionBoxEnd.x);
    const height = Math.abs(this.selectionBoxStart.y - this.selectionBoxEnd.y);

    return { x, y, width, height };
  }
}
