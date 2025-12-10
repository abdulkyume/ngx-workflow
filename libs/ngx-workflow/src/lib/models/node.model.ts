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
  extent?: 'parent';
  label?: string;
  highlighted?: boolean;
  dimmed?: boolean;
  searchHighlight?: 'match' | 'current';  // Search highlighting state
  zIndex?: number; // Stacking order (higher = on top)

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
}