import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NodeToolbarComponent, ToolbarPosition, ToolbarAlign } from './node-toolbar.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Node } from '../../models';

describe('NodeToolbarComponent', () => {
  let component: NodeToolbarComponent;
  let fixture: ComponentFixture<NodeToolbarComponent>;
  let diagramStateService: DiagramStateService;
  let dummySvg: SVGSVGElement;

  const testNode: Node = {
    id: 'node-1',
    type: 'default',
    position: { x: 50, y: 50 },
    width: 100,
    height: 50
  };

  beforeEach(async () => {
    dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spyOn(dummySvg, 'getBoundingClientRect').and.returnValue({
      left: 0, top: 0, width: 1000, height: 800, right: 1000, bottom: 800, x: 0, y: 0, toJSON: () => {}
    } as DOMRect);

    await TestBed.configureTestingModule({
      imports: [NodeToolbarComponent],
      providers: [
        provideZonelessChangeDetection(),
        DiagramStateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NodeToolbarComponent);
    component = fixture.componentInstance;
    diagramStateService = TestBed.inject(DiagramStateService);
    diagramStateService.el = { nativeElement: dummySvg };
    diagramStateService.nodes.set([testNode]);

    component.nodeId = 'node-1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return {x:0, y:0} if node or svg element is missing', () => {
    component.nodeId = 'non-existent';
    expect(component.toolbarPosition()).toEqual({ x: 0, y: 0 });

    component.nodeId = 'node-1';
    diagramStateService.el = null as any;
    expect(component.toolbarPosition()).toEqual({ x: 0, y: 0 });
  });

  it('should compute toolbarPosition for top, bottom, left, right with all alignment combinations', () => {
    const positions: ToolbarPosition[] = ['top', 'bottom', 'left', 'right'];
    const aligns: ToolbarAlign[] = ['start', 'center', 'end'];

    positions.forEach(pos => {
      aligns.forEach(align => {
        component.position = pos;
        component.align = align;
        fixture.detectChanges();
        const coords = component.toolbarPosition();
        expect(coords.x).toBeDefined();
        expect(coords.y).toBeDefined();
      });
    });
  });

  it('should toggle visibility using shouldShow computed signal when node is selected', () => {
    diagramStateService.selectNodes(['node-1']);
    fixture.detectChanges();
    expect(component.shouldShow()).toBe(true);

    diagramStateService.clearSelection();
    fixture.detectChanges();
    expect(component.shouldShow()).toBe(false);
  });
});
