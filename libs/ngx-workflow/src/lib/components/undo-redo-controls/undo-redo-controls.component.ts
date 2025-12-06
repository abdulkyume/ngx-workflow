import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
    selector: 'ngx-workflow-undo-redo-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './undo-redo-controls.component.html',
    styleUrls: ['./undo-redo-controls.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class UndoRedoControlsComponent {
    private diagramStateService = inject(DiagramStateService);

    canUndo = this.diagramStateService.undoRedoService.canUndo;
    canRedo = this.diagramStateService.undoRedoService.canRedo;

    onUndo(): void {
        this.diagramStateService.undo();
    }

    onRedo(): void {
        this.diagramStateService.redo();
    }
}
