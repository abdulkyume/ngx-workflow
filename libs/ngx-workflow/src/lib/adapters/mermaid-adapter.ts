import { Node, Edge } from '../models';
import { v4 as uuidv4 } from 'uuid';

export class MermaidAdapter {
  /**
   * Exports ngx-workflow nodes and edges into Mermaid.js flowchart syntax.
   * @param nodes Array of workflow nodes
   * @param edges Array of workflow edges
   * @param direction 'TD' | 'LR' | 'BT' | 'RL'
   */
  static toMermaid(nodes: Node[], edges: Edge[], direction: 'TD' | 'LR' | 'BT' | 'RL' = 'TD'): string {
    let output = `graph ${direction}\n`;

    const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_');

    for (const n of nodes) {
      const label = n.label || n.id;
      const cleanId = sanitizeId(n.id);

      if (n.type === 'group') {
        output += `  subgraph ${cleanId} ["${label}"]\n`;
        const children = nodes.filter((c) => c.parentId === n.id);
        for (const child of children) {
          const childLabel = child.label || child.id;
          output += `    ${sanitizeId(child.id)}["${childLabel}"]\n`;
        }
        output += `  end\n`;
      } else if (!n.parentId) {
        output += `  ${cleanId}["${label}"]\n`;
      }
    }

    for (const e of edges) {
      const src = sanitizeId(e.source);
      const tgt = sanitizeId(e.target);
      if (e.label) {
        output += `  ${src} -- "${e.label}" --> ${tgt}\n`;
      } else {
        output += `  ${src} --> ${tgt}\n`;
      }
    }

    return output.trim();
  }

  /**
   * Parses standard Mermaid.js flowchart syntax into ngx-workflow nodes and edges.
   */
  static fromMermaid(mermaidText: string): { nodes: Node[]; edges: Edge[] } {
    const nodesMap = new Map<string, Node>();
    const edges: Edge[] = [];

    const lines = mermaidText.split('\n');
    let xOffset = 100;
    let yOffset = 100;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('graph') || line.startsWith('flowchart') || line.startsWith('subgraph') || line.startsWith('end')) {
        continue;
      }

      // Regex to match "A["Label"] --> B["Label"]" or "A --> B" or "A -- "label" --> B"
      const edgeMatch = line.match(/^([a-zA-Z0-9_]+)(?:\["?([^"\]]+)"?\])?\s*(?:--\s*"([^"]+)"\s*-->|-->)\s*([a-zA-Z0-9_]+)(?:\["?([^"\]]+)"?\])?$/);

      if (edgeMatch) {
        const [, srcId, srcLabel, edgeLabel, tgtId, tgtLabel] = edgeMatch;

        if (!nodesMap.has(srcId)) {
          nodesMap.set(srcId, {
            id: srcId,
            label: srcLabel || srcId,
            position: { x: xOffset, y: yOffset },
            type: 'default',
            width: 170,
            height: 60,
          });
          xOffset += 220;
        }

        if (!nodesMap.has(tgtId)) {
          nodesMap.set(tgtId, {
            id: tgtId,
            label: tgtLabel || tgtId,
            position: { x: xOffset, y: yOffset + 120 },
            type: 'default',
            width: 170,
            height: 60,
          });
          xOffset += 220;
        }

        edges.push({
          id: `e_${srcId}_${tgtId}_${uuidv4().substring(0, 6)}`,
          source: srcId,
          target: tgtId,
          label: edgeLabel || undefined,
          type: 'bezier',
        });
      } else {
        // Single node declaration e.g. "A["Label"]"
        const nodeMatch = line.match(/^([a-zA-Z0-9_]+)\["?([^"\]]+)"?\]$/);
        if (nodeMatch) {
          const [, id, label] = nodeMatch;
          if (!nodesMap.has(id)) {
            nodesMap.set(id, {
              id,
              label: label || id,
              position: { x: xOffset, y: yOffset },
              type: 'default',
              width: 170,
              height: 60,
            });
            xOffset += 220;
          }
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
    };
  }
}
