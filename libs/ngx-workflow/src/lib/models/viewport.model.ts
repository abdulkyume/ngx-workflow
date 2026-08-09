import { XYPosition } from './node.model';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Viewport Helper Method Options

export interface ZoomOptions {
  step?: number;
  /** Animation duration in ms (0 = instant). */
  duration?: number;
}

export interface ZoomToOptions {
  center?: XYPosition;
  /** Animation duration in ms (0 = instant). */
  duration?: number;
}

export interface FitViewOptions {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  /** Animation duration in ms (0 = instant). */
  duration?: number;
  nodes?: string[]; // Specific node IDs to fit
}

export interface SetCenterOptions {
  zoom?: number;
  /** Animation duration in ms (0 = instant). */
  duration?: number;
}

export interface FitBoundsOptions {
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Animation duration in ms (0 = instant). */
  duration?: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}