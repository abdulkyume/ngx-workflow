import { Injectable, signal } from '@angular/core';

export interface ContextMenuItem {
    label: string;
    action: () => void;
    shortcut?: string;
    icon?: string;
    disabled?: boolean;
    danger?: boolean;
}

export interface ContextMenuState {
    isOpen: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
    target?: any; // The object (Node/Edge) the menu was triggered on
}

@Injectable({
    providedIn: 'root'
})
export class ContextMenuService {
    // Signal to hold the current state of the context menu
    state = signal<ContextMenuState>({
        isOpen: false,
        position: { x: 0, y: 0 },
        items: []
    });

    open(position: { x: number; y: number }, items: ContextMenuItem[], target?: any) {
        this.state.set({
            isOpen: true,
            position,
            items,
            target
        });
    }

    close() {
        this.state.update(s => ({ ...s, isOpen: false }));
    }

    toggle(position: { x: number; y: number }, items: ContextMenuItem[], target?: any) {
        if (this.state().isOpen) {
            this.close();
        } else {
            this.open(position, items, target);
        }
    }
}
