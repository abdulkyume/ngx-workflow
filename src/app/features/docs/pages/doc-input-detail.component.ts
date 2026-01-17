import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { INPUT_DOCS, InputDoc } from '../data/input-docs.data';
import { NgxWorkflowModule } from 'ngx-workflow';

@Component({
  selector: 'app-doc-input-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgxWorkflowModule],
  template: `
    @if (input(); as item) {
      <div class="max-w-5xl mx-auto py-8">
        
        <!-- Breadcrumb -->
        <nav class="flex mb-8 text-sm text-gray-500">
          <a routerLink="/docs/inputs" class="hover:text-blue-600">Inputs</a>
          <span class="mx-2">/</span>
          <span class="text-gray-900 font-medium">{{ item.name }}</span>
        </nav>

        <!-- Header -->
        <div class="mb-10">
           <h1 class="text-3xl font-bold text-gray-900 mb-4 font-mono">{{ item.name }}</h1>
           <p class="text-xl text-gray-600 mb-6">{{ item.description }}</p>
           
           <div class="flex flex-wrap gap-6 text-sm">
             <div class="flex flex-col">
               <span class="text-gray-500 uppercase tracking-wide text-xs font-semibold mb-1">Category</span>
               <span class="font-medium text-gray-900">{{ item.category }}</span> 
             </div>
             
             <div class="flex flex-col">
                <span class="text-gray-500 uppercase tracking-wide text-xs font-semibold mb-1">Type</span>
                <code class="font-mono bg-gray-100 px-2 py-0.5 rounded text-blue-700">{{ item.type }}</code>
             </div>
             
             <div class="flex flex-col" *ngIf="item.default !== 'undefined'">
                <span class="text-gray-500 uppercase tracking-wide text-xs font-semibold mb-1">Default</span>
                <code class="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-800">{{ item.default }}</code>
             </div>
           </div>
        </div>

        <hr class="border-gray-200 mb-10">

        <!-- Example -->
        <div class="mb-12">
           <h2 class="text-2xl font-bold text-gray-900 mb-4">Example</h2>
           <p class="text-gray-600 mb-4">Interactive preview:</p>
           
           <div class="h-[400px] border border-gray-300 rounded-lg overflow-hidden relative shadow-sm bg-gray-50">
               <ngx-workflow-diagram 
                    [nodes]="nodes" 
                    [edges]="edges"
                    [showBackground]="true">
               </ngx-workflow-diagram>
               
               <div class="absolute bottom-2 right-2 bg-white/80 backdrop-blur px-2 py-1 text-xs text-gray-500 rounded border border-gray-200">
                  ngx-workflow-diagram
               </div>
           </div>
        </div>
      </div>
    } @else {
      <div class="py-12 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Input not found</h2>
        <a routerLink="/docs/inputs" class="text-blue-600 hover:underline">Back to Inputs</a>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class DocInputDetailComponent {
  private route = inject(ActivatedRoute);
  private params = toSignal(this.route.params);

  input = computed(() => {
    const params = this.params();
    const name = params?.['id'];
    return INPUT_DOCS.find(i => i.name === name);
  });

  // Dummy data
  nodes = [
    { id: '1', position: { x: 100, y: 100 }, label: 'Node A' },
    { id: '2', position: { x: 300, y: 100 }, label: 'Node B' }
  ];
  edges = [
    { id: 'e1-2', source: '1', target: '2', label: 'Edge' }
  ];
}
