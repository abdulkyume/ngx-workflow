import { Node } from './node.model';
import { Edge } from './edge.model';
import { Viewport } from './viewport.model';

export interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}