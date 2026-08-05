import { Injectable, NgZone } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';

/**
 * TouchGestureService - Handles multi-touch gestures for the workflow diagram.
 *
 * Supports:
 * - Pinch-to-zoom: Two-finger spread/pinch scales the canvas around the midpoint.
 * - Two-finger pan: Two fingers moving in the same direction pans the canvas.
 * - Single-finger passthrough: Maps touch events to pointer events for existing drag logic.
 *
 * All listeners run outside Angular Zone and are throttled with requestAnimationFrame.
 */
@Injectable({
  providedIn: 'root',
})
export class TouchGestureService {
  private svgElement: SVGSVGElement | null = null;
  private diagramState: DiagramStateService | null = null;

  // Active touch tracking
  private activeTouches: Map<number, Touch> = new Map();
  private initialPinchDistance: number | null = null;
  private initialPinchZoom: number = 1;
  private initialPinchMidpoint: { x: number; y: number } | null = null;
  private lastTwoFingerPos: { x: number; y: number } | null = null;

  // rAF throttle
  private pendingRAF: number | null = null;

  // Bound listeners (for removal)
  private boundTouchStart = this.onTouchStart.bind(this);
  private boundTouchMove = this.onTouchMove.bind(this);
  private boundTouchEnd = this.onTouchEnd.bind(this);
  private boundTouchCancel = this.onTouchEnd.bind(this);

  constructor(private ngZone: NgZone) {}

  /**
   * Attach touch listeners to the SVG canvas element.
   * Must be called once during component initialization.
   */
  attach(svgElement: SVGSVGElement, diagramState: DiagramStateService): void {
    this.svgElement = svgElement;
    this.diagramState = diagramState;

    this.ngZone.runOutsideAngular(() => {
      svgElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
      svgElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
      svgElement.addEventListener('touchend', this.boundTouchEnd, { passive: false });
      svgElement.addEventListener('touchcancel', this.boundTouchCancel, { passive: false });
    });
  }

  /**
   * Remove all touch listeners. Must be called during component destruction.
   */
  detach(): void {
    if (this.svgElement) {
      this.svgElement.removeEventListener('touchstart', this.boundTouchStart);
      this.svgElement.removeEventListener('touchmove', this.boundTouchMove);
      this.svgElement.removeEventListener('touchend', this.boundTouchEnd);
      this.svgElement.removeEventListener('touchcancel', this.boundTouchCancel);
    }

    if (this.pendingRAF !== null) {
      cancelAnimationFrame(this.pendingRAF);
      this.pendingRAF = null;
    }

    this.svgElement = null;
    this.diagramState = null;
    this.resetState();
  }

  // --- Touch Event Handlers ---

  private onTouchStart(event: TouchEvent): void {
    // Update active touches map
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }

    if (this.activeTouches.size === 2) {
      // Two fingers down → begin pinch/pan gesture
      event.preventDefault();
      this.initTwoFingerGesture();
    }
    // Single finger: let the existing pointer events handle it (no preventDefault)
  }

  private onTouchMove(event: TouchEvent): void {
    // Update active touches map with latest positions
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.set(touch.identifier, touch);
    }

    if (this.activeTouches.size >= 2) {
      // Prevent default scrolling/zooming for multi-touch
      event.preventDefault();

      // Throttle with rAF
      if (this.pendingRAF !== null) return;

      this.pendingRAF = requestAnimationFrame(() => {
        this.pendingRAF = null;
        this.handleTwoFingerMove();
      });
    }
    // Single finger: pointer events handle it naturally
  }

  private onTouchEnd(event: TouchEvent): void {
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    if (this.activeTouches.size < 2) {
      // Gesture ended
      this.resetState();
    }
  }

  // --- Gesture Logic ---

  /**
   * Initialize two-finger gesture state (pinch + pan baseline).
   */
  private initTwoFingerGesture(): void {
    if (!this.diagramState) return;

    const touches = Array.from(this.activeTouches.values());
    if (touches.length < 2) return;

    const t1 = touches[0];
    const t2 = touches[1];

    this.initialPinchDistance = this.getTouchDistance(t1, t2);
    this.initialPinchZoom = this.diagramState.viewport().zoom;
    this.initialPinchMidpoint = this.getTouchMidpoint(t1, t2);
    this.lastTwoFingerPos = { ...this.initialPinchMidpoint };
  }

  /**
   * Process two-finger movement: simultaneous pinch-to-zoom and pan.
   */
  private handleTwoFingerMove(): void {
    if (!this.diagramState || !this.svgElement) return;
    if (this.initialPinchDistance === null || !this.initialPinchMidpoint || !this.lastTwoFingerPos) return;

    const touches = Array.from(this.activeTouches.values());
    if (touches.length < 2) return;

    const t1 = touches[0];
    const t2 = touches[1];

    const currentDistance = this.getTouchDistance(t1, t2);
    const currentMidpoint = this.getTouchMidpoint(t1, t2);

    // --- Pinch-to-zoom ---
    const scaleFactor = currentDistance / this.initialPinchDistance;
    const newZoom = Math.max(0.1, Math.min(10, this.initialPinchZoom * scaleFactor));

    // Focal point is the midpoint between the two fingers, in SVG client coords
    const svgRect = this.svgElement.getBoundingClientRect();
    const viewportBefore = this.diagramState.viewport();

    // The diagram-space point that should stay under the focal point
    const focalDiagramX = (this.initialPinchMidpoint.x - svgRect.left - viewportBefore.x) / this.initialPinchZoom;
    const focalDiagramY = (this.initialPinchMidpoint.y - svgRect.top - viewportBefore.y) / this.initialPinchZoom;

    // New viewport translation to keep the focal point stationary
    let newX = currentMidpoint.x - svgRect.left - focalDiagramX * newZoom;
    let newY = currentMidpoint.y - svgRect.top - focalDiagramY * newZoom;

    // --- Two-finger pan ---
    // Pan is the delta of the midpoint from the last frame (not initial)
    const panDx = currentMidpoint.x - this.lastTwoFingerPos.x;
    const panDy = currentMidpoint.y - this.lastTwoFingerPos.y;
    newX += panDx;
    newY += panDy;

    this.lastTwoFingerPos = { ...currentMidpoint };

    this.diagramState.setViewport({ x: newX, y: newY, zoom: newZoom });
  }

  // --- Utility ---

  private getTouchDistance(t1: Touch, t2: Touch): number {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchMidpoint(t1: Touch, t2: Touch): { x: number; y: number } {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  }

  private resetState(): void {
    this.initialPinchDistance = null;
    this.initialPinchZoom = 1;
    this.initialPinchMidpoint = null;
    this.lastTwoFingerPos = null;
  }
}
