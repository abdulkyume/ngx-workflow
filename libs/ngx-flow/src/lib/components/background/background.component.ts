import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
  selector: 'ngx-background',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent {
  @Input() variant: 'dots' | 'lines' | 'cross' = 'dots';
  @Input() gap: number = 20;
  @Input() size: number = 1;
  @Input() color: string = '#81818a';
  @Input() backgroundColor: string = '#f0f0f0';

  private diagramStateService = inject(DiagramStateService);

  // Computed property for pattern transform based on viewport
  patternTransform = computed(() => {
    const viewport = this.diagramStateService.viewport();
    return `translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`;
  });
}
