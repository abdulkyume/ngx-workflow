import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';


@Component({
    selector: 'ngx-workflow-export-controls',
    standalone: true,
    imports: [],
    templateUrl: './export-controls.component.html',
    styleUrls: ['./export-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportControlsComponent {
    @Output() exportJSON = new EventEmitter<void>();
    @Output() importJSON = new EventEmitter<void>();

    onExportJSON(): void {
        this.exportJSON.emit();
    }

    onImportJSON(): void {
        this.importJSON.emit();
    }
}
