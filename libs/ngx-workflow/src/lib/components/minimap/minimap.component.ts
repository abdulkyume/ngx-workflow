import { Component, ChangeDetectionStrategy, Input, ElementRef, ViewChild, AfterViewInit, OnDestroy, computed, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Node, Viewport } from '../../models';

@Component({
  selector: 'ngx-workflow-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MinimapComponent {
  @Input() nodeColor: string = '#e2e2e2';
  @Input() nodeClass: string = '';

  // Initialize signals from service
  nodes: Signal<Node[]>;
  viewport: Signal<Viewport>;

  // Minimap dimensions
  width = 200;
  height = 150;

  // Drag state
  private isDragging = false;
  private lastDragPos = { x: 0, y: 0 };

  constructor(
    private diagramStateService: DiagramStateService,
    private el: ElementRef<HTMLElement>
  ) {
    this.nodes = this.diagramStateService.nodes;
    this.viewport = this.diagramStateService.viewport;
  }

  // Computed properties for rendering
  viewBox = computed(() => {
    const nodes = this.nodes();
    if (nodes.length === 0) return '0 0 100 100';

    const bounds = this.getBounds(nodes);
    const padding = 50;
    return `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  });

  viewportIndicator = computed(() => {
    const v = this.viewport();
    const nodes = this.nodes();
    const dimensions = this.diagramStateService.containerDimensions();

    if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    // Calculate viewport rect in diagram coordinates
    // Viewport x/y are the translation of the content.
    // Visible area top-left in diagram space is: -v.x / v.zoom, -v.y / v.zoom
    // Visible area width/height in diagram space is: dimensions.width / v.zoom, dimensions.height / v.zoom

    const x = -v.x / v.zoom;
    const y = -v.y / v.zoom;
    const width = dimensions.width / v.zoom;
    const height = dimensions.height / v.zoom;

    return { x, y, width, height };
  });

  private getBounds(nodes: Node[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (nodes.length === 0) return { minX: 0, minY: 0, width: 100, height: 100 };

    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.width || 170));
      maxY = Math.max(maxY, node.position.y + (node.height || 60));
    });

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  onMinimapClick(event: MouseEvent) {
    if (this.isDragging) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();

    // Click position relative to minimap element
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    // Convert to SVG coordinates (diagram space)
    const vb = this.viewBox().split(' ').map(parseFloat);
    const vbX = vb[0];
    const vbY = vb[1];
    const vbW = vb[2];
    const vbH = vb[3];

    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;

    // Point in diagram space where user clicked
    const diagramX = vbX + clickX * scaleX;
    const diagramY = vbY + clickY * scaleY;

    // Center the viewport on this point
    const currentZoom = this.viewport().zoom;
    const dimensions = this.diagramStateService.containerDimensions();

    // We want diagramX to be at the center of the screen
    // screenCenterX = diagramX * zoom + viewportX
    // viewportX = screenCenterX - diagramX * zoom

    const screenCenterX = dimensions.width / 2;
    const screenCenterY = dimensions.height / 2;

    const newX = screenCenterX - diagramX * currentZoom;
    const newY = screenCenterY - diagramY * currentZoom;

    this.diagramStateService.setViewport({
      x: newX,
      y: newY,
      zoom: currentZoom
    });
  }

  onViewportMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.lastDragPos = { x: event.clientX, y: event.clientY };

    // Add global listeners
    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }

  private onWindowMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const dx = event.clientX - this.lastDragPos.x;
    const dy = event.clientY - this.lastDragPos.y;
    this.lastDragPos = { x: event.clientX, y: event.clientY };

    // Get minimap dimensions
    const svg = this.el.nativeElement.querySelector('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();

    // Parse viewBox
    const vb = this.viewBox().split(' ').map(parseFloat);
    const vbW = vb[2];
    const vbH = vb[3];

    // Calculate scale: how many diagram units per pixel
    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;

    // Convert delta to diagram space
    const diagramDx = dx * scaleX;
    const diagramDy = dy * scaleY;

    // Update viewport
    const currentViewport = this.viewport();
    const zoom = currentViewport.zoom;

    // Moving the viewport indicator RIGHT means we are panning the view RIGHT (showing content to the right)
    // which means the viewport x (translation) should decrease.

    const newX = currentViewport.x - diagramDx * zoom;
    const newY = currentViewport.y - diagramDy * zoom;

    this.diagramStateService.setViewport({
      x: newX,
      y: newY
    });
  }

  private onWindowMouseUp = () => {
    this.isDragging = false;
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }
}
