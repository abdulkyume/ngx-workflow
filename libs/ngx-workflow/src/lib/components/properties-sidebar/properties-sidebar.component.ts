import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Node, Edge } from '../../models';

@Component({
    selector: 'ngx-workflow-properties-sidebar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './properties-sidebar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./properties-sidebar.component.scss']
})
export class PropertiesSidebarComponent {
    @Input() node: Node | null = null;
    @Input() edge: Edge | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() change = new EventEmitter<Partial<Node>>();
    @Output() edgeChange = new EventEmitter<Partial<Edge>>();

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

    shapes = [
        'default', 'rectangle', 'circle', 'diamond', 'hexagon', 'round-rectangle',
        'cylinder', 'cylinder-simple', 'arrow-rectangle', 'plus', 'triangle', 'parallelogram'
    ];

    updateShapeType(type: string) {
        if (!this.node) return;
        const currentData = this.node.data || {};

        if (type === 'default') {
            this.change.emit({
                type: 'default',
                data: { ...currentData } // Keep data, remove specific shape type from data if needed, or just let it be ignored
            });
        } else {
            this.change.emit({
                type: 'shape',
                data: { ...currentData, type }
            });
        }
    }

    updatePorts(ports: number) {
        if (!this.node) return;
        this.change.emit({ ports: +ports });
    }

    /** Active port ids for the current node.ports setting */
    getActivePorts(): Array<'top' | 'right' | 'bottom' | 'left'> {
        const ports = this.node?.ports ?? 4;
        if (ports === 0) return [];
        if (ports === 1) return ['top'];
        if (ports === 2) return ['top', 'bottom'];
        if (ports === 3) return ['left', 'right'];
        return ['top', 'right', 'bottom', 'left'];
    }

    getPortMaxConnections(handleId: string): number | null {
        const value = this.node?.handleConfig?.[handleId]?.maxConnections;
        return value === undefined ? null : value;
    }

    updateMaxConnectionsPerPort(value: number | string | null): void {
        if (!this.node) return;
        if (value === '' || value === null || value === undefined) {
            this.change.emit({ maxConnectionsPerPort: undefined });
            return;
        }
        const n = Number(value);
        if (!Number.isFinite(n) || n < 1) return;
        this.change.emit({ maxConnectionsPerPort: Math.floor(n) });
    }

    updatePortMaxConnections(handleId: string, value: number | string | null): void {
        if (!this.node) return;
        const current = { ...(this.node.handleConfig || {}) };
        const existing = { ...(current[handleId] || {}) };

        if (value === '' || value === null || value === undefined) {
            delete existing.maxConnections;
            if (Object.keys(existing).length === 0) {
                delete current[handleId];
            } else {
                current[handleId] = existing;
            }
        } else {
            const n = Number(value);
            if (!Number.isFinite(n) || n < 1) return;
            current[handleId] = { ...existing, maxConnections: Math.floor(n) };
        }

        this.change.emit({ handleConfig: current });
    }

    // Edge Updates
    updateEdgeLabel(label: string) {
        if (!this.edge) return;
        this.edgeChange.emit({ label });
    }

    updateEdgeType(type: any) {
        if (!this.edge) return;
        this.edgeChange.emit({ type });
    }

    updateEdgeAnimated(animated: boolean) {
        if (!this.edge) return;
        this.edgeChange.emit({ animated });
    }

    updateEdgeColor(color: string) {
        if (!this.edge) return;
        const currentStyle = this.edge.style || {};
        this.edgeChange.emit({ style: { ...currentStyle, stroke: color } });
    }

    updateEdgeWidth(width: number) {
        if (!this.edge) return;
        const currentStyle = this.edge.style || {};
        this.edgeChange.emit({ style: { ...currentStyle, strokeWidth: width.toString() } });
    }

    updateEdgeLabelColor(color: string) {
        if (!this.edge) return;
        const currentLabelStyle = this.edge.labelStyle || {};
        this.edgeChange.emit({
            labelStyle: { ...currentLabelStyle, fill: color, color: color }
        });
    }

    updateEdgeAnimationDuration(duration: string) {
        if (!this.edge) return;
        this.edgeChange.emit({ animationDuration: duration });
    }

    updateEdgeAnimationColor(color: string) {
        if (!this.edge) return;
        const currentAnimStyle = this.edge.animationStyle || {};
        this.edgeChange.emit({
            animationStyle: { ...currentAnimStyle, fill: color }
        });
    }

    updateEdgeAnimationType(type: any) {
        if (!this.edge) return;
        this.edgeChange.emit({ animationType: type });
    }

    updateEdgeStrokeStyle(style: string) {
        if (!this.edge) return;
        const currentStyle = this.edge.style || {};
        this.edgeChange.emit({
            style: { ...currentStyle, strokeDasharray: style }
        });
    }

    updateEdgeMarkerStart(marker: string) {
        if (!this.edge) return;
        this.edgeChange.emit({ markerStart: marker });
    }

    updateEdgeMarkerEnd(marker: string) {
        if (!this.edge) return;
        this.edgeChange.emit({ markerEnd: marker });
    }
}
