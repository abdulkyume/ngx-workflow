import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ExecutionControlsComponent } from './execution-controls.component';
import { ExecutionSimulatorService } from '../../services/execution-simulator.service';

describe('ExecutionControlsComponent', () => {
  let component: ExecutionControlsComponent;
  let fixture: ComponentFixture<ExecutionControlsComponent>;
  let mockSimulator: jasmine.SpyObj<ExecutionSimulatorService>;

  beforeEach(async () => {
    mockSimulator = jasmine.createSpyObj(
      'ExecutionSimulatorService',
      ['start', 'pause', 'resume', 'stop', 'step', 'setSpeed'],
      {
        isPlaying: signal(false),
        currentStepIndex: signal(-1),
        speed: signal(1),
        speedMs: signal(1000),
      }
    );

    await TestBed.configureTestingModule({
      imports: [ExecutionControlsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ExecutionSimulatorService, useValue: mockSimulator }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExecutionControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start playing when togglePlay is called and simulator is not playing and index is -1', () => {
    (mockSimulator.isPlaying as any).set(false);
    (mockSimulator.currentStepIndex as any).set(-1);

    component.togglePlay();
    expect(mockSimulator.start).toHaveBeenCalled();
  });

  it('should resume when togglePlay is called and simulator is paused mid-execution', () => {
    (mockSimulator.isPlaying as any).set(false);
    (mockSimulator.currentStepIndex as any).set(2);

    component.togglePlay();
    expect(mockSimulator.resume).toHaveBeenCalled();
  });

  it('should pause when togglePlay is called while simulator is playing', () => {
    (mockSimulator.isPlaying as any).set(true);

    component.togglePlay();
    expect(mockSimulator.pause).toHaveBeenCalled();
  });

  it('should update speed when onSpeedChange is called', () => {
    const fakeEvent = {
      target: { value: '2' }
    } as any;
    component.onSpeedChange(fakeEvent);
    expect(mockSimulator.setSpeed).toHaveBeenCalledWith(2);
  });
});
