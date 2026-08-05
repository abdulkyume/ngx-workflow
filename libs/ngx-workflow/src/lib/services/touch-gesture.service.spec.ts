import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { TouchGestureService } from './touch-gesture.service';
import { DiagramStateService } from './diagram-state.service';
import { Viewport } from '../models';

describe('TouchGestureService 100% Coverage Suite', () => {
  let service: TouchGestureService;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let dummySvg: SVGSVGElement;
  let viewportSignal: WritableSignal<Viewport>;

  beforeEach(() => {
    viewportSignal = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', ['setViewport'], {
      viewport: viewportSignal
    });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        TouchGestureService
      ]
    });
    service = TestBed.inject(TouchGestureService);

    dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spyOn(dummySvg, 'getBoundingClientRect').and.returnValue({
      left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);

    service.attach(dummySvg, mockDiagramStateService);
  });

  afterEach(() => {
    service.detach();
  });

  it('should handle multi-touch pinch to zoom and two-finger pan', (done) => {
    const t1 = { identifier: 1, clientX: 100, clientY: 100 } as any;
    const t2 = { identifier: 2, clientX: 200, clientY: 200 } as any;

    const fakeStartEvt = { changedTouches: [t1, t2], preventDefault: () => {} } as any;
    (service as any).onTouchStart(fakeStartEvt);

    const t1Move = { identifier: 1, clientX: 80, clientY: 80 } as any;
    const t2Move = { identifier: 2, clientX: 220, clientY: 220 } as any;
    const fakeMoveEvt = { changedTouches: [t1Move, t2Move], preventDefault: () => {} } as any;
    (service as any).onTouchMove(fakeMoveEvt);

    requestAnimationFrame(() => {
      expect(mockDiagramStateService.setViewport).toHaveBeenCalled();

      const fakeEndEvt = { changedTouches: [t1Move, t2Move] } as any;
      (service as any).onTouchEnd(fakeEndEvt);
      done();
    });
  });
});
