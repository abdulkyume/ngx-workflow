import { Injectable } from '@angular/core';
import { Edge } from '../models/edge.model';
import { Node, XYPosition } from '../models/node.model';

@Injectable({
    providedIn: 'root'
})
export class AutoLayoutService {

    calculateLayout(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB'): Node[] {
        if (nodes.length === 0) return [];

        const graph = this.buildGraph(nodes, edges);
        const ranks = this.calculateRanks(graph, nodes);
        const layout = this.assignPositions(ranks, nodes, direction);

        return layout;
    }

    private buildGraph(nodes: Node[], edges: Edge[]): Map<string, string[]> {
        const adj = new Map<string, string[]>();
        nodes.forEach(n => adj.set(n.id, []));
        edges.forEach(e => {
            if (adj.has(e.source) && adj.has(e.target)) {
                adj.get(e.source)?.push(e.target);
            }
        });
        return adj;
    }

    private calculateRanks(adj: Map<string, string[]>, nodes: Node[]): Map<number, string[]> {
        const ranks = new Map<string, number>();
        const visited = new Set<string>();
        const nodeIds = nodes.map(n => n.id);

        // Initialize all nodes with rank 0
        nodeIds.forEach(id => ranks.set(id, 0));

        // Simple longest path algorithm for DAGs
        // For cycles, this might need safeguards, but let's assume DAG for now or limit depth

        const calculateNodeRank = (id: string, currentRank: number, path: Set<string>) => {
            if (path.has(id)) return; // Cycle detected

            const existingRank = ranks.get(id) || 0;
            if (currentRank > existingRank) {
                ranks.set(id, currentRank);
            }

            path.add(id);
            const neighbors = adj.get(id) || [];
            neighbors.forEach(neighbor => {
                calculateNodeRank(neighbor, currentRank + 1, new Set(path));
            });
        };

        // Find roots (nodes with no incoming edges)
        // Actually, we can just iterate all nodes. If a node is a child, its rank will be updated by its parent.
        // But to be efficient, finding roots helps.
        // Let's just iterate all nodes as potential starts.
        nodeIds.forEach(id => {
            calculateNodeRank(id, 0, new Set());
        });

        // Group by rank
        const rankGroups = new Map<number, string[]>();
        ranks.forEach((rank, id) => {
            if (!rankGroups.has(rank)) {
                rankGroups.set(rank, []);
            }
            rankGroups.get(rank)?.push(id);
        });

        return rankGroups;
    }

    private assignPositions(rankGroups: Map<number, string[]>, nodes: Node[], direction: 'TB' | 'LR'): Node[] {
        const newNodes: Node[] = [];
        const nodeMap = new Map(nodes.map(n => [n.id, n]));

        const nodeWidth = 180; // Approx width + gap
        const nodeHeight = 80; // Approx height + gap
        const levelSeparation = 100;
        const siblingSeparation = 50;

        const maxRank = Math.max(...Array.from(rankGroups.keys()));

        for (let r = 0; r <= maxRank; r++) {
            const nodeIds = rankGroups.get(r) || [];
            // Sort nodeIds to minimize crossing? For now, just keep order or sort by ID
            nodeIds.sort();

            let currentPos = 0;

            // Center the row/column?
            // Let's just start from 0 for now.

            nodeIds.forEach((id, index) => {
                const node = nodeMap.get(id);
                if (!node) return;

                let x = 0;
                let y = 0;

                if (direction === 'TB') {
                    x = index * (node.width || 150) + index * siblingSeparation;
                    y = r * (nodeHeight + levelSeparation);
                } else {
                    x = r * (nodeWidth + levelSeparation);
                    y = index * (node.height || 60) + index * siblingSeparation;
                }

                newNodes.push({
                    ...node,
                    position: { x, y }
                });
            });
        }

        // Add nodes that might have been missed (disconnected?) 
        // The rank calculation initializes all nodes to 0, so they should be in rank 0 if not connected.
        // But let's verify if any nodes are missing from newNodes

        return newNodes;
    }
}
