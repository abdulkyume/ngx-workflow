import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, ElementRef, signal, WritableSignal } from '@angular/core';
import { CanvasPanZoomService } from './canvas-pan-zoom.service';
import { DiagramStateService } from './diagram-state.service';
import { Viewport } from '../models';

describe('CanvasPanZoomService 100% Coverage Suite', () => {
  let service: CanvasPanZoomService;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let dummySvg: SVGSVGElement;
  let dummyRef: ElementRef<SVGSVGElement>;
  let viewportSignal: WritableSignal<Viewport>;

  beforeEach(() => {
    viewportSignal = signal<Viewport>({ x: 0, y: 0, zoom: 1 });

    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', ['setViewport'], {
      viewport: viewportSignal
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CanvasPanZoomService
      ]
    });
    service = TestBed.inject(CanvasPanZoomService);

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

  it('should handle wheel zoom events anchored to pointer location', () => {
    const wheelEvent = new WheelEvent('wheel', { clientX: 100, clientY: 100, deltaY: -100 });
    spyOn(wheelEvent, 'preventDefault');

    service.handleWheel(wheelEvent);
    expect(wheelEvent.preventDefault).toHaveBeenCalled();
    expect(mockDiagramStateService.setViewport).toHaveBeenCalled();
  });

  it('should start, update, and stop panning', () => {
    const pointerDown = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    service.startPanning(pointerDown);

    const pointerMove = new PointerEvent('pointermove', { clientX: 120, clientY: 130 });
    service.pan(pointerMove);
    expect(mockDiagramStateService.setViewport).toHaveBeenCalledWith({ x: 20, y: 30, zoom: 1 });

    const pointerUp = new PointerEvent('pointerup');
    service.stopPanning(pointerUp);
  });
});
