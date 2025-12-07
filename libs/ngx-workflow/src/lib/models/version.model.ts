import { DiagramState } from './diagram.model';

export interface VersionSnapshot {
    id: string;
    timestamp: number;
    state: DiagramState;
    metadata: {
        nodeCount: number;
        edgeCount: number;
        description?: string;
    };
}
