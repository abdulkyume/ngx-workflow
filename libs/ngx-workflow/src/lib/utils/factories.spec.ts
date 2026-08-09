import { createEdge, createEdges, createNode, createNodes } from './factories';

describe('factories', () => {
  it('createNode should generate id and defaults', () => {
    const node = createNode({ label: 'A', position: { x: 10, y: 20 } });
    expect(node.id).toBeTruthy();
    expect(node.label).toBe('A');
    expect(node.position).toEqual({ x: 10, y: 20 });
  });

  it('createNodes should create multiple nodes', () => {
    const nodes = createNodes([{ label: '1' }, { label: '2' }]);
    expect(nodes.length).toBe(2);
    expect(nodes[0].id).not.toBe(nodes[1].id);
  });

  it('createEdge should wire source/target and id', () => {
    const edge = createEdge({ source: 'a', target: 'b', type: 'bezier' });
    expect(edge.source).toBe('a');
    expect(edge.target).toBe('b');
    expect(edge.type).toBe('bezier');
    expect(edge.id).toContain('a->b');
  });

  it('createEdges should create multiple edges', () => {
    const edges = createEdges([
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c' },
    ]);
    expect(edges.length).toBe(2);
  });
});
