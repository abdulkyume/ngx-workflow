import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';

import {
  DiagramStateService,
  LayoutService,
  Node,
  Edge,
  XYPosition,
  Viewport,
  NgxFlowModule,
} from 'ngx-flow';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgxFlowModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'ngx-flow-demo';

  constructor(
    private diagramStateService: DiagramStateService,
    private layoutService: LayoutService
  ) {}

  ngOnInit(): void {
    // Initial setup: Add some nodes and edges to demonstrate
    this.addNode({ id: '1', position: { x: 50, y: 50 }, data: { label: 'Start' } });
    this.addNode({
      id: '2',
      position: { x: 250, y: 150 },
      data: { label: 'Process A' },
      type: 'rounded-rect',
    });
    this.addNode({ id: '3', position: { x: 50, y: 250 }, data: { label: 'Process B' } });
    this.addNode({ id: '4', position: { x: 450, y: 250 }, data: { label: 'End' } });
    this.addEdge({ id: 'e1-2', source: '1', target: '2', type: 'bezier' });
    this.addEdge({ id: 'e1-3', source: '1', target: '3', type: 'step' });
    this.addEdge({ id: 'e2-4', source: '2', target: '4', animated: true });
    this.addEdge({ id: 'e3-4', source: '3', target: '4', type: 'straight' });
  }

  addNode(node: Node): void {
    this.diagramStateService.addNode({ ...node, id: node.id || uuidv4(), draggable: true });
  }

  addEdge(edge: Edge): void {
    this.diagramStateService.addEdge({ ...edge, id: edge.id || uuidv4() });
  }

  addRandomNode(): void {
    const newNode: Node = {
      id: uuidv4(),
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      data: { label: `Node ${this.diagramStateService.nodes().length + 1}` },
      type: Math.random() > 0.5 ? 'default' : 'rounded-rect',
      draggable: true,
    };
    this.diagramStateService.addNode(newNode);
  }

  clearFlow(): void {
    this.diagramStateService.nodes.set([]);
    this.diagramStateService.edges.set([]);
    this.diagramStateService.tempEdges.set([]);
  }

  async applyDagreLayout(): Promise<void> {
    const currentNodes = this.diagramStateService.nodes();
    const currentEdges = this.diagramStateService.edges();
    const laidOutNodes = await this.layoutService.applyDagreLayout(currentNodes, currentEdges);

    // Update positions of nodes in the state service
    laidOutNodes.forEach((node) => {
      this.diagramStateService.updateNode(node.id, { position: node.position });
    });
  }

  async applyElkLayout(): Promise<void> {
    const currentNodes = this.diagramStateService.nodes();
    const currentEdges = this.diagramStateService.edges();
    const laidOutNodes = await this.layoutService.applyElkLayout(currentNodes, currentEdges);

    laidOutNodes.forEach((node) => {
      this.diagramStateService.updateNode(node.id, { position: node.position });
    });
  }

  // Placeholder for FitView
  fitView(): void {
    // The DiagramComponent has a fitView() method. You might want to call it directly
    // from a template reference or expose it through the state service if the demo
    // component needs to trigger it. For now, just a log.
    console.log('Fit View clicked (DiagramComponent needs to expose this)');
  }

  // Debugging / State display
  get nodesCount(): number {
    return this.diagramStateService.nodes().length;
  }

  get edgesCount(): number {
    return this.diagramStateService.edges().length;
  }

  get viewport(): Viewport {
    return this.diagramStateService.viewport();
  }
}
