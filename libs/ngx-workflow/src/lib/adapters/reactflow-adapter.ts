import { Node, Edge, Viewport } from '../models';

export interface ReactFlowNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data?: { label?: string; [key: string]: any };
  style?: Record<string, any>;
  width?: number;
  height?: number;
  parentId?: string;
  extent?: string;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

export interface ReactFlowObject {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  viewport?: Viewport;
}

export class ReactFlowAdapter {
  /**
   * Converts ngx-workflow state to ReactFlow / xyflow JSON schema.
   */
  static toReactFlow(nodes: Node[], edges: Edge[], viewport?: Viewport): ReactFlowObject {
    const rfNodes: ReactFlowNode[] = nodes.map((n) => ({
      id: n.id,
      type: n.type || 'default',
      position: { ...n.position },
      data: {
        label: n.label,
        ...(n.data || {}),
      },
      width: n.width,
      height: n.height,
      parentId: n.parentId,
      style: n.style,
    }));

    const rfEdges: ReactFlowEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      type: e.type || 'default',
      animated: e.animated,
      style: e.style,
    }));

    return {
      nodes: rfNodes,
      edges: rfEdges,
      viewport: viewport ? { ...viewport } : undefined,
    };
  }

  /**
   * Imports ReactFlow / xyflow JSON schema into ngx-workflow state.
   */
  static fromReactFlow(rfObject: ReactFlowObject): { nodes: Node[]; edges: Edge[]; viewport?: Viewport } {
    const nodes: Node[] = (rfObject.nodes || []).map((n) => {
      const { label, ...dataProps } = n.data || {};
      return {
        id: n.id,
        type: n.type || 'default',
        position: { x: n.position?.x || 0, y: n.position?.y || 0 },
        label: label || n.data?.label || n.id,
        data: Object.keys(dataProps).length > 0 ? dataProps : undefined,
        width: n.width || 170,
        height: n.height || 60,
        parentId: n.parentId,
        style: n.style,
      };
    });

    const edges: Edge[] = (rfObject.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      type: (e.type as any) || 'bezier',
      animated: e.animated,
      style: e.style,
    }));

    return {
      nodes,
      edges,
      viewport: rfObject.viewport,
    };
  }
}
