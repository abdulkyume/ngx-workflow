import { XYPosition } from '../models';

export type HandlePosition = 'top' | 'right' | 'bottom' | 'left';

export interface BezierPathOptions {
  /** Parallel-edge lateral offset (legacy 3rd-arg number; applies to both ends). */
  offset?: number;
  /** Fan curves away from the source anchor (first control point only). */
  sourceOffset?: number;
  /** Fan curves into the target anchor (second control point only). */
  targetOffset?: number;
  /** Curve strength multiplier (default 0.25). */
  curvature?: number;
  /** Minimum control-point stem from a handle (default 36). Lower for spread anchors. */
  minControlStem?: number;
  sourcePosition?: HandlePosition;
  targetPosition?: HandlePosition;
}

export interface StepPathOptions {
  borderRadius?: number;
  sourcePosition?: HandlePosition;
  targetPosition?: HandlePosition;
  /** Fan orthogonal corridors away from the source anchor (matches bezier sourceOffset). */
  sourceOffset?: number;
  /** Fan orthogonal corridors into the target anchor (matches bezier targetOffset). */
  targetOffset?: number;
}

export function normalizeHandle(handle?: string | null): HandlePosition | undefined {
  if (handle === 'top' || handle === 'right' || handle === 'bottom' || handle === 'left') {
    return handle;
  }
  return undefined;
}

/** Infer handle side from relative node placement when handle id is missing. */
export function inferHandlePosition(
  from: XYPosition,
  to: XYPosition,
  prefer: 'source' | 'target' = 'source'
): HandlePosition {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (prefer === 'source') return dx >= 0 ? 'right' : 'left';
    return dx >= 0 ? 'left' : 'right';
  }
  if (prefer === 'source') return dy >= 0 ? 'bottom' : 'top';
  return dy >= 0 ? 'top' : 'bottom';
}

function controlOffset(distance: number, curvature: number, minStem = 36): number {
  if (distance >= 0) {
    // Keep a minimum stem so the final approach matches the arrow orientation
    return Math.max(minStem, 0.5 * distance * curvature);
  }
  // When folding back, keep a minimum bulge so the curve stays readable
  return curvature * 25 * Math.sqrt(Math.max(25, Math.abs(distance)));
}

function getControlPoint(
  pos: HandlePosition,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number,
  minStem = 36,
): [number, number] {
  switch (pos) {
    case 'left':
      return [x1 - controlOffset(x1 - x2, curvature, minStem), y1];
    case 'right':
      return [x1 + controlOffset(x2 - x1, curvature, minStem), y1];
    case 'top':
      return [x1, y1 - controlOffset(y1 - y2, curvature, minStem)];
    case 'bottom':
      return [x1, y1 + controlOffset(y2 - y1, curvature, minStem)];
  }
}

export function getStraightPath(
  source: XYPosition,
  target: XYPosition,
  options?: { sourceOffset?: number; targetOffset?: number },
): string {
  const midpoint = getStraightPathBendPoint(source, target, options);
  if (!midpoint) {
    return `M ${source.x},${source.y} L ${target.x},${target.y}`;
  }
  return `M ${source.x},${source.y} L ${midpoint.x},${midpoint.y} L ${target.x},${target.y}`;
}

/** Lateral bend point for center-anchored straight edges; null when no offset. */
export function getStraightPathBendPoint(
  source: XYPosition,
  target: XYPosition,
  options?: { sourceOffset?: number; targetOffset?: number },
): XYPosition | null {
  const srcOff = options?.sourceOffset ?? 0;
  const tgtOff = options?.targetOffset ?? 0;
  if (!srcOff && !tgtOff) {
    return null;
  }
  const lu = lateralVector(source, target);
  const lane = (srcOff + tgtOff) / 2;
  return {
    x: (source.x + target.x) / 2 + lu.x * lane,
    y: (source.y + target.y) / 2 + lu.y * lane,
  };
}

/**
 * Direction-aware cubic bezier (xyflow-style).
 * Pass source/target handle sides so vertical and reverse flows curve correctly.
 *
 * Legacy: `getBezierPath(a, b, curvatureOffset: number)` still works.
 */
export function getBezierPath(
  source: XYPosition,
  target: XYPosition,
  options: number | BezierPathOptions = 0
): string {
  const { c1, c2 } = getBezierControlPoints(source, target, options);
  return `M ${source.x},${source.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${target.x},${target.y}`;
}

/** Shared cubic control points used by path + arrowhead so they stay in sync. */
export function getBezierControlPoints(
  source: XYPosition,
  target: XYPosition,
  options: number | BezierPathOptions = 0
): { c1: XYPosition; c2: XYPosition; sourcePosition: HandlePosition; targetPosition: HandlePosition } {
  const opts: BezierPathOptions =
    typeof options === 'number' ? { offset: options } : (options || {});

  const curvature = opts.curvature ?? 0.25;
  const minStem = opts.minControlStem ?? 36;
  const sourcePosition =
    opts.sourcePosition ?? inferHandlePosition(source, target, 'source');
  const targetPosition =
    opts.targetPosition ?? inferHandlePosition(source, target, 'target');

  let [c1x, c1y] = getControlPoint(
    sourcePosition,
    source.x,
    source.y,
    target.x,
    target.y,
    curvature,
    minStem,
  );
  let [c2x, c2y] = getControlPoint(
    targetPosition,
    target.x,
    target.y,
    source.x,
    source.y,
    curvature,
    minStem,
  );

  const offset = opts.offset ?? 0;
  const sourceOff = opts.sourceOffset ?? offset;
  const targetOff = opts.targetOffset ?? offset;
  if (sourceOff) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    c1x += nx * sourceOff;
    c1y += ny * sourceOff;
  }
  if (targetOff) {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    c2x += nx * targetOff;
    c2y += ny * targetOff;
  }

  return {
    c1: { x: c1x, y: c1y },
    c2: { x: c2x, y: c2y },
    sourcePosition,
    targetPosition,
  };
}

/** Point on cubic Bezier at parameter t ∈ [0, 1]. */
export function getCubicBezierPoint(
  source: XYPosition,
  c1: XYPosition,
  c2: XYPosition,
  target: XYPosition,
  t: number
): XYPosition {
  const u = 1 - t;
  return {
    x: u * u * u * source.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * target.x,
    y: u * u * u * source.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * target.y,
  };
}

/** Unit tangent of cubic Bezier at t (falls back to source→target). */
export function getCubicBezierTangent(
  source: XYPosition,
  c1: XYPosition,
  c2: XYPosition,
  target: XYPosition,
  t: number
): XYPosition {
  const u = 1 - t;
  let tx =
    3 * u * u * (c1.x - source.x) + 6 * u * t * (c2.x - c1.x) + 3 * t * t * (target.x - c2.x);
  let ty =
    3 * u * u * (c1.y - source.y) + 6 * u * t * (c2.y - c1.y) + 3 * t * t * (target.y - c2.y);
  const len = Math.hypot(tx, ty);
  if (len < 1e-6) {
    tx = target.x - source.x;
    ty = target.y - source.y;
  }
  const n = Math.hypot(tx, ty) || 1;
  return { x: tx / n, y: ty / n };
}

export interface ArrowheadGeometry {
  /** SVG polygon points string: "tipX,tipY baseLeftX,baseLeftY baseRightX,baseRightY" */
  points: string;
  /** Path should end here (base center) so the stroke meets the triangle. */
  pathEnd: XYPosition;
  tip: XYPosition;
}

/**
 * Arrowhead that rides the bezier end tangent — not a separate SVG marker —
 * so the tip always stays attached to the edge.
 */
export function getArrowheadGeometry(
  source: XYPosition,
  target: XYPosition,
  options: number | BezierPathOptions = 0,
  size: { length?: number; width?: number } = {}
): ArrowheadGeometry {
  const length = size.length ?? 8;
  const width = size.width ?? 6;
  const opts: BezierPathOptions =
    typeof options === 'number' ? { offset: options } : (options || {});
  const { c2, targetPosition } = getBezierControlPoints(source, target, opts);

  // Prefer handle normal so the tip stays flush on spread anchors.
  let tx = 0;
  let ty = 0;
  switch (targetPosition) {
    case 'top':
      ty = 1;
      break;
    case 'bottom':
      ty = -1;
      break;
    case 'left':
      tx = 1;
      break;
    case 'right':
      tx = -1;
      break;
  }
  if (!tx && !ty) {
    tx = target.x - c2.x;
    ty = target.y - c2.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
  }

  const tip = { x: target.x, y: target.y };
  const pathEnd = { x: tip.x - tx * length, y: tip.y - ty * length };
  const px = -ty;
  const py = tx;
  const half = width / 2;
  const baseLeft = { x: pathEnd.x + px * half, y: pathEnd.y + py * half };
  const baseRight = { x: pathEnd.x - px * half, y: pathEnd.y - py * half };

  return {
    tip,
    pathEnd,
    points: `${tip.x},${tip.y} ${baseLeft.x},${baseLeft.y} ${baseRight.x},${baseRight.y}`,
  };
}

function lateralVector(from: XYPosition, to: XYPosition): XYPosition {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  return { x: -dy / dist, y: dx / dist };
}

function hasStepOffsets(options?: StepPathOptions): boolean {
  return !!(options?.sourceOffset || options?.targetOffset);
}

/**
 * Center-anchored orthogonal fan — same sibling offsets as bezier, without moving handles.
 */
function buildCenterAnchoredStepPoints(
  source: XYPosition,
  target: XYPosition,
  options: StepPathOptions
): XYPosition[] | null {
  const srcOff = options.sourceOffset ?? 0;
  const tgtOff = options.targetOffset ?? 0;
  if (srcOff === 0 && tgtOff === 0) {
    return null;
  }

  const sourcePosition =
    options.sourcePosition ?? inferHandlePosition(source, target, 'source');
  const targetPosition =
    options.targetPosition ?? inferHandlePosition(source, target, 'target');
  const { x: sx, y: sy } = source;
  const { x: tx, y: ty } = target;
  const lu = lateralVector(source, target);
  const laneSrcX = sx + lu.x * srcOff;
  const laneTgtX = tx + lu.x * tgtOff;
  const laneSrcY = sy + lu.y * srcOff;
  const laneTgtY = ty + lu.y * tgtOff;

  const verticalSource = sourcePosition === 'top' || sourcePosition === 'bottom';
  const verticalTarget = targetPosition === 'top' || targetPosition === 'bottom';

  if (verticalSource && verticalTarget) {
    const forward =
      (sourcePosition === 'bottom' && targetPosition === 'top' && ty >= sy) ||
      (sourcePosition === 'top' && targetPosition === 'bottom' && ty <= sy);

    if (forward) {
      const stem = 28;
      const dropY = sourcePosition === 'bottom' ? sy + stem : sy - stem;
      const riseY = targetPosition === 'top' ? ty - stem : ty + stem;
      return [
        source,
        { x: laneSrcX, y: dropY },
        { x: laneSrcX, y: riseY },
        { x: laneTgtX, y: riseY },
        target,
      ];
    }

    const corridorOffset = srcOff || tgtOff;
    const corridor = Math.min(sx, tx) - 120 + corridorOffset;
    const dropY = sourcePosition === 'bottom' ? sy + 36 : sy - 36;
    const riseY = targetPosition === 'top' ? ty - 36 : ty + 36;
    return [
      source,
      { x: sx, y: dropY },
      { x: corridor, y: dropY },
      { x: corridor, y: riseY },
      { x: tx, y: riseY },
      target,
    ];
  }

  if (!verticalSource && !verticalTarget) {
    const forward =
      (sourcePosition === 'right' && targetPosition === 'left' && tx >= sx) ||
      (sourcePosition === 'left' && targetPosition === 'right' && tx <= sx);

    if (forward) {
      const stem = 28;
      const dropX = sourcePosition === 'right' ? sx + stem : sx - stem;
      const riseX = targetPosition === 'left' ? tx - stem : tx + stem;
      return [
        source,
        { x: dropX, y: laneSrcY },
        { x: riseX, y: laneSrcY },
        { x: riseX, y: laneTgtY },
        target,
      ];
    }

    const corridorOffset = srcOff || tgtOff;
    const corridor = Math.min(sy, ty) - 120 + corridorOffset;
    const dropX = sourcePosition === 'right' ? sx + 36 : sx - 36;
    const riseX = targetPosition === 'left' ? tx - 36 : tx + 36;
    return [
      source,
      { x: dropX, y: sy },
      { x: dropX, y: corridor },
      { x: riseX, y: corridor },
      { x: riseX, y: ty },
      target,
    ];
  }

  return null;
}

function pointsToStepPath(points: XYPosition[]): string {
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x},${points[i].y}`;
  }
  return d;
}

function pointsToSmoothStepPath(points: XYPosition[], borderRadius: number): string {
  if (points.length < 3 || borderRadius <= 0) {
    return pointsToStepPath(points);
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const inLen = Math.hypot(inDx, inDy);
    const outLen = Math.hypot(outDx, outDy);
    const r = Math.min(borderRadius, inLen / 2, outLen / 2);
    if (r < 0.5 || inLen < 1e-6 || outLen < 1e-6) {
      d += ` L ${curr.x},${curr.y}`;
      continue;
    }
    const inUx = inDx / inLen;
    const inUy = inDy / inLen;
    const outUx = outDx / outLen;
    const outUy = outDy / outLen;
    const start = { x: curr.x - inUx * r, y: curr.y - inUy * r };
    const end = { x: curr.x + outUx * r, y: curr.y + outUy * r };
    d += ` L ${start.x},${start.y} Q ${curr.x},${curr.y} ${end.x},${end.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

export function getStepPath(
  source: XYPosition,
  target: XYPosition,
  options?: StepPathOptions
): string {
  const sourcePosition =
    options?.sourcePosition ?? inferHandlePosition(source, target, 'source');
  const targetPosition =
    options?.targetPosition ?? inferHandlePosition(source, target, 'target');

  if (hasStepOffsets(options)) {
    const fanned = buildCenterAnchoredStepPoints(source, target, {
      ...options,
      sourcePosition,
      targetPosition,
    });
    if (fanned) {
      return pointsToStepPath(fanned);
    }
  }

  // Horizontal exit → vertical mid → horizontal enter (and vice versa)
  const horizontalSource = sourcePosition === 'left' || sourcePosition === 'right';
  const horizontalTarget = targetPosition === 'left' || targetPosition === 'right';

  if (horizontalSource && horizontalTarget) {
    const midX = (source.x + target.x) / 2;
    return `M ${source.x},${source.y} L ${midX},${source.y} L ${midX},${target.y} L ${target.x},${target.y}`;
  }

  if (!horizontalSource && !horizontalTarget) {
    const midY = (source.y + target.y) / 2;
    return `M ${source.x},${source.y} L ${source.x},${midY} L ${target.x},${midY} L ${target.x},${target.y}`;
  }

  // Mixed: go out in source direction then into target
  if (horizontalSource) {
    return `M ${source.x},${source.y} L ${target.x},${source.y} L ${target.x},${target.y}`;
  }
  return `M ${source.x},${source.y} L ${source.x},${target.y} L ${target.x},${target.y}`;
}

export function getSmoothStepPath(
  source: XYPosition,
  target: XYPosition,
  borderRadiusOrOptions: number | StepPathOptions = 5
): string {
  const opts: StepPathOptions =
    typeof borderRadiusOrOptions === 'number'
      ? { borderRadius: borderRadiusOrOptions }
      : borderRadiusOrOptions || {};
  const borderRadius = opts.borderRadius ?? 5;
  const sourcePosition =
    opts.sourcePosition ?? inferHandlePosition(source, target, 'source');
  const targetPosition =
    opts.targetPosition ?? inferHandlePosition(source, target, 'target');

  if (hasStepOffsets(opts)) {
    const fanned = buildCenterAnchoredStepPoints(source, target, {
      ...opts,
      sourcePosition,
      targetPosition,
    });
    if (fanned) {
      return pointsToSmoothStepPath(fanned, borderRadius);
    }
  }

  const { x: sx, y: sy } = source;
  const { x: tx, y: ty } = target;

  if (Math.abs(sx - tx) < 2 * borderRadius && Math.abs(sy - ty) < 2 * borderRadius) {
    return getStepPath(source, target, { sourcePosition, targetPosition });
  }

  const horizontalSource = sourcePosition === 'left' || sourcePosition === 'right';

  if (horizontalSource) {
    const midX = (sx + tx) / 2;
    const dirY = ty > sy ? 1 : -1;
    const dirX = tx > sx ? 1 : -1;
    if (Math.abs(sy - ty) < 2 * borderRadius) {
      return getStepPath(source, target, { sourcePosition, targetPosition });
    }
    return `
      M ${sx},${sy}
      L ${midX - borderRadius * dirX},${sy}
      Q ${midX},${sy} ${midX},${sy + borderRadius * dirY}
      L ${midX},${ty - borderRadius * dirY}
      Q ${midX},${ty} ${midX + borderRadius * dirX},${ty}
      L ${tx},${ty}
    `.replace(/\s+/g, ' ').trim();
  }

  const midY = (sy + ty) / 2;
  const dirX = tx > sx ? 1 : -1;
  const dirY = ty > sy ? 1 : -1;
  if (Math.abs(sx - tx) < 2 * borderRadius) {
    return getStepPath(source, target, { sourcePosition, targetPosition });
  }
  return `
    M ${sx},${sy}
    L ${sx},${midY - borderRadius * dirY}
    Q ${sx},${midY} ${sx + borderRadius * dirX},${midY}
    L ${tx - borderRadius * dirX},${midY}
    Q ${tx},${midY} ${tx},${midY + borderRadius * dirY}
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

  let totalLength = 0;
  const segments: { length: number; start: XYPosition; end: XYPosition }[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    segments.push({ length, start, end });
    totalLength += length;
  }

  let half = totalLength / 2;
  for (const seg of segments) {
    if (half <= seg.length) {
      const t = seg.length === 0 ? 0 : half / seg.length;
      return {
        x: seg.start.x + (seg.end.x - seg.start.x) * t,
        y: seg.start.y + (seg.end.y - seg.start.y) * t,
      };
    }
    half -= seg.length;
  }

  return points[points.length - 1];
}
