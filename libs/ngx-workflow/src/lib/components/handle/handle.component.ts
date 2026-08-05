import { Component, input, inject, effect, OnDestroy } from '@angular/core';
import { HandleRegistryService, ConnectableLimit } from '../../services/handle-registry.service';

@Component({
    selector: 'g[ngx-workflow-handle], ngx-workflow-handle',
    template: '<ng-content></ng-content>',
    standalone: true
})
export class HandleComponent implements OnDestroy {
    private handleRegistry = inject(HandleRegistryService);

    readonly nodeId = input.required<string>();
    readonly handleId = input.required<string>();
    readonly type = input.required<'source' | 'target'>();
    readonly dataType = input<string | undefined>();
    readonly isConnectable = input<ConnectableLimit | undefined>();
    readonly isValidConnection = input<((connection: {
        source: string;
        sourceHandle: string;
        target: string;
        targetHandle: string;
    }) => boolean) | undefined>();

    constructor() {
        effect(() => {
            const nodeId = this.nodeId();
            const handleId = this.handleId();
            const type = this.type();
            if (nodeId && handleId && type) {
                this.handleRegistry.registerHandle(nodeId, handleId, type, {
                    dataType: this.dataType(),
                    isConnectable: this.isConnectable(),
                    isValidConnection: this.isValidConnection()
                });
            }
        });
    }

    ngOnDestroy(): void {
        const nodeId = this.nodeId();
        const handleId = this.handleId();
        const type = this.type();
        if (nodeId && handleId && type) {
            this.handleRegistry.unregisterHandle(nodeId, handleId, type);
        }
    }
}
