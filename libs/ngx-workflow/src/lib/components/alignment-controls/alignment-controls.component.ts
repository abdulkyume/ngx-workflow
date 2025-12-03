import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
    selector: 'ngx-workflow-alignment-controls',
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

    constructor(private diagramStateService: DiagramStateService) { }

    align(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
        this.diagramStateService.alignNodes(alignment);
    }

    distribute(distribution: 'horizontal' | 'vertical'): void {
        this.diagramStateService.distributeNodes(distribution);
    }

    autoLayout(direction: 'TB' | 'LR'): void {
        this.diagramStateService.applyLayout(direction);
    }
}
