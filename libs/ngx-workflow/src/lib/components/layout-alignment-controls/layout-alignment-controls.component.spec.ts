import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { LayoutAlignmentControlsComponent } from './layout-alignment-controls.component';
import { DiagramStateService } from '../../services/diagram-state.service';

describe('LayoutAlignmentControlsComponent', () => {
  let component: LayoutAlignmentControlsComponent;
  let fixture: ComponentFixture<LayoutAlignmentControlsComponent>;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let selectedNodesSignal = signal<any[]>([]);

  beforeEach(async () => {
    selectedNodesSignal = signal<any[]>([]);
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', ['alignNodes', 'distributeNodes'], {
      selectedNodes: selectedNodesSignal,
    });

    await TestBed.configureTestingModule({
      imports: [LayoutAlignmentControlsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DiagramStateService, useValue: mockDiagramStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutAlignmentControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute showAlignment correctly based on selectedNodes count', () => {
    expect(component.showAlignment()).toBe(false);

    selectedNodesSignal.set([{ id: '1' }, { id: '2' }]);
    fixture.detectChanges();
    expect(component.showAlignment()).toBe(true);
  });

  it('should compute showDistribution correctly based on selectedNodes count', () => {
    expect(component.showDistribution()).toBe(false);

    selectedNodesSignal.set([{ id: '1' }, { id: '2' }, { id: '3' }]);
    fixture.detectChanges();
    expect(component.showDistribution()).toBe(true);
  });

  it('should emit applyLayout when onApplyLayout is called', () => {
    spyOn(component.applyLayout, 'emit');
    component.onApplyLayout('force');
    expect(component.applyLayout.emit).toHaveBeenCalledWith('force');
  });

  it('should call alignNodes on diagramStateService', () => {
    component.align('center');
    expect(mockDiagramStateService.alignNodes).toHaveBeenCalledWith('center');
  });

  it('should call distributeNodes on diagramStateService', () => {
    component.distribute('horizontal');
    expect(mockDiagramStateService.distributeNodes).toHaveBeenCalledWith('horizontal');
  });
});
