import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SearchService } from './search.service';
import { Node } from '../models';

describe('SearchService', () => {
  let service: SearchService;

  const testNodes: Node[] = [
    { id: '1', type: 'default', label: 'Alpha Node', position: { x: 0, y: 0 } },
    { id: '2', type: 'default', data: { label: 'Beta Node' }, position: { x: 0, y: 0 } },
    { id: '3', type: 'default', label: 'Gamma Node', position: { x: 0, y: 0 } }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SearchService
      ]
    });
    service = TestBed.inject(SearchService);
  });

  it('should create and initialize state$', (done) => {
    service.state$.subscribe(state => {
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      done();
    });
  });

  it('should return empty results when query is whitespace', () => {
    const res = service.search('   ', testNodes);
    expect(res).toEqual([]);
    expect(service.getState().query).toBe('');
  });

  it('should search nodes by label and data.label', () => {
    const alphaRes = service.search('alpha', testNodes);
    expect(alphaRes.length).toBe(1);
    expect(alphaRes[0].id).toBe('1');

    const betaRes = service.search('beta', testNodes);
    expect(betaRes.length).toBe(1);
    expect(betaRes[0].id).toBe('2');
  });

  it('should navigate through search results using nextResult and previousResult', () => {
    service.search('node', testNodes); // Matches all 3
    expect(service.getState().totalResults).toBe(3);
    expect(service.getCurrentResult()?.id).toBe('1');

    const next1 = service.nextResult();
    expect(next1?.id).toBe('2');

    const next2 = service.nextResult();
    expect(next2?.id).toBe('3');

    const loopNext = service.nextResult(); // Wraps around to index 0
    expect(loopNext?.id).toBe('1');

    const prevWrap = service.previousResult(); // Wraps around to last index (2)
    expect(prevWrap?.id).toBe('3');
  });

  it('should return null when navigating results with empty state', () => {
    service.clearSearch();
    expect(service.nextResult()).toBeNull();
    expect(service.previousResult()).toBeNull();
    expect(service.getCurrentResult()).toBeNull();
  });
});
