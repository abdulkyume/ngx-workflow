import { Injectable } from '@angular/core';
import { Node, Edge, XYPosition } from '../models';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled';

export interface ForceDirectedOptions {
  iterations?: number;      // Default: 100
  springLength?: number;    // Default: 100
  springStrength?: number;  // Default: 0.1
  repulsion?: number;       // Default: 1000
  damping?: number;         // Default: 0.9
}

export interface HierarchicalOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL';  // Default: 'TB'
  levelSeparation?: number;                // Default: 100
  nodeSeparation?: number;                 // Default: 50
}

export interface CircularOptions {
  radius?: number;          // Default: auto-calculate
  startAngle?: number;      // Default: 0
  sortBy?: 'id' | 'type';   // Default: 'id'
}

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  private elk: any;

  constructor() {
    this.elk = new ELK();
  }

  // --- ELK Layout ---
  async applyElkLayout(nodes: Node[], edges: Edge[], options?: any): Promise<Node[]> {
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '75',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOELLER',
        ...options
      },
      children: nodes.map(node => ({
        id: node.id,
        width: node.width || 170,
        height: node.height || 60,
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    };

    try {
      const result = await this.elk.layout(elkGraph);

      const laidOutNodes = nodes.map(node => {
        const elkNode = result.children?.find((n: ElkNode) => n.id === node.id);
        if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
          return {
            ...node,
            position: {
              x: elkNode.x,
              y: elkNode.y,
            },
          };
        }
        return node; // Return original if not found or no position
      });
      return laidOutNodes;

    } catch (error) {
      console.error('ELK layout failed:', error);
      return nodes; // Return original nodes on error
    }
  }

  // --- Force-Directed Layout (Physics-Based) ---
  calculateForceDirected(nodes: Node[], edges: Edge[], options: ForceDirectedOptions = {}): Node[] {
    const {
      iterations = 100,
      springLength = 100,
      springStrength = 0.1,
      repulsion = 1000,
      damping = 0.9
    } = options;

    if (nodes.length === 0) return [];

    // Initialize positions if not set
    const nodeMap = new Map<string, { node: Node; vx: number; vy: number }>();
    nodes.forEach((node, i) => {
      const hasPosition = node.position && node.position.x !== undefined && node.position.y !== undefined;
      nodeMap.set(node.id, {
        node: {
          ...node,
          position: hasPosition ? node.position : {
            x: Math.random() * 500,
            y: Math.random() * 500
          }
        },
        vx: 0,
        vy: 0
      });
    });

    // Build adjacency map
    const adjacency = new Map<string, Set<string>>();
    nodes.forEach(n => adjacency.set(n.id, new Set()));
    edges.forEach(e => {
      adjacency.get(e.source)?.add(e.target);
      adjacency.get(e.target)?.add(e.source);
    });

    // Simulation loop
    for (let iter = 0; iter < iterations; iter++) {
      // Calculate forces
      nodeMap.forEach((data1, id1) => {
        let fx = 0;
        let fy = 0;

        // Repulsive forces (all pairs)
        nodeMap.forEach((data2, id2) => {
          if (id1 === id2) return;

          const dx = data1.node.position.x - data2.node.position.x;
          const dy = data1.node.position.y - data2.node.position.y;
          const distSq = dx * dx + dy * dy + 0.01; // Avoid division by zero
          const dist = Math.sqrt(distSq);

          const force = repulsion / distSq;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });

        // Attractive forces (connected nodes)
        const neighbors = adjacency.get(id1) || new Set();
        neighbors.forEach(id2 => {
          const data2 = nodeMap.get(id2);
          if (!data2) return;

          const dx = data2.node.position.x - data1.node.position.x;
          const dy = data2.node.position.y - data1.node.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy + 0.01);

          const force = springStrength * (dist - springLength);
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        });

        // Update velocity
        data1.vx = (data1.vx + fx) * damping;
        data1.vy = (data1.vy + fy) * damping;
      });

      // Update positions
      nodeMap.forEach(data => {
        data.node.position.x += data.vx;
        data.node.position.y += data.vy;
      });
    }

    // Center the graph
    const positions = Array.from(nodeMap.values()).map(d => d.node.position);
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));

    return Array.from(nodeMap.values()).map(data => ({
      ...data.node,
      position: {
        x: data.node.position.x - minX + 50,
        y: data.node.position.y - minY + 50
      }
    }));
  }

  // --- Hierarchical Layout (Tree-Based) ---
  calculateHierarchical(nodes: Node[], edges: Edge[], options: HierarchicalOptions = {}): Node[] {
    const {
      direction = 'TB',
      levelSeparation = 100,
      nodeSeparation = 50
    } = options;

    if (nodes.length === 0) return [];

    // Build adjacency list
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    nodes.forEach(n => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });
    edges.forEach(e => {
      if (adj.has(e.source) && adj.has(e.target)) {
        adj.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Topological sort to assign layers
    const layers: string[][] = [];
    const nodeLayer = new Map<string, number>();
    const queue: string[] = [];

    // Find root nodes (no incoming edges)
    inDegree.forEach((degree, id) => {
      if (degree === 0) queue.push(id);
    });

    // If no roots, pick arbitrary starting node
    if (queue.length === 0 && nodes.length > 0) {
      queue.push(nodes[0].id);
    }

    while (queue.length > 0) {
      const layerNodes: string[] = [];
      const nextQueue: string[] = [];

      queue.forEach(nodeId => {
        layerNodes.push(nodeId);
        nodeLayer.set(nodeId, layers.length);

        const neighbors = adj.get(nodeId) || [];
        neighbors.forEach(neighbor => {
          const degree = inDegree.get(neighbor) || 0;
          inDegree.set(neighbor, degree - 1);
          if (degree - 1 === 0 && !nodeLayer.has(neighbor)) {
            nextQueue.push(neighbor);
          }
        });
      });

      layers.push(layerNodes);
      queue.length = 0;
      queue.push(...nextQueue);
    }

    // Handle disconnected nodes
    nodes.forEach(n => {
      if (!nodeLayer.has(n.id)) {
        layers[0] = layers[0] || [];
        layers[0].push(n.id);
        nodeLayer.set(n.id, 0);
      }
    });

    // Assign positions
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const laidOutNodes: Node[] = [];

    layers.forEach((layerNodes, layerIndex) => {
      layerNodes.forEach((nodeId, nodeIndex) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;

        let x = 0;
        let y = 0;

        const nodeWidth = node.width || 150;
        const nodeHeight = node.height || 60;

        if (direction === 'TB') {
          x = nodeIndex * (nodeWidth + nodeSeparation);
          y = layerIndex * (nodeHeight + levelSeparation);
        } else if (direction === 'LR') {
          x = layerIndex * (nodeWidth + levelSeparation);
          y = nodeIndex * (nodeHeight + nodeSeparation);
        } else if (direction === 'BT') {
          x = nodeIndex * (nodeWidth + nodeSeparation);
          y = (layers.length - 1 - layerIndex) * (nodeHeight + levelSeparation);
        } else { // RL
          x = (layers.length - 1 - layerIndex) * (nodeWidth + levelSeparation);
          y = nodeIndex * (nodeHeight + nodeSeparation);
        }

        laidOutNodes.push({
          ...node,
          position: { x, y }
        });
      });
    });

    return laidOutNodes;
  }

  // --- Circular Layout (Radial) ---
  calculateCircular(nodes: Node[], edges: Edge[], options: CircularOptions = {}): Node[] {
    const {
      radius,
      startAngle = 0,
      sortBy = 'id'
    } = options;

    if (nodes.length === 0) return [];

    // Sort nodes
    const sortedNodes = [...nodes].sort((a, b) => {
      if (sortBy === 'type') {
        return (a.type || '').localeCompare(b.type || '');
      }
      return a.id.localeCompare(b.id);
    });

    // Calculate radius
    const nodeCount = sortedNodes.length;
    const avgNodeSize = 100; // Average node diameter
    const calculatedRadius = radius || Math.max(200, (nodeCount * avgNodeSize) / (2 * Math.PI));

    // Position nodes in circle
    const angleStep = (2 * Math.PI) / nodeCount;
    const centerX = calculatedRadius + 100;
    const centerY = calculatedRadius + 100;

    return sortedNodes.map((node, index) => {
      const angle = startAngle + index * angleStep;
      const x = centerX + calculatedRadius * Math.cos(angle);
      const y = centerY + calculatedRadius * Math.sin(angle);

      return {
        ...node,
        position: { x, y }
      };
    });
  }
}
