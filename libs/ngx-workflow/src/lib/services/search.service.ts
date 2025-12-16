import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Node } from '../models';

export interface SearchState {
    query: string;
    results: Node[];
    currentIndex: number;
    totalResults: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
    private searchState$ = new BehaviorSubject<SearchState>({
        query: '',
        results: [],
        currentIndex: -1,
        totalResults: 0
    });

    public state$: Observable<SearchState> = this.searchState$.asObservable();

    /**
     * Search nodes by label (case-insensitive)
     */
    search(query: string, nodes: Node[]): Node[] {
        if (!query.trim()) {
            this.clearSearch();
            return [];
        }

        const lowerQuery = query.toLowerCase();
        const results = nodes.filter(node => {
            const label = node.label?.toLowerCase() || '';
            const dataLabel = node.data?.label?.toString().toLowerCase() || '';
            return label.includes(lowerQuery) || dataLabel.includes(lowerQuery);
        });

        this.searchState$.next({
            query,
            results,
            currentIndex: results.length > 0 ? 0 : -1,
            totalResults: results.length
        });

        return results;
    }

    /**
     * Navigate to next search result
     */
    nextResult(): Node | null {
        const state = this.searchState$.value;
        if (state.results.length === 0) return null;

        const nextIndex = (state.currentIndex + 1) % state.results.length;
        this.searchState$.next({
            ...state,
            currentIndex: nextIndex
        });

        return state.results[nextIndex];
    }

    /**
     * Navigate to previous search result
     */
    previousResult(): Node | null {
        const state = this.searchState$.value;
        if (state.results.length === 0) return null;

        const prevIndex = state.currentIndex - 1 < 0
            ? state.results.length - 1
            : state.currentIndex - 1;

        this.searchState$.next({
            ...state,
            currentIndex: prevIndex
        });

        return state.results[prevIndex];
    }

    /**
     * Get current search result
     */
    getCurrentResult(): Node | null {
        const state = this.searchState$.value;
        if (state.currentIndex >= 0 && state.currentIndex < state.results.length) {
            return state.results[state.currentIndex];
        }
        return null;
    }

    /**
     * Clear search
     */
    clearSearch(): void {
        this.searchState$.next({
            query: '',
            results: [],
            currentIndex: -1,
            totalResults: 0
        });
    }

    /**
     * Get current search state
     */
    getState(): SearchState {
        return this.searchState$.value;
    }
}
