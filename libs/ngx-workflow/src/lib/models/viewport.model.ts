import { XYPosition } from './node.model';

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

// Viewport Helper Method Options

export interface ZoomOptions {
  step?: number;
  duration?: number; // For future animation support
}

export interface ZoomToOptions {
  center?: XYPosition;
  duration?: number; // For future animation support
}

export interface FitViewOptions {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number; // For future animation support
  nodes?: string[]; // Specific node IDs to fit
}

export interface SetCenterOptions {
  zoom?: number;
  duration?: number; // For future animation support
}

export interface FitBoundsOptions {
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
  duration?: number; // For future animation support
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}