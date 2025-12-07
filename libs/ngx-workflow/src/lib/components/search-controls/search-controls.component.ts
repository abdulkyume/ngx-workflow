import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchService, SearchState } from '../../services/search.service';
import { Node } from '../../models';
import { Subscription } from 'rxjs';

@Component({
    selector: 'ngx-workflow-search-controls',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './search-controls.component.html',
    styleUrls: ['./search-controls.component.scss']
})
export class SearchControlsComponent implements OnInit, OnDestroy {
    @Input() nodes: Node[] = [];
    @Output() resultSelected = new EventEmitter<Node>();
    @Output() close = new EventEmitter<void>();
    @Output() searchResults = new EventEmitter<Node[]>();

    searchQuery: string = '';
    searchState: SearchState = {
        query: '',
        results: [],
        currentIndex: -1,
        totalResults: 0
    };

    private subscription?: Subscription;

    constructor(private searchService: SearchService) { }

    ngOnInit(): void {
        // Subscribe to search state changes
        this.subscription = this.searchService.state$.subscribe(state => {
            this.searchState = state;

            // Emit all search results for highlighting
            this.searchResults.emit(state.results);

            // Emit current result when it changes
            if (state.currentIndex >= 0 && state.results[state.currentIndex]) {
                this.resultSelected.emit(state.results[state.currentIndex]);
            }
        });
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.searchService.clearSearch();
    }

    onSearchChange(): void {
        this.searchService.search(this.searchQuery, this.nodes);
    }

    onClear(): void {
        this.searchQuery = '';
        this.searchService.clearSearch();
    }

    onNext(): void {
        const result = this.searchService.nextResult();
        if (result) {
            this.resultSelected.emit(result);
        }
    }

    onPrevious(): void {
        const result = this.searchService.previousResult();
        if (result) {
            this.resultSelected.emit(result);
        }
    }

    onClose(): void {
        this.onClear();
        this.close.emit();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            if (event.shiftKey) {
                this.onPrevious();
            } else {
                this.onNext();
            }
            event.preventDefault();
        } else if (event.key === 'Escape') {
            this.onClose();
            event.preventDefault();
        }
    }

    get resultText(): string {
        if (this.searchState.totalResults === 0) {
            return this.searchQuery ? 'No results' : '';
        }
        return `${this.searchState.currentIndex + 1} of ${this.searchState.totalResults}`;
    }
}
