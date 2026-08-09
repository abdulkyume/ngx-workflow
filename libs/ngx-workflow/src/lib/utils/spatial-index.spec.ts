import { SpatialIndex, computeVirtualizationBuffer } from './spatial-index';

describe('SpatialIndex', () => {
  it('queries nodes intersecting a viewport', () => {
    const index = new SpatialIndex(100);
    index.rebuild([
      { id: 'a', position: { x: 0, y: 0 }, width: 50, height: 50 },
      { id: 'b', position: { x: 500, y: 500 }, width: 50, height: 50 },
      { id: 'c', position: { x: 80, y: 80 }, width: 40, height: 40 },
    ]);

    const hits = index.query({ minX: -10, minY: -10, maxX: 120, maxY: 120 });
    expect(hits.has('a')).toBeTrue();
    expect(hits.has('c')).toBeTrue();
    expect(hits.has('b')).toBeFalse();
  });

  it('uses render position when present', () => {
    const index = new SpatialIndex(256);
    index.rebuild([
      {
        id: 'child',
        position: { x: 0, y: 0 },
        _renderPosition: { x: 1000, y: 1000 },
        width: 10,
        height: 10,
      },
    ]);
    const nearOrigin = index.query({ minX: 0, minY: 0, maxX: 50, maxY: 50 });
    const nearRender = index.query({ minX: 990, minY: 990, maxX: 1020, maxY: 1020 });
    expect(nearOrigin.has('child')).toBeFalse();
    expect(nearRender.has('child')).toBeTrue();
  });

  it('clears on rebuild', () => {
    const index = new SpatialIndex();
    index.rebuild([{ id: 'a', position: { x: 0, y: 0 } }]);
    expect(index.size).toBe(1);
    index.rebuild([]);
    expect(index.size).toBe(0);
  });
});

describe('computeVirtualizationBuffer', () => {
  it('returns base when adaptive is off', () => {
    expect(computeVirtualizationBuffer(500, 0.25, false)).toBe(500);
  });

  it('grows when zoomed out', () => {
    expect(computeVirtualizationBuffer(500, 0.5, true)).toBe(1000);
    expect(computeVirtualizationBuffer(500, 1, true)).toBe(500);
  });
});
