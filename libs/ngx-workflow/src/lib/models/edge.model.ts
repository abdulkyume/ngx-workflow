export type MarkerType = 'arrow' | 'arrowclosed' | 'dot';

export interface Edge<T = any> {
  id: string;
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string;
  targetHandle?: string;
  type?: 'bezier' | 'straight' | 'step' | 'smoothstep' | 'smart' | 'dashed';
  animated?: boolean;
  animationType?: 'flow' | 'dot' | 'both'; // Default to 'flow' if undefined
  animationDuration?: string; // e.g. '2s'
  animationStyle?: { [key: string]: any }; // e.g. { fill: 'red' }
  style?: { [key: string]: any };

  // Selection
  selected?: boolean;

  // Labels
  label?: string;
  labelStyle?: { [key: string]: any };
  labelBgStyle?: { [key: string]: any };
  labelBgPadding?: [number, number]; // [x, y] padding
  labelBgBorderRadius?: number;

  // Markers (arrows, dots)
  markerStart?: MarkerType | string;
  markerEnd?: MarkerType | string;
  shadow?: boolean; // New property

  // Hidden state (for edge reconnection)
  hidden?: boolean;

  // Custom data
  data?: T;
}

export interface TempEdge extends Edge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}