import { Component, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ngx-workflow-export-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './export-controls.component.html',
    styleUrls: ['./export-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportControlsComponent {
    @Output() exportPNG = new EventEmitter<void>();
    @Output() exportSVG = new EventEmitter<void>();
    @Output() copyClipboard = new EventEmitter<void>();

    onExportPNG(): void {
        this.exportPNG.emit();
    }

    onExportSVG(): void {
        this.exportSVG.emit();
    }

    onCopyClipboard(): void {
        this.copyClipboard.emit();
    }
}
