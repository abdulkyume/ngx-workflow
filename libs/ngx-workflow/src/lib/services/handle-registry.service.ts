import { Injectable, signal, WritableSignal } from '@angular/core';
import { Edge, Node } from '../models';

export type ConnectableLimit = boolean | number | ((node: Node, connectedEdges: Edge[]) => boolean);

export interface HandleConfig {
    nodeId: string;
    handleId: string;
    type: 'source' | 'target';
    dataType?: string;
    isConnectable?: ConnectableLimit;
    isValidConnection?: (connection: {
        source: string;
        sourceHandle: string;
        target: string;
        targetHandle: string;
    }) => boolean;
}

@Injectable({
    providedIn: 'root'
})
export class HandleRegistryService {
    private handles: Map<string, HandleConfig> = new Map();

    // Helper to generate a unique key for the handle
    private getHandleKey(nodeId: string, handleId: string, type: 'source' | 'target'): string {
        return `${nodeId}-${handleId}-${type}`;
    }

    registerHandle(nodeId: string, handleId: string, type: 'source' | 'target', config: Partial<HandleConfig>): void {
        const key = this.getHandleKey(nodeId, handleId, type);
        this.handles.set(key, { nodeId, handleId, type, ...config });
    }

    unregisterHandle(nodeId: string, handleId: string, type: 'source' | 'target'): void {
        const key = this.getHandleKey(nodeId, handleId, type);
        this.handles.delete(key);
    }

    canConnect(nodeId: string, handleId: string, type: 'source' | 'target', node: Node, connectedEdges: Edge[]): boolean {
        const key = this.getHandleKey(nodeId, handleId, type);
        const config = this.handles.get(key);

        if (!config) {
            return true; // Default to allow connection if not registered (backward compatibility)
        }

        const isConnectable = config.isConnectable;

        if (isConnectable === undefined || isConnectable === null) {
            return true; // Default to true
        }

        if (typeof isConnectable === 'boolean') {
            return isConnectable;
        }

        if (typeof isConnectable === 'number') {
            return connectedEdges.length < isConnectable;
        }

        if (typeof isConnectable === 'function') {
            return isConnectable(node, connectedEdges);
        }

        return true;
    }

    canConnectTypes(sourceNodeId: string, sourceHandleId?: string, targetNodeId?: string, targetHandleId?: string): boolean {
        if (!sourceHandleId || !targetNodeId || !targetHandleId) return true;

        const sourceConfig = this.getHandle(sourceNodeId, sourceHandleId, 'source');
        const targetConfig = this.getHandle(targetNodeId, targetHandleId, 'target');

        if (!sourceConfig || !targetConfig) return true;
        if (!sourceConfig.dataType || !targetConfig.dataType) return true;
        if (sourceConfig.dataType === 'any' || targetConfig.dataType === 'any') return true;

        return sourceConfig.dataType === targetConfig.dataType;
    }

    getHandle(nodeId: string, handleId: string, type: 'source' | 'target'): HandleConfig | undefined {
        const key = this.getHandleKey(nodeId, handleId, type);
        return this.handles.get(key);
    }
}
