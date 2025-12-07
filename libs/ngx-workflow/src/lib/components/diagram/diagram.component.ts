import { Component, ChangeDetectionStrategy, ElementRef, OnInit, Renderer2, NgZone, OnDestroy, HostListener, WritableSignal, Inject, Optional, computed, ViewChild, Input, Output, EventEmitter, OnChanges, SimpleChanges, Signal, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Viewport, XYPosition, Node as WorkflowNode, Edge, TempEdge, DiagramState, AlignmentGuide } from '../../models';
import { Subscription, Observable } from 'rxjs';
import { NGX_WORKFLOW_NODE_TYPES } from '../../injection-tokens';
import { NodeComponentType as WorkflowNodeComponentType } from '../../types';
import { getBezierPath, getStraightPath, getStepPath, getSmoothStepPath, getSelfLoopPath, getSmartEdgePath, PathFinder, getPolylineMidpoint } from '../../utils';
import { v4 as uuidv4 } from 'uuid';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { UndoRedoControlsComponent } from '../undo-redo-controls/undo-redo-controls.component';
import { MinimapComponent } from '../minimap/minimap.component';
import { BackgroundComponent } from '../background/background.component';
import { GridOverlayComponent } from '../grid-overlay/grid-overlay.component';
import { AlignmentControlsComponent } from '../alignment-controls/alignment-controls.component';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ContextMenuService, ContextMenuItem } from '../../services/context-menu.service';
import { SearchControlsComponent } from '../search-controls/search-controls.component';
import { NodeToolbarComponent } from '../node-toolbar/node-toolbar.component';
import { PanelComponent } from '../panel/panel.component';
import { ThemeService, ColorMode } from '../../services/theme.service';
import { ExportService } from '../../services/export.service';
import { ExportControlsComponent } from '../export-controls/export-controls.component';

// Helper function to get a node from the array
function getNode(id: string, nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find(n => n.id === id);
}

// Helper function to determine handle position based on node and handle id/type
function getHandleAbsolutePosition(node: WorkflowNode, handleId: string | undefined): XYPosition {
  const nodeWidth = node.width || 170;
  const nodeHeight = node.height || 60;
  let offsetX = 0;
  let offsetY = 0;

  switch (handleId) {
    case 'top':
      offsetX = nodeWidth / 2;
      offsetY = 0;
      break;
    case 'right':
      offsetX = nodeWidth;
      offsetY = nodeHeight / 2;
      break;
    case 'bottom':
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight;
      break;
    case 'left':
      offsetX = 0;
      offsetY = nodeHeight / 2;
      break;
    default: // Center of the node if no specific handle
      offsetX = nodeWidth / 2;
      offsetY = nodeHeight / 2;
  }
  return {
    x: node.position.x + offsetX,
    y: node.position.y + offsetY
  };
}



@Component({
  selector: 'ngx-workflow-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ZoomControlsComponent, UndoRedoControlsComponent, MinimapComponent, BackgroundComponent, GridOverlayComponent, AlignmentControlsComponent, PropertiesSidebarComponent, SearchControlsComponent, ContextMenuComponent, NodeToolbarComponent, PanelComponent, ExportControlsComponent]
})
export class DiagramComponent implements OnInit, OnDestroy, OnChanges {
  // Trigger rebuild
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  // Input properties for declarative usage
  @Input() initialNodes: WorkflowNode[] = [];
  @Input() initialEdges: Edge[] = [];
  @Input() initialViewport?: Viewport;
  @Input() showZoomControls: boolean = true;

  // Input for showing/hiding undo/redo controls
  @Input() showUndoRedoControls: boolean = true;

  // Input for showing/hiding minimap
  @Input() showMinimap: boolean = true;

  // Input for background configuration
  @Input() showBackground: boolean = true;
  @Input() backgroundVariant: 'dots' | 'lines' | 'cross' = 'dots';
  @Input() backgroundGap: number = 20;
  @Input() backgroundSize: number = 1;
  @Input() backgroundColor: string = '#81818a';
  @Input() backgroundBgColor: string = '#f0f0f0';

  // Color mode (theme) configuration
  @Input() colorMode: ColorMode = 'light';

  // Grid configuration
  @Input() gridSize: number = 20;
  @Input() snapToGrid: boolean = false;
  @Input() showGrid: boolean = false;

  // Export controls configuration
  @Input() showExportControls: boolean = false;

  // Auto-panning configuration
  @Input() autoPanOnNodeDrag: boolean = true;
  @Input() autoPanOnConnect: boolean = true;
  @Input() autoPanSpeed: number = 15; // pixels per frame
  @Input() autoPanEdgeThreshold: number = 50; // pixels from edge

  // Output events
  @Output() nodeClick = new EventEmitter<WorkflowNode>();
  @Output() edgeClick = new EventEmitter<Edge>();
  @Output() connect = new EventEmitter<{ source: string; sourceHandle?: string; target: string; targetHandle?: string }>();
  @Output() nodesChange = new EventEmitter<WorkflowNode[]>();
  @Output() edgesChange = new EventEmitter<Edge[]>();
  @Output() nodeDoubleClick = new EventEmitter<WorkflowNode>();
  @Output() contextMenu = new EventEmitter<{ type: 'node' | 'edge' | 'canvas'; item?: WorkflowNode | Edge; event: MouseEvent }>();

  // Connection validation callback
  @Input() validateConnection?: (connection: {
    source: string;
    sourceHandle?: string;
    target?: string;
    targetHandle?: string;
  }) => boolean;

  // Custom edge template
  @Input() edgeTemplate?: TemplateRef<any>;

  // Edge reconnection feature
  @Input() edgeReconnectable: boolean = false;

  // Sidebar State
  selectedNodeForEditing: WorkflowNode | null = null;

  // Edge Editing State
  editingEdgeId: string | null = null;
  editingEdgeLabel: string = '';

  viewport!: WritableSignal<Viewport>;
  nodes!: WritableSignal<WorkflowNode[]>;
  viewNodes!: Signal<WorkflowNode[]>;
  filteredNodes!: Signal<WorkflowNode[]>;
  edges!: WritableSignal<Edge[]>;
  filteredEdges!: Signal<Edge[]>;
  tempEdges!: WritableSignal<TempEdge[]>;
  alignmentGuides!: Signal<AlignmentGuide[]>;
  selectionBox!: Signal<any>;

  // Expose Math to the template
  Math = Math;

  private _pathFinder: PathFinder | null = null;
  private pathCache = new Map<string, string>();
  private dragAnimationFrameId: number | null = null;
  private unlistenPointerMove: (() => void) | null = null;
  private unlistenPointerUp: (() => void) | null = null;
  private unlistenPointerLeave: (() => void) | null = null;
  private pathPointsCache = new Map<string, XYPosition[]>();

  private isPanning = false;
  private lastPanPosition: XYPosition = { x: 0, y: 0 };
  private subscriptions = new Subscription();
  // Lasso selection properties
  isSelecting = false;
  selectionStart: XYPosition = { x: 0, y: 0 };
  selectionEnd: XYPosition = { x: 0, y: 0 };

  // Node Dragging
  private isDraggingNode = false;
  private draggingNode: WorkflowNode | null = null;
  private draggingNodes: WorkflowNode[] = []; // All nodes being dragged (for multi-select)
  private startNodePosition: XYPosition = { x: 0, y: 0 };
  private startNodePositions: Map<string, XYPosition> = new Map(); // Initial positions for multi-drag
  private startPointerPosition: XYPosition = { x: 0, y: 0 };

  // Connection (Handle)
  private isConnecting = false;
  private currentPreviewEdgeId: string | null = null;
  private currentTargetHandle: { nodeId: string; handleId?: string; type: 'source' | 'target' } | null = null;
  private connectingSourceNodeId: string | null = null;
  private connectingSourceHandleId: string | undefined = undefined;

  // Resizing
  private isResizing = false;
  private resizingNode: WorkflowNode | null = null;
  private resizeHandle: 'nw' | 'ne' | 'sw' | 'se' | null = null;
  private startResizePosition: XYPosition = { x: 0, y: 0 };
  private startNodeDimensions: { width: number; height: number; x: number; y: number } = { width: 0, height: 0, x: 0, y: 0 };

  // Edge Updating
  private isUpdatingEdge = false;
  private updatingEdge: Edge | null = null;
  private updatingEdgeHandle: 'source' | 'target' | null = null;

  // Auto-panning state
  private autoPanInterval: number | null = null;
  private autoPanDirection = { x: 0, y: 0 };

  // Space + Drag Panning
  private isSpacePressed = false;
  private isSpacePanning = false;
  private panStartPosition: XYPosition = { x: 0, y: 0 };
  private viewportStartPosition: Viewport = { x: 0, y: 0, zoom: 1 };

  private updatePathFinder(nodes: WorkflowNode[]): void {
    this.pathCache.clear();
    this.pathPointsCache.clear();
    this._pathFinder = new PathFinder(nodes.map(n => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      width: n.width || this.defaultNodeWidth,
      height: n.height || this.defaultNodeHeight
    })));
  }



  // --- Node Interaction Handlers ---

  onNodePointerDown(event: PointerEvent, node: WorkflowNode): void {
    // Ignore if clicking on a handle or resize handle
    const target = event.target as HTMLElement;
    if (target.classList.contains('ngx-workflow__handle') ||
      target.classList.contains('ngx-workflow__resize-handle')) {
      return;
    }

    event.stopPropagation();

    // Select the node (toggle if ctrl/cmd is pressed)
    const isMultiSelect = event.ctrlKey || event.metaKey;
    if (!isMultiSelect) {
      // Clear other selections
      this.diagramStateService.nodes.update(nodes =>
        nodes.map(n => ({ ...n, selected: n.id === node.id }))
      );
    } else {
      // Toggle this node's selection
      this.diagramStateService.nodes.update(nodes =>
        nodes.map(n => n.id === node.id ? { ...n, selected: !n.selected } : n)
      );
    }

    // Start dragging
    this.diagramStateService.onDragStart(node);
  }

  onNodeDoubleClick(event: MouseEvent, node: WorkflowNode): void {
    console.log('Node double clicked:', node);
    event.stopPropagation();
    this.selectedNodeForEditing = node;
    this.nodeDoubleClick.emit(node);
    this.cdRef.detectChanges();
  }

  onDiagramDoubleClick(event: MouseEvent): void {
    let target = event.target as Element;

    // If target is SVG (likely due to capture), find the actual element under cursor
    if (target === this.svgRef.nativeElement || target.classList.contains('ngx-workflow__background')) {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      if (element) {
        target = element;
      }
    }

    const nodeElement = target.closest('.ngx-workflow__node');
    if (nodeElement) {
      const nodeId = (nodeElement as HTMLElement).dataset['id'];
      const node = this.nodes().find(n => n.id === nodeId);
      if (node) {
        this.onNodeDoubleClick(event, node);
      }
    }
  }




  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target as HTMLElement;
    const nodeElement = target.closest('.ngx-workflow__node') as HTMLElement;
    const edgeElement = target.closest('.ngx-workflow__edge') as HTMLElement;

    let type: 'node' | 'edge' | 'canvas' = 'canvas';
    let item: WorkflowNode | Edge | undefined;

    if (nodeElement) {
      type = 'node';
      const nodeId = nodeElement.dataset['id'];
      item = this.nodes().find(n => n.id === nodeId);
    } else if (edgeElement) {
      type = 'edge';
      const edgeId = edgeElement.dataset['id'];
      if (edgeId) {
        item = this.edges().find(e => e.id === edgeId);
      }
    }

    this.contextMenu.emit({ type, item, event });

    const actions: ContextMenuItem[] = [];

    if (type === 'node' && item) {
      const node = item as WorkflowNode;
      actions.push({
        label: 'Duplicate',
        action: () => {
          this.diagramStateService.selectNodes([node.id]);
          this.diagramStateService.duplicate();
        },
        shortcut: 'Ctrl+D'
      });
      actions.push({
        label: 'Delete',
        action: () => this.diagramStateService.removeNode(node.id),
        shortcut: 'Del',
        danger: true
      });
    } else if (type === 'edge' && item) {
      const edge = item as Edge;
      actions.push({
        label: 'Delete',
        action: () => this.diagramStateService.removeEdge(edge.id),
        shortcut: 'Del',
        danger: true
      });
    } else {
      // Canvas
      actions.push({
        label: 'Fit View',
        action: () => {
          this.diagramStateService.setViewport({ x: 0, y: 0, zoom: 1 });
        }
      });
      actions.push({
        label: 'Paste',
        action: () => this.diagramStateService.paste(),
        shortcut: 'Ctrl+V'
      });
    }

    if (actions.length > 0) {
      this.contextMenuService.open({ x: event.clientX, y: event.clientY }, actions, item);
    }
  }

  closeSidebar(): void {
    this.selectedNodeForEditing = null;
  }

  onPropertiesChange(changes: Partial<WorkflowNode>): void {
    if (this.selectedNodeForEditing) {
      this.diagramStateService.updateNode(this.selectedNodeForEditing.id, changes);
      // Update local reference to keep sidebar in sync
      this.selectedNodeForEditing = { ...this.selectedNodeForEditing, ...changes };
    }
  }

  updateEdgeLabel(edge: Edge, newLabel: string): void {
    this.diagramStateService.updateEdge(edge.id, { label: newLabel });
    this.editingEdgeId = null;
  }

  onEdgeLabelInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editingEdgeLabel = input.value;
  }

  onEdgeLabelBlur(edge: Edge): void {
    if (this.editingEdgeId === edge.id) {
      this.diagramStateService.updateEdge(edge.id, { label: this.editingEdgeLabel });
      this.editingEdgeId = null;
      this.editingEdgeLabel = '';
    }
  }

  // Default node dimensions
  defaultNodeWidth = 170;
  defaultNodeHeight = 60;

  // Input for custom connection validation (optional)
  @Input() connectionValidator?: (sourceNodeId: string, targetNodeId: string) => boolean;
  // Input for node resizing (global toggle)
  @Input() nodesResizable: boolean = true;

  private nodes$: Observable<WorkflowNode[]>;
  private resizeObserver!: ResizeObserver;

  // Helper to check if a connection is allowed
  private isValidConnection(sourceId: string, targetId: string): boolean {
    // Prevent duplicate edges between same source and target
    const existing = this.edges().some(e => e.source === sourceId && e.target === targetId);
    if (existing) {
      return false;
    }
    // Use custom validator if provided
    if (this.connectionValidator) {
      return this.connectionValidator(sourceId, targetId);
    }
    return true;
  }

  constructor(
    public el: ElementRef<HTMLElement>, // Host element
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef,
    public diagramStateService: DiagramStateService,
    private contextMenuService: ContextMenuService,
    private themeService: ThemeService,
    private exportService: ExportService,
    @Optional() @Inject(NGX_WORKFLOW_NODE_TYPES) public nodeTypes: Record<string, WorkflowNodeComponentType> | null
  ) {
    this.nodes$ = toObservable(this.diagramStateService.nodes);
  }

  get nodeTypeKeys(): string[] {
    return this.nodeTypes ? Object.keys(this.nodeTypes) : [];
  }

  ngOnInit(): void {
    this.diagramStateService.el = this.svgRef;
    this.viewport = this.diagramStateService.viewport;
    this.nodes = this.diagramStateService.nodes;
    this.filteredNodes = this.diagramStateService.visibleNodes; // Use visibleNodes for rendering
    this.edges = this.diagramStateService.edges;
    this.filteredEdges = this.diagramStateService.visibleEdges; // Use visibleEdges for rendering
    this.tempEdges = this.diagramStateService.tempEdges;
    this.alignmentGuides = this.diagramStateService.alignmentGuides;

    // Set grid configuration
    this.diagramStateService.setGridConfig(this.gridSize, this.snapToGrid);

    if (this.initialNodes.length > 0) {
      this.initialNodes.forEach(node => this.diagramStateService.addNode(node));
    }
    if (this.initialEdges.length > 0) {
      // Add initial edges directly to the signal without triggering connect events
      this.diagramStateService.edges.set([...this.initialEdges]);
    }
    if (this.initialViewport) {
      this.diagramStateService.setViewport(this.initialViewport);
    }

    // Set initial color mode
    this.themeService.setColorMode(this.colorMode);

    // Subscribe to state changes and emit events
    this.subscriptions.add(
      this.diagramStateService.nodeClick.subscribe((node: WorkflowNode) => this.nodeClick.emit(node))
    );
    this.subscriptions.add(
      this.diagramStateService.edgeClick.subscribe((edge: Edge) => this.edgeClick.emit(edge))
    );
    this.subscriptions.add(
      this.diagramStateService.connect.subscribe((connection) => this.connect.emit(connection))
    );
    this.subscriptions.add(
      this.nodes$.subscribe(nodes => {
        this.nodes.set(nodes);
        if (!this.isDraggingNode) {
          this.updatePathFinder(nodes);
          this.nodesChange.emit(nodes);
        }
      })
    );
    this.subscriptions.add(
      this.diagramStateService.edgesChange.subscribe((edges: Edge[]) => this.edgesChange.emit(edges))
    );

    // Initialize ResizeObserver
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.diagramStateService.setContainerDimensions({ width, height });
      }
    });

    // We need to observe the container, but we only have el (host) or svgRef.
    // Let's observe the host element.
    this.resizeObserver.observe(this.el.nativeElement);

    this.ngZone.runOutsideAngular(() => {
      this.unlistenPointerMove = this.renderer.listen(this.svgRef.nativeElement, 'pointermove', (event: PointerEvent) => {
        this.onPointerMove(event);
      });
      this.unlistenPointerUp = this.renderer.listen(this.svgRef.nativeElement, 'pointerup', (event: PointerEvent) => {
        this.onPointerUp(event);
      });
      this.unlistenPointerLeave = this.renderer.listen(this.svgRef.nativeElement, 'pointerleave', (event: PointerEvent) => {
        this.onPointerLeave(event);
      });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.unlistenPointerMove) this.unlistenPointerMove();
    if (this.unlistenPointerUp) this.unlistenPointerUp();
    if (this.unlistenPointerLeave) this.unlistenPointerLeave();
  }

  get lodLevel(): string {
    return this.diagramStateService.lodLevel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to input properties after initialization
    if (changes['initialNodes'] && !changes['initialNodes'].firstChange) {
      if (this.isDraggingNode || this.draggingNode) {
        return;
      }
      const currentNodes = this.nodes();
      if (this.initialNodes === currentNodes) {
        return;
      }
      const currentNodeIds = new Set(currentNodes.map(n => n.id));
      const newNodeIds = new Set(this.initialNodes.map(n => n.id));
      currentNodes.forEach(node => {
        if (!newNodeIds.has(node.id)) {
          this.diagramStateService.removeNode(node.id);
        }
      });
      this.initialNodes.forEach(node => {
        if (!currentNodeIds.has(node.id)) {
          this.diagramStateService.addNode(node);
        } else {
          const currentNode = currentNodes.find(n => n.id === node.id);
          if (currentNode && JSON.stringify(currentNode) !== JSON.stringify(node)) {
            this.diagramStateService.updateNode(node.id, node);
          }
        }
      });
    }
    if (changes['initialEdges'] && !changes['initialEdges'].firstChange) {
      const currentEdges = this.edges();
      if (this.initialEdges === currentEdges) return;
      if (JSON.stringify(this.initialEdges) !== JSON.stringify(currentEdges)) {
        this.diagramStateService.edges.set([...this.initialEdges]);
      }
    }
    if (changes['initialViewport'] && !changes['initialViewport'].firstChange && this.initialViewport) {
      const currentViewport = this.viewport();
      if (JSON.stringify(this.initialViewport) !== JSON.stringify(currentViewport)) {
        this.diagramStateService.setViewport(this.initialViewport);
      }
    }

    // Handle color mode changes
    if (changes['colorMode'] && !changes['colorMode'].firstChange) {
      this.themeService.setColorMode(this.colorMode);
    }
  }



  get transform(): string {
    const v = this.viewport();
    return `translate(${v.x}, ${v.y}) scale(${v.zoom})`;
  }

  trackByNodeId(index: number, node: WorkflowNode): string {
    return node.id;
  }

  trackByEdgeId(index: number, edge: Edge): string {
    return edge.id;
  }

  @HostListener('window:keydown.delete', ['$event'])
  onDeleteKeyPress(event: any): void {
    this.diagramStateService.deleteSelectedElements();
  }

  @HostListener('window:keydown.control.z', ['$event'])
  @HostListener('window:keydown.meta.z', ['$event']) // For macOS
  onUndoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser undo
    this.diagramStateService.undo();
  }

  @HostListener('window:keydown.control.shift.z', ['$event'])
  @HostListener('window:keydown.meta.shift.z', ['$event']) // For macOS
  onRedoKeyPress(event: any): void {
    event.preventDefault(); // Prevent browser redo
    this.diagramStateService.redo();
  }

  @HostListener('window:keydown.control.c', ['$event'])
  @HostListener('window:keydown.meta.c', ['$event'])
  onCopyKeyPress(event: any): void {
    // Don't prevent default if user is typing in an input
    if (this.isInputActive(event)) return;
    this.diagramStateService.copy();
  }

  @HostListener('window:keydown.control.v', ['$event'])
  @HostListener('window:keydown.meta.v', ['$event'])
  onPasteKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    this.diagramStateService.paste();
  }

  @HostListener('window:keydown.control.x', ['$event'])
  @HostListener('window:keydown.meta.x', ['$event'])
  onCutKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    this.diagramStateService.cut();
  }

  @HostListener('window:keydown.control.d', ['$event'])
  @HostListener('window:keydown.meta.d', ['$event'])
  onDuplicateKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault(); // Prevent browser bookmark
    this.diagramStateService.duplicate();
  }

  @HostListener('window:keydown.control.g', ['$event'])
  @HostListener('window:keydown.meta.g', ['$event'])
  onGroupKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault(); // Prevent browser find
    const selectedNodes = this.diagramStateService.selectedNodes();
    if (selectedNodes.length > 1) {
      this.diagramStateService.groupNodes(selectedNodes.map(n => n.id));
    }
  }

  @HostListener('window:keydown.control.shift.g', ['$event'])
  @HostListener('window:keydown.meta.shift.g', ['$event'])
  onUngroupKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    const selectedNodes = this.diagramStateService.selectedNodes();
    if (selectedNodes.length === 1 && selectedNodes[0].type === 'group') {
      this.diagramStateService.ungroupNodes(selectedNodes[0].id);
    }
  }

  @HostListener('window:keydown.control.a', ['$event'])
  @HostListener('window:keydown.meta.a', ['$event'])
  onSelectAllKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    this.diagramStateService.selectAllNodes();
  }

  @HostListener('window:keydown.arrowup', ['$event'])
  @HostListener('window:keydown.arrowdown', ['$event'])
  @HostListener('window:keydown.arrowleft', ['$event'])
  @HostListener('window:keydown.arrowright', ['$event'])
  onArrowKeyPress(event: any): void {
    if (this.isInputActive(event)) return;

    const selectedNodes = this.diagramStateService.selectedNodes();
    if (selectedNodes.length === 0) return;

    event.preventDefault();
    const step = event.shiftKey ? 1 : 10;
    const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;

    this.diagramStateService.moveNodesByDelta(selectedNodes.map(n => n.id), dx, dy);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    // Handle Space key release
    if (event.code === 'Space') {
      this.isSpacePressed = false;
      this.isSpacePanning = false;
      this.svgRef.nativeElement.style.cursor = '';
    }
  }

  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(event: PointerEvent): void {
    if (this.isSpacePanning) {
      const dx = event.clientX - this.panStartPosition.x;
      const dy = event.clientY - this.panStartPosition.y;

      const newViewport = {
        ...this.viewportStartPosition,
        x: this.viewportStartPosition.x + dx,
        y: this.viewportStartPosition.y + dy
      };

      this.diagramStateService.setViewport(newViewport);
      event.preventDefault();
    }
  }

  @HostListener('window:pointerup', ['$event'])
  onWindowPointerUp(event: PointerEvent): void {
    if (this.isSpacePanning) {
      this.isSpacePanning = false;
      if (this.isSpacePressed) {
        this.svgRef.nativeElement.style.cursor = 'grab';
      } else {
        this.svgRef.nativeElement.style.cursor = '';
      }
    }
  }

  toggleGroup(event: Event, node: WorkflowNode): void {
    event.stopPropagation();
    this.diagramStateService.toggleGroup(node.id);
  }

  private isInputActive(event: any): boolean {
    const target = event.target as HTMLElement;
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.ngZone.runOutsideAngular(() => {
      const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
      const clientX = event.clientX;
      const clientY = event.clientY;

      const viewportBefore = this.viewport();

      const pointX = (clientX - svgRect.left - viewportBefore.x) / viewportBefore.zoom;
      const pointY = (clientY - svgRect.top - viewportBefore.y) / viewportBefore.zoom;

      const scaleFactor = 1.05;
      const newZoom = event.deltaY < 0 ? viewportBefore.zoom * scaleFactor : viewportBefore.zoom / scaleFactor;

      const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

      const newX = clientX - svgRect.left - pointX * clampedZoom;
      const newY = clientY - svgRect.top - pointY * clampedZoom;

      this.diagramStateService.setViewport({ x: newX, y: newY, zoom: clampedZoom });
    });
  }



  onPointerDown(event: PointerEvent): void {
    // Check if right click (button 2) - ignore as it's handled by context menu
    if (event.button === 2) return;

    // If space is pressed, start panning
    if (this.isSpacePressed) {
      this.isSpacePanning = true;
      this.panStartPosition = { x: event.clientX, y: event.clientY };
      this.viewportStartPosition = { ...this.viewport() };
      this.svgRef.nativeElement.style.cursor = 'grabbing';
      event.preventDefault();
      return;
    }

    const target = event.target as HTMLElement;
    const handleElement = target.closest('.ngx-workflow__handle') as HTMLElement;
    const nodeElement = target.closest('.ngx-workflow__node') as HTMLElement;
    const resizeHandle = target.closest('.ngx-workflow__resize-handle') as HTMLElement;
    const edgeElement = target.closest('.ngx-workflow__edge') as HTMLElement;

    if (resizeHandle && nodeElement) {
      const nodeId = nodeElement.dataset['id'];
      const node = this.nodes().find(n => n.id === nodeId);
      const handle = resizeHandle.dataset['handle'] as 'nw' | 'ne' | 'sw' | 'se';
      if (node && handle) {
        this.startResizing(event, node, handle);
        return;
      }
    }

    if (handleElement) {
      this.startConnecting(event, handleElement);
      return;
    }

    if (nodeElement) {
      const nodeId = nodeElement.dataset['id'];
      const node = this.nodes().find(n => n.id === nodeId);
      if (node) {
        // If node is not selected, select it (and deselect others unless shift is pressed)
        if (!node.selected) {
          if (!event.shiftKey) {
            this.diagramStateService.clearSelection();
          }
          this.diagramStateService.selectNodes([node.id], true);
        }

        this.startDraggingNode(event, node);
        return;
      }
    }

    // If clicking an edge, let the specific handlers handle it (don't pan)
    if (edgeElement) {
      return;
    }

    // Canvas interactions
    if (event.shiftKey) {
      this.startSelecting(event);
    } else {
      this.startPanning(event);
    }
  }



  onPointerMove(event: PointerEvent): void {
    // console.log('onPointerMove', { dragging: this.isDraggingNode, connecting: this.isConnecting, resizing: this.isResizing });
    if (this.isResizing) {
      this.resize(event);
    } else if (this.isUpdatingEdge) {
      this.updateEdge(event);
    } else if (this.isConnecting) {
      this.updateConnection(event);
    } else if (this.isDraggingNode) {
      this.dragNode(event);
    } else if (this.isPanning) {
      this.pan(event);
    } else if (this.isSelecting) {
      this.updateSelection(event);
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.isResizing) {
      this.stopResizing(event);
    } else if (this.isUpdatingEdge) {
      this.stopUpdatingEdge(event);
    } else if (this.isConnecting) {
      this.finishConnecting(event);
    } else if (this.isDraggingNode) {
      this.stopDraggingNode(event);
    } else if (this.isPanning) {
      this.stopPanning(event);
    } else if (this.isSelecting) {
      this.endSelecting(event);
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (this.isResizing || this.isUpdatingEdge || this.isPanning || this.isSelecting || this.isDraggingNode || this.isConnecting) {
      this.onPointerUp(event);
    }
  }

  // --- Connecting Logic ---

  /**
   * Public method called from template when handle is clicked
   */
  onHandlePointerDown(event: PointerEvent, node: WorkflowNode, handleId: string): void {
    const handleElement = (event.currentTarget as HTMLElement);
    this.startConnecting(event, handleElement);
  }

  private startConnecting(event: PointerEvent, handleElement: HTMLElement): void {
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = true;
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    const nodeId = handleElement.dataset['nodeid'];
    const handleId = handleElement.dataset['handleid'];

    if (!nodeId) return;

    this.connectingSourceNodeId = nodeId;
    this.connectingSourceHandleId = handleId;

    const previewEdgeId = `preview-${uuidv4()}`;
    this.currentPreviewEdgeId = previewEdgeId;

    const viewport = this.viewport();
    const diagramSvgEl = this.svgRef.nativeElement;
    const handleScreenCoords = handleElement.getBoundingClientRect();
    const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();

    const sourceX = (handleScreenCoords.x + handleScreenCoords.width / 2 - diagramScreenCoords.x - viewport.x) / viewport.zoom;
    const sourceY = (handleScreenCoords.y + handleScreenCoords.height / 2 - diagramScreenCoords.y - viewport.y) / viewport.zoom;

    const newTempEdge: TempEdge = {
      id: previewEdgeId,
      source: nodeId,
      sourceHandle: handleId,
      target: 'preview-target',
      targetHandle: undefined,
      type: 'straight',
      animated: true,
      style: { stroke: 'blue', strokeWidth: '2' },
      sourceX: sourceX,
      sourceY: sourceY,
      targetX: sourceX,
      targetY: sourceY,
    };
    this.diagramStateService.addTempEdge(newTempEdge);
  }

  private updateConnection(event: PointerEvent): void {
    if (!this.currentPreviewEdgeId) return;

    this.ngZone.runOutsideAngular(() => {
      const diagramSvgEl = this.svgRef.nativeElement;
      const diagramScreenCoords = diagramSvgEl.getBoundingClientRect();
      const viewport = this.viewport();

      const currentPointerX = (event.clientX - diagramScreenCoords.x - viewport.x) / viewport.zoom;
      const currentPointerY = (event.clientY - diagramScreenCoords.y - viewport.y) / viewport.zoom;

      this.diagramStateService.updateTempEdgeTarget(this.currentPreviewEdgeId!, { x: currentPointerX, y: currentPointerY });

      // Use geometric distance check instead of elementFromPoint to avoid pointer capture issues
      let closestHandle: { nodeId: string, handleId: string } | null = null;
      let minDistance = 20; // Detection radius

      const nodes = this.nodes();
      for (const node of nodes) {
        const handles = ['top', 'right', 'bottom', 'left'];
        for (const handleId of handles) {
          const handlePos = getHandleAbsolutePosition(node, handleId);
          const dist = Math.hypot(handlePos.x - currentPointerX, handlePos.y - currentPointerY);
          if (dist < minDistance) {
            minDistance = dist;
            closestHandle = { nodeId: node.id, handleId: handleId };
          }
        }
      }

      this.clearTargetHandleHighlight();

      if (closestHandle) {
        const targetNodeId = closestHandle.nodeId;
        const targetHandleId = closestHandle.handleId;

        // Allow connecting to any handle on a different node OR same node (self-loop)
        // console.log('updateConnection: handle found', targetNodeId, this.connectingSourceNodeId);
        if (targetNodeId && this.isValidConnection(this.connectingSourceNodeId!, targetNodeId)) {
          this.currentTargetHandle = { nodeId: targetNodeId, handleId: targetHandleId, type: 'target' };

          // We need to find the handle element to highlight it
          // This is a bit expensive but necessary for visual feedback
          const handleEl = this.el.nativeElement.querySelector(`.ngx-workflow__handle[data-nodeid="${targetNodeId}"][data-handleid="${targetHandleId}"]`);
          if (handleEl) {
            this.renderer.addClass(handleEl, 'ngx-workflow__handle--valid-target');
          }
        } else {
          this.currentTargetHandle = null;
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private finishConnecting(event: PointerEvent): void {
    console.log('finishConnecting: start');
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.clearTargetHandleHighlight();

    if (this.currentPreviewEdgeId) {
      console.log('finishConnecting: removing preview edge');
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
    }

    if (this.currentTargetHandle && this.connectingSourceNodeId) {
      const sourceId = this.connectingSourceNodeId;
      const targetId = this.currentTargetHandle.nodeId;
      console.log('finishConnecting: attempting connection', { sourceId, targetId });

      if (this.isValidConnection(sourceId, targetId)) {
        const newEdge: Edge = {
          id: uuidv4(),
          source: sourceId,
          sourceHandle: this.connectingSourceHandleId,
          target: targetId,
          targetHandle: this.currentTargetHandle.handleId,
          // type: 'bezier', // Removed to use default smart routing
        };
        console.log('finishConnecting: adding edge', newEdge);
        this.diagramStateService.addEdge(newEdge);
      } else {
        console.log('finishConnecting: invalid connection');
        // Visual feedback for invalid connection: flash source node
        const sourceNodeEl = this.el.nativeElement.querySelector(`[data-nodeid="${sourceId}"]`);
        if (sourceNodeEl) {
          this.renderer.addClass(sourceNodeEl, 'invalid-connection');
          setTimeout(() => this.renderer.removeClass(sourceNodeEl, 'invalid-connection'), 1000);
        }
      }
    }

    this.currentPreviewEdgeId = null;
    this.currentTargetHandle = null;
    this.connectingSourceNodeId = null;
    this.connectingSourceHandleId = undefined;
    console.log('finishConnecting: end');
  }

  private clearTargetHandleHighlight(): void {
    const activeHighlights = document.querySelectorAll('.ngx-workflow__handle--valid-target');
    activeHighlights.forEach(el => this.renderer.removeClass(el, 'ngx-workflow__handle--valid-target'));
  }

  // --- Dragging Logic ---

  private startDraggingNode(event: PointerEvent, node: WorkflowNode): void {
    event.stopPropagation();
    this.isDraggingNode = true;
    this.draggingNode = node;
    this.startNodePosition = { x: node.position.x, y: node.position.y };
    this.startPointerPosition = { x: event.clientX, y: event.clientY };
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    // Check if this node is part of a multi-selection
    const selectedNodes = this.nodes().filter(n => n.selected);
    if (selectedNodes.length > 1 && node.selected) {
      // Multi-node drag: store all selected nodes and their positions
      this.draggingNodes = selectedNodes;
      this.startNodePositions.clear();
      selectedNodes.forEach(n => {
        this.startNodePositions.set(n.id, { x: n.position.x, y: n.position.y });
      });
    } else {
      // Single node drag
      this.draggingNodes = [node];
      this.startNodePositions.clear();
      this.startNodePositions.set(node.id, { x: node.position.x, y: node.position.y });
    }

    this.diagramStateService.onDragStart(node);
    console.log('startDraggingNode: started for', node.id);
  }

  private dragNode(event: PointerEvent): void {
    if (!this.draggingNode) return;
    event.stopPropagation();

    if (this.dragAnimationFrameId) {
      cancelAnimationFrame(this.dragAnimationFrameId);
    }

    this.dragAnimationFrameId = requestAnimationFrame(() => {
      if (!this.draggingNode) return;
      const zoom = this.viewport().zoom;
      const deltaX = (event.clientX - this.startPointerPosition.x) / zoom;
      const deltaY = (event.clientY - this.startPointerPosition.y) / zoom;

      if (this.draggingNodes.length > 1) {
        // Multi-node drag: move all selected nodes by the same delta
        const moves = this.draggingNodes.map(node => {
          const startPos = this.startNodePositions.get(node.id)!;
          return {
            id: node.id,
            position: {
              x: startPos.x + deltaX,
              y: startPos.y + deltaY
            }
          };
        });
        this.diagramStateService.moveNodes(moves);
      } else {
        // Single node drag
        const newPosition = {
          x: this.startNodePosition.x + deltaX,
          y: this.startNodePosition.y + deltaY,
        };
        this.diagramStateService.moveNode(this.draggingNode!.id, newPosition);
      }
      this.cdRef.detectChanges();
      this.dragAnimationFrameId = null;
    });

    // Check for auto-pan
    this.checkAutoPan(event.clientX, event.clientY);
  }

  private stopDraggingNode(event: PointerEvent): void {
    if (!this.draggingNode) return;
    event.stopPropagation();

    // Stop auto-pan
    this.stopAutoPan();

    this.isDraggingNode = false;
    this.updatePathFinder(this.nodes());
    if (this.dragAnimationFrameId) {
      cancelAnimationFrame(this.dragAnimationFrameId);
      this.dragAnimationFrameId = null;
    }
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);

    // Trigger onDragEnd for all dragged nodes
    this.draggingNodes.forEach(node => {
      this.diagramStateService.onDragEnd(node);
      this.checkReparenting(node);
    });
    console.log('stopDraggingNode: stopped');

    this.draggingNode = null;
    this.draggingNodes = [];
    this.startNodePositions.clear();

    // Emit the final state after drag is complete
    this.nodesChange.emit(this.nodes());
  }

  private checkReparenting(node: WorkflowNode): void {
    // Find if the node is dropped onto a group
    const nodes = this.nodes();
    const nodeRect = {
      x: node.position.x,
      y: node.position.y,
      width: node.width || this.defaultNodeWidth,
      height: node.height || this.defaultNodeHeight
    };

    const nodeCenter = {
      x: nodeRect.x + nodeRect.width / 2,
      y: nodeRect.y + nodeRect.height / 2
    };

    const potentialParents = nodes.filter(n =>
      n.type === 'group' &&
      n.id !== node.id &&
      // Check if center is inside group
      nodeCenter.x >= n.position.x &&
      nodeCenter.x <= n.position.x + (n.width || this.defaultNodeWidth) &&
      nodeCenter.y >= n.position.y &&
      nodeCenter.y <= n.position.y + (n.height || this.defaultNodeHeight)
    );

    let newParentId: string | undefined = undefined;

    if (potentialParents.length > 0) {
      // Sort by area (smallest first) to find the most specific group
      potentialParents.sort((a, b) => {
        const areaA = (a.width || this.defaultNodeWidth) * (a.height || this.defaultNodeHeight);
        const areaB = (b.width || this.defaultNodeWidth) * (b.height || this.defaultNodeHeight);
        return areaA - areaB;
      });
      newParentId = potentialParents[0].id;
    }

    // Only update if parent changed
    if (node.parentId !== newParentId) {
      console.log(`Reparenting node ${node.id} to ${newParentId || 'root'}`);
      this.diagramStateService.updateNode(node.id, { parentId: newParentId });
    }
  }

  // --- Resizing Logic ---

  private startResizing(event: PointerEvent, node: WorkflowNode, handle: 'nw' | 'ne' | 'sw' | 'se'): void {
    event.stopPropagation();
    this.isResizing = true;
    this.resizingNode = node;
    this.resizeHandle = handle;
    this.startResizePosition = { x: event.clientX, y: event.clientY };
    this.startNodeDimensions = {
      width: node.width || this.defaultNodeWidth,
      height: node.height || this.defaultNodeHeight,
      x: node.position.x,
      y: node.position.y
    };
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
    this.diagramStateService.onResizeStart(node);
  }

  private resize(event: PointerEvent): void {
    if (!this.resizingNode || !this.resizeHandle) return;
    event.stopPropagation();

    const resizingNode = this.resizingNode;
    const resizeHandle = this.resizeHandle;

    this.ngZone.runOutsideAngular(() => {
      const zoom = this.viewport().zoom;
      const deltaX = (event.clientX - this.startResizePosition.x) / zoom;
      const deltaY = (event.clientY - this.startResizePosition.y) / zoom;

      let newWidth = this.startNodeDimensions.width;
      let newHeight = this.startNodeDimensions.height;
      let newX = this.startNodeDimensions.x;
      let newY = this.startNodeDimensions.y;

      // Calculate new dimensions based on handle
      switch (resizeHandle) {
        case 'se': // Southeast - resize from bottom-right
          newWidth = this.startNodeDimensions.width + deltaX;
          newHeight = this.startNodeDimensions.height + deltaY;
          break;
        case 'sw': // Southwest - resize from bottom-left
          newWidth = this.startNodeDimensions.width - deltaX;
          newHeight = this.startNodeDimensions.height + deltaY;
          newX = this.startNodeDimensions.x + deltaX;
          break;
        case 'ne': // Northeast - resize from top-right
          newWidth = this.startNodeDimensions.width + deltaX;
          newHeight = this.startNodeDimensions.height - deltaY;
          newY = this.startNodeDimensions.y + deltaY;
          break;
        case 'nw': // Northwest - resize from top-left
          newWidth = this.startNodeDimensions.width - deltaX;
          newHeight = this.startNodeDimensions.height - deltaY;
          newX = this.startNodeDimensions.x + deltaX;
          newY = this.startNodeDimensions.y + deltaY;
          break;
      }

      // Apply constraints
      const minWidth = resizingNode.minWidth || 50;
      const minHeight = resizingNode.minHeight || 30;
      const maxWidth = resizingNode.maxWidth || 500;
      const maxHeight = resizingNode.maxHeight || 500;

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      // Adjust position if constrained (for nw, ne, sw handles)
      if (resizeHandle === 'nw' || resizeHandle === 'sw') {
        const widthDiff = newWidth - (this.startNodeDimensions.width - deltaX);
        newX = this.startNodeDimensions.x + deltaX - widthDiff;
      }
      if (resizeHandle === 'nw' || resizeHandle === 'ne') {
        const heightDiff = newHeight - (this.startNodeDimensions.height - deltaY);
        newY = this.startNodeDimensions.y + deltaY - heightDiff;
      }

      // Update node
      this.diagramStateService.resizeNode(resizingNode.id, newWidth, newHeight, { x: newX, y: newY });
    });
  }

  private stopResizing(event: PointerEvent): void {
    if (!this.resizingNode) return;
    event.stopPropagation();
    this.isResizing = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.diagramStateService.onResizeEnd(this.resizingNode);
    this.resizingNode = null;
    this.resizeHandle = null;
  }

  // --- Edge Updating Logic ---

  startUpdatingEdge(event: PointerEvent, edge: Edge, handleType: 'source' | 'target'): void {
    event.stopPropagation();
    this.isUpdatingEdge = true;
    this.updatingEdge = edge;
    this.updatingEdgeHandle = handleType;
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);

    // Hide the original edge during reconnection
    this.diagramStateService.edges.update(edges =>
      edges.map(e => e.id === edge.id ? { ...e, hidden: true } : e)
    );

    const tempEdgeId = `temp-update-${edge.id}`;
    this.currentPreviewEdgeId = tempEdgeId;

    const sourceNode = this.nodes().find(n => n.id === edge.source);
    const targetNode = this.nodes().find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) return;

    const sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

    let startX, startY, endX, endY;

    if (handleType === 'source') {
      startX = targetPos.x;
      startY = targetPos.y;
      endX = sourcePos.x;
      endY = sourcePos.y;
    } else {
      startX = sourcePos.x;
      startY = sourcePos.y;
      endX = targetPos.x;
      endY = targetPos.y;
    }

    this.diagramStateService.addTempEdge({
      id: tempEdgeId,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
      type: edge.type || 'bezier',
      animated: edge.animated,
      sourceX: startX,
      sourceY: startY,
      targetX: endX,
      targetY: endY,
      style: edge.style,
      markerEnd: edge.markerEnd
    });
  }

  private updateEdge(event: PointerEvent): void {
    if (!this.updatingEdge || !this.currentPreviewEdgeId) return;
    event.stopPropagation();

    this.ngZone.runOutsideAngular(() => {
      const diagramRect = this.svgRef.nativeElement.getBoundingClientRect();
      const viewport = this.viewport();
      const point = {
        x: (event.clientX - diagramRect.left - viewport.x) / viewport.zoom,
        y: (event.clientY - diagramRect.top - viewport.y) / viewport.zoom
      };

      this.diagramStateService.updateTempEdgeTarget(this.currentPreviewEdgeId!, point);

      const element = document.elementFromPoint(event.clientX, event.clientY);
      const handle = element?.closest('.ngx-workflow__handle');

      if (handle) {
        const nodeId = handle.getAttribute('data-nodeid');
        const handleId = handle.getAttribute('data-handleid');
        const type = handle.getAttribute('data-type');

        if (nodeId && type) {
          this.currentTargetHandle = { nodeId, handleId: handleId || undefined, type: type as 'source' | 'target' };
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private stopUpdatingEdge(event: PointerEvent): void {
    if (!this.updatingEdge) return;
    event.stopPropagation();

    const edgeToUpdate = this.updatingEdge;
    const handleType = this.updatingEdgeHandle;

    this.isUpdatingEdge = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);

    // Remove preview edge
    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
      this.currentPreviewEdgeId = null;
    }

    // If dropped on a valid handle, reconnect the edge
    if (this.currentTargetHandle && handleType) {
      const newEdge = { ...edgeToUpdate, hidden: false };

      if (handleType === 'source') {
        // Reconnecting source end
        newEdge.source = this.currentTargetHandle.nodeId;
        newEdge.sourceHandle = this.currentTargetHandle.handleId;
      } else {
        // Reconnecting target end
        newEdge.target = this.currentTargetHandle.nodeId;
        newEdge.targetHandle = this.currentTargetHandle.handleId;
      }

      // Validate the new connection
      if (this.isValidConnection(newEdge.source, newEdge.target)) {
        // Save state before updating for undo/redo
        this.diagramStateService.saveStateForUndo();

        // Update the edge in the state using edges.update
        this.diagramStateService.edges.update(edges =>
          edges.map(e => e.id === edgeToUpdate.id ? newEdge : e)
        );
        this.edgesChange.emit(this.diagramStateService.edges());
      } else {
        // Show the original edge again if connection failed
        this.diagramStateService.edges.update(edges =>
          edges.map(e => e.id === edgeToUpdate.id ? { ...e, hidden: false } : e)
        );
      }
    } else {
      // Show the original edge again if no valid drop target
      this.diagramStateService.edges.update(edges =>
        edges.map(e => e.id === edgeToUpdate.id ? { ...e, hidden: false } : e)
      );
    }

    // Clear state
    this.updatingEdge = null;
    this.updatingEdgeHandle = null;
    this.currentTargetHandle = null;
  }


  // --- Panning Logic ---

  private startPanning(event: PointerEvent): void {
    this.isPanning = true;
    this.lastPanPosition = { x: event.clientX, y: event.clientY };
    this.renderer.setStyle(this.svgRef.nativeElement, 'cursor', 'grabbing');
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
    this.diagramStateService.clearSelection();
  }

  private pan(event: PointerEvent): void {
    this.ngZone.runOutsideAngular(() => {
      const deltaX = event.clientX - this.lastPanPosition.x;
      const deltaY = event.clientY - this.lastPanPosition.y;

      const currentViewport = this.viewport();
      this.diagramStateService.setViewport({
        x: currentViewport.x + deltaX,
        y: currentViewport.y + deltaY,
        zoom: currentViewport.zoom,
      });

      this.lastPanPosition = { x: event.clientX, y: event.clientY };
    });
  }

  private stopPanning(event: PointerEvent): void {
    this.isPanning = false;
    this.renderer.setStyle(this.svgRef.nativeElement, 'cursor', 'grab');
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
  }

  // --- Edge Logic ---

  getEdgePath(edge: Edge | TempEdge, isTemporary: boolean = false): string {
    const nodes = this.nodes();
    let sourcePos: XYPosition;
    let targetPos: XYPosition;

    if (isTemporary && 'sourceX' in edge && 'sourceY' in edge && 'targetX' in edge && 'targetY' in edge) {
      sourcePos = { x: edge.sourceX, y: edge.sourceY };
      targetPos = { x: edge.targetX, y: edge.targetY };
    } else {
      const sourceNode = getNode(edge.source, nodes);
      const targetNode = getNode(edge.target, nodes);

      if (!sourceNode || !targetNode) {
        return 'M 0 0';
      }

      sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
      targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

      if (sourceNode.id === targetNode.id) {
        return getSelfLoopPath(sourcePos, edge.sourceHandle);
      }
    }

    // Use smart routing if type is 'smart' or not specified (default)
    // But respect explicit 'straight' type if user wants simple straight line
    if ((edge.type === 'smart' || !edge.type) && !isTemporary) {
      const cacheKey = `${edge.id}-${sourcePos.x},${sourcePos.y}-${targetPos.x},${targetPos.y}`;

      if (this.pathCache.has(cacheKey)) {
        return this.pathCache.get(cacheKey)!;
      }

      try {
        if (!this._pathFinder) {
          this.updatePathFinder(this.nodes());
        }
        const path = this._pathFinder!.findPath(sourcePos, targetPos);
        const d = getSmartEdgePath(path);
        this.pathCache.set(cacheKey, d);
        return d;
      } catch (e) {
        console.warn('Pathfinding failed, falling back to straight path', e);
        return getStraightPath(sourcePos, targetPos);
      }
    }

    switch (edge.type) {
      case 'bezier': return getBezierPath(sourcePos, targetPos);
      case 'step': return getStepPath(sourcePos, targetPos);
      case 'smoothstep': return getSmoothStepPath(sourcePos, targetPos);
      case 'straight': return getStraightPath(sourcePos, targetPos);
      default: return getStraightPath(sourcePos, targetPos);
    }
  }

  getMarkerUrl(marker: string | undefined): string | null {
    if (!marker) return null;
    // Support built-in markers or custom marker IDs
    if (marker === 'arrow' || marker === 'arrowclosed' || marker === 'dot') {
      return `url(#ngx-workflow__${marker})`;
    }
    return `url(#${marker})`;
  }

  getEdgeLabelPosition(edge: Edge): XYPosition {
    const nodes = this.nodes();
    const sourceNode = getNode(edge.source, nodes);
    const targetNode = getNode(edge.target, nodes);

    if (!sourceNode || !targetNode) {
      return { x: 0, y: 0 };
    }

    const sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

    if (edge.type === 'smart' || !edge.type) {
      try {
        // For label position, we can re-use the cached path if available, 
        // but we need the points, not the string. 
        // For now, let's just re-calculate or maybe cache points too?
        // Re-calculating for label might be okay if getEdgePath is cached, 
        // but ideally we cache the points.
        // Let's optimize this later if needed, or cache points instead of string.

        // Optimization: Cache points instead of string
        const cacheKey = `${edge.id}-${sourcePos.x},${sourcePos.y}-${targetPos.x},${targetPos.y}-points`;
        let path: XYPosition[];

        if (this.pathPointsCache.has(cacheKey)) {
          path = this.pathPointsCache.get(cacheKey)!;
        } else {
          if (!this._pathFinder) {
            this.updatePathFinder(this.nodes());
          }
          path = this._pathFinder!.findPath(sourcePos, targetPos);
          this.pathPointsCache.set(cacheKey, path);
        }

        return getPolylineMidpoint(path);
      } catch (e) {
        console.warn('Pathfinding failed for label position', e);
      }
    }

    // Return midpoint of the edge
    return {
      x: (sourcePos.x + targetPos.x) / 2,
      y: (sourcePos.y + targetPos.y) / 2
    };
  }

  onEdgeClick(event: MouseEvent, edge: Edge): void {
    console.log('onEdgeClick', edge.id);
    event.stopPropagation();
    event.preventDefault();

    this.diagramStateService.onEdgeClick(edge);

    const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;

    // Clear node selection when selecting edges
    this.diagramStateService.nodes.update(nodes =>
      nodes.map(n => ({ ...n, selected: false }))
    );

    // Toggle edge selection
    this.diagramStateService.edges.update(edges =>
      edges.map(e => ({
        ...e,
        selected: e.id === edge.id
          ? !e.selected
          : (isMultiSelect ? e.selected : false)
      }))
    );
  }

  onEdgeDoubleClick(event: MouseEvent, edge: Edge): void {
    console.log('onEdgeDoubleClick', edge.id);
    event.stopPropagation();
    event.preventDefault();
    this.editingEdgeId = edge.id;
    this.editingEdgeLabel = edge.label || '';

    // Force change detection
    this.cdRef.detectChanges();

    // Focus the input after a short delay to allow rendering
    setTimeout(() => {
      const input = this.el.nativeElement.querySelector('.ngx-workflow__edge-label-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      } else {
        console.warn('Edge label input not found');
      }
    }, 10);
  }

  // --- Node Logic ---

  getCustomNodeComponent(type: string | undefined): WorkflowNodeComponentType | null {
    if (type && this.nodeTypes && this.nodeTypes[type]) {
      return this.nodeTypes[type];
    }
    return null;
  }

  zoomIn(): void {
    const currentViewport = this.viewport();
    const newZoom = Math.min(currentViewport.zoom * 1.2, 10);
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: newZoom
    });
  }

  zoomOut(): void {
    const currentViewport = this.viewport();
    const newZoom = Math.max(currentViewport.zoom / 1.2, 0.1);
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: newZoom
    });
  }

  resetZoom(): void {
    const currentViewport = this.viewport();
    this.diagramStateService.setViewport({
      ...currentViewport,
      zoom: 1
    });
  }

  fitView(): void {
    const nodes = this.nodes();
    if (nodes.length === 0) return;

    // Calculate bounds of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const width = node.width || this.defaultNodeWidth;
      const height = node.height || this.defaultNodeHeight;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const boundsWidth = maxX - minX;
    const boundsHeight = maxY - minY;

    // Get SVG dimensions
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const padding = 50; // Padding around nodes

    // Calculate zoom to fit
    const zoomX = (svgRect.width - padding * 2) / boundsWidth;
    const zoomY = (svgRect.height - padding * 2) / boundsHeight;
    const zoom = Math.min(zoomX, zoomY, 2); // Max zoom of 2x for fit view

    // Calculate center position
    const x = (svgRect.width - boundsWidth * zoom) / 2 - minX * zoom;
    const y = (svgRect.height - boundsHeight * zoom) / 2 - minY * zoom;

    this.diagramStateService.setViewport({ x, y, zoom });
  }

  /**
   * Returns the current state of the diagram (nodes, edges, viewport).
   */
  getDiagramState(): DiagramState {
    return this.diagramStateService.getDiagramState();
  }

  /**
   * Sets the state of the diagram.
   */
  setDiagramState(state: DiagramState): void {
    this.diagramStateService.setDiagramState(state);
  }

  /**
   * Exports the diagram as an SVG file.
   * @param fileName The name of the file to download (default: 'diagram.svg')
   * @param download Whether to trigger a download (default: true)
   * @returns The SVG string
   */
  exportToSVG(fileName: string = 'diagram.svg', download: boolean = true): string {
    const svgElement = this.svgRef.nativeElement;

    // Clone the SVG to avoid modifying the live diagram
    const clone = svgElement.cloneNode(true) as SVGSVGElement;

    // Get the bounding box of the content (nodes and edges)
    const nodes = this.nodes();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (nodes.length > 0) {
      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + (node.width || this.defaultNodeWidth));
        maxY = Math.max(maxY, node.position.y + (node.height || this.defaultNodeHeight));
      });
    } else {
      minX = 0; minY = 0; maxX = 100; maxY = 100;
    }

    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = maxX - minX;
    const height = maxY - minY;

    // Set the viewBox to the content bounds
    clone.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
    clone.setAttribute('width', `${width}`);
    clone.setAttribute('height', `${height}`);

    // Remove background and other non-content elements from clone
    const background = clone.querySelector('ngx-workflow-background');
    if (background) background.remove();

    const gridOverlay = clone.querySelector('ngx-workflow-grid-overlay');
    if (gridOverlay) gridOverlay.remove();

    const minimap = clone.querySelector('ngx-workflow-minimap');
    if (minimap) minimap.remove();

    const controls = clone.querySelectorAll('.ngx-workflow__controls, .ngx-workflow__zoom-controls, .ngx-workflow__undo-redo-controls');
    controls.forEach(el => el.remove());

    // Reset the viewport transform
    const viewportGroup = clone.querySelector('.ngx-workflow__viewport');
    if (viewportGroup) {
      viewportGroup.removeAttribute('transform');
    }

    // Serialize the SVG
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clone);

    // Add XML declaration
    if (!svgString.match(/^<\?xml/)) {
      svgString = '<?xml version="1.0" encoding="utf-8"?>\n' + svgString;
    }

    if (download) {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      this.downloadFile(url, fileName);
      URL.revokeObjectURL(url);
    }

    return svgString;
  }

  /**
   * Exports the diagram as a PNG image.
   * @param fileName The name of the file to download (default: 'diagram.png')
   * @param download Whether to trigger a download (default: true)
   * @returns A promise that resolves to the data URL of the PNG
   */
  async exportToPNG(fileName: string = 'diagram.png', download: boolean = true): Promise<string> {
    const svgString = this.exportToSVG(fileName, false);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        const pngUrl = canvas.toDataURL('image/png');

        if (download) {
          this.downloadFile(pngUrl, fileName);
        }

        URL.revokeObjectURL(url);
        resolve(pngUrl);
      };

      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };

      img.src = url;
    });
  }

  /**
   * Copies the diagram to the clipboard as a PNG image.
   */
  async copyToClipboard(): Promise<void> {
    await this.exportService.copyToClipboard(this.svgRef.nativeElement);
  }

  /**
   * Exports the diagram state as a JSON file.
   * @param fileName The name of the file to download (default: 'diagram.json')
   */
  exportToJSON(fileName: string = 'diagram.json'): void {
    const state = this.getDiagramState();
    const jsonString = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    this.downloadFile(url, fileName);
    URL.revokeObjectURL(url);
  }

  /**
   * Triggers the file input to select a JSON file for import.
   */
  triggerImport(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    fileInput.onchange = (e) => this.onFileSelected(e);
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
  }

  /**
   * Handles the file selection for import.
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const state = JSON.parse(jsonString) as DiagramState;

        // Basic validation
        if (state.nodes && state.edges && state.viewport) {
          this.setDiagramState(state);
        } else {
          console.error('Invalid diagram JSON format');
          // TODO: Show user notification
        }
      } catch (error) {
        console.error('Error parsing JSON', error);
        // TODO: Show user notification
      }
    };

    reader.readAsText(file);
  }

  private downloadFile(url: string, fileName: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.diagramStateService.setSearchQuery(input.value);
  }

  onFilterType(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.diagramStateService.setFilterType(select.value || null);
  }

  onZoomChange(zoom: number): void {
    this.diagramStateService.setZoom(zoom);
  }

  getEdgeHandlePosition(edge: Edge, type: 'source' | 'target'): XYPosition {
    const nodes = this.nodes();
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);

    if (!sourceNode || !targetNode) {
      return { x: 0, y: 0 };
    }

    const sourcePos = getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = getHandleAbsolutePosition(targetNode, edge.targetHandle);

    // Offset 30px along the edge from each node
    const offset = 30;

    if (type === 'source') {
      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < offset * 2) return sourcePos;

      return {
        x: sourcePos.x + (dx / length) * offset,
        y: sourcePos.y + (dy / length) * offset
      };
    } else {
      const dx = sourcePos.x - targetPos.x;
      const dy = sourcePos.y - targetPos.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < offset * 2) return targetPos;

      return {
        x: targetPos.x + (dx / length) * offset,
        y: targetPos.y + (dy / length) * offset
      };
    }
  }

  onMinimapViewportChange(viewport: Viewport): void {
    this.diagramStateService.setViewport(viewport);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    // Ignore if focus is on an input or textarea
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Handle Space key for panning
    if (event.code === 'Space' && !this.isSpacePressed) {
      this.isSpacePressed = true;
      event.preventDefault();
      // Change cursor to grab
      this.svgRef.nativeElement.style.cursor = 'grab';
      return; // Don't process other keys when space is pressed
    }

    // Delete or Backspace to remove selected elements
    if (event.key === 'Delete' || event.key === 'Backspace') {
      this.diagramStateService.deleteSelectedElements();
    }

    // Ctrl+A or Cmd+A to select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault(); // Prevent default browser select all
      this.diagramStateService.selectAll();
    }

    // Undo (Ctrl+Z) and Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        event.preventDefault();
        this.diagramStateService.undo();
      } else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) {
        event.preventDefault();
        this.diagramStateService.redo();
      }

      // Export Shortcuts (Ctrl+Shift+...)
      if (event.shiftKey) {
        if (event.key === 'E') {
          // Ctrl+Shift+E: Export as PNG
          event.preventDefault();
          this.exportToPNG();
        } else if (event.key === 'S') {
          // Ctrl+Shift+S: Export as SVG
          event.preventDefault();
          this.exportToSVG();
        } else if (event.key === 'C') {
          // Ctrl+Shift+C: Copy to clipboard
          event.preventDefault();
          this.copyToClipboard();
        }
      }

      // Clipboard Operations
      if (event.key === 'c') {
        // Handled by onCopyKeyPress
      } else if (event.key === 'v') {
        // Handled by onPasteKeyPress
      } else if (event.key === 'x') {
        // Handled by onCutKeyPress
      }
    }
  }

  // --- Box Selection Methods ---

  private startSelecting(event: PointerEvent): void {
    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();

    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

    this.isSelecting = true;
    this.selectionStart = { x, y };
    this.selectionEnd = { x, y };
    this.diagramStateService.startBoxSelection(x, y);
    this.svgRef.nativeElement.setPointerCapture(event.pointerId);
  }

  private updateSelection(event: PointerEvent): void {
    if (!this.isSelecting) return;

    const rect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();

    const x = (event.clientX - rect.left - viewport.x) / viewport.zoom;
    const y = (event.clientY - rect.top - viewport.y) / viewport.zoom;

    this.selectionEnd = { x, y };
    this.diagramStateService.updateBoxSelection(x, y);
  }
  private endSelecting(event: PointerEvent): void {
    if (!this.isSelecting) return;

    this.isSelecting = false;
    this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
    this.diagramStateService.endBoxSelection();
  }

  /**
   * Check if mouse is near viewport edge and calculate pan direction
   */
  private checkAutoPan(clientX: number, clientY: number): void {
    if (!this.autoPanOnNodeDrag && !this.isDraggingNode) return;
    if (!this.autoPanOnConnect && !this.isConnecting) return;

    const container = this.svgRef.nativeElement.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const threshold = this.autoPanEdgeThreshold;

    // Calculate distance from edges
    const distanceFromLeft = clientX - rect.left;
    const distanceFromRight = rect.right - clientX;
    const distanceFromTop = clientY - rect.top;
    const distanceFromBottom = rect.bottom - clientY;

    // Determine pan direction
    let panX = 0;
    let panY = 0;

    if (distanceFromLeft < threshold) {
      panX = 1;
    } else if (distanceFromRight < threshold) {
      panX = -1;
    }

    if (distanceFromTop < threshold) {
      panY = 1;
    } else if (distanceFromBottom < threshold) {
      panY = -1;
    }

    // Start or stop auto-pan
    if (panX !== 0 || panY !== 0) {
      this.startAutoPan(panX, panY);
    } else {
      this.stopAutoPan();
    }
  }

  /**
   * Start auto-panning in the specified direction
   */
  private startAutoPan(x: number, y: number): void {
    this.autoPanDirection = { x, y };

    if (this.autoPanInterval === null) {
      this.autoPanInterval = window.requestAnimationFrame(() => this.autoPan());
    }
  }

  /**
   * Stop auto-panning
   */
  private stopAutoPan(): void {
    if (this.autoPanInterval !== null) {
      window.cancelAnimationFrame(this.autoPanInterval);
      this.autoPanInterval = null;
    }
    this.autoPanDirection = { x: 0, y: 0 };
  }

  /**
   * Perform auto-pan animation
   */
  private autoPan(): void {
    if (this.autoPanDirection.x === 0 && this.autoPanDirection.y === 0) {
      this.stopAutoPan();
      return;
    }

    const currentViewport = this.diagramStateService.viewport();
    const newViewport = {
      ...currentViewport,
      x: currentViewport.x + (this.autoPanDirection.x * this.autoPanSpeed),
      y: currentViewport.y + (this.autoPanDirection.y * this.autoPanSpeed)
    };

    this.diagramStateService.setViewport(newViewport);

    // Continue animation
    this.autoPanInterval = window.requestAnimationFrame(() => this.autoPan());
  }
}
