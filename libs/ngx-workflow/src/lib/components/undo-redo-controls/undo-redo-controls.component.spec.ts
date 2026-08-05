import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { UndoRedoControlsComponent } from './undo-redo-controls.component';
import { DiagramStateService } from '../../services/diagram-state.service';

describe('UndoRedoControlsComponent', () => {
  let component: UndoRedoControlsComponent;
  let fixture: ComponentFixture<UndoRedoControlsComponent>;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;

  beforeEach(async () => {
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', ['undo', 'redo'], {
      undoRedoService: {
        canUndo: signal(true),
        canRedo: signal(false),
      },
    });

    await TestBed.configureTestingModule({
      imports: [UndoRedoControlsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DiagramStateService, useValue: mockDiagramStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UndoRedoControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect canUndo and canRedo state signals', () => {
    expect(component.canUndo()).toBe(true);
    expect(component.canRedo()).toBe(false);
  });

  it('should call undo on diagramStateService when onUndo is triggered', () => {
    component.onUndo();
    expect(mockDiagramStateService.undo).toHaveBeenCalled();
  });

  it('should call redo on diagramStateService when onRedo is triggered', () => {
    component.onRedo();
    expect(mockDiagramStateService.redo).toHaveBeenCalled();
  });
});
