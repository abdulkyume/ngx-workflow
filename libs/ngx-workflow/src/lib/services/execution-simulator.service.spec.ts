import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ExecutionSimulatorService } from './execution-simulator.service';
import { DiagramStateService } from './diagram-state.service';
import { Node, Edge } from '../models';

describe('ExecutionSimulatorService 100% Coverage Suite', () => {
  let service: ExecutionSimulatorService;
  let diagramState: DiagramStateService;

  const n1: Node = { id: 'n1', type: 'default', position: { x: 0, y: 0 } };
  const n2: Node = { id: 'n2', type: 'default', position: { x: 100, y: 100 } };
  const e1: Edge = { id: 'e1', source: 'n1', target: 'n2' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        DiagramStateService,
        ExecutionSimulatorService
      ]
    });
    service = TestBed.inject(ExecutionSimulatorService);
    diagramState = TestBed.inject(DiagramStateService);

    diagramState.nodes.set([n1, n2]);
    diagramState.edges.set([e1]);
  });

  afterEach(() => {
    service.pause();
  });

  it('should create and initialize in idle state', () => {
    expect(service.isPlaying()).toBe(false);
    expect(service.activeNodeId()).toBeNull();
  });

  it('should start execution and step through nodes topologically', (done) => {
    service.setSpeed(50);
    service.start();
    expect(service.isPlaying()).toBe(true);
    expect(service.activeNodeId()).toBe('n1');

    setTimeout(() => {
      expect(service.activeNodeId()).toBe('n2');
      service.pause();
      done();
    }, 100);
  });

  it('should support manual stepNext, stepBack, pause, resume, and setSpeed', () => {
    service.start();
    service.pause();
    expect(service.isPlaying()).toBe(false);

    service.resume();
    expect(service.isPlaying()).toBe(true);

    service.setSpeed(500);
    expect(service.speedMs()).toBe(500);

    service.stepNext();
    expect(service.activeNodeId()).toBe('n2');

    service.stepBack();
    expect(service.activeNodeId()).toBe('n1');

    service.stepBack();
    expect(service.activeNodeId()).toBeNull();
  });

  it('should set node status and payload', () => {
    service.setNodeStatus('n1', 'error', null, 'Failed node');
    const stateMap = service.executionStates();
    expect(stateMap.get('n1')?.status).toBe('error');
    expect(stateMap.get('n1')?.errorMsg).toBe('Failed node');
  });

  it('should handle empty diagram when starting', () => {
    diagramState.nodes.set([]);
    diagramState.edges.set([]);

    service.start();
    expect(service.isPlaying()).toBe(false);
  });
});
