import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node } from '../../models';

@Component({
    selector: 'ngx-workflow-properties-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './properties-sidebar.component.html',
    styleUrls: ['./properties-sidebar.component.scss']
})
export class PropertiesSidebarComponent {
    @Input() node: Node | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() change = new EventEmitter<Partial<Node>>();

    updateLabel(label: string) {
        if (!this.node) return;
        this.change.emit({ label });
    }

    updateWidth(width: number) {
        this.change.emit({ width });
    }

    updateHeight(height: number) {
        this.change.emit({ height });
    }

    updateX(x: number) {
        if (!this.node) return;
        this.change.emit({ position: { x, y: this.node.position.y } });
    }

    updateY(y: number) {
        if (!this.node) return;
        this.change.emit({ position: { x: this.node.position.x, y } });
    }

    updateBackgroundColor(color: string) {
        if (!this.node) return;
        const currentStyle = this.node.style || {};
        this.change.emit({ style: { ...currentStyle, backgroundColor: color } });
    }

    updateLabelColor(color: string) {
        if (!this.node) return;
        const currentStyle = this.node.style || {};
        this.change.emit({ style: { ...currentStyle, color: color } });
    }
}
