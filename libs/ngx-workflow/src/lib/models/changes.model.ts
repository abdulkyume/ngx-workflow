import { Node } from './node.model';
import { Edge } from './edge.model';
import { XYPosition, Dimensions } from './node.model';

export type NodeChangeType =
  | 'add'
  | 'remove'
  | 'position'
  | 'select'
  | 'dimensions'
  | 'data';

export type EdgeChangeType = 'add' | 'remove' | 'select' | 'reconnect' | 'data';

export interface NodeChange {
  type: NodeChangeType;
  id: string;
  item?: Node;
  position?: XYPosition;
  selected?: boolean;
  dimensions?: Dimensions;
  data?: unknown;
}

export interface EdgeChange {
  type: EdgeChangeType;
  id: string;
  item?: Edge;
  selected?: boolean;
  source?: string;
  target?: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: unknown;
}

export type ConnectionMode = 'strict' | 'loose';
export type SelectionMode = 'partial' | 'full';

export type EdgeVirtualizationMode = 'any-endpoint' | 'both-endpoints';

export interface FlowOptimization {
  /** When true, group backgrounds render in a detached bottom layer (default behavior). */
  detachedGroupsLayer?: boolean;
  /** Lazy-load custom node components when they enter the viewport (or immediately). */
  lazyLoadTrigger?: 'viewport' | 'immediate';
  /**
   * Cull off-screen nodes/edges via a spatial index (default true).
   * Alias of `onlyRenderVisibleElements` for xyflow familiarity.
   */
  virtualization?: boolean;
  /** Alias for `virtualization`. */
  onlyRenderVisibleElements?: boolean;
  /** Extra world-space padding around the viewport when culling (default 500). */
  virtualizationBuffer?: number;
  /** Scale buffer with zoom so panning while zoomed out stays smooth (default true). */
  adaptiveBuffer?: boolean;
  /** Always keep selected nodes mounted even if outside the viewport (default true). */
  keepSelectedVisible?: boolean;
  /**
   * Soft cap on rendered nodes after culling. Closest-to-center nodes win;
   * selected nodes are always kept. `null` / omit = unlimited.
   */
  maxRenderedNodes?: number | null;
  /**
   * `any-endpoint` (default): keep an edge if source or target is visible.
   * `both-endpoints`: require both ends visible (stricter for huge graphs).
   */
  edgeVirtualization?: EdgeVirtualizationMode;
}

export type KeyboardShortcutAction =
  | 'delete'
  | 'undo'
  | 'redo'
  | 'selectAll'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'duplicate'
  | 'group'
  | 'ungroup'
  | 'search'
  | 'fitView';

/** Map of action → enabled. Omitted keys default to true. */
export type KeyboardShortcuts = Partial<Record<KeyboardShortcutAction, boolean>>;

export interface ComponentNodeEvent<T = unknown> {
  eventName: string;
  nodeId: string;
  eventPayload?: T;
}
