import { Component, ChangeDetectionStrategy, Input, ElementRef, NgZone, OnDestroy, computed, Signal } from '@angular/core';

import { DiagramStateService } from '../../services/diagram-state.service';
import { Node, Viewport } from '../../models';

@Component({
  selector: 'ngx-workflow-minimap',
  standalone: true,
  imports: [],
  templateUrl: './minimap.component.html',
  styleUrls: ['./minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MinimapComponent implements OnDestroy {
  @Input() nodeColor: string = '#e2e2e2';
  @Input() nodeClass: string = '';
  @Input() showNodeColors: boolean = true;

  // Initialize signals from service
  nodes: Signal<Node[]>;
  viewport: Signal<Viewport>;

  // Minimap dimensions
  width = 200;
  height = 150;

  // Drag state
  private isDragging = false;
  private lastDragPos = { x: 0, y: 0 };
  private pendingRAF: number | null = null;

  constructor(
    private diagramStateService: DiagramStateService,
    private el: ElementRef<HTMLElement>,
    private ngZone: NgZone
  ) {
    this.nodes = this.diagramStateService.nodes;
    this.viewport = this.diagramStateService.viewport;
  }

  ngOnDestroy(): void {
    if (this.pendingRAF !== null) {
      cancelAnimationFrame(this.pendingRAF);
      this.pendingRAF = null;
    }
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }

  // Memoized bounds signal
  bounds = computed(() => {
    const nodes = this.nodes();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (nodes.length === 0) return { minX: 0, minY: 0, width: 100, height: 100 };

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + (node.width || 170));
      maxY = Math.max(maxY, node.position.y + (node.height || 60));
    }

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  });

  // Computed properties for rendering
  viewBox = computed(() => {
    const nodes = this.nodes();
    if (nodes.length === 0) return '0 0 100 100';

    const bounds = this.bounds();
    const padding = 50;
    return `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width + padding * 2} ${bounds.height + padding * 2}`;
  });

  viewportIndicator = computed(() => {
    const v = this.viewport();
    const nodes = this.nodes();
    const dimensions = this.diagramStateService.containerDimensions();

    if (nodes.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    const x = -v.x / v.zoom;
    const y = -v.y / v.zoom;
    const width = dimensions.width / v.zoom;
    const height = dimensions.height / v.zoom;

    return { x, y, width, height };
  });

  /**
   * Get the fill color for a node in the minimap
   */
  getNodeFill(node: Node): string {
    if (!this.showNodeColors) return this.nodeColor;
    return node.data?.nodeColor || node.style?.['backgroundColor'] || this.nodeColor;
  }

  /**
   * Check if a node is selected
   */
  isNodeSelected(node: Node): boolean {
    return node.selected || false;
  }

  onMinimapClick(event: MouseEvent) {
    if (this.isDragging) return;

    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();

    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const vb = this.viewBox().split(' ').map(parseFloat);
    const vbX = vb[0];
    const vbY = vb[1];
    const vbW = vb[2];
    const vbH = vb[3];

    const scaleX = vbW / rect.width;
    const scaleY = vbH / rect.height;

    const diagramX = vbX + clickX * scaleX;
    const diagramY = vbY + clickY * scaleY;

    const currentZoom = this.viewport().zoom;
    const dimensions = this.diagramStateService.containerDimensions();

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

    // Add global listeners outside Angular Zone
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.onWindowMouseMove);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    });
  }

  private onWindowMouseMove = (event: MouseEvent) => {
    if (!this.isDragging) return;

    const dx = event.clientX - this.lastDragPos.x;
    const dy = event.clientY - this.lastDragPos.y;
    this.lastDragPos = { x: event.clientX, y: event.clientY };

    if (this.pendingRAF !== null) return;

    this.pendingRAF = requestAnimationFrame(() => {
      this.pendingRAF = null;

      const svg = this.el.nativeElement.querySelector('svg');
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const vb = this.viewBox().split(' ').map(parseFloat);
      const vbW = vb[2];
      const vbH = vb[3];

      const scaleX = vbW / rect.width;
      const scaleY = vbH / rect.height;

      const diagramDx = dx * scaleX;
      const diagramDy = dy * scaleY;

      const currentViewport = this.viewport();
      const zoom = currentViewport.zoom;

      const newX = currentViewport.x - diagramDx * zoom;
      const newY = currentViewport.y - diagramDy * zoom;

      this.diagramStateService.setViewport({
        x: newX,
        y: newY
      });
    });
  }

  private onWindowMouseUp = () => {
    this.isDragging = false;
    if (this.pendingRAF !== null) {
      cancelAnimationFrame(this.pendingRAF);
      this.pendingRAF = null;
    }
    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }
}
