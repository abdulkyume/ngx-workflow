import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, ElementRef } from '@angular/core';
import { NodeDragService } from './node-drag.service';
import { DiagramStateService } from './diagram-state.service';
import { Node } from '../models';

describe('NodeDragService 100% Coverage Suite', () => {
  let service: NodeDragService;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let dummySvg: SVGSVGElement;
  let dummyRef: ElementRef<SVGSVGElement>;

  const n1: Node = { id: 'n1', type: 'default', position: { x: 10, y: 10 }, selected: true };
  const n2: Node = { id: 'n2', type: 'default', position: { x: 50, y: 50 }, selected: true };

  beforeEach(() => {
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', [
      'onDragStart', 'onDragEnd', 'moveNode', 'moveNodes'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        NodeDragService
      ]
    });
    service = TestBed.inject(NodeDragService);

    dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dummySvg.setPointerCapture = jasmine.createSpy('setPointerCapture');
    dummySvg.hasPointerCapture = jasmine.createSpy('hasPointerCapture').and.returnValue(true);
    dummySvg.releasePointerCapture = jasmine.createSpy('releasePointerCapture');
    dummyRef = new ElementRef(dummySvg);

    service.attach(dummyRef, mockDiagramStateService);
  });

  afterEach(() => {
    service.detach();
  });

  it('should attach and start dragging single node', () => {
    const fakePointerDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    spyOn(fakePointerDown, 'stopPropagation');

    service.startDraggingNode(fakePointerDown, n1, [n1]);

    expect(service.isDraggingNode).toBe(true);
    expect(service.draggingNode).toEqual(n1);
    expect(mockDiagramStateService.onDragStart).toHaveBeenCalledWith(n1);
    expect(dummySvg.setPointerCapture).toHaveBeenCalled();
  });

  it('should start dragging multiple selected nodes', () => {
    const fakePointerDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    service.startDraggingNode(fakePointerDown, n1, [n1, n2]);

    expect(service.draggingNodes.length).toBe(2);
  });

  it('should perform dragging and trigger moveNode callback', (done) => {
    const fakePointerDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    service.startDraggingNode(fakePointerDown, n1, [n1]);

    const fakePointerMove = new PointerEvent('pointermove', { clientX: 120, clientY: 130 });
    spyOn(fakePointerMove, 'stopPropagation');

    const moveSpy = jasmine.createSpy('moveSpy');
    service.dragNode(fakePointerMove, { x: 0, y: 0, zoom: 1 }, moveSpy);

    requestAnimationFrame(() => {
      expect(mockDiagramStateService.moveNode).toHaveBeenCalledWith('n1', { x: 30, y: 40 });
      expect(moveSpy).toHaveBeenCalledWith(30, 40);

      service.stopDraggingNode(fakePointerDown);
      expect(service.isDraggingNode).toBe(false);
      expect(mockDiagramStateService.onDragEnd).toHaveBeenCalledWith(n1);
      done();
    });
  });

  it('should perform multi-node dragging via moveNodes', (done) => {
    const fakePointerDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    service.startDraggingNode(fakePointerDown, n1, [n1, n2]);

    const fakePointerMove = new PointerEvent('pointermove', { clientX: 110, clientY: 110 });
    service.dragNode(fakePointerMove, { x: 0, y: 0, zoom: 1 });

    requestAnimationFrame(() => {
      expect(mockDiagramStateService.moveNodes).toHaveBeenCalled();
      done();
    });
  });
});
