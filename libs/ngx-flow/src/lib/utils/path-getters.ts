import { XYPosition } from '../models';

export function getStraightPath(source: XYPosition, target: XYPosition): string {
  return `M ${source.x},${source.y} L ${target.x},${target.y}`;
}

export function getBezierPath(source: XYPosition, target: XYPosition): string {
  const midX = (source.x + target.x) / 2;
  return `M ${source.x},${source.y} C ${midX},${source.y} ${midX},${target.y} ${target.x},${target.y}`;
}

export function getStepPath(source: XYPosition, target: XYPosition): string {
  const midY = (source.y + target.y) / 2;
  return `M ${source.x},${source.y} L ${source.x},${midY} L ${target.x},${midY} L ${target.x},${target.y}`;
}