import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SearchControlsComponent } from './search-controls.component';
import { SearchService, SearchState } from '../../services/search.service';

describe('SearchControlsComponent', () => {
  let component: SearchControlsComponent;
  let fixture: ComponentFixture<SearchControlsComponent>;
  let mockSearchService: jasmine.SpyObj<SearchService>;
  let stateSubject: BehaviorSubject<SearchState>;

  const initialState: SearchState = {
    query: '',
    results: [],
    currentIndex: -1,
    totalResults: 0
  };

  beforeEach(async () => {
    stateSubject = new BehaviorSubject<SearchState>(initialState);
    mockSearchService = jasmine.createSpyObj('SearchService', ['search', 'clearSearch', 'nextResult', 'previousResult']);
    (mockSearchService as any).state$ = stateSubject.asObservable();

    await TestBed.configureTestingModule({
      imports: [SearchControlsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: SearchService, useValue: mockSearchService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update state and emit searchResults on state$ update', () => {
    spyOn(component.searchResults, 'emit');
    const newState: SearchState = {
      query: 'test',
      results: [{ id: 'node1', label: 'Test Node', type: 'default', position: { x: 0, y: 0 } }],
      currentIndex: 0,
      totalResults: 1
    };

    spyOn(component.resultSelected, 'emit');
    stateSubject.next(newState);

    expect(component.searchState).toEqual(newState);
    expect(component.searchResults.emit).toHaveBeenCalledWith(newState.results);
    expect(component.resultSelected.emit).toHaveBeenCalledWith(newState.results[0]);
  });

  it('should call search on searchService onSearchChange()', () => {
    component.searchQuery = 'query';
    component.nodes = [];
    component.onSearchChange();
    expect(mockSearchService.search).toHaveBeenCalledWith('query', []);
  });

  it('should clear query and searchService state onClear()', () => {
    component.searchQuery = 'active';
    component.onClear();
    expect(component.searchQuery).toBe('');
    expect(mockSearchService.clearSearch).toHaveBeenCalled();
  });

  it('should call nextResult on onNext() and emit if result returned', () => {
    const fakeNode: any = { id: 'node2' };
    mockSearchService.nextResult.and.returnValue(fakeNode);
    spyOn(component.resultSelected, 'emit');

    component.onNext();
    expect(mockSearchService.nextResult).toHaveBeenCalled();
    expect(component.resultSelected.emit).toHaveBeenCalledWith(fakeNode);
  });

  it('should call previousResult on onPrevious() and emit if result returned', () => {
    const fakeNode: any = { id: 'node3' };
    mockSearchService.previousResult.and.returnValue(fakeNode);
    spyOn(component.resultSelected, 'emit');

    component.onPrevious();
    expect(mockSearchService.previousResult).toHaveBeenCalled();
    expect(component.resultSelected.emit).toHaveBeenCalledWith(fakeNode);
  });

  it('should calculate resultText correctly', () => {
    component.searchState = { query: '', results: [], currentIndex: -1, totalResults: 0 };
    component.searchQuery = '';
    expect(component.resultText).toBe('');

    component.searchQuery = 'abc';
    expect(component.resultText).toBe('No results');

    component.searchState = { query: 'abc', results: [{} as any], currentIndex: 0, totalResults: 1 };
    expect(component.resultText).toBe('1 of 1');
  });

  it('should handle keyboard navigation and shortcuts on onKeyDown', () => {
    spyOn(component, 'onNext');
    spyOn(component, 'onPrevious');
    spyOn(component, 'onClose');

    const enterEvent = jasmine.createSpyObj('KeyboardEvent', ['preventDefault'], { key: 'Enter', shiftKey: false });
    component.onKeyDown(enterEvent);
    expect(component.onNext).toHaveBeenCalled();
    expect(enterEvent.preventDefault).toHaveBeenCalled();

    const shiftEnterEvent = jasmine.createSpyObj('KeyboardEvent', ['preventDefault'], { key: 'Enter', shiftKey: true });
    component.onKeyDown(shiftEnterEvent);
    expect(component.onPrevious).toHaveBeenCalled();

    const escapeEvent = jasmine.createSpyObj('KeyboardEvent', ['preventDefault'], { key: 'Escape' });
    component.onKeyDown(escapeEvent);
    expect(component.onClose).toHaveBeenCalled();
  });

  it('should emit close event on onClose()', () => {
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should clear on destroy', () => {
    component.ngOnDestroy();
    expect(mockSearchService.clearSearch).toHaveBeenCalled();
  });
});
