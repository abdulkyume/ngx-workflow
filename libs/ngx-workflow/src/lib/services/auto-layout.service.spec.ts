import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AutoLayoutService } from './auto-layout.service';
import { Node, Edge } from '../models';

describe('AutoLayoutService 100% Coverage Suite', () => {
  let service: AutoLayoutService;

  const n1: Node = { id: '1', type: 'default', position: { x: 0, y: 0 }, width: 100, height: 50 };
  const n2: Node = { id: '2', type: 'default', position: { x: 0, y: 0 }, width: 100, height: 50 };
  const e1: Edge = { id: 'e1', source: '1', target: '2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AutoLayoutService
      ]
    });
    service = TestBed.inject(AutoLayoutService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should return empty array for empty node input', () => {
    expect(service.calculateLayout([], [])).toEqual([]);
  });

  it('should calculate TB and LR auto layout for DAG nodes', () => {
    const layoutTB = service.calculateLayout([n1, n2], [e1], 'TB');
    expect(layoutTB.length).toBe(2);
    expect(layoutTB[0].position.y).toBe(0);
    expect(layoutTB[1].position.y).toBeGreaterThan(0);

    const layoutLR = service.calculateLayout([n1, n2], [e1], 'LR');
    expect(layoutLR.length).toBe(2);
    expect(layoutLR[1].position.x).toBeGreaterThan(0);
  });
});
