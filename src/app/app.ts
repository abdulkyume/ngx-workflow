import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';

import {
  LayoutService,
  Node,
  Edge,
  Viewport,
  NgxWorkflowModule,
  DiagramComponent,
  ColorMode,
} from 'ngx-workflow';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-root',
  imports: [CommonModule, NgxWorkflowModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  title = 'ngx-workflow-demo';

  // Data properties for declarative binding
  nodes: Node[] = [];
  edges: Edge[] = [];
  viewport: Viewport = { x: 0, y: 0, zoom: 1 };
  currentTheme: ColorMode = 'light';

  constructor(private layoutService: LayoutService) { }

  ngOnInit(): void {
    // Initial setup: Add some nodes and edges to demonstrate
    this.nodes = [
      { id: '1', position: { x: 50, y: 50 }, data: { label: 'Start' }, draggable: true },
      { id: '2', position: { x: 250, y: 150 }, data: { label: 'Process A' }, type: 'rounded-rect', draggable: true },
      { id: '3', position: { x: 50, y: 250 }, data: { label: 'Process B' }, draggable: true },
      { id: '4', position: { x: 450, y: 250 }, data: { label: 'End' }, draggable: true }
    ];

    this.edges = [
      {
        id: 'e1-2',
        source: '1',
        sourceHandle: 'right',
        target: '2',
        targetHandle: 'left',
        // type: 'bezier', // Removed to test default smart routing
        label: 'processes',
        markerEnd: 'arrowclosed'
      },
      {
        id: 'e1-3',
        source: '1',
        sourceHandle: 'bottom',
        target: '3',
        targetHandle: 'top',
        type: 'smoothstep',
        label: 'alternate path',
        markerEnd: 'arrow'
      },
      {
        id: 'e2-4',
        source: '2',
        sourceHandle: 'right',
        target: '4',
        targetHandle: 'left',
        animated: true,
        label: 'completes',
        markerEnd: 'arrowclosed'
      },
      {
        id: 'e3-4',
        source: '3',
        sourceHandle: 'right',
        target: '4',
        targetHandle: 'bottom',
        // type: 'straight', // Removed to test default smart routing
        markerEnd: 'dot'
      },
      {
        id: 'e1-4-smart',
        source: '1',
        sourceHandle: 'bottom',
        target: '4',
        targetHandle: 'top',
        // type: 'smart', // Removed to test default smart routing
        label: 'smart route',
        markerEnd: 'arrow',
        style: { stroke: 'blue', strokeWidth: 2 }
      }
    ];

    this.testNewFeatures();
  }

  addRandomNode(): void {
    const newNode: Node = {
      id: uuidv4(),
      position: { x: Math.random() * 500, y: Math.random() * 300 },
      data: { label: `Node ${this.nodes.length + 1}` },
      type: Math.random() > 0.5 ? 'default' : 'rounded-rect',
      draggable: true,
    };
    this.nodes = [...this.nodes, newNode];
  }

  // Test Method to add a node with all new features
  testNewFeatures(): void {
    const featureNode: Node = {
      id: 'feature-node',
      position: { x: 300, y: 50 },
      data: { label: 'New Features' },
      width: 200,
      height: 80,
      borderStyle: 'dashed',
      borderColor: '#ec4899', // Pink
      borderWidth: 2,
      shadow: true,
      badges: [
        { content: 'New', backgroundColor: '#3b82f6', position: 'top-right' },
        { content: '!', backgroundColor: '#ef4444', position: 'top-left' }
      ]
    };

    const shadowEdge: Edge = {
      id: 'e-shadow',
      source: '1',
      target: 'feature-node',
      shadow: true,
      label: 'Shadow Edge',
      type: 'bezier'
    };

    this.nodes = [...this.nodes, featureNode];
    this.edges = [...this.edges, shadowEdge];
  }

  clearFlow(): void {
    this.nodes = [];
    this.edges = [];
  }

  async applyElkLayout(): Promise<void> {
    const laidOutNodes = await this.layoutService.applyElkLayout(this.nodes, this.edges);
    this.nodes = laidOutNodes;
  }

  toggleTheme(): void {
    const themes: ColorMode[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(this.currentTheme);
    this.currentTheme = themes[(currentIndex + 1) % themes.length];
    console.log('Theme changed to:', this.currentTheme);
  }

  // Viewport Helper Method Tests
  testZoomIn(): void {
    if (this.diagram) {
      this.diagram.diagramStateService.zoomIn();
      console.log('Zoom In - Current zoom:', this.diagram.diagramStateService.getZoom());
    }
  }

  testZoomOut(): void {
    if (this.diagram) {
      this.diagram.diagramStateService.zoomOut();
      console.log('Zoom Out - Current zoom:', this.diagram.diagramStateService.getZoom());
    }
  }

  testFitView(): void {
    if (this.diagram) {
      this.diagram.diagramStateService.fitView({ padding: 50, maxZoom: 1.5 });
      console.log('Fit View - Viewport:', this.diagram.diagramStateService.getViewport());
    }
  }

  testSetCenter(): void {
    if (this.diagram) {
      // Center on node 2's position
      const node = this.nodes.find(n => n.id === '2');
      if (node) {
        this.diagram.diagramStateService.setCenter(
          node.position.x + (node.width || 170) / 2,
          node.position.y + (node.height || 60) / 2
        );
        console.log('Set Center - Centered on node 2');
      }
    }
  }

  // Event handlers
  onNodeClick(node: Node): void {
    console.log('Node clicked:', node);
  }

  onNodesChange(nodes: Node[]): void {
    this.nodes = nodes;
  }

  onEdgesChange(edges: Edge[]): void {
    this.edges = edges;
  }

  // Computed properties for display
  get nodesCount(): number {
    return this.nodes.length;
  }

  get edgesCount(): number {
    return this.edges.length;
  }

  // Access the diagram component to call export methods
  @ViewChild(DiagramComponent) diagram?: DiagramComponent;

  exportJSON(): void {
    if (!this.diagram) return;
    const state = this.diagram.getDiagramState();
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  importJSON(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.diagram) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const state = JSON.parse(json);
        this.diagram!.setDiagramState(state);
      } catch (err) {
        console.error('Failed to parse JSON', err);
        alert('Invalid JSON file');
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again
    input.value = '';
  }

  exportPNG(): void {
    if (this.diagram) {
      this.diagram.exportToPNG();
    }
  }

  exportSVG(): void {
    // TODO: Re-implement SVG export
    console.log('SVG export not yet implemented');
  }

  // Toolbar actions
  get selectedNodes(): Node[] {
    return this.nodes.filter(n => n.selected);
  }

  deleteNode(nodeId: string): void {
    this.nodes = this.nodes.filter(n => n.id !== nodeId);
    this.edges = this.edges.filter(e => e.source !== nodeId && e.target !== nodeId);
    console.log('Deleted node:', nodeId);
  }

  duplicateNode(nodeId: string): void {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: Node = {
        ...node,
        id: uuidv4(),
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        data: { ...node.data, label: `${node.data?.label || 'Node'} (Copy)` },
        selected: false
      };
      this.nodes = [...this.nodes, newNode];
      console.log('Duplicated node:', nodeId);
    }
  }

  editNodeLabel(nodeId: string): void {
    // Trigger the same behavior as double-clicking the node (opens properties sidebar)
    if (this.diagram) {
      const node = this.nodes.find(n => n.id === nodeId);
      if (node) {
        // Programmatically trigger the double-click handler
        this.diagram.selectedNodeForEditing = node;
        console.log('Opening properties sidebar for node:', nodeId);
      }
    }
  }
}
