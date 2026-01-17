import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { INPUT_DOCS, InputDoc } from '../data/input-docs.data';

@Component({
  selector: 'app-doc-inputs',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8">
      <div class="border-b border-gray-200 pb-8 mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Inputs Reference</h1>
        <p class="text-lg text-gray-600">
          Configuration options for the component.
        </p>
      </div>

      <!-- Search -->
      <div class="mb-8 max-w-xl">
        <div class="relative rounded-md shadow-sm">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="text-gray-400" style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-3 border"
            placeholder="Search inputs..."
          />
        </div>
      </div>

      <div class="space-y-12">
        <div *ngFor="let category of categories()">
          <h2 class="text-xl font-bold text-gray-900 mb-4 px-2 border-l-4 border-blue-500 rounded-sm">
            {{ category }}
          </h2>
          
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <a *ngFor="let input of getInputsByCategory(category)" 
               [routerLink]="['/docs/inputs', input.name]"
               class="block bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 p-6">
               
               <div class="flex items-center justify-between mb-2">
                 <span class="text-lg font-mono font-bold text-blue-600 truncate" title="{{ input.name }}">
                   {{ input.name }}
                 </span>
                 <span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 font-mono">
                   {{ input.type }}
                 </span>
               </div>
               
               <p class="text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
                 {{ input.description }}
               </p>
            </a>
          </div>
        </div>
        
        <div *ngIf="categories().length === 0" class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
           <p class="text-gray-500">No inputs found matching "{{ searchQuery() }}"</p>
           <button (click)="searchQuery.set('')" class="mt-2 text-blue-600 hover:text-blue-500 font-medium">Clear search</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DocInputsComponent {
  searchQuery = signal('');
  allInputs = signal<InputDoc[]>(INPUT_DOCS);

  filteredInputs = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.allInputs().filter(input =>
      input.name.toLowerCase().includes(query) ||
      input.description.toLowerCase().includes(query) ||
      input.category.toLowerCase().includes(query)
    );
  });

  categories = computed(() => {
    const inputs = this.filteredInputs();
    const uniqueCategories = new Set(inputs.map(i => i.category));
    const order = ['Data', 'Viewport', 'Appearance', 'Controls', 'Behavior', 'Persistence'];
    return Array.from(uniqueCategories).sort((a, b) => {
      const indexA = order.indexOf(a);
      const indexB = order.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  });

  getInputsByCategory(category: string): InputDoc[] {
    return this.filteredInputs().filter(i => i.category === category);
  }
}
