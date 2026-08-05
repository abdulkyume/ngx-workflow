import { Component, Input, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'ngx-workflow-grid-overlay',
    standalone: true,
    imports: [],
    template: `
    <svg class="ngx-workflow__grid-overlay" [attr.viewBox]="'0 0 ' + width + ' ' + height">
      <defs>
        <pattern 
          [id]="'grid-pattern-' + gridSize" 
          [attr.width]="gridSize" 
          [attr.height]="gridSize" 
          patternUnits="userSpaceOnUse"
        >
          <circle 
            cx="0.5" 
            cy="0.5" 
            r="1" 
            [attr.fill]="gridColor" 
          />
        </pattern>
      </defs>
      <rect 
        width="100%" 
        height="100%" 
        [attr.fill]="'url(#grid-pattern-' + gridSize + ')'" 
      />
    </svg>
  `,
    styles: [`
    .ngx-workflow__grid-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 0;
      opacity: 0.5;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridOverlayComponent {
    @Input() gridSize: number = 20;
    @Input() gridColor: string = '#cbd5e1';
    @Input() width: number = 5000;
    @Input() height: number = 5000;
}
