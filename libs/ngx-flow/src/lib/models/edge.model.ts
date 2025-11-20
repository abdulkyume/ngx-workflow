export interface Edge {
  id: string;
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string;
  targetHandle?: string;
  type?: string; // Corresponds to a key in the edge types registry
  animated?: boolean;
  selected?: boolean;
  data?: any;
  class?: string;
  style?: Record<string, string>;
}

export interface TempEdge extends Edge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}