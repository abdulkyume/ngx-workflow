import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PanelPosition =
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

@Component({
    selector: 'ngx-workflow-panel',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './panel.component.html',
    styleUrls: ['./panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponent {
    /**
     * Position of the panel in the diagram viewport.
     * @default 'top-left'
     */
    @Input() position: PanelPosition = 'top-left';

    /**
     * Optional custom CSS class to apply to the panel.
     */
    @Input() className?: string;
}
