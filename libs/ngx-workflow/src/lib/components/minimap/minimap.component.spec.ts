import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { MinimapComponent } from './minimap.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Node, Viewport } from '../../models';

describe('MinimapComponent 100% Coverage Suite', () => {
  let component: MinimapComponent;
  let fixture: ComponentFixture<MinimapComponent>;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let nodesSignal: WritableSignal<Node[]>;
  let viewportSignal: WritableSignal<Viewport>;
  let containerDimensionsSignal: WritableSignal<{ width: number; height: number }>;

  beforeEach(async () => {
    nodesSignal = signal<Node[]>([
      { id: '1', type: 'default', position: { x: 0, y: 0 }, width: 100, height: 50 },
      { id: '2', type: 'default', position: { x: 200, y: 150 }, width: 100, height: 50 }
    ]);
    viewportSignal = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
    containerDimensionsSignal = signal({ width: 800, height: 600 });

    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', ['setViewport'], {
      nodes: nodesSignal,
      viewport: viewportSignal,
      containerDimensions: containerDimensionsSignal,
    });

    await TestBed.configureTestingModule({
      imports: [MinimapComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DiagramStateService, useValue: mockDiagramStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MinimapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate bounds and viewBox correctly from nodes', () => {
    const b = component.bounds();
    expect(b.minX).toBe(0);
    expect(b.minY).toBe(0);
    expect(b.width).toBe(300);
    expect(b.height).toBe(200);

    const vb = component.viewBox();
    expect(vb).toBe('-50 -50 400 300');
  });

  it('should handle empty nodes array in bounds, viewBox, and viewportIndicator', () => {
    nodesSignal.set([]);
    fixture.detectChanges();

    expect(component.bounds()).toEqual({ minX: 0, minY: 0, width: 100, height: 100 });
    expect(component.viewBox()).toBe('0 0 100 100');
    expect(component.viewportIndicator()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  it('should calculate viewport indicator correctly', () => {
    const vi = component.viewportIndicator();
    expect(vi.x).toBe(0);
    expect(vi.y).toBe(0);
    expect(vi.width).toBe(800);
    expect(vi.height).toBe(600);
  });

  it('should return correct fill color for nodes', () => {
    const customNode: Node = {
      id: '3',
      type: 'default',
      position: { x: 0, y: 0 },
      data: { nodeColor: '#ff0000' }
    };
    expect(component.getNodeFill(customNode)).toBe('#ff0000');

    const styleNode: Node = {
      id: '4',
      type: 'default',
      position: { x: 0, y: 0 },
      style: { backgroundColor: '#00ff00' }
    };
    expect(component.getNodeFill(styleNode)).toBe('#00ff00');

    component.showNodeColors = false;
    expect(component.getNodeFill(customNode)).toBe(component.nodeColor);
  });

  it('should check if node is selected', () => {
    expect(component.isNodeSelected({ id: '1', type: 'default', position: { x: 0, y: 0 }, selected: true })).toBe(true);
    expect(component.isNodeSelected({ id: '2', type: 'default', position: { x: 0, y: 0 } })).toBe(false);
  });

  it('should handle onMinimapClick', () => {
    const dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spyOn(dummySvg, 'getBoundingClientRect').and.returnValue({
      left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);

    const fakeClickEvent = {
      currentTarget: dummySvg,
      clientX: 100,
      clientY: 75
    } as any;

    component.onMinimapClick(fakeClickEvent);
    expect(mockDiagramStateService.setViewport).toHaveBeenCalled();
  });

  it('should ignore onMinimapClick when dragging', () => {
    (component as any).isDragging = true;
    const dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const fakeClickEvent = { currentTarget: dummySvg } as any;

    component.onMinimapClick(fakeClickEvent);
    expect(mockDiagramStateService.setViewport).not.toHaveBeenCalled();
  });

  it('should handle viewport drag pan with mousemove and mouseup events', (done) => {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spyOn(svgEl, 'getBoundingClientRect').and.returnValue({
      left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);
    fixture.nativeElement.appendChild(svgEl);

    const fakeDownEvent = new MouseEvent('mousedown', { clientX: 50, clientY: 50 });
    spyOn(fakeDownEvent, 'preventDefault');
    spyOn(fakeDownEvent, 'stopPropagation');

    component.onViewportMouseDown(fakeDownEvent);
    expect((component as any).isDragging).toBe(true);

    const fakeMoveEvent = new MouseEvent('mousemove', { clientX: 70, clientY: 80 });
    window.dispatchEvent(fakeMoveEvent);

    requestAnimationFrame(() => {
      expect(mockDiagramStateService.setViewport).toHaveBeenCalled();

      const fakeUpEvent = new MouseEvent('mouseup');
      window.dispatchEvent(fakeUpEvent);
      expect((component as any).isDragging).toBe(false);

      component.ngOnDestroy();
      done();
    });
  });
});
