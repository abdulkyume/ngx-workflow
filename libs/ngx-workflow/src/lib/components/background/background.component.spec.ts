import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { BackgroundComponent } from './background.component';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Viewport } from '../../models';

describe('BackgroundComponent', () => {
  let component: BackgroundComponent;
  let fixture: ComponentFixture<BackgroundComponent>;
  let mockDiagramStateService: jasmine.SpyObj<DiagramStateService>;
  let viewportSignal = signal<Viewport>({ x: 0, y: 0, zoom: 1 });

  beforeEach(async () => {
    viewportSignal = signal<Viewport>({ x: 10, y: 20, zoom: 1 });
    mockDiagramStateService = jasmine.createSpyObj('DiagramStateService', [], {
      viewport: viewportSignal,
    });

    await TestBed.configureTestingModule({
      imports: [BackgroundComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: DiagramStateService, useValue: mockDiagramStateService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default variant to dots and default inputs', () => {
    expect(component.variant()).toBe('dots');
    expect(component.gap()).toBe(20);
    expect(component.size()).toBe(1);
    expect(component.color()).toBe('var(--ngx-workflow-bg-pattern, #81818a)');
    expect(component.backgroundColor()).toBe('var(--ngx-workflow-bg, transparent)');
  });

  it('should compute patternTransform based on viewport signal', () => {
    expect(component.patternTransform()).toBe('translate(10, 20) scale(1)');

    viewportSignal.set({ x: 50, y: 100, zoom: 2 });
    fixture.detectChanges();
    expect(component.patternTransform()).toBe('translate(50, 100) scale(2)');
  });
});
