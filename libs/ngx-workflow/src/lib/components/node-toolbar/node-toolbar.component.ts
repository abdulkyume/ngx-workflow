import {
    Component,
    ChangeDetectionStrategy,
    Input,
    computed,
    signal,
    effect,
    ElementRef,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Node } from '../../models';

export type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right';
export type ToolbarAlign = 'start' | 'center' | 'end';

@Component({
    selector: 'ngx-workflow-node-toolbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './node-toolbar.component.html',
    styleUrls: ['./node-toolbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeToolbarComponent implements AfterViewInit {
    @Input() nodeId!: string;
    @Input() position: ToolbarPosition = 'top';
    @Input() offset: number = 10;
    @Input() visible?: boolean; // undefined = auto (show when selected)
    @Input() align: ToolbarAlign = 'center';

    @ViewChild('toolbarContent', { static: false }) toolbarContent?: ElementRef<HTMLDivElement>;

    // Track toolbar dimensions for positioning
    private toolbarDimensions = signal<{ width: number; height: number }>({ width: 0, height: 0 });

    constructor(
        public diagramStateService: DiagramStateService,
        private elementRef: ElementRef<HTMLElement>
    ) {
        // Update toolbar dimensions when content changes
        effect(() => {
            if (this.toolbarContent) {
                const rect = this.toolbarContent.nativeElement.getBoundingClientRect();
                this.toolbarDimensions.set({ width: rect.width, height: rect.height });
            }
        });
    }

    // Computed signal to determine if toolbar should be visible
    shouldShow = computed(() => {
        // If visibility is explicitly set, use that
        if (this.visible !== undefined) {
            return this.visible;
        }

        // Otherwise, show when node is selected
        const selectedNodeIds = this.diagramStateService.selectedNodes().map(n => n.id);
        return selectedNodeIds.includes(this.nodeId);
    });

    // Get the node this toolbar belongs to
    private node = computed(() => {
        return this.diagramStateService.nodes().find(n => n.id === this.nodeId);
    });

    // Calculate toolbar position in screen coordinates
    toolbarPosition = computed(() => {
        const node = this.node();
        if (!node) {
            return { x: 0, y: 0 };
        }

        const viewport = this.diagramStateService.viewport();
        const containerDimensions = this.diagramStateService.containerDimensions();
        const toolbarDims = this.toolbarDimensions();

        // Get SVG element from the diagram state service
        const svgEl = this.diagramStateService.el?.nativeElement;
        if (!svgEl) {
            return { x: 0, y: 0 };
        }

        const svgRect = svgEl.getBoundingClientRect();

        // Calculate node position in screen space (use absolute position for nested nodes)
        const nodes = this.diagramStateService.nodes();
        const absPos = this.diagramStateService.getAbsolutePosition(node, nodes);

        const nodeScreenX = svgRect.left + absPos.x * viewport.zoom + viewport.x;
        const nodeScreenY = svgRect.top + absPos.y * viewport.zoom + viewport.y;

        // Calculate node dimensions in screen space
        const nodeWidth = (node.width || 170) * viewport.zoom;
        const nodeHeight = (node.height || 60) * viewport.zoom;

        let x = 0;
        let y = 0;

        // Position based on toolbar position setting
        switch (this.position) {
            case 'top':
                y = nodeScreenY - this.offset - toolbarDims.height;
                // Align horizontally
                if (this.align === 'start') {
                    x = nodeScreenX;
                } else if (this.align === 'end') {
                    x = nodeScreenX + nodeWidth - toolbarDims.width;
                } else {
                    // center
                    x = nodeScreenX + nodeWidth / 2 - toolbarDims.width / 2;
                }
                break;

            case 'bottom':
                y = nodeScreenY + nodeHeight + this.offset;
                // Align horizontally
                if (this.align === 'start') {
                    x = nodeScreenX;
                } else if (this.align === 'end') {
                    x = nodeScreenX + nodeWidth - toolbarDims.width;
                } else {
                    // center
                    x = nodeScreenX + nodeWidth / 2 - toolbarDims.width / 2;
                }
                break;

            case 'left':
                x = nodeScreenX - this.offset - toolbarDims.width;
                // Align vertically
                if (this.align === 'start') {
                    y = nodeScreenY;
                } else if (this.align === 'end') {
                    y = nodeScreenY + nodeHeight - toolbarDims.height;
                } else {
                    // center
                    y = nodeScreenY + nodeHeight / 2 - toolbarDims.height / 2;
                }
                break;

            case 'right':
                x = nodeScreenX + nodeWidth + this.offset;
                // Align vertically
                if (this.align === 'start') {
                    y = nodeScreenY;
                } else if (this.align === 'end') {
                    y = nodeScreenY + nodeHeight - toolbarDims.height;
                } else {
                    // center
                    y = nodeScreenY + nodeHeight / 2 - toolbarDims.height / 2;
                }
                break;
        }

        return { x, y };
    });

    // Update toolbar dimensions after view init
    ngAfterViewInit(): void {
        setTimeout(() => {
            if (this.toolbarContent) {
                const rect = this.toolbarContent.nativeElement.getBoundingClientRect();
                this.toolbarDimensions.set({ width: rect.width, height: rect.height });
            }
        });
    }
}
