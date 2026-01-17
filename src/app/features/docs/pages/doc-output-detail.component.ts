import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { OUTPUT_DOCS, OutputDoc } from '../data/output-docs.data';
import { NgxWorkflowModule } from 'ngx-workflow';

@Component({
    selector: 'app-doc-output-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, NgxWorkflowModule],
    template: `
    @if (output(); as item) {
      <div class="max-w-5xl mx-auto py-8">
        
        <!-- Breadcrumb -->
        <nav class="flex mb-8 text-sm text-gray-500">
          <a routerLink="/docs/outputs" class="hover:text-green-600">Outputs</a>
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
                <code class="font-mono bg-gray-100 px-2 py-0.5 rounded text-green-700">{{ item.type }}</code>
             </div>
           </div>
        </div>

        <hr class="border-gray-200 mb-10">

        <div class="grid lg:grid-cols-3 gap-8">
           <!-- Playground -->
           <div class="lg:col-span-2">
               <h2 class="text-2xl font-bold text-gray-900 mb-4">Interactive Example</h2>
               
               <div class="h-[400px] border border-gray-300 rounded-lg overflow-hidden relative shadow-sm bg-gray-50">
                   <ngx-workflow-diagram 
                        [nodes]="nodes" 
                        [edges]="edges"
                        [showBackground]="true"
                        (nodeClick)="logEvent('nodeClick', $event)"
                        (nodeDoubleClick)="logEvent('nodeDoubleClick', $event)"
                        (edgeClick)="logEvent('edgeClick', $event)"
                        (connect)="logEvent('connect', $event)"
                        (nodesChange)="logEvent('nodesChange', $event)"
                        (edgesChange)="logEvent('edgesChange', $event)"
                        (paneClick)="logEvent('paneClick', $event)"
                        (contextMenu)="logEvent('contextMenu', $event)"
                        (nodeMouseEnter)="logEvent('nodeMouseEnter', $event)"
                        (nodeMouseLeave)="logEvent('nodeMouseLeave', $event)"
                        (edgeMouseEnter)="logEvent('edgeMouseEnter', $event)"
                        (edgeMouseLeave)="logEvent('edgeMouseLeave', $event)">
                   </ngx-workflow-diagram>
               </div>
               <p class="mt-2 text-sm text-gray-500">Try interacting with the nodes and edges above.</p>
           </div>

           <!-- Console -->
           <div class="lg:col-span-1">
               <h3 class="text-lg font-bold text-gray-900 mb-4">Event Log</h3>
               <div class="border border-gray-200 rounded-lg h-[400px] flex flex-col bg-white overflow-hidden shadow-sm">
                   <div class="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
                      <span class="text-xs font-mono text-gray-500 uppercase">Output</span>
                      <button (click)="logs.set([])" class="text-xs text-red-600 hover:text-red-800">Clear</button>
                   </div>
                   
                   <div class="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs">
                       <div *ngIf="logs().length === 0" class="text-gray-400 italic text-center py-4">
                          No events logged yet.
                       </div>
                       <div *ngFor="let log of logs()" class="animate-fade-in border-l-2 pl-2" [class.border-green-500]="log.event === item.name" [class.border-gray-300]="log.event !== item.name">
                           <div class="flex items-center gap-2 text-gray-400 mb-1">
                               <span>{{ log.time }}</span>
                               <span class="font-bold text-gray-700">{{ log.event }}</span>
                           </div>
                           <div class="text-gray-600 break-words whitespace-pre-wrap">
                               {{ log.data }}
                           </div>
                       </div>
                   </div>
               </div>
           </div>
        </div>
      </div>
    } @else {
      <div class="py-12 text-center">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Output not found</h2>
        <a routerLink="/docs/outputs" class="text-green-600 hover:underline">Back to Outputs</a>
      </div>
    }
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class DocOutputDetailComponent {
    private route = inject(ActivatedRoute);
    private params = toSignal(this.route.params);

    output = computed(() => {
        const params = this.params();
        const name = params?.['id'];
        return OUTPUT_DOCS.find(i => i.name === name);
    });

    logs = signal<Array<{ time: string, event: string, data: string }>>([]);

    // Dummy data
    nodes = [
        { id: '1', position: { x: 50, y: 50 }, label: 'Click Me' },
        { id: '2', position: { x: 250, y: 150 }, label: 'Drag Me' }
    ];
    edges = [
        { id: 'e1-2', source: '1', target: '2', label: 'Connect' }
    ];

    logEvent(eventName: string, data: any) {
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dataStr = JSON.stringify(data, (key, value) => {
            if (key === 'source' && value?.view) return '[Window]';
            return value;
        });

        this.logs.update(prev => [{ time, event: eventName, data: dataStr }, ...prev].slice(0, 50));
    }
}
