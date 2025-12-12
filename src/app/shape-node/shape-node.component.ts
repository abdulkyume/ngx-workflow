import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramStateService } from '../../../libs/ngx-workflow/src/lib/services/diagram-state.service';

@Component({
  selector: 'app-shape-node',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="shape-node-container">
      <svg class="shape-svg" width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path [attr.d]="getPath()" 
              [attr.fill]="style?.backgroundColor || '#ffffff'" 
              [attr.stroke]="style?.borderColor || '#000000'" 
              stroke-width="1.5"
              vector-effect="non-scaling-stroke"/>
      </svg>
      
      <div class="content" [style.color]="style?.color || '#000000'" (dblclick)="startEditing()">
        <span *ngIf="!isEditing">{{ label }}</span>
        <input *ngIf="isEditing" 
               #labelInput
               type="text" 
               [ngModel]="label" 
               (ngModelChange)="onLabelChange($event)"
               (blur)="stopEditing()" 
               (keydown.enter)="stopEditing()"
               class="label-input nodrag">
      </div>

      <!-- Handles -->
      <div *ngIf="!ports || ports === 1 || ports === 2 || ports === 4"
           class="ngx-workflow__handle custom-handle" 
           [ngStyle]="getHandleStyle('top')"
           [attr.data-nodeid]="id" data-handleid="top" data-type="target"></div>
      <div *ngIf="!ports || ports === 2 || ports === 4"
           class="ngx-workflow__handle custom-handle" 
           [ngStyle]="getHandleStyle('bottom')"
           [attr.data-nodeid]="id" data-handleid="bottom" data-type="source"></div>
      <div *ngIf="!ports || ports === 3 || ports === 4"
           class="ngx-workflow__handle custom-handle" 
           [ngStyle]="getHandleStyle('left')"
           [attr.data-nodeid]="id" data-handleid="left" data-type="target"></div>
      <div *ngIf="!ports || ports === 3 || ports === 4"
           class="ngx-workflow__handle custom-handle" 
           [ngStyle]="getHandleStyle('right')"
           [attr.data-nodeid]="id" data-handleid="right" data-type="source"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .shape-node-container {
      width: 100%;
      height: 100%;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .shape-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }
    .content {
      position: relative;
      z-index: 1;
      text-align: center;
      padding: 10px;
      font-weight: bold;
      pointer-events: auto; /* Allow interaction for double-click */
      user-select: none;
      min-width: 50px;
      min-height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: inherit; /* Inherit drag cursor from parent if not editing */
    }
    .label-input {
      pointer-events: auto;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 2px 4px;
      font-size: inherit;
      font-weight: inherit;
      text-align: center;
      width: 100%;
      max-width: 150px;
    }

    /* Connection Handles */
    .custom-handle {
      width: 10px;
      height: 10px;
      background: var(--ngx-workflow-surface, #ffffff);
      border: 1px solid var(--ngx-workflow-text-secondary, #64748b);
      border-radius: 50%;
      position: absolute;
      z-index: 10;
      cursor: crosshair;
      transition: transform 0.1s;
    }
    .custom-handle:hover {
      background-color: var(--ngx-workflow-primary, #3b82f6);
      transform: scale(1.2);
    }
  `]
})
export class ShapeNodeComponent {
  @Input() id!: string;
  @Input() data: any; // data.type determines the shape
  @Input() selected?: boolean;
  @Input() type?: string;
  @Input() label: string = 'Shape'; // New input for synced label
  @Input() pos: any;
  @Input() easyConnect?: boolean;
  @Input() style?: any;
  @Input() ports?: number;

  @ViewChild('labelInput') labelInput?: ElementRef;

  isEditing = false;

  constructor(private diagramStateService: DiagramStateService) { }

  startEditing() {
    this.isEditing = true;
    setTimeout(() => {
      this.labelInput?.nativeElement.focus();
      this.labelInput?.nativeElement.select();
    });
  }

  stopEditing() {
    this.isEditing = false;
  }

  onLabelChange(newLabel: string) {
    // Update local data for immediate feedback if needed, but rely on input
    // Update state service to persist change to ROOT label
    this.diagramStateService.updateNode(this.id, { label: newLabel });
  }

  getPath(): string {
    const shapeType = this.data?.type || 'rectangle';

    // Paths are defined for a 100x100 coord system, preserveAspectRatio="none" scales it
    switch (shapeType) {
      case 'circle':
        return 'M 50,0 A 50,50 0 1,1 50,100 A 50,50 0 1,1 50,0';

      case 'diamond':
        return 'M 50,0 L 100,50 L 50,100 L 0,50 Z';

      case 'hexagon':
        return 'M 25,0 L 75,0 L 100,50 L 75,100 L 25,100 L 0,50 Z';

      case 'round-rectangle':
        return 'M 20,0 L 80,0 A 20,20 0 0,1 100,20 L 100,80 A 20,20 0 0,1 80,100 L 20,100 A 20,20 0 0,1 0,80 L 0,20 A 20,20 0 0,1 20,0 Z';

      case 'cylinder':
      case 'cylinder-simple':
        return 'M 0,15 L 0,85 Q 50,115 100,85 L 100,15 Q 50,-15 0,15 Z M 0,15 Q 50,45 100,15';

      case 'arrow-rectangle':
        return 'M 0,0 L 70,0 L 100,50 L 70,100 L 0,100 Z';

      case 'plus':
        return 'M 35,0 L 65,0 L 65,35 L 100,35 L 100,65 L 65,65 L 65,100 L 35,100 L 35,65 L 0,65 L 0,35 L 35,35 Z';

      case 'triangle':
        return 'M 50,0 L 100,100 L 0,100 Z';

      case 'parallelogram':
        return 'M 25,0 L 100,0 L 75,100 L 0,100 Z';

      case 'rectangle':
      default:
        return 'M 0,0 L 100,0 L 100,100 L 0,100 Z';
    }
  }

  getHandleStyle(position: 'top' | 'bottom' | 'left' | 'right'): any {
    const shape = this.data?.type || 'rectangle';
    const style: any = {};

    // Center offsets
    const centerVals: any = {
      'top': { top: '-5px', left: '50%', transform: 'translateX(-50%)' },
      'bottom': { bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
      'left': { left: '-5px', top: '50%', transform: 'translateY(-50%)' },
      'right': { right: '-5px', top: '50%', transform: 'translateY(-50%)' }
    };

    // Apply defaults first
    Object.assign(style, centerVals[position]);

    // Custom overrides based on shape
    if (shape === 'triangle') {
      if (position === 'left') {
        style.left = '25%'; // Midpoint of left edge (0,100)-(50,0) is at x=25
        style.top = '50%';
        style.transform = 'translate(-50%, -50%)';
      } else if (position === 'right') {
        style.left = '75%'; // Midpoint of right edge (100,100)-(50,0) is at x=75
        style.top = '50%';
        style.transform = 'translate(-50%, -50%)';
      }
    } else if (shape === 'parallelogram') {
      if (position === 'top') {
        style.left = '62.5%';
      } else if (position === 'bottom') {
        style.left = '37.5%';
      } else if (position === 'left') {
        style.left = '12.5%';
        style.transform = 'translate(-50%, -50%)';
      } else if (position === 'right') {
        style.left = '87.5%';
        style.transform = 'translate(-50%, -50%)';
      }
    } else if (shape === 'arrow-rectangle') {
      if (position === 'top') {
        style.left = '35%'; // Center of top edge (0 to 70)
      } else if (position === 'bottom') {
        style.left = '35%';
      }
    }

    return style;
  }
}
