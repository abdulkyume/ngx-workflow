import { Injectable } from '@angular/core';
import { Node, Edge, XYPosition } from '../models';
import * as dagre from '@dagrejs/dagre';
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled';

// Declare global for dagre as it doesn't always have proper types in some setups
declare const dagre: any;

@Injectable({
  providedIn: 'root',
})
export class LayoutService {

  private elk: any;

  constructor() {
    this.elk = new ELK();
  }

  // --- Dagre Layout ---
  async applyDagreLayout(nodes: Node[], edges: Edge[], options?: { rankdir?: 'TB' | 'LR'; align?: 'UL' | 'UR' | 'DL' | 'DR'; nodesep?: number; ranksep?: number }): Promise<Node[]> {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({
      rankdir: options?.rankdir || 'TB', // Top-to-bottom or Left-to-right
      align: options?.align,
      nodesep: options?.nodesep || 50,
      ranksep: options?.ranksep || 50,
      marginx: 20,
      marginy: 20,
    });
    graph.setDefaultEdgeLabel(() => ({})); // Required for dagre

    // Add nodes to the graph, ensuring they have dimensions
    nodes.forEach(node => {
      graph.setNode(node.id, {
        width: node.width || 170, // Default width if not set
        height: node.height || 60, // Default height if not set
      });
    });

    // Add edges to the graph
    edges.forEach(edge => {
      graph.setEdge(edge.source, edge.target);
    });

    dagre.layout(graph); // Perform layout calculation

    // Map new positions back to nodes
    const laidOutNodes = nodes.map(node => {
      const graphNode = graph.node(node.id);
      return {
        ...node,
        position: {
          x: graphNode.x - (node.width || 170) / 2, // Adjust to top-left corner
          y: graphNode.y - (node.height || 60) / 2, // Adjust to top-left corner
        },
      };
    });

    return laidOutNodes;
  }

  // --- ELK Layout ---
  async applyElkLayout(nodes: Node[], edges: Edge[], options?: any): Promise<Node[]> {
    const elkGraph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        'elk.spacing.nodeNode': '75',
        'elk.layered.nodePlacement.strategy': 'BRANDES_KOLLER',
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
}
