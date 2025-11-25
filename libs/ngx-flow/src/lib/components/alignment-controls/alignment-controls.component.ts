import { Component, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
    selector: 'ngx-alignment-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './alignment-controls.component.html',
    styleUrls: ['./alignment-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlignmentControlsComponent {
    // Only show controls if more than 1 node is selected
    showControls = computed(() => this.diagramStateService.selectedNodes().length > 1);
    // Only show distribution controls if more than 2 nodes are selected
    showDistribution = computed(() => this.diagramStateService.selectedNodes().length > 2);

    constructor(private diagramStateService: DiagramStateService) {
        // Debug logging
        effect(() => {
            console.log('Alignment Controls - Selected Nodes:', this.diagramStateService.selectedNodes().length);
            console.log('Alignment Controls - Show Controls:', this.showControls());
        });
    }

    align(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
        this.diagramStateService.alignNodes(alignment);
    }

    distribute(distribution: 'horizontal' | 'vertical'): void {
        this.diagramStateService.distributeNodes(distribution);
    }
}
