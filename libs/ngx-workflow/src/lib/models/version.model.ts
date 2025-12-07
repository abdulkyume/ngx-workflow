import { DiagramState } from './diagram.model';

export interface VersionSnapshot {
    id: string;
    timestamp: number;
    state: DiagramState;
    description?: string;
    nodeCount: number;
    edgeCount: number;
}
