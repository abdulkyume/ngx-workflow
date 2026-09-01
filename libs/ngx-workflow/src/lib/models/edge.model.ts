export type MarkerType = 'arrow' | 'arrowclosed' | 'dot';

export type BuiltInEdgeType =
  | 'bezier'
  | 'straight'
  | 'step'
  | 'smoothstep'
  | 'smart'
  | 'dashed';

/** Built-in path kinds plus custom edge component / template type keys. */
export type EdgeType = BuiltInEdgeType | (string & {});

export type EdgeLabelPosition = 'start' | 'center' | 'end';

export interface EdgeLabel {
  type?: 'text' | 'html-template';
  text?: string;
  data?: any;
  style?: { [key: string]: any };
  bgStyle?: { [key: string]: any };
}

export interface EdgeLabels {
  start?: EdgeLabel | string;
  center?: EdgeLabel | string;
  end?: EdgeLabel | string;
}

export interface Edge<T = any> {
  id: string;
  source: string; // source node id
  target: string; // target node id
  sourceHandle?: string;
  targetHandle?: string;
  /** Built-in path type or a key registered via NGX_WORKFLOW_EDGE_TYPES / edgeTemplate. */
  type?: EdgeType;
  animated?: boolean;
  animationType?: 'flow' | 'dot' | 'both'; // Default to 'flow' if undefined
  animationDuration?: string; // e.g. '2s'
  animationStyle?: { [key: string]: any }; // e.g. { fill: 'red' }
  style?: { [key: string]: any };

  // Selection
  selected?: boolean;

  // Labels (legacy center label)
  label?: string;
  labelStyle?: { [key: string]: any };
  labelBgStyle?: { [key: string]: any };
  labelBgPadding?: [number, number]; // [x, y] padding
  labelBgBorderRadius?: number;

  /** Multi-position labels (start / center / end). Center falls back to `label` when unset. */
  edgeLabels?: EdgeLabels;

  // Markers (arrows, dots)
  markerStart?: MarkerType | string;
  markerEnd?: MarkerType | string;
  shadow?: boolean; // New property

  // Hidden state (for edge reconnection)
  hidden?: boolean;

  // Custom Waypoints / Control Points
  waypoints?: Array<{ x: number; y: number }>;

  /** Custom payload. `centerAnchors: true` pins parallel edges to one handle point; `false` spreads siblings along the handle (use `anchorSpreadMax` to cap width). */
  data?: T;
}

export interface TempEdge extends Edge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}
