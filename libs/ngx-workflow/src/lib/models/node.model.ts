import { Type } from '@angular/core';

export interface XYPosition {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface Node<T = any> {
  id: string;
  position: XYPosition;
  data?: T;
  type?: string; // Corresponds to a key in the node types registry
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;
  /** When false, the node cannot be selected. Defaults to true. */
  selectable?: boolean;
  /** When false, handles on this node reject new connections. Defaults to true. */
  connectable?: boolean;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  lockAspectRatio?: boolean; // If true, maintains aspect ratio during resize (also with Shift key)
  class?: string;
  style?: Record<string, string>;
  parentId?: string;
  expanded?: boolean;
  collapsed?: boolean;
  extent?: 'parent';
  label?: string;
  highlighted?: boolean;
  dimmed?: boolean;
  searchHighlight?: 'match' | 'current';  // Search highlighting state
  zIndex?: number; // Stacking order (higher = on top)
  _renderPosition?: XYPosition; // Computed absolute position for rendering

  // New features
  badges?: Array<{
    content: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  }>;
  shadow?: boolean | string; // boolean for default, string for custom CSS box-shadow
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderColor?: string;
  borderWidth?: number;
  handleConfig?: {
    [handleId: string]: {
      isConnectable?: boolean | number | ((node: Node, connectedEdges: any[]) => boolean);
      /** Max edges allowed on this specific port (overrides maxConnectionsPerPort / global) */
      maxConnections?: number;
    }
  };
  /**
   * Max edges allowed on each port of this node.
   * Overridden per port by handleConfig[handleId].maxConnections.
   * Falls back to diagram [maxConnectionsPerHandle] when unset.
   */
  maxConnectionsPerPort?: number;
  easyConnect?: boolean; // If true, dragging from node body starts connection (unless on .drag-handle)
  ports?: number; // 0: None, 1: Top, 2: Top/Bottom, 3: Left/Right, 4: All (default)
}
