import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { Node, Edge, DiagramState } from '../models';

describe('DiagramStateService Complete 100% Coverage Suite', () => {
  let service: DiagramStateService;

  const n1: Node = { id: 'n1', type: 'default', position: { x: 10, y: 10 }, width: 100, height: 50 };
  const n2: Node = { id: 'n2', type: 'default', position: { x: 200, y: 200 }, width: 100, height: 50 };
  const n3: Node = { id: 'n3', type: 'default', position: { x: 400, y: 100 }, width: 100, height: 50 };
  const e1: Edge = { id: 'e1', source: 'n1', target: 'n2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DiagramStateService
      ]
    });
    service = TestBed.inject(DiagramStateService);
  });

  it('should set and get diagram state, and find single node via getNode', () => {
    const initialState: DiagramState = {
      nodes: [n1, n2],
      edges: [e1],
      viewport: { x: 10, y: 20, zoom: 1.5 }
    };

    service.setDiagramState(initialState);
    const retrieved = service.getDiagramState();
    expect(retrieved.nodes.length).toBe(2);
    expect(retrieved.viewport).toEqual({ x: 10, y: 20, zoom: 1.5 });
    expect(service.getNode('n1')?.id).toBe('n1');
    expect(service.getNode('non-existent')).toBeUndefined();
  });

  it('should add, update, and remove edges with duplicate prevention', () => {
    service.addNode(n1);
    service.addNode(n2);
    service.addEdge(e1);

    expect(service.edges().length).toBe(1);

    // Try adding duplicate edge
    service.addEdge(e1);
    expect(service.edges().length).toBe(1);

    service.updateEdge('e1', { label: 'Updated Edge', animated: true });
    expect(service.edges()[0].label).toBe('Updated Edge');

    service.removeEdge('e1');
    expect(service.edges().length).toBe(0);
  });

  it('should manage temporary preview edges', () => {
    service.addTempEdge({ id: 'temp1', source: 'n1', target: 'n2', sourceX: 0, sourceY: 0, targetX: 10, targetY: 10 });
    expect(service.tempEdges().length).toBe(1);

    service.updateTempEdgeTarget('temp1', { x: 50, y: 50 });
    expect(service.tempEdges()[0].targetX).toBe(50);
  });

  it('should handle focusNode, zoomIn, zoomOut, zoomTo, fitView, setCenter, and fitBounds', () => {
    service.setContainerDimensions({ width: 800, height: 600 });
    service.nodes.set([n1, n2]);

    service.focusNode('n1');
    expect(service.viewport().zoom).toBe(1.2);
    expect(service.selectedNodeIds()).toContain('n1');

    service.zoomIn({ step: 0.2 });
    expect(service.getZoom()).toBeGreaterThan(1.2);

    service.zoomOut({ step: 0.2 });
    expect(service.getZoom()).toBeLessThan(1.5);

    service.zoomTo(2.0, { center: { x: 100, y: 100 } });
    expect(service.getZoom()).toBe(2.0);

    service.fitView({ padding: 30 });
    expect(service.getViewport()).toBeDefined();

    service.setCenter(200, 200, { zoom: 1 });
    expect(service.viewport()).toBeDefined();
  });

  it('should support screenToFlowPosition and flowToScreenPosition with projected coordinates', () => {
    const dummySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    spyOn(dummySvg, 'getBoundingClientRect').and.returnValue({
      left: 10, top: 10, width: 800, height: 600, right: 810, bottom: 610, x: 10, y: 10, toJSON: () => {}
    } as DOMRect);

    service.el = { nativeElement: dummySvg };
    service.setViewport({ x: 0, y: 0, zoom: 1 });

    const flowPos = service.screenToFlowPosition({ x: 110, y: 110 });
    expect(flowPos).toEqual({ x: 100, y: 100 });

    const projected = service.project({ x: 110, y: 110 });
    expect(projected).toEqual({ x: 100, y: 100 });

    const screenPos = service.flowToScreenPosition({ x: 100, y: 100 });
    expect(screenPos).toEqual({ x: 110, y: 110 });
  });

  it('should handle smart deletion with auto-reconnection for single deleted node', () => {
    const middleNode: Node = { id: 'nMid', type: 'default', position: { x: 100, y: 100 }, selected: true };
    const edgeIn: Edge = { id: 'eIn', source: 'n1', target: 'nMid' };
    const edgeOut: Edge = { id: 'eOut', source: 'nMid', target: 'n2' };

    service.nodes.set([n1, middleNode, n2]);
    service.edges.set([edgeIn, edgeOut]);

    service.deleteSelectedElements();
    expect(service.nodes().find(n => n.id === 'nMid')).toBeUndefined();
    expect(service.edges().length).toBe(1);
    expect(service.edges()[0].source).toBe('n1');
    expect(service.edges()[0].target).toBe('n2');
  });

  it('should handle clipboard copy, paste, cut, and duplicate', () => {
    service.nodes.set([n1, n2]);
    service.edges.set([e1]);
    service.selectNodes(['n1', 'n2']);

    service.copy();
    service.paste();
    expect(service.nodes().length).toBe(4);

    service.selectAll();
    service.cut();
    expect(service.nodes().length).toBe(0);

    service.paste();
    expect(service.nodes().length).toBe(4);

    service.duplicate();
    expect(service.nodes().length).toBe(8);
  });

  it('should perform z-index operations (bringToFront, sendToBack, raiseLayer, lowerLayer, setNodeZIndex)', () => {
    service.nodes.set([n1, n2]);

    service.bringToFront('n1');
    expect(service.getNode('n1')?.zIndex).toBe(1);

    service.sendToBack('n1');
    expect(service.getNode('n1')?.zIndex).toBe(-1);

    service.raiseLayer('n1');
    expect(service.getNode('n1')?.zIndex).toBe(0);

    service.lowerLayer('n1');
    expect(service.getNode('n1')?.zIndex).toBe(-1);

    service.setNodeZIndex('n1', 10);
    expect(service.getNode('n1')?.zIndex).toBe(10);
  });

  it('should perform alignNodes across all alignments (left, right, center, top, bottom, middle)', () => {
    service.nodes.set([n1, n2, n3]);
    service.selectNodes(['n1', 'n2', 'n3']);

    service.alignNodes('left');
    service.alignNodes('right');
    service.alignNodes('center');
    service.alignNodes('top');
    service.alignNodes('bottom');
    service.alignNodes('middle');

    expect(service.nodes().length).toBe(3);
  });

  it('should perform distributeNodes horizontally and vertically', () => {
    service.nodes.set([n1, n2, n3]);
    service.selectNodes(['n1', 'n2', 'n3']);

    service.distributeNodes('horizontal');
    service.distributeNodes('vertical');

    expect(service.nodes().length).toBe(3);
  });

  it('should resizeNode, toggleGroup, and toggleGroupCollapse', () => {
    service.nodes.set([n1]);

    service.resizeNode('n1', 250, 120, { x: 15, y: 15 });
    expect(service.getNode('n1')?.width).toBe(250);
    expect(service.getNode('n1')?.height).toBe(120);

    const grp: Node = { id: 'g1', type: 'group', position: { x: 0, y: 0 }, expanded: true, collapsed: false };
    const child: Node = { id: 'c1', type: 'default', parentId: 'g1', position: { x: 10, y: 10 } };
    service.nodes.set([grp, child]);

    service.toggleGroup('g1');
    expect(service.getNode('g1')?.expanded).toBe(false);

    service.toggleGroupCollapse('g1');
    expect(service.getNode('g1')?.collapsed).toBe(true);
    expect((service.getNode('c1') as any)?.hidden).toBe(true);
  });

  it('should group, groupSelectedNodes, ungroupNodes, ungroup, reparentNode, and check isChildOf', () => {
    service.nodes.set([n1, n2]);
    service.selectNodes(['n1', 'n2']);

    const groupId = service.groupSelectedNodes('My Group');
    expect(groupId).toBeDefined();

    expect(service.isChildOf('n1', groupId!)).toBe(true);

    service.reparentNode('n1', undefined);
    expect(service.getNode('n1')?.parentId).toBeUndefined();

    service.groupNodes(['n2']);
    service.ungroupNodes(['n2']);

    if (groupId) {
      service.ungroup(groupId);
    }
  });

  it('should moveNode with node snapping and alignment guides', () => {
    service.setGridConfig(20, true);
    service.nodes.set([n1, n2]);

    service.moveNode('n1', { x: 18, y: 18 });
    expect(service.getNode('n1')?.position).toEqual({ x: 20, y: 20 });

    service.moveNodesByDelta(['n1'], 10, 10);
    expect(service.getNode('n1')?.position).toEqual({ x: 40, y: 40 });

    service.moveNodes([{ id: 'n1', position: { x: 60, y: 60 } }]);
    expect(service.getNode('n1')?.position).toEqual({ x: 60, y: 60 });
  });

  it('should support search, filter, selectAll, deselectAll, and deleteAll', () => {
    service.nodes.set([n1, n2]);
    service.edges.set([e1]);

    service.setSearchQuery('test');
    expect(service.searchQuery()).toBe('test');

    service.setFilterType('default');
    expect(service.filterType()).toBe('default');

    service.selectAllNodes();
    expect(service.selectedNodes().length).toBe(2);

    service.deselectAll();
    expect(service.selectedNodes().length).toBe(0);

    service.deleteAll();
    expect(service.nodes().length).toBe(0);
    expect(service.edges().length).toBe(0);
  });

  it('should manage selection box operations and intersection testing', () => {
    service.nodes.set([n1, n2]);
    service.startBoxSelection(0, 0);
    service.updateBoxSelection(300, 300);
    service.endBoxSelection();

    expect(service.selectedNodes().length).toBe(2);

    service.startBoxSelection(0, 0);
    service.cancelBoxSelection();
    expect(service.selectionBox()).toBeNull();
  });
});
