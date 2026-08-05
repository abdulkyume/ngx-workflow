import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AutoSaveService } from './auto-save.service';
import { DiagramState } from '../models';

describe('AutoSaveService 100% Coverage Suite', () => {
  let service: AutoSaveService;

  const testState: DiagramState = {
    nodes: [{ id: '1', type: 'default', position: { x: 0, y: 0 } }],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        AutoSaveService
      ]
    });
    service = TestBed.inject(AutoSaveService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create and queue save with debounced persistence', (done) => {
    service.queueSave(testState);

    setTimeout(() => {
      const loaded = service.loadCurrentState();
      expect(loaded).toEqual(testState);
      done();
    }, 1100);
  });

  it('should save, retrieve, restore, and delete version snapshots', () => {
    service.saveVersion(testState, 'Initial Save');
    const history = service.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].description).toBe('Initial Save');

    const restored = service.restoreVersion(history[0].id);
    expect(restored).toEqual(testState);

    expect(service.restoreVersion('non-existent')).toBeNull();

    service.deleteVersion(history[0].id);
    expect(service.getHistory().length).toBe(0);
  });

  it('should cap version history to MAX_VERSIONS (10)', () => {
    for (let i = 0; i < 15; i++) {
      service.saveVersion({
        ...testState,
        viewport: { x: i, y: 0, zoom: 1 }
      }, `Version ${i}`);
    }

    const history = service.getHistory();
    expect(history.length).toBe(10);
  });

  it('should clear history and clear all storage', () => {
    service.saveVersion(testState, 'V1');
    service.clearHistory();
    expect(service.getHistory().length).toBe(0);

    service.saveVersion(testState, 'V2');
    service.queueSave(testState);
    service.clearAll();

    expect(service.loadCurrentState()).toBeNull();
    expect(service.getHistory().length).toBe(0);
  });
});
