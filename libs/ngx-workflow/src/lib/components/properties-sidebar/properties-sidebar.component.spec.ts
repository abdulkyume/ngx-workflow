import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PropertiesSidebarComponent } from './properties-sidebar.component';
import { Node, Edge } from '../../models';

describe('PropertiesSidebarComponent', () => {
  let component: PropertiesSidebarComponent;
  let fixture: ComponentFixture<PropertiesSidebarComponent>;

  const mockNode: Node = {
    id: 'node-1',
    type: 'default',
    position: { x: 10, y: 20 },
    width: 150,
    height: 60,
    data: { label: 'Node Label' },
    style: { backgroundColor: '#ffffff' }
  };

  const mockEdge: Edge = {
    id: 'edge-1',
    source: 'node-1',
    target: 'node-2',
    label: 'Edge Label',
    type: 'bezier',
    animated: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertiesSidebarComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertiesSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return early when node or edge is null', () => {
    component.node = null;
    component.edge = null;
    spyOn(component.change, 'emit');
    spyOn(component.edgeChange, 'emit');

    component.updateLabel('test');
    component.updateX(5);
    component.updateY(5);
    component.updateBackgroundColor('#fff');
    component.updateLabelColor('#000');
    component.updateShapeType('circle');
    component.updatePorts(2);
    component.updateMaxConnectionsPerPort(1);
    component.updatePortMaxConnections('top', 1);

    component.updateEdgeLabel('test');
    component.updateEdgeType('straight');
    component.updateEdgeAnimated(true);
    component.updateEdgeColor('#000');
    component.updateEdgeWidth(2);
    component.updateEdgeLabelColor('#000');
    component.updateEdgeAnimationDuration('2s');
    component.updateEdgeAnimationColor('#000');
    component.updateEdgeAnimationType('dash');
    component.updateEdgeStrokeStyle('5,5');
    component.updateEdgeMarkerStart('arrow');
    component.updateEdgeMarkerEnd('arrow');

    expect(component.change.emit).not.toHaveBeenCalled();
    expect(component.edgeChange.emit).not.toHaveBeenCalled();
  });

  it('should emit node changes when updating node properties', () => {
    component.node = mockNode;
    spyOn(component.change, 'emit');

    component.updateLabel('New Title');
    expect(component.change.emit).toHaveBeenCalledWith({ label: 'New Title' });

    component.updateWidth(200);
    expect(component.change.emit).toHaveBeenCalledWith({ width: 200 });

    component.updateHeight(100);
    expect(component.change.emit).toHaveBeenCalledWith({ height: 100 });

    component.updateX(100);
    expect(component.change.emit).toHaveBeenCalledWith({ position: { x: 100, y: 20 } });

    component.updateY(80);
    expect(component.change.emit).toHaveBeenCalledWith({ position: { x: 10, y: 80 } });

    component.updateBackgroundColor('#ff0000');
    expect(component.change.emit).toHaveBeenCalledWith({ style: jasmine.objectContaining({ backgroundColor: '#ff0000' }) });

    component.updateLabelColor('#00ff00');
    expect(component.change.emit).toHaveBeenCalledWith({ style: jasmine.objectContaining({ color: '#00ff00' }) });

    component.updateShapeType('default');
    expect(component.change.emit).toHaveBeenCalledWith({ type: 'default', data: { label: 'Node Label' } });

    component.updateShapeType('circle');
    expect(component.change.emit).toHaveBeenCalledWith({ type: 'shape', data: { label: 'Node Label', type: 'circle' } });

    component.updatePorts(4);
    expect(component.change.emit).toHaveBeenCalledWith({ ports: 4 });

    component.updateMaxConnectionsPerPort(2);
    expect(component.change.emit).toHaveBeenCalledWith({ maxConnectionsPerPort: 2 });

    component.updateMaxConnectionsPerPort('');
    expect(component.change.emit).toHaveBeenCalledWith({ maxConnectionsPerPort: undefined });

    component.updatePortMaxConnections('top', 1);
    expect(component.change.emit).toHaveBeenCalledWith({
      handleConfig: { top: { maxConnections: 1 } }
    });
  });

  it('should emit edge changes when updating edge properties', () => {
    component.edge = mockEdge;
    spyOn(component.edgeChange, 'emit');

    component.updateEdgeLabel('Updated Edge');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ label: 'Updated Edge' });

    component.updateEdgeType('straight');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ type: 'straight' });

    component.updateEdgeAnimated(true);
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ animated: true });

    component.updateEdgeColor('#00ff00');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ style: jasmine.objectContaining({ stroke: '#00ff00' }) });

    component.updateEdgeWidth(3);
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ style: jasmine.objectContaining({ strokeWidth: '3' }) });

    component.updateEdgeLabelColor('#ff00ff');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ labelStyle: { fill: '#ff00ff', color: '#ff00ff' } });

    component.updateEdgeAnimationDuration('1.5s');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ animationDuration: '1.5s' });

    component.updateEdgeAnimationColor('#123456');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ animationStyle: { fill: '#123456' } });

    component.updateEdgeAnimationType('dot');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ animationType: 'dot' });

    component.updateEdgeStrokeStyle('4 4');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ style: jasmine.objectContaining({ strokeDasharray: '4 4' }) });

    component.updateEdgeMarkerStart('arrowhead');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ markerStart: 'arrowhead' });

    component.updateEdgeMarkerEnd('arrowhead');
    expect(component.edgeChange.emit).toHaveBeenCalledWith({ markerEnd: 'arrowhead' });
  });
});
