import {
  getStraightPath,
  getBezierPath,
  getStepPath,
  getSmoothStepPath,
  getSelfLoopPath,
  getSmartEdgePath,
  getWaypointPath,
  getPolylineMidpoint
} from './path-getters';
import { XYPosition } from '../models';

describe('path-getters utility functions', () => {
  const source: XYPosition = { x: 0, y: 0 };
  const target: XYPosition = { x: 100, y: 100 };

  describe('getStraightPath', () => {
    it('should format straight line path string', () => {
      const path = getStraightPath(source, target);
      expect(path).toBe('M 0,0 L 100,100');
    });
  });

  describe('getBezierPath', () => {
    it('should format cubic bezier path for left-right flow (legacy number API)', () => {
      const path = getBezierPath({ x: 0, y: 50 }, { x: 100, y: 50 }, 0);
      expect(path.startsWith('M 0,50 C')).toBeTrue();
      expect(path).toContain('100,50');
    });

    it('should curve downward when source is bottom and target is top', () => {
      const path = getBezierPath(
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { sourcePosition: 'bottom', targetPosition: 'top' }
      );
      // Control points should leave vertically from source (same x, larger y)
      expect(path).toMatch(/^M 50,0 C 50,/);
      expect(path).toContain('50,100');
    });

    it('should apply parallel-edge offset without switching to quadratic', () => {
      const path = getBezierPath(source, target, 20);
      expect(path).toContain('C');
      expect(path).not.toContain('Q');
    });
  });

  describe('getStepPath', () => {
    it('should format orthogonal step path for vertical flow', () => {
      const path = getStepPath(
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { sourcePosition: 'bottom', targetPosition: 'top' }
      );
      expect(path).toBe('M 50,0 L 50,50 L 50,50 L 50,100');
    });

    it('should format horizontal step path for left-right flow', () => {
      const path = getStepPath(
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { sourcePosition: 'right', targetPosition: 'left' }
      );
      expect(path).toBe('M 0,50 L 50,50 L 50,50 L 100,50');
    });
  });

  describe('getSmoothStepPath', () => {
    it('should fallback to step path when points are too close', () => {
      const closeTarget = { x: 2, y: 2 };
      const path = getSmoothStepPath(source, closeTarget, 10);
      expect(path.startsWith('M 0,0')).toBeTrue();
    });

    it('should format rounded smooth step path for distant points', () => {
      const path = getSmoothStepPath(source, target, 5);
      expect(path).toContain('Q');
    });
  });

  describe('getSelfLoopPath', () => {
    it('should return loop path for top handle', () => {
      const path = getSelfLoopPath(source, 'top', 30);
      expect(path).toBe('M 0,0 C -30,-60 30,-60 0,0');
    });

    it('should return loop path for right handle', () => {
      const path = getSelfLoopPath(source, 'right', 30);
      expect(path).toBe('M 0,0 C 60,-30 60,30 0,0');
    });

    it('should return loop path for bottom handle', () => {
      const path = getSelfLoopPath(source, 'bottom', 30);
      expect(path).toBe('M 0,0 C 30,60 -30,60 0,0');
    });

    it('should return loop path for left handle', () => {
      const path = getSelfLoopPath(source, 'left', 30);
      expect(path).toBe('M 0,0 C -60,30 -60,-30 0,0');
    });
  });

  describe('getSmartEdgePath', () => {
    it('should return empty string for empty path', () => {
      expect(getSmartEdgePath([])).toBe('');
    });

    it('should construct SVG path from list of points', () => {
      const points = [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 50 }];
      expect(getSmartEdgePath(points)).toBe('M 0,0 L 50,0 L 50,50');
    });
  });

  describe('getWaypointPath', () => {
    it('should return straight path if waypoints are empty', () => {
      expect(getWaypointPath(source, target, [])).toBe('M 0,0 L 100,100');
    });

    it('should include waypoints in SVG path string', () => {
      const waypoints = [{ x: 50, y: 20 }];
      expect(getWaypointPath(source, target, waypoints)).toBe('M 0,0 L 50,20 L 100,100');
    });
  });

  describe('getPolylineMidpoint', () => {
    it('should return first point if points length < 2', () => {
      expect(getPolylineMidpoint([source])).toEqual(source);
    });

    it('should compute exact midpoint along polyline segments', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 }
      ];
      expect(getPolylineMidpoint(points)).toEqual({ x: 50, y: 0 });
    });
  });
});
