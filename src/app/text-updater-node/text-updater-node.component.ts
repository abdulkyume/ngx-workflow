import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleComponent } from '../../../libs/ngx-workflow/src/lib/components/handle/handle.component';
// Ideally, use library import: import { HandleComponent } from 'ngx-workflow';
// But since I'm in same repo, I'll try to import relatively or via path mapping.
// Let's assume 'ngx-workflow' is mapped. If not, I'll use relative.
// Using relative path for robustness in this context.

@Component({
  selector: 'app-text-updater-node',
  standalone: true,
  imports: [CommonModule], // HandleComponent needs to be imported if I use it. 
  // Wait, I can't easily import from libraries in App unless they are exported.
  // I need to export HandleComponent from public-api.ts first.
  template: `
    <div class="text-updater-node">
      <!-- 4-sided Drag Frame -->
      <div class="drag-handle drag-top"></div>
      <div class="drag-handle drag-bottom"></div>
      <div class="drag-handle drag-left"></div>
      <div class="drag-handle drag-right"></div>
      
      <div class="handle-container" [class.easy-connect]="easyConnect">
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
      </div>
      
      <div class="content">
        <label>Text:</label>
        <input type="text" [value]="data.label" (input)="onInput($event)" class="nodrag" />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .text-updater-node {
      height: 100%;
      border: 1px solid var(--ngx-workflow-border, #e2e8f0);
      border-radius: 4px; /* Standard rect radius */
      background: var(--ngx-workflow-surface, #ffffff);
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center; /* Center content */
      position: relative;
      box-sizing: border-box;
      /* Match standard node shadow */
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
    }
    .drag-handle {
      position: absolute;
      background: transparent; /* Same color as node (transparent shows node bg) */
      cursor: grab;
      z-index: 5; /* Above background, below content/handles if needed */
    }
    .drag-handle:active {
      cursor: grabbing;
      background: rgba(0,0,0,0.05); /* Subtle visual feedback on active drag */
    }
    /* Frame positioning */
    .drag-top { top: 0; left: 0; right: 0; height: 20px; border-top-left-radius: 3px; border-top-right-radius: 3px; }
    .drag-bottom { bottom: 0; left: 0; right: 0; height: 20px; border-bottom-left-radius: 3px; border-bottom-right-radius: 3px; }
    .drag-left { top: 20px; bottom: 20px; left: 0; width: 20px; }
    .drag-right { top: 20px; bottom: 20px; right: 0; width: 20px; }

    .content {
      display: flex;
      flex-direction: column;
      padding: 0 10px 10px 10px;
    }
    input { 
      border: 1px solid var(--ngx-workflow-border, #ccc); 
      border-radius: 4px; 
      padding: 4px; 
      margin-top: 5px;
      font-size: 12px;
    }
    /* Custom handle styles to mimic standard SVG handles */
    .custom-handle {
      width: 12px; /* Standard size */
      height: 12px;
      background: var(--ngx-workflow-surface, #ffffff);
      border: 1.5px solid var(--ngx-workflow-text-secondary, #64748b);
      border-radius: 50%;
      position: absolute;
      cursor: crosshair;
      transition: all 0.2s ease;
      z-index: 10;
    }
    .custom-handle:hover {
      background: var(--ngx-workflow-primary, #3b82f6);
      border-color: var(--ngx-workflow-primary, #3b82f6);
      transform: scale(1.2) !important; /* Override positioning transform for scale only? No, need to be careful */
    }

    /* Positioning - need to ensure transform doesn't conflict with hover scale if possible, 
       or use margins instead of transform for centering to allow scale on hover */
    .top { top: -6px; left: 50%; margin-left: -6px; }
    .bottom { bottom: -6px; left: 50%; margin-left: -6px; }
    .left { left: -6px; top: 50%; margin-top: -6px; }
    .right { right: -6px; top: 50%; margin-top: -6px; }

    /* Easy Connect Styles: Hide handles but keep them DOM-present for logic */
    .handle-container.easy-connect .custom-handle {
      opacity: 0;
      /* Ensure they don't block other clicks if needed, 
         but we need them to be findable by querySelector.
         Pointer events? logic finds them by DOM query, not pointer event target on the handle itself (in the body-drag case).
         But if user clicks EXACTLY on the invisible handle, standard behavior might trigger.
         That's probably fine/desired.
      */
    }
  `]
})
export class TextUpdaterNodeComponent {
  @Input() id!: string;
  @Input() data: any;
  @Input() selected?: boolean;
  @Input() type?: string;
  @Input() pos?: { x: number, y: number };
  @Input() easyConnect?: boolean;

  onInput(event: any) {
    this.data = { ...this.data, label: event.target.value };
  }
}
