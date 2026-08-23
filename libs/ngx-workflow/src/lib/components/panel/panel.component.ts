import { Component, ChangeDetectionStrategy, input } from '@angular/core';

export type PanelPosition =
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

@Component({
    selector: 'ngx-workflow-panel',
    standalone: true,
    imports: [],
    templateUrl: './panel.component.html',
    styleUrls: ['./panel.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanelComponent {
    /**
     * Position of the panel in the diagram viewport.
     * @default 'top-left'
     */
    readonly position = input<PanelPosition>('top-left');

    /**
     * Optional custom CSS class to apply to the panel.
     */
    readonly className = input<string | undefined>(undefined);

    /**
     * Optional custom inline styles (e.g. { width: '320px', height: 'auto', background: '#1e293b', color: '#fff' } or style string).
     */
    readonly style = input<string | Record<string, string | number> | undefined>(undefined);
}
