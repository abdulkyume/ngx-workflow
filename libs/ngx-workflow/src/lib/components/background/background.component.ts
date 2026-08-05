import { Component, input, computed, inject, ChangeDetectionStrategy } from '@angular/core';

import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'ngx-workflow-background',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="ngx-workflow__background-svg" width="100%" height="100%">
      <rect width="100%" height="100%" [attr.fill]="backgroundColor()"></rect>
      @if (backgroundImage()) {
        <image [attr.href]="backgroundImage()" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" [attr.opacity]="0.5"></image>
      }
      @if (!backgroundImage()) {
        <rect width="100%" height="100%" [attr.fill]="'url(#' + variant() + '-pattern)'"></rect>
      }
    
      <defs>
        <pattern [id]="variant() + '-pattern'" [attr.x]="diagramStateService.viewport().x % (gap() * diagramStateService.viewport().zoom)"
          [attr.y]="diagramStateService.viewport().y % (gap() * diagramStateService.viewport().zoom)"
          [attr.width]="gap() * diagramStateService.viewport().zoom"
          [attr.height]="gap() * diagramStateService.viewport().zoom"
          patternUnits="userSpaceOnUse">
    
          @if (variant() === 'dots') {
            <circle
              [attr.cx]="(gap() * diagramStateService.viewport().zoom) / 2"
              [attr.cy]="(gap() * diagramStateService.viewport().zoom) / 2"
              [attr.r]="size() * diagramStateService.viewport().zoom"
              [attr.fill]="color()">
            </circle>
          }
    
          @if (variant() === 'lines') {
            <path
              [attr.d]="'M ' + (gap() * diagramStateService.viewport().zoom) + ' 0 L 0 0 M 0 ' + (gap() * diagramStateService.viewport().zoom) + ' L 0 0'"
              [attr.stroke]="color()"
              [attr.stroke-width]="size() * diagramStateService.viewport().zoom">
            </path>
          }
    
          @if (variant() === 'cross') {
            <path
              [attr.d]="'M ' + (gap() * diagramStateService.viewport().zoom / 4) + ' ' + (gap() * diagramStateService.viewport().zoom / 2) + ' L ' + (gap() * diagramStateService.viewport().zoom * 3/4) + ' ' + (gap() * diagramStateService.viewport().zoom / 2) + ' M ' + (gap() * diagramStateService.viewport().zoom / 2) + ' ' + (gap() * diagramStateService.viewport().zoom / 4) + ' L ' + (gap() * diagramStateService.viewport().zoom / 2) + ' ' + (gap() * diagramStateService.viewport().zoom * 3/4)"
              [attr.stroke]="color()"
              [attr.stroke-width]="size() * diagramStateService.viewport().zoom">
            </path>
          }
        </pattern>
      </defs>
    </svg>
    `,
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent {
  readonly variant = input<'dots' | 'lines' | 'cross'>('dots');
  readonly gap = input<number>(20);
  readonly size = input<number>(1);
  readonly color = input<string>('var(--ngx-workflow-bg-pattern, #81818a)');
  readonly backgroundColor = input<string>('var(--ngx-workflow-bg, transparent)');
  readonly backgroundImage = input<string | null>(null);

  public diagramStateService = inject(DiagramStateService);

  // Computed property for pattern transform based on viewport
  patternTransform = computed(() => {
    const viewport = this.diagramStateService.viewport();
    return `translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`;
  });
}
