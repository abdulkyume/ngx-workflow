import { Component, ChangeDetectionStrategy, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuService } from '../../services/context-menu.service';

@Component({
    selector: 'ngx-workflow-context-menu',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-menu.component.html',
    styleUrls: ['./context-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContextMenuComponent {
    contextMenuService = inject(ContextMenuService);
    state = this.contextMenuService.state;

    constructor(private elementRef: ElementRef) { }

    @HostListener('document:click', ['$event'])
    @HostListener('document:contextmenu', ['$event'])
    onDocumentClick(event: MouseEvent) {
        // If the click is outside the menu, close it
        if (this.state().isOpen && !this.elementRef.nativeElement.contains(event.target)) {
            // Don't close if we just opened it (prevent immediate close on the triggering click)
            // But actually, the triggering click is usually handled by the diagram component stopping propagation
            // So this should be fine for subsequent clicks.
            this.contextMenuService.close();
        }
    }

    onActionClick(event: MouseEvent, action: () => void) {
        event.stopPropagation(); // Prevent closing immediately if we want to handle it here
        action();
        this.contextMenuService.close();
    }
}
