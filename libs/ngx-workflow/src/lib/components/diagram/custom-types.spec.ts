import { Component, Input } from '@angular/core';
import { Node } from '../../models/node.model';
import { Edge } from '../../models/edge.model';
import { createEdge, createNode } from '../../utils/factories';

@Component({
  standalone: true,
  template: `<div class="custom-node">{{ node.label }}</div>`,
})
class SpecCustomNodeComponent {
  @Input() node!: Node;
}

@Component({
  standalone: true,
  template: `<svg:path [attr.d]="path" />`,
})
class SpecCustomEdgeComponent {
  @Input() edge!: Edge;
  @Input() path = '';
}

describe('custom node/edge contracts', () => {
  it('createNode/createEdge produce usable graph entities', () => {
    const a = createNode({ id: 'a', label: 'A', type: 'custom', position: { x: 0, y: 0 } });
    const b = createNode({ id: 'b', label: 'B', position: { x: 100, y: 0 } });
    const e = createEdge({ id: 'e1', source: 'a', target: 'b', type: 'my-edge' });

    expect(a.type).toBe('custom');
    expect(a.selectable).toBeUndefined();
    expect(e.type).toBe('my-edge');
    expect(SpecCustomNodeComponent).toBeTruthy();
    expect(SpecCustomEdgeComponent).toBeTruthy();
    expect(b.id).toBe('b');
  });

  it('node model supports selectable and connectable flags', () => {
    const node = createNode({
      selectable: false,
      connectable: false,
      position: { x: 1, y: 2 },
    });
    expect(node.selectable).toBe(false);
    expect(node.connectable).toBe(false);
  });

  it('edge model supports multi-position labels', () => {
    const edge = createEdge({
      source: 'a',
      target: 'b',
      edgeLabels: { start: 'in', center: 'mid', end: 'out' },
    });
    expect(edge.edgeLabels?.start).toBe('in');
    expect(edge.edgeLabels?.end).toBe('out');
  });
});
