import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, NgZone, HostListener, Inject, Optional } from '@angular/core';
import { Node, XYPosition } from '../../models';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { HandleComponent } from '../handle/handle.component';
import { NGX_FLOW_NODE_TYPES } from '../../injection-tokens';
import { NodeComponentType } from '../../types';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'ngx-node',
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, HandleComponent, NgComponentOutlet] // Add NgComponentOutlet to imports
})
export class NodeComponent {
  @Input() node!: Node;

  private dragging = false;
  private startPosition: XYPosition = { x: 0, y: 0 };
  private startPointerPosition: XYPosition = { x: 0, y: 0 };

  // Default width and height for calculating handle positions if not provided by the node
  defaultWidth = 170;
  defaultHeight = 60;

  customNodeComponent: NodeComponentType | undefined;

  constructor(
    private el: ElementRef<SVGGElement>,
    private ngZone: NgZone,
    private diagramStateService: DiagramStateService,
    @Optional() @Inject(NGX_FLOW_NODE_TYPES) private nodeTypes: Record<string, NodeComponentType> | null
  ) {
    if (this.node && this.node.type && this.nodeTypes && this.nodeTypes[this.node.type]) {
      this.customNodeComponent = this.nodeTypes[this.node.type];
    }
  }

  ngOnChanges(): void {
    // Re-evaluate custom component if node input changes (e.g., node.type)
    if (this.node && this.node.type && this.nodeTypes && this.nodeTypes[this.node.type]) {
      this.customNodeComponent = this.nodeTypes[this.node.type];
    } else {
      this.customNodeComponent = undefined;
    }
  }

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || !this.node.draggable) { // Only left click and if node is draggable
      return;
    }
    event.stopPropagation(); // Prevent canvas panning

    this.dragging = true;
    this.startPosition = { x: this.node.position.x, y: this.node.position.y };
    this.startPointerPosition = { x: event.clientX, y: event.clientY };
    this.el.nativeElement.setPointerCapture(event.pointerId);

    this.diagramStateService.onDragStart(this.node);
    this.diagramStateService.selectNodes([this.node.id], event.ctrlKey || event.metaKey || event.shiftKey);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    event.stopPropagation();

    this.ngZone.runOutsideAngular(() => {
      const zoom = this.diagramStateService.viewport().zoom;
      const deltaX = (event.clientX - this.startPointerPosition.x) / zoom;
      const deltaY = (event.clientY - this.startPointerPosition.y) / zoom;

      const newPosition = {
        x: this.startPosition.x + deltaX,
        y: this.startPosition.y + deltaY,
      };
      this.diagramStateService.moveNode(this.node.id, newPosition);
    });
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(event: PointerEvent): void {
    if (!this.dragging) {
      return;
    }
    event.stopPropagation();

    this.dragging = false;
    this.el.nativeElement.releasePointerCapture(event.pointerId);
    this.diagramStateService.onDragEnd(this.node);
  }

  @HostListener('click', ['$event'])
  onClick(event: PointerEvent): void {
    // Check if it was a drag or a click
    const wasDragged = Math.abs(event.clientX - this.startPointerPosition.x) > 5 || Math.abs(event.clientY - this.startPointerPosition.y) > 5;
    if (wasDragged) {
      return; // It was a drag, not a click
    }

    event.stopPropagation();
    this.diagramStateService.onNodeClick(this.node);
    this.diagramStateService.selectNodes([this.node.id], event.ctrlKey || event.metaKey || event.shiftKey);
  }

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Node context menu:', this.node);
  }
}