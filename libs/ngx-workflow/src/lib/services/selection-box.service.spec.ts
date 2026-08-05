import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, ElementRef } from '@angular/core';
import { SelectionBoxService } from './selection-box.service';
import { DiagramStateService } from './diagram-state.service';

describe('SelectionBoxService 100% Coverage Suite', () => {
  let service: SelectionBoxService;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let dummySvg: SVGSVGElement;
  let dummyRef: ElementRef<SVGSVGElement>;

  beforeEach(() => {
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', [
      'startBoxSelection', 'updateBoxSelection', 'endBoxSelection'
    ]);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SelectionBoxService
      ]
    });
    service = TestBed.inject(SelectionBoxService);

    dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    dummySvg.setPointerCapture = jasmine.createSpy('setPointerCapture');
    dummySvg.hasPointerCapture = jasmine.createSpy('hasPointerCapture').and.returnValue(true);
    dummySvg.releasePointerCapture = jasmine.createSpy('releasePointerCapture');
    spyOn(dummySvg, 'getBoundingClientRect').and.returnValue({
      left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);

    dummyRef = new ElementRef(dummySvg);
    service.attach(dummyRef, mockDiagramStateService);
  });

  afterEach(() => {
    service.detach();
  });

  it('should start, update, and end rubber-band selection', () => {
    const fakeDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    service.startSelecting(fakeDown, { x: 0, y: 0, zoom: 1 });

    expect(service.isSelecting).toBe(true);
    expect(mockDiagramStateService.startBoxSelection).toHaveBeenCalledWith(100, 100);

    const fakeMove = new PointerEvent('pointermove', { clientX: 200, clientY: 200 });
    service.updateSelection(fakeMove, { x: 0, y: 0, zoom: 1 });
    expect(mockDiagramStateService.updateBoxSelection).toHaveBeenCalledWith(200, 200);

    const fakeUp = new PointerEvent('pointerup');
    service.endSelecting(fakeUp);
    expect(service.isSelecting).toBe(false);
    expect(mockDiagramStateService.endBoxSelection).toHaveBeenCalled();
  });

  it('should support manual startBoxSelection, updateBoxSelection, stopBoxSelection, and getSelectionBox', () => {
    service.startBoxSelection(10, 10);
    expect(service.isBoxSelecting).toBe(true);

    const fakeMove = new PointerEvent('pointermove', { clientX: 110, clientY: 110 });
    service.updateBoxSelection(fakeMove, { x: 0, y: 0, zoom: 1 });

    const box = service.getSelectionBox();
    expect(box).toEqual({ x: 10, y: 10, width: 100, height: 100 });

    service.stopBoxSelection();
    expect(service.isBoxSelecting).toBe(false);
  });
});
