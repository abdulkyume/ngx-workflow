import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LayoutAlgorithm = 'auto' | 'force' | 'hierarchical' | 'circular';

@Component({
    selector: 'ngx-workflow-layout-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './layout-controls.component.html',
    styleUrls: ['./layout-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutControlsComponent {
    @Output() applyLayout = new EventEmitter<LayoutAlgorithm>();

    onApplyLayout(algorithm: LayoutAlgorithm) {
        this.applyLayout.emit(algorithm);
    }
}
