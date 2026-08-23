import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, SimpleChange } from '@angular/core';
import { DiagramComponent } from './diagram.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { ContextMenuService } from '../../services/context-menu.service';
import { ThemeService } from '../../services/theme.service';
import { ExportService } from '../../services/export.service';
import { AutoSaveService } from '../../services/auto-save.service';
import { TouchGestureService } from '../../services/touch-gesture.service';
import { CanvasPanZoomService } from '../../services/canvas-pan-zoom.service';
import { NodeDragService } from '../../services/node-drag.service';
import { SelectionBoxService } from '../../services/selection-box.service';
import { HandleRegistryService } from '../../services/handle-registry.service';
import { LayoutService } from '../../services/layout.service';
import { Node, Edge } from '../../models';

describe('DiagramComponent Complete 100% Coverage Suite', () => {
  let component: DiagramComponent;
  let fixture: ComponentFixture<DiagramComponent>;
  let diagramState: DiagramStateService;
  let exportService: jasmine.SpyObj<ExportService>;

  const n1: Node = { id: 'n1', type: 'default', position: { x: 10, y: 10 }, width: 100, height: 50, selected: false };
  const n2: Node = { id: 'n2', type: 'default', position: { x: 200, y: 200 }, width: 100, height: 50, selected: false };
  const e1: Edge = { id: 'e1', source: 'n1', target: 'n2', selected: false, type: 'bezier' };

  beforeEach(async () => {
    exportService = jasmine.createSpyObj('ExportService', ['exportToPNG', 'exportToSVG', 'copyToClipboard']);

    await TestBed.configureTestingModule({
      imports: [DiagramComponent],
      providers: [
        provideZonelessChangeDetection(),
        DiagramStateService,
        ContextMenuService,
        ThemeService,
        { provide: ExportService, useValue: exportService },
        AutoSaveService,
        TouchGestureService,
        CanvasPanZoomService,
        NodeDragService,
        SelectionBoxService,
        HandleRegistryService,
        LayoutService,
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DiagramComponent);
    component = fixture.componentInstance;
    // Diagram provides its own DiagramStateService — use the component injector
    diagramState = fixture.debugElement.injector.get(DiagramStateService);
    fixture.componentRef.setInput('nodes', [n1, n2]);
    fixture.componentRef.setInput('edges', [e1]);
    diagramState.nodes.set([n1, n2]);
    diagramState.edges.set([e1]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle ControlValueAccessor writeValue, registerOnChange, registerOnTouched, setDisabledState', () => {
    const fn1 = jasmine.createSpy('fn1');
    const fn2 = jasmine.createSpy('fn2');
    component.registerOnChange(fn1);
    component.registerOnTouched(fn2);
    component.setDisabledState(true);
    expect(component.isDisabled).toBe(true);

    component.writeValue({ nodes: [n1], edges: [e1], viewport: { x: 5, y: 5, zoom: 1 } });
    expect(diagramState.nodes()).toEqual([n1]);
  });

  it('should handle node mouse hover and pointer events', () => {
    spyOn(component.nodeMouseEnter, 'emit');
    spyOn(component.nodeMouseLeave, 'emit');
    spyOn(component.nodeMouseMove, 'emit');
    spyOn(component.nodeDoubleClick, 'emit');

    const fakeEvt = new MouseEvent('mousemove');
    component.onNodeMouseEnter(fakeEvt, n1);
    expect(component.nodeMouseEnter.emit).toHaveBeenCalledWith(n1);

    component.onNodeMouseLeave(fakeEvt, n1);
    expect(component.nodeMouseLeave.emit).toHaveBeenCalledWith(n1);

    component.onNodeMouseMove(fakeEvt, n1);
    expect(component.nodeMouseMove.emit).toHaveBeenCalledWith({ node: n1, event: fakeEvt });

    // Default: showPropertiesSidebar is false so selectedNodeForEditing remains null
    component.onNodeDoubleClick(fakeEvt, n1);
    expect(component.nodeDoubleClick.emit).toHaveBeenCalledWith(n1);
    expect(component.selectedNodeForEditing).toBeNull();

    // When showPropertiesSidebar is true:
    (component as any).showPropertiesSidebar = () => true;
    component.onNodeDoubleClick(fakeEvt, n1);
    expect(component.selectedNodeForEditing).toEqual(n1);
  });

  it('should handle edge mouse enter and mouse leave events', () => {
    spyOn(component.edgeMouseEnter, 'emit');
    spyOn(component.edgeMouseLeave, 'emit');

    component.onEdgeMouseEnter(new MouseEvent('mouseenter'), e1);
    expect(component.edgeMouseEnter.emit).toHaveBeenCalledWith(e1);

    component.onEdgeMouseLeave(new MouseEvent('mouseleave'), e1);
    expect(component.edgeMouseLeave.emit).toHaveBeenCalledWith(e1);
  });

  it('should handle context menu events via onContextMenu for canvas and node', () => {
    spyOn(component.contextMenu, 'emit');

    const fakeCanvasTarget = document.createElement('div');
    const fakeCanvasEvt = new MouseEvent('contextmenu');
    Object.defineProperty(fakeCanvasEvt, 'target', { value: fakeCanvasTarget });
    component.onContextMenu(fakeCanvasEvt);
    expect(component.contextMenu.emit).toHaveBeenCalled();

    const fakeNodeTarget = document.createElement('div');
    fakeNodeTarget.classList.add('ngx-workflow__node');
    fakeNodeTarget.dataset['id'] = 'n1';
    const fakeNodeEvt = new MouseEvent('contextmenu');
    Object.defineProperty(fakeNodeEvt, 'target', { value: fakeNodeTarget });
    component.onContextMenu(fakeNodeEvt);
    expect(component.contextMenu.emit).toHaveBeenCalled();
  });

  it('should handle sidebar editing and property changes', () => {
    component.selectedNodeForEditing = n1;
    component.onPropertiesChange({ label: 'Edited N1', ports: 2 });
    expect(diagramState.nodes()[0].label).toBe('Edited N1');

    component.selectedEdgeForEditing = e1;
    component.onEdgePropertiesChange({ label: 'Edited E1' });
    expect(diagramState.edges()[0].label).toBe('Edited E1');

    component.closeSidebar();
    expect(component.selectedNodeForEditing).toBeNull();
    expect(component.selectedEdgeForEditing).toBeNull();
  });

  it('should handle edge label editing (updateEdgeLabel, onEdgeLabelInput, onEdgeLabelBlur)', () => {
    component.editingEdgeId = 'e1';
    component.onEdgeLabelInput({ target: { value: 'New Label' } } as any);
    expect(component.editingEdgeLabel).toBe('New Label');

    component.onEdgeLabelBlur(e1);
    expect(diagramState.edges()[0].label).toBe('New Label');
    expect(component.editingEdgeId).toBeNull();

    component.updateEdgeLabel(e1, 'Direct Label');
    expect(diagramState.edges()[0].label).toBe('Direct Label');
  });

  it('should compute SVG edge paths for straight, bezier, step, and smoothstep edge types', () => {
    const straightEdge: Edge = { id: 's1', source: 'n1', target: 'n2', type: 'straight' };
    const stepEdge: Edge = { id: 'st1', source: 'n1', target: 'n2', type: 'step' };
    const smoothStepEdge: Edge = { id: 'sm1', source: 'n1', target: 'n2', type: 'smoothstep' };

    expect(component.getEdgePath(straightEdge)).toBeDefined();
    expect(component.getEdgePath(e1)).toBeDefined();
    expect(component.getEdgePath(stepEdge)).toBeDefined();
    expect(component.getEdgePath(smoothStepEdge)).toBeDefined();
  });

  it('should handle keyboard shortcut listeners', () => {
    diagramState.selectNodes(['n1']);

    component.onDeleteKeyPress(new KeyboardEvent('keydown', { key: 'Delete' }));
    expect(diagramState.nodes().length).toBe(1);

    const undoEvt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
    spyOn(undoEvt, 'preventDefault');
    component.onUndoKeyPress(undoEvt);

    const redoEvt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true });
    spyOn(redoEvt, 'preventDefault');
    component.onRedoKeyPress(redoEvt);

    diagramState.nodes.set([n1, n2]);
    diagramState.selectNodes(['n1']);
    const frontEvt = new KeyboardEvent('keydown', { key: ']', ctrlKey: true });
    Object.defineProperty(frontEvt, 'target', { value: document.body });
    component.onBringToFrontKeyPress(frontEvt);

    const backEvt = new KeyboardEvent('keydown', { key: '[', ctrlKey: true });
    Object.defineProperty(backEvt, 'target', { value: document.body });
    component.onSendToBackKeyPress(backEvt);

    const raiseEvt = new KeyboardEvent('keydown', { key: ']', ctrlKey: true, shiftKey: true });
    Object.defineProperty(raiseEvt, 'target', { value: document.body });
    component.onRaiseLayerKeyPress(raiseEvt);

    const lowerEvt = new KeyboardEvent('keydown', { key: '[', ctrlKey: true, shiftKey: true });
    Object.defineProperty(lowerEvt, 'target', { value: document.body });
    component.onLowerLayerKeyPress(lowerEvt);

    const selectAllEvt = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
    Object.defineProperty(selectAllEvt, 'target', { value: document.body });
    component.onSelectAllKeyPress(selectAllEvt);

    const groupEvt = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true });
    Object.defineProperty(groupEvt, 'target', { value: document.body });
    component.onGroupKeyPress(groupEvt);

    const ungroupEvt = new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, shiftKey: true });
    Object.defineProperty(ungroupEvt, 'target', { value: document.body });
    component.onUngroupKeyPress(ungroupEvt);

    const arrowUpEvt = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    Object.defineProperty(arrowUpEvt, 'target', { value: document.body });
    component.onArrowKeyPress(arrowUpEvt);

    const spaceUpEvt = new KeyboardEvent('keyup', { code: 'Space' });
    component.onKeyUp(spaceUpEvt);
  });

  it('should handle wheel zoom events via onWheel', () => {
    const wheelEvt = new WheelEvent('wheel', { clientX: 100, clientY: 100, deltaY: -100 });
    spyOn(wheelEvt, 'preventDefault');
    component.onWheel(wheelEvt);
    expect(wheelEvt.preventDefault).toHaveBeenCalled();
  });

  it('should handle pointerdown, pointermove, pointerup, pointerleave on canvas element', () => {
    const dummyDiv = document.createElement('div');
    const downEvt = new PointerEvent('pointerdown', { clientX: 100, clientY: 100 });
    Object.defineProperty(downEvt, 'target', { value: dummyDiv });
    component.onPointerDown(downEvt);

    const moveEvt = new PointerEvent('pointermove', { clientX: 120, clientY: 120 });
    component.onPointerMove(moveEvt);

    const upEvt = new PointerEvent('pointerup');
    component.onPointerUp(upEvt);

    const leaveEvt = new PointerEvent('pointerleave');
    component.onPointerLeave(leaveEvt);
  });

  it('should handle drag and drop node creation on canvas', () => {
    const fakeDragOver = jasmine.createSpyObj('DragEvent', ['preventDefault'], {
      dataTransfer: { types: ['application/ngx-workflow-node'], dropEffect: '' }
    });

    component.onDragOver(fakeDragOver);

    const nodePayload = JSON.stringify({ type: 'default', label: 'New Node' });
    const fakeDrop = jasmine.createSpyObj('DragEvent', ['preventDefault'], {
      clientX: 300,
      clientY: 300,
      dataTransfer: {
        getData: (type: string) => type === 'application/ngx-workflow-node' ? nodePayload : ''
      }
    });

    component.onDrop(fakeDrop);
    expect(diagramState.nodes().length).toBe(3);
  });

  it('should calculate layout with all layout algorithms', async () => {
    await component.onApplyLayout('auto');
    expect(diagramState.nodes().length).toBe(2);

    await component.onApplyLayout('force');
    expect(diagramState.nodes().length).toBe(2);

    await component.onApplyLayout('hierarchical');
    expect(diagramState.nodes().length).toBe(2);

    await component.onApplyLayout('circular');
    expect(diagramState.nodes().length).toBe(2);
  });

  it('should manage version history snapshots', () => {
    component.saveVersion('Version Snapshot');
    const history = component.getVersionHistory();
    expect(history.length).toBe(1);

    component.clearVersionHistory();
    expect(component.getVersionHistory().length).toBe(0);
  });

  it('should delegate zoom and viewport operations', () => {
    component.zoomIn();
    expect(diagramState.viewport().zoom).toBeGreaterThan(1);

    component.zoomOut();
    expect(diagramState.viewport().zoom).toBeLessThan(1.5);

    component.resetZoom();
    expect(diagramState.viewport().zoom).toBe(1);

    expect(() => component.fitView()).not.toThrow();
  });

  it('should handle ARIA labels, node focus, blur, and keyboard navigation', () => {
    expect(component.getNodeAriaLabel(n1)).toContain('Node:');
    expect(component.getEdgeAriaLabel(e1)).toContain('Edge from');

    component.onNodeFocus(n1);
    expect(component.focusedNodeId()).toBe('n1');

    component.onNodeBlur(n1);
    expect(component.focusedNodeId()).toBeNull();

    const enterEvt = new KeyboardEvent('keydown', { key: 'Enter' });
    component.onNodeKeyDown(enterEvt, n1);
    expect(diagramState.nodes()[0].selected).toBe(true);
  });

  it('should support search, filter, and zoom change handlers', () => {
    component.onSearch({ target: { value: 'query' } } as any);
    expect(diagramState.searchQuery()).toBe('query');

    component.onFilterType({ target: { value: 'default' } } as any);
    expect(diagramState.filterType()).toBe('default');

    component.onZoomChange(1.5);
    expect(diagramState.viewport().zoom).toBe(1.5);
  });

  it('should support export to SVG, PNG, and JSON', async () => {
    const svgStr = component.exportToSVG('test.svg', false);
    expect(svgStr).toBeDefined();

    component.exportToJSON('test.json');

    await component.copyToClipboard();
    expect(exportService.copyToClipboard).toHaveBeenCalled();
  });
});
