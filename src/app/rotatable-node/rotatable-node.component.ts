import { Component, Input, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../../libs/ngx-workflow/src/lib/services/diagram-state.service';

@Component({
  selector: 'app-rotatable-node',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rotatable-node" [style.transform]="'rotate(' + rotation + 'deg)'">
      <!-- Rotation Handle (Not a connection handle) -->
      <div 
        class="rotate-handle nodrag"
        (pointerdown)="onRotateStart($event)"
      ></div>

      <!-- Connection Handles -->
      <div class="ngx-workflow__handle custom-handle top" 
            [attr.data-nodeid]="id" 
            data-handleid="top" 
            data-type="target"></div>
      <div class="ngx-workflow__handle custom-handle bottom" 
            [attr.data-nodeid]="id" 
            data-handleid="bottom" 
            data-type="source"></div>
      <div class="ngx-workflow__handle custom-handle left" 
            [attr.data-nodeid]="id" 
            data-handleid="left" 
            data-type="target"></div>
      <div class="ngx-workflow__handle custom-handle right" 
            [attr.data-nodeid]="id" 
            data-handleid="right" 
            data-type="source"></div>
      
      <div class="content" #content>
        <label>{{ data.label }}</label>
        <div>{{ rotation }}°</div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .rotatable-node {
      height: 100%;
      width: 100%;
      border: 1px solid var(--ngx-workflow-border, #e2e8f0);
      border-radius: 4px;
      background: var(--ngx-workflow-surface, #ffffff);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-sizing: border-box;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
      transition: border-color 0.2s, filter 0.2s;
    }

    .rotatable-node:hover {
      border-color: #94a3b8; /* Slate-400 */
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
    }

    .rotatable-node.selected {
      border-color: #3b82f6; /* Blue-500 */
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .content {
      padding: 10px;
      text-align: center;
      pointer-events: none;
    }
    
    label {
      font-weight: bold;
      color: #333;
      display: block;
    }

    /* Rotation Handle */
    .rotate-handle {
      width: 12px;
      height: 12px;
      background: #555;
      border-radius: 50%;
      position: absolute;
      top: -40px; /* Position floating higher above the node */
      left: 50%;
      transform: translateX(-50%);
      cursor: grab;
      z-index: 20;
      transition: background-color 0.2s, transform 0.2s;
    }

    .rotate-handle:hover {
      background-color: #333;
      transform: translateX(-50%) scale(1.1);
    }

    .rotate-handle::after {
      content: '';
      position: absolute;
      top: 12px; /* Starts at the bottom of the circle */
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 28px; /* Connects down to the node */
      background: #555;
      pointer-events: none;
    }

    .rotate-handle:active {
      cursor: grabbing;
      background: #333;
    }

    /* Connection Handles */
    .custom-handle {
      width: 10px; /* Standard size */
      height: 10px;
      background: var(--ngx-workflow-surface, #ffffff);
      border: 1px solid var(--ngx-workflow-text-secondary, #64748b);
      border-radius: 50%;
      position: absolute;
      z-index: 10;
      cursor: crosshair;
      transition: transform 0.1s, background-color 0.1s, border-color 0.1s;
    }

    .custom-handle:hover {
      background-color: var(--ngx-workflow-primary, #3b82f6);
      border-color: var(--ngx-workflow-primary, #3b82f6);
      /* Scale effect handled per position to preserve translate */
    }
    
    /* Highlight handle when a valid connection is dragged over it */
    .custom-handle.ngx-workflow__handle--valid-target {
      background-color: #3b82f6;
      border-color: #2563eb;
      transform: scale(1.2); 
    }

    /* Handle Positioning with Hover Effects */
    .top { top: -5px; left: 50%; transform: translateX(-50%); }
    .top:hover { transform: translateX(-50%) scale(1.2); }

    .bottom { bottom: -5px; left: 50%; transform: translateX(-50%); }
    .bottom:hover { transform: translateX(-50%) scale(1.2); }

    .left { left: -5px; top: 50%; transform: translateY(-50%); }
    .left:hover { transform: translateY(-50%) scale(1.2); }

    .right { right: -5px; top: 50%; transform: translateY(-50%); }
    .right:hover { transform: translateY(-50%) scale(1.2); }
  `]
})
export class RotatableNodeComponent implements OnInit, OnDestroy {
  @Input() id!: string;
  @Input() data: any;
  @Input() selected?: boolean;

  rotation = 0;
  isRotating = false;

  // Clean up listeners
  private pointerMoveListener?: (e: PointerEvent) => void;
  private pointerUpListener?: (e: PointerEvent) => void;

  constructor(private elementRef: ElementRef, private diagramStateService: DiagramStateService) { }

  ngOnInit() {
    if (this.data && typeof this.data.rotation === 'number') {
      this.rotation = this.data.rotation;
    }
  }

  onRotateStart(event: PointerEvent) {
    event.preventDefault();
    event.stopPropagation(); // Stop propagation to prevent node dragging
    this.isRotating = true;

    // Save state before rotation for undo
    this.diagramStateService.saveStateForUndo();

    // Set pointer capture to ensure we get events even if cursor moves outside
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const box = this.elementRef.nativeElement.getBoundingClientRect();
    const centerX = box.left + box.width / 2;
    const centerY = box.top + box.height / 2;

    this.pointerMoveListener = (e: PointerEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calculate angle from center to mouse
      const radians = Math.atan2(mouseY - centerY, mouseX - centerX);
      let degrees = radians * (180 / Math.PI);

      // Adjust to start from top
      degrees += 90;

      // Normalize to 0-360
      if (degrees < 0) {
        degrees += 360;
      }

      this.rotation = Math.round(degrees);

      // Update diagram state so edges follow
      this.diagramStateService.updateNode(this.id, {
        data: { ...this.data, rotation: this.rotation }
      }, false); // false = don't save to history for every move
    };

    this.pointerUpListener = (e: PointerEvent) => {
      this.isRotating = false;
      target.releasePointerCapture(e.pointerId);

      if (this.pointerMoveListener) {
        window.removeEventListener('pointermove', this.pointerMoveListener);
      }
      if (this.pointerUpListener) {
        window.removeEventListener('pointerup', this.pointerUpListener);
      }
    };

    window.addEventListener('pointermove', this.pointerMoveListener);
    window.addEventListener('pointerup', this.pointerUpListener);
  }

  ngOnDestroy() {
    if (this.pointerMoveListener) {
      window.removeEventListener('pointermove', this.pointerMoveListener);
    }
    if (this.pointerUpListener) {
      window.removeEventListener('pointerup', this.pointerUpListener);
    }
  }
}
