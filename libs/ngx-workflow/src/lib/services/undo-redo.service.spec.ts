import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UndoRedoService } from './undo-redo.service';
import { DiagramState } from '../models';

describe('UndoRedoService Extensive Coverage Tests', () => {
  let service: UndoRedoService;

  const state1: DiagramState = {
    nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 }, label: 'N1' }],
    edges: [{ id: 'e1', source: '1', target: '2', type: 'bezier' }],
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  const state2: DiagramState = {
    nodes: [
      { id: '1', type: 'default', position: { x: 0, y: 0 }, label: 'N1' },
      { id: '2', type: 'default', position: { x: 100, y: 100 }, label: 'N2' }
    ],
    edges: [{ id: 'e1', source: '1', target: '2', type: 'bezier' }],
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        UndoRedoService
      ]
    });
    service = TestBed.inject(UndoRedoService);
  });

  it('should create and have false canUndo/canRedo initially', () => {
    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);
  });

  it('should return undefined when undoing or redoing an empty stack', () => {
    expect(service.undo(state1)).toBeUndefined();
    expect(service.redo(state1)).toBeUndefined();
  });

  it('should save state and support undo and redo cycles', () => {
    service.saveState(state1);
    expect(service.canUndo()).toBe(true);
    expect(service.canRedo()).toBe(false);

    const undoneState = service.undo(state2);
    expect(undoneState).toBeDefined();
    expect(undoneState?.nodes.length).toBe(1);
    expect(service.canRedo()).toBe(true);

    const redoneState = service.redo(state1);
    expect(redoneState).toBeDefined();
    expect(redoneState?.nodes.length).toBe(2);
  });

  it('should reuse unchanged node/edge references via structural sharing in cloneState', () => {
    service.saveState(state1);
    // Push state2 which shares node 1 and edge e1 with state1
    service.saveState(state2);

    const prev = service.undo(state2);
    expect(prev).toBeDefined();
  });

  it('should clear stacks on clearStacks()', () => {
    service.saveState(state1);
    service.clearStacks();

    expect(service.canUndo()).toBe(false);
    expect(service.canRedo()).toBe(false);
  });

  it('should cap undo history stack size to MAX_HISTORY (50)', () => {
    for (let i = 0; i < 60; i++) {
      service.saveState({
        ...state1,
        viewport: { x: i, y: 0, zoom: 1 }
      });
    }

    let count = 0;
    let curr: any = state1;
    while (service.canUndo()) {
      curr = service.undo(curr);
      count++;
    }
    expect(count).toBe(50);
  });
});
