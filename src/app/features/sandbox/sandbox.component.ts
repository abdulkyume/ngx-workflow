import { Component, signal, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, DiagramComponent } from 'ngx-workflow';

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div class="sandbox-page">
      <header class="sandbox-toolbar glass-panel">
        <div class="toolbar-left">
          <span class="badge badge-accent">Studio</span>
          <div>
            <h1>Canvas Studio</h1>
            <p>Experiment with nodes, edges, layout, undo/redo, and export in a live editor.</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <button type="button" class="tool-btn" (click)="addNode()">+ Add Node</button>
          <button type="button" class="tool-btn" (click)="fitView()">Fit View</button>
          <button type="button" class="tool-btn" (click)="reset()">Reset</button>
        </div>
      </header>

      <main class="sandbox-canvas glass-panel">
        <ngx-workflow-diagram
          [nodes]="nodes()"
          [edges]="edges()"
          [showMinimap]="true"
          [showZoomControls]="true"
          [showUndoRedoControls]="true"
          [showBackground]="true"
          [showLayoutControls]="true"
          [showExportControls]="true"
          [edgeReconnectable]="true"
          (nodesChange)="onNodesChange($event)"
          (edgesChange)="onEdgesChange($event)"
        ></ngx-workflow-diagram>
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .sandbox-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px 0 48px;
      min-height: calc(100vh - 120px);
    }

    .sandbox-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      margin: 0 24px;
    }

    .toolbar-left {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .sandbox-toolbar h1 {
      margin: 0 0 4px;
      font-size: 1.25rem;
    }

    .sandbox-toolbar p {
      margin: 0;
      color: var(--color-text-secondary, #64748b);
      font-size: 0.9rem;
    }

    .toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tool-btn {
      background: var(--color-bg-base, #f8fafc);
      border: 1px solid var(--color-border, #e2e8f0);
      color: var(--color-text-secondary, #475569);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }

    .tool-btn:hover {
      border-color: var(--color-primary, #3b82f6);
      color: var(--color-primary, #3b82f6);
    }

    .sandbox-canvas {
      margin: 0 24px;
      height: min(72vh, 820px);
      min-height: 520px;
      overflow: hidden;
      position: relative;
    }

    @media (max-width: 768px) {
      .sandbox-toolbar {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class SandboxComponent {
  @ViewChild(DiagramComponent) diagram?: DiagramComponent;

  private readonly initialNodes: Node[] = [
    { id: 'start', label: 'Start', position: { x: 120, y: 180 }, ports: 4 },
    { id: 'process', label: 'Process', position: { x: 380, y: 180 }, ports: 4 },
    { id: 'end', label: 'End', position: { x: 640, y: 180 }, ports: 4 },
  ];

  private readonly initialEdges: Edge[] = [
    { id: 'e1', source: 'start', target: 'process', sourceHandle: 'right', targetHandle: 'left' },
    { id: 'e2', source: 'process', target: 'end', sourceHandle: 'right', targetHandle: 'left', animated: true },
  ];

  nodes = signal<Node[]>(this.cloneNodes(this.initialNodes));
  edges = signal<Edge[]>(this.cloneEdges(this.initialEdges));
  private nodeCounter = 4;

  onNodesChange(nodes: Node[]): void {
    this.nodes.set(nodes);
  }

  // Diagram already adds edges on connect — only sync state here (do not append again).
  onEdgesChange(edges: Edge[]): void {
    this.edges.set(edges);
  }

  addNode(): void {
    const id = `node-${this.nodeCounter++}`;
    this.nodes.update((nodes) => [
      ...nodes,
      {
        id,
        label: `Node ${this.nodeCounter - 1}`,
        position: { x: 160 + (nodes.length % 4) * 40, y: 120 + (nodes.length % 3) * 40 },
        ports: 4,
      },
    ]);
  }

  fitView(): void {
    this.diagram?.fitView();
  }

  reset(): void {
    this.nodes.set(this.cloneNodes(this.initialNodes));
    this.edges.set(this.cloneEdges(this.initialEdges));
    this.nodeCounter = 4;
    setTimeout(() => this.diagram?.fitView(), 0);
  }

  private cloneNodes(nodes: Node[]): Node[] {
    return nodes.map((node) => ({ ...node, position: { ...node.position } }));
  }

  private cloneEdges(edges: Edge[]): Edge[] {
    return edges.map((edge) => ({ ...edge }));
  }
}
