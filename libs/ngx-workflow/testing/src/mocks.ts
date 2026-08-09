import { Component, Directive, Injectable, input, output, signal } from '@angular/core';
import {
  ComponentNodeEventService,
  DiagramStateService,
  HandleRegistryService,
  createEdge,
  createNode,
  type Edge,
  type Node,
  type Viewport,
} from 'ngx-workflow';

@Component({
  selector: 'ngx-workflow-diagram',
  standalone: true,
  template: `<div class="ngx-workflow-diagram-mock" data-testid="ngx-workflow-diagram-mock"><ng-content /></div>`,
})
export class MockDiagramComponent {
  readonly nodes = input<unknown[]>([]);
  readonly edges = input<unknown[]>([]);
  readonly nodesChange = output<unknown[]>();
  readonly edgesChange = output<unknown[]>();
  readonly nodeChanges = output<unknown[]>();
  readonly edgeChanges = output<unknown[]>();
  readonly connect = output<unknown>();
  readonly componentNodeEvent = output<unknown>();
  readonly nodeClick = output<unknown>();
  readonly edgeClick = output<unknown>();
  readonly viewportChange = output<unknown>();
}

@Component({
  selector: 'g[ngx-workflow-handle], ngx-workflow-handle',
  standalone: true,
  template: '<ng-content />',
  host: { class: 'ngx-workflow__handle-mock' },
})
export class MockHandleComponent {
  readonly nodeId = input<string>('');
  readonly handleId = input<string>('');
  readonly type = input<'source' | 'target'>('source');
}

@Component({
  selector: 'ngx-workflow-minimap',
  standalone: true,
  template: `<div class="ngx-workflow-minimap-mock" data-testid="ngx-workflow-minimap-mock"></div>`,
})
export class MockMinimapComponent {}

@Component({
  selector: 'ngx-workflow-background',
  standalone: true,
  template: `<div class="ngx-workflow-background-mock"></div>`,
})
export class MockBackgroundComponent {
  readonly variant = input<string>('dots');
}

@Component({
  selector: 'ngx-workflow-zoom-controls',
  standalone: true,
  template: `<div class="ngx-workflow-zoom-controls-mock"></div>`,
})
export class MockZoomControlsComponent {}

@Component({
  selector: 'ngx-workflow-palette',
  standalone: true,
  template: `<div class="ngx-workflow-palette-mock"></div>`,
})
export class MockPaletteComponent {
  readonly items = input<unknown[]>([]);
}

@Component({
  selector: 'ngx-workflow-panel',
  standalone: true,
  template: `<div class="ngx-workflow-panel-mock"><ng-content /></div>`,
})
export class MockPanelComponent {
  readonly position = input<string>('top-left');
}

@Component({
  selector: 'ngx-workflow-node-toolbar',
  standalone: true,
  template: `<div class="ngx-workflow-node-toolbar-mock"><ng-content /></div>`,
})
export class MockNodeToolbarComponent {
  readonly nodeId = input<string>('');
}

@Component({
  selector: 'ngx-workflow-properties-sidebar',
  standalone: true,
  template: `<div class="ngx-workflow-properties-sidebar-mock"></div>`,
})
export class MockPropertiesSidebarComponent {
  readonly node = input<unknown>(null);
  readonly edge = input<unknown>(null);
  readonly nodeChange = output<unknown>();
  readonly edgeChange = output<unknown>();
}

@Component({
  selector: 'ngx-workflow-export-controls',
  standalone: true,
  template: `<div class="ngx-workflow-export-controls-mock"></div>`,
})
export class MockExportControlsComponent {}

@Component({
  selector: 'ngx-workflow-undo-redo-controls',
  standalone: true,
  template: `<div class="ngx-workflow-undo-redo-controls-mock"></div>`,
})
export class MockUndoRedoControlsComponent {}

@Component({
  selector: 'ngx-workflow-context-menu',
  standalone: true,
  template: `<div class="ngx-workflow-context-menu-mock"></div>`,
})
export class MockContextMenuComponent {}

@Component({
  selector: 'ngx-workflow-grid-overlay',
  standalone: true,
  template: `<div class="ngx-workflow-grid-overlay-mock"></div>`,
})
export class MockGridOverlayComponent {}

@Component({
  selector: 'ngx-workflow-search-controls',
  standalone: true,
  template: `<div class="ngx-workflow-search-controls-mock"></div>`,
})
export class MockSearchControlsComponent {}

@Component({
  selector: 'ngx-workflow-layout-alignment-controls',
  standalone: true,
  template: `<div class="ngx-workflow-layout-alignment-controls-mock"></div>`,
})
export class MockLayoutAlignmentControlsComponent {}

@Component({
  selector: 'ngx-workflow-execution-controls',
  standalone: true,
  template: `<div class="ngx-workflow-execution-controls-mock"></div>`,
})
export class MockExecutionControlsComponent {}

@Component({
  selector: 'ngx-workflow-version-history',
  standalone: true,
  template: `<div class="ngx-workflow-version-history-mock"></div>`,
})
export class MockVersionHistoryComponent {}

@Directive({
  selector: '[ngxWorkflowDragHandle], .drag-handle',
  standalone: true,
})
export class MockDragHandleDirective {}

@Directive({
  selector: '[ngxWorkflowChangesController]',
  standalone: true,
})
export class MockChangesControllerDirective {}

@Directive({
  selector: '[ngxWorkflowConnectionController]',
  standalone: true,
})
export class MockConnectionControllerDirective {}

/** Drop-in mock set for TestBed `imports` override (diagram + chrome). */
export const NgxWorkflowMocks = [
  MockDiagramComponent,
  MockHandleComponent,
  MockMinimapComponent,
  MockBackgroundComponent,
  MockZoomControlsComponent,
  MockPaletteComponent,
  MockPanelComponent,
  MockNodeToolbarComponent,
  MockPropertiesSidebarComponent,
  MockExportControlsComponent,
  MockUndoRedoControlsComponent,
  MockContextMenuComponent,
  MockGridOverlayComponent,
  MockSearchControlsComponent,
  MockLayoutAlignmentControlsComponent,
  MockExecutionControlsComponent,
  MockVersionHistoryComponent,
  MockDragHandleDirective,
  MockChangesControllerDirective,
  MockConnectionControllerDirective,
] as const;

/** Core canvas-only mocks (lighter than full chrome). */
export const NgxWorkflowCoreMocks = [
  MockDiagramComponent,
  MockHandleComponent,
  MockMinimapComponent,
  MockBackgroundComponent,
  MockDragHandleDirective,
] as const;

@Injectable()
export class MockDiagramStateService {
  readonly nodes = signal<Node[]>([]);
  readonly edges = signal<Edge[]>([]);
  readonly viewport = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
  readonly selectedNodes = signal<Node[]>([]);
  readonly visibleNodes = signal<Node[]>([]);
  readonly visibleEdges = signal<Edge[]>([]);
  readonly culledNodeCount = signal(0);

  setNodes(nodes: Node[]): void {
    this.nodes.set(nodes);
    this.visibleNodes.set(nodes);
    this.selectedNodes.set(nodes.filter((n) => n.selected));
  }

  setEdges(edges: Edge[]): void {
    this.edges.set(edges);
    this.visibleEdges.set(edges);
  }

  setViewport(viewport: Viewport): void {
    this.viewport.set(viewport);
  }
}

/**
 * Provides lightweight stubs so custom node components can be unit-tested
 * outside a full diagram host.
 */
export function provideCustomNodeMocks(): unknown[] {
  return [
    ComponentNodeEventService,
    HandleRegistryService,
    { provide: DiagramStateService, useClass: MockDiagramStateService },
  ];
}

/** Alias matching common testing helper naming. */
export function provideNgxWorkflowTesting(): unknown[] {
  return provideCustomNodeMocks();
}

/** Build a typed node fixture with sensible defaults. */
export function mockNode(partial: Partial<Node> & Pick<Node, 'id'> | Partial<Node> = {}): Node {
  if ('id' in partial && partial.id) {
    return {
      ...createNode({ label: partial.label ?? partial.id }),
      ...partial,
      id: partial.id,
      position: partial.position ?? { x: 0, y: 0 },
    };
  }
  return createNode({
    label: partial.label ?? 'Node',
    position: partial.position ?? { x: 0, y: 0 },
    ...partial,
  });
}

/** Build a typed edge fixture. */
export function mockEdge(
  partial: Partial<Edge> & Pick<Edge, 'source' | 'target'> | Partial<Edge> = {}
): Edge {
  const source = partial.source ?? 'a';
  const target = partial.target ?? 'b';
  return {
    ...createEdge({ source, target }),
    ...partial,
    source,
    target,
  };
}

/** Simple two-node graph fixture for host tests. */
export function mockGraph(count = 2): { nodes: Node[]; edges: Edge[] } {
  const nodes = Array.from({ length: count }, (_, i) =>
    mockNode({
      id: `n${i + 1}`,
      label: `Node ${i + 1}`,
      position: { x: i * 200, y: 0 },
    })
  );
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push(mockEdge({ id: `e${i + 1}`, source: nodes[i].id, target: nodes[i + 1].id }));
  }
  return { nodes, edges };
}
