import { Component, signal, ViewChild, AfterViewInit } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, DiagramComponent } from 'ngx-workflow';

@Component({
  selector: 'app-examples',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div class="container" style="padding-top: var(--space-8)">
      <h1>Examples</h1>
      <p style="color: var(--color-text-secondary)">Interactive playground using the real <code>ngx-workflow</code> library.</p>
      
      <div class="example-viewer">
        <ngx-workflow-diagram
          [nodes]="nodes()"
          [edges]="edges()"
          [showMinimap]="true"
          [showZoomControls]="true"
          [showBackground]="true"
          [showLayoutControls]="true"
          (nodeClick)="onNodeClick($event)" 
        ></ngx-workflow-diagram>
      </div>
    </div>
  `,
  styles: [`
    .example-viewer {
      margin-top: var(--space-8);
      height: 600px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--color-bg-surface);
    }
  `]
})
export class ExamplesComponent implements AfterViewInit {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  nodes = signal<Node[]>([
    { id: '1', label: 'Input', type: 'default', position: { x: 100, y: 100 }, ports: 2 },
    { id: '2', label: 'Process', type: 'default', position: { x: 350, y: 100 }, ports: 4 },
    { id: '3', label: 'Output', type: 'default', position: { x: 600, y: 200 }, ports: 1 }
  ]);

  edges = signal<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e2-3', source: '2', target: '3', sourceHandle: 'right', targetHandle: 'left', animated: true }
  ]);

  ngAfterViewInit() {
    // Delay to allow view to stabilize
    setTimeout(() => {
      if (this.diagram) {
        this.diagram.fitView();
      }
    }, 100);
  }

  onNodeClick(node: Node) {
    console.log('Node clicked:', node);
  }
}
