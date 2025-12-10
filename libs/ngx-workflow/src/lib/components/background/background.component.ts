import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'ngx-workflow-background',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg class="ngx-workflow__background-svg" width="100%" height="100%">
      <rect width="100%" height="100%" [attr.fill]="backgroundColor"></rect>
      <image *ngIf="backgroundImage" [attr.href]="backgroundImage" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" [attr.opacity]="0.5"></image>
      <rect *ngIf="!backgroundImage" width="100%" height="100%" [attr.fill]="'url(#' + variant + '-pattern)'"></rect>
      
      <defs>
        <pattern [id]="variant + '-pattern'" [attr.x]="diagramStateService.viewport().x % (gap * diagramStateService.viewport().zoom)" 
                 [attr.y]="diagramStateService.viewport().y % (gap * diagramStateService.viewport().zoom)"
                 [attr.width]="gap * diagramStateService.viewport().zoom" 
                 [attr.height]="gap * diagramStateService.viewport().zoom" 
                 patternUnits="userSpaceOnUse">
          
          <circle *ngIf="variant === 'dots'" 
                  [attr.cx]="(gap * diagramStateService.viewport().zoom) / 2" 
                  [attr.cy]="(gap * diagramStateService.viewport().zoom) / 2" 
                  [attr.r]="size * diagramStateService.viewport().zoom" 
                  [attr.fill]="color">
          </circle>

          <path *ngIf="variant === 'lines'" 
                [attr.d]="'M ' + (gap * diagramStateService.viewport().zoom) + ' 0 L 0 0 M 0 ' + (gap * diagramStateService.viewport().zoom) + ' L 0 0'" 
                [attr.stroke]="color" 
                [attr.stroke-width]="size * diagramStateService.viewport().zoom">
          </path>
          
           <path *ngIf="variant === 'cross'" 
                [attr.d]="'M ' + (gap * diagramStateService.viewport().zoom / 4) + ' ' + (gap * diagramStateService.viewport().zoom / 2) + ' L ' + (gap * diagramStateService.viewport().zoom * 3/4) + ' ' + (gap * diagramStateService.viewport().zoom / 2) + ' M ' + (gap * diagramStateService.viewport().zoom / 2) + ' ' + (gap * diagramStateService.viewport().zoom / 4) + ' L ' + (gap * diagramStateService.viewport().zoom / 2) + ' ' + (gap * diagramStateService.viewport().zoom * 3/4)" 
                [attr.stroke]="color" 
                [attr.stroke-width]="size * diagramStateService.viewport().zoom">
          </path>
        </pattern>
      </defs>
    </svg>
  `,
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent {
  @Input() variant: 'dots' | 'lines' | 'cross' = 'dots';
  @Input() gap: number = 20;
  @Input() size: number = 1;
  @Input() color: string = '#81818a';
  @Input() backgroundColor: string = '#f0f0f0';
  @Input() backgroundImage: string | null = null;

  public diagramStateService = inject(DiagramStateService);

  // Computed property for pattern transform based on viewport
  patternTransform = computed(() => {
    const viewport = this.diagramStateService.viewport();
    return `translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`;
  });
}
