import { XYPosition } from '../models';

export function getStraightPath(source: XYPosition, target: XYPosition): string {
  return `M ${source.x},${source.y} L ${target.x},${target.y}`;
}

export function getBezierPath(source: XYPosition, target: XYPosition, curvatureOffset: number = 0): string {
  if (!curvatureOffset) {
    const midX = (source.x + target.x) / 2;
    return `M ${source.x},${source.y} C ${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
  }

  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / dist;
  const ny = dx / dist;

  const midX = (source.x + target.x) / 2 + nx * curvatureOffset;
  const midY = (source.y + target.y) / 2 + ny * curvatureOffset;

  return `M ${source.x},${source.y} Q ${midX},${midY} ${target.x},${target.y}`;
}

export function getStepPath(source: XYPosition, target: XYPosition): string {
  const midY = (source.y + target.y) / 2;
  return `M ${source.x},${source.y} L ${source.x},${midY} L ${target.x},${midY} L ${target.x},${target.y}`;
}

export function getSmoothStepPath(source: XYPosition, target: XYPosition, borderRadius: number = 5): string {
  const midY = (source.y + target.y) / 2;
  const { x: sx, y: sy } = source;
  const { x: tx, y: ty } = target;

  // If points are too close, fallback to straight line or simple step
  if (Math.abs(sx - tx) < 2 * borderRadius || Math.abs(sy - ty) < 2 * borderRadius) {
    return getStepPath(source, target);
  }

  // Direction signs
  const dirX = tx > sx ? 1 : -1;
  const dirY = ty > sy ? 1 : -1;

  // We assume Top-Bottom flow for simplicity in this helper, similar to getStepPath
  // Corner 1: (sx, midY)
  // Corner 2: (tx, midY)

  const corner1X = sx;
  const corner1Y = midY;
  const corner2X = tx;
  const corner2Y = midY;

  return `
    M ${sx},${sy}
    L ${corner1X},${corner1Y - borderRadius * dirY}
    Q ${corner1X},${corner1Y} ${corner1X + borderRadius * dirX},${corner1Y}
    L ${corner2X - borderRadius * dirX},${corner2Y}
    Q ${corner2X},${corner2Y} ${corner2X},${corner2Y + borderRadius * dirY}
    L ${tx},${ty}
  `.replace(/\s+/g, ' ').trim();
}

export function getSelfLoopPath(source: XYPosition, handle: string = 'top', offset: number = 30): string {
  const { x, y } = source;

  switch (handle) {
    case 'top':
      return `M ${x},${y} C ${x - offset},${y - offset * 2} ${x + offset},${y - offset * 2} ${x},${y}`;
    case 'right':
      return `M ${x},${y} C ${x + offset * 2},${y - offset} ${x + offset * 2},${y + offset} ${x},${y}`;
    case 'bottom':
      return `M ${x},${y} C ${x + offset},${y + offset * 2} ${x - offset},${y + offset * 2} ${x},${y}`;
    case 'left':
      return `M ${x},${y} C ${x - offset * 2},${y + offset} ${x - offset * 2},${y - offset} ${x},${y}`;
    default:
      return `M ${x},${y} C ${x - offset},${y - offset * 2} ${x + offset},${y - offset * 2} ${x},${y}`;
  }
}

export function getSmartEdgePath(path: XYPosition[]): string {
  if (path.length === 0) return '';

  let d = `M ${path[0].x},${path[0].y}`;

  for (let i = 1; i < path.length; i++) {
    d += ` L ${path[i].x},${path[i].y}`;
  }

  return d;
}

export function getWaypointPath(source: XYPosition, target: XYPosition, waypoints: XYPosition[]): string {
  if (!waypoints || waypoints.length === 0) {
    return getStraightPath(source, target);
  }

  let d = `M ${source.x},${source.y}`;
  for (const wp of waypoints) {
    d += ` L ${wp.x},${wp.y}`;
  }
  d += ` L ${target.x},${target.y}`;
  return d;
}

export function getPolylineMidpoint(points: XYPosition[]): XYPosition {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };

  // Calculate total length
  let totalLength = 0;
  const segments: { length: number; start: XYPosition; end: XYPosition }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    segments.push({ length, start, end });
    totalLength += length;
  }

  // Find midpoint
  let remainingLength = totalLength / 2;

  for (const segment of segments) {
    if (remainingLength <= segment.length) {
      // Midpoint is on this segment
      const ratio = remainingLength / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * ratio,
        y: segment.start.y + (segment.end.y - segment.start.y) * ratio
      };
    }
    remainingLength -= segment.length;
  }

  return points[points.length - 1];
}