import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { LayoutService } from './layout.service';
import { Node, Edge } from '../models';

describe('LayoutService Unit Tests', () => {
  let service: LayoutService;

  const n1: Node = { id: '1', type: 'default', label: 'N1', position: { x: 0, y: 0 }, width: 100, height: 50 };
  const n2: Node = { id: '2', type: 'default', label: 'N2', position: { x: 0, y: 0 }, width: 100, height: 50 };
  const n3: Node = { id: '3', type: 'group', label: 'Group 1', position: { x: 0, y: 0 } };
  const n4: Node = { id: '4', type: 'default', label: 'N4', parentId: '3', position: { x: 0, y: 0 } };
  const e1: Edge = { id: 'e1', source: '1', target: '2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        LayoutService
      ]
    });
    service = TestBed.inject(LayoutService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate force-directed layout', () => {
    expect(service.calculateForceDirected([], [])).toEqual([]);

    const result = service.calculateForceDirected([n1, n2], [e1], { iterations: 10 });
    expect(result.length).toBe(2);
    expect(result[0].position.x).toBeDefined();
    expect(result[0].position.y).toBeDefined();
  });

  it('should calculate hierarchical layout across directions (TB, LR, BT, RL)', () => {
    expect(service.calculateHierarchical([], [])).toEqual([]);

    const tb = service.calculateHierarchical([n1, n2], [e1], { direction: 'TB' });
    expect(tb.length).toBe(2);

    const lr = service.calculateHierarchical([n1, n2], [e1], { direction: 'LR' });
    expect(lr.length).toBe(2);

    const bt = service.calculateHierarchical([n1, n2], [e1], { direction: 'BT' });
    expect(bt.length).toBe(2);

    const rl = service.calculateHierarchical([n1, n2], [e1], { direction: 'RL' });
    expect(rl.length).toBe(2);
  });

  it('should calculate circular layout with custom radius and sorting', () => {
    expect(service.calculateCircular([], [])).toEqual([]);

    const resId = service.calculateCircular([n2, n1], [], { sortBy: 'id', radius: 150 });
    expect(resId[0].id).toBe('1');

    const resType = service.calculateCircular([n2, n1], [], { sortBy: 'type' });
    expect(resType.length).toBe(2);
  });

  it('should apply ELK layout including parent-child hierarchy', async () => {
    const layouted = await service.applyElkLayout([n1, n2, n3, n4], [e1], { direction: 'RIGHT', spacing: 50 });
    expect(layouted.length).toBeGreaterThan(0);
  });
});
