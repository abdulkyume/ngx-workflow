import { PathFinder } from './path-finder';

describe('PathFinder', () => {
  const nodes = [
    { id: 'n1', x: 100, y: 100, width: 100, height: 50 },
    { id: 'n2', x: 300, y: 100, width: 100, height: 50 }
  ];

  it('should instantiate PathFinder with node obstacles', () => {
    const pf = new PathFinder(nodes);
    expect(pf).toBeTruthy();
  });

  it('should find path avoiding obstacles between start and target', () => {
    const pf = new PathFinder(nodes);
    const start = { x: 50, y: 125 };
    const end = { x: 450, y: 125 };

    const path = pf.findPath(start, end);
    expect(path.length).toBeGreaterThanOrEqual(2);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(end);
  });

  it('should return fallback straight line path when start or end is out of bounds', () => {
    const pf = new PathFinder(nodes);
    const start = { x: -10000, y: -10000 };
    const end = { x: 450, y: 125 };

    const path = pf.findPath(start, end);
    expect(path).toEqual([start, end]);
  });
});
