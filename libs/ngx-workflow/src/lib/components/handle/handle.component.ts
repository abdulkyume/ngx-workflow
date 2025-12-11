import { Component, Input, OnDestroy, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { HandleRegistryService, ConnectableLimit } from '../../services/handle-registry.service';

@Component({
    selector: 'g[ngx-workflow-handle]',
    template: '<ng-content></ng-content>',
    standalone: true
})
export class HandleComponent implements OnInit, OnDestroy, OnChanges {
    @Input() nodeId!: string;
    @Input() handleId!: string;
    @Input() type!: 'source' | 'target';
    @Input() isConnectable: ConnectableLimit | undefined;

    constructor(private handleRegistry: HandleRegistryService) { }

    ngOnInit(): void {
        this.register();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isConnectable'] && !changes['isConnectable'].firstChange) {
            this.register(); // Re-register on change
        }
    }

    ngOnDestroy(): void {
        if (this.nodeId && this.handleId && this.type) {
            this.handleRegistry.unregisterHandle(this.nodeId, this.handleId, this.type);
        }
    }

    private register(): void {
        if (this.nodeId && this.handleId && this.type) {
            this.handleRegistry.registerHandle(this.nodeId, this.handleId, this.type, {
                isConnectable: this.isConnectable
            });
        }
    }
}
