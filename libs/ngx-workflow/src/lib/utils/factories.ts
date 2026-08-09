import { v4 as uuidv4 } from 'uuid';
import { Node, XYPosition } from '../models/node.model';
import { Edge, EdgeType } from '../models/edge.model';

export interface CreateNodeOptions<T = any> extends Partial<Omit<Node<T>, 'id' | 'position'>> {
  id?: string;
  position?: XYPosition;
}

export interface CreateEdgeOptions<T = any> extends Partial<Omit<Edge<T>, 'id' | 'source' | 'target'>> {
  id?: string;
  source: string;
  target: string;
  type?: EdgeType;
}

/** Create a node with sensible defaults and a generated id when omitted. */
export function createNode<T = any>(options: CreateNodeOptions<T> = {}): Node<T> {
  const { id, position, ...rest } = options;
  return {
    id: id ?? uuidv4(),
    position: position ?? { x: 0, y: 0 },
    ...rest,
  };
}

/** Create many nodes. */
export function createNodes<T = any>(items: CreateNodeOptions<T>[]): Node<T>[] {
  return items.map((item) => createNode(item));
}

/** Create an edge with a generated id when omitted. */
export function createEdge<T = any>(options: CreateEdgeOptions<T>): Edge<T> {
  const { id, source, target, ...rest } = options;
  return {
    id: id ?? `${source}->${target}-${uuidv4().slice(0, 8)}`,
    source,
    target,
    ...rest,
  };
}

/** Create many edges. */
export function createEdges<T = any>(items: CreateEdgeOptions<T>[]): Edge<T>[] {
  return items.map((item) => createEdge(item));
}
