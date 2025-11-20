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
  class?: string;
  style?: Record<string, string>;
}