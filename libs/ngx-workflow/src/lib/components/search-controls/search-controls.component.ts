import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';

@Component({
    selector: 'ngx-workflow-search-controls',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './search-controls.component.html',
    styleUrls: ['./search-controls.component.scss']
})
export class SearchControlsComponent {
    private state = inject(DiagramStateService);

    // Computed signal for matching nodes (only highlighted ones)
    results = computed(() => {
        const nodes = this.state.viewNodes();
        return nodes.filter(n => n.highlighted);
    });

    currentResultIndex = signal(0);

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.state.searchQuery.set(input.value);
        this.currentResultIndex.set(0); // Reset index on new search
    }

    onFilterChange(event: Event) {
        const select = event.target as HTMLSelectElement;
        const value = select.value === 'all' ? null : select.value;
        this.state.filterType.set(value);
        this.currentResultIndex.set(0);
    }

    nextResult() {
        const results = this.results();
        if (results.length === 0) return;

        const nextIndex = (this.currentResultIndex() + 1) % results.length;
        this.currentResultIndex.set(nextIndex);
        this.focusCurrentResult();
    }

    prevResult() {
        const results = this.results();
        if (results.length === 0) return;

        const prevIndex = (this.currentResultIndex() - 1 + results.length) % results.length;
        this.currentResultIndex.set(prevIndex);
        this.focusCurrentResult();
    }

    focusCurrentResult() {
        const results = this.results();
        const index = this.currentResultIndex();
        if (results[index]) {
            this.state.focusNode(results[index].id);
        }
    }

    onEnter() {
        this.nextResult();
    }

    get uniqueTypes() {
        const nodes = this.state.nodes();
        const types = new Set(nodes.map(n => n.type || 'default'));
        return Array.from(types);
    }
}
