import { Node, XYPosition } from '../models/node.model';

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Uniform grid spatial hash for fast viewport queries on large graphs.
 * Rebuild when node positions/sizes change significantly.
 */
export class SpatialIndex {
  private readonly cells = new Map<string, string[]>();
  private readonly items = new Map<
    string,
    { x: number; y: number; w: number; h: number }
  >();

  constructor(private readonly cellSize: number = 256) {}

  clear(): void {
    this.cells.clear();
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }

  rebuild(
    nodes: Array<
      Pick<Node, 'id' | 'width' | 'height'> & {
        position: XYPosition;
        _renderPosition?: XYPosition;
      }
    >,
    defaultWidth = 150,
    defaultHeight = 60
  ): void {
    this.clear();
    for (const node of nodes) {
      const x = node._renderPosition?.x ?? node.position.x;
      const y = node._renderPosition?.y ?? node.position.y;
      const w = node.width || defaultWidth;
      const h = node.height || defaultHeight;
      this.insert(node.id, x, y, w, h);
    }
  }

  insert(id: string, x: number, y: number, w: number, h: number): void {
    this.items.set(id, { x, y, w, h });
    const x0 = Math.floor(x / this.cellSize);
    const y0 = Math.floor(y / this.cellSize);
    const x1 = Math.floor((x + w) / this.cellSize);
    const y1 = Math.floor((y + h) / this.cellSize);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const key = `${cx},${cy}`;
        const bucket = this.cells.get(key);
        if (bucket) {
          bucket.push(id);
        } else {
          this.cells.set(key, [id]);
        }
      }
    }
  }

  /** Whether an id is currently indexed. */
  has(id: string): boolean {
    return this.items.has(id);
  }

  /** Return node ids whose AABB intersects the query rect. */
  query(bounds: ViewportBounds): Set<string> {
    const result = new Set<string>();
    const x0 = Math.floor(bounds.minX / this.cellSize);
    const y0 = Math.floor(bounds.minY / this.cellSize);
    const x1 = Math.floor(bounds.maxX / this.cellSize);
    const y1 = Math.floor(bounds.maxY / this.cellSize);

    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const bucket = this.cells.get(`${cx},${cy}`);
        if (!bucket) continue;
        for (const id of bucket) {
          const item = this.items.get(id);
          if (!item) continue;
          if (
            item.x + item.w >= bounds.minX &&
            item.x <= bounds.maxX &&
            item.y + item.h >= bounds.minY &&
            item.y <= bounds.maxY
          ) {
            result.add(id);
          }
        }
      }
    }
    return result;
  }
}

/** Adaptive padding in world units — larger when zoomed out. */
export function computeVirtualizationBuffer(
  baseBuffer: number,
  zoom: number,
  adaptive: boolean
): number {
  if (!adaptive) return baseBuffer;
  const z = Math.max(0.05, zoom);
  // When zoomed out, keep more world-space padding so panning feels continuous
  return Math.round(baseBuffer * Math.max(1, 1 / z));
}
