import { Component, ChangeDetectionStrategy, computed, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

export type LayoutAlgorithm = 'auto' | 'force' | 'hierarchical' | 'circular';

@Component({
    selector: 'ngx-workflow-layout-alignment-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './layout-alignment-controls.component.html',
    styleUrls: ['./layout-alignment-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutAlignmentControlsComponent {
    private diagramStateService = inject(DiagramStateService);

    @Output() applyLayout = new EventEmitter<LayoutAlgorithm>();

    // Only show alignment controls if more than 1 node is selected
    showAlignment = computed(() => this.diagramStateService.selectedNodes().length > 1);
    // Only show distribution controls if more than 2 nodes are selected
    showDistribution = computed(() => this.diagramStateService.selectedNodes().length > 2);

    onApplyLayout(algorithm: LayoutAlgorithm) {
        this.applyLayout.emit(algorithm);
    }

    align(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
        this.diagramStateService.alignNodes(alignment);
    }

    distribute(distribution: 'horizontal' | 'vertical'): void {
        this.diagramStateService.distributeNodes(distribution);
    }
}
