import { Component, ChangeDetectionStrategy, ElementRef, OnInit, Renderer2, NgZone, OnDestroy, HostListener, WritableSignal, Inject, Optional, computed, ViewChild, ContentChild, Signal, ChangeDetectorRef, TemplateRef, Type, signal, forwardRef, inject, input, output, effect, untracked } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { CommonModule, NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { DiagramStateService } from '../../services/diagram-state.service';
import { Viewport, XYPosition, Node as WorkflowNode, Edge, TempEdge, DiagramState, AlignmentGuide, EdgeLabelPosition, EdgeLabel, NodeChange, EdgeChange, ConnectionMode, SelectionMode, KeyboardShortcuts, FlowOptimization, ComponentNodeEvent } from '../../models';
import { Subscription, Observable, combineLatest } from 'rxjs';
import { debounceTime, skip } from 'rxjs/operators';
import { NGX_WORKFLOW_NODE_TYPES, NGX_WORKFLOW_EDGE_TYPES } from '../../injection-tokens';
import { NodeComponentType as WorkflowNodeComponentType, EdgeComponentType as WorkflowEdgeComponentType } from '../../types';
import { getBezierPath, getBezierControlPoints, getStraightPath, getStepPath, getSmoothStepPath, getSelfLoopPath, getSmartEdgePath, getWaypointPath, PathFinder, getPolylineMidpoint, normalizeHandle, inferHandlePosition, HandlePosition, getArrowheadGeometry, ArrowheadGeometry, getCubicBezierPoint, getCubicBezierTangent } from '../../utils';
import { v4 as uuidv4 } from 'uuid';
import { ZoomControlsComponent } from '../zoom-controls/zoom-controls.component';
import { ZoomControlsConfig } from '../zoom-controls/zoom-controls.model';
import { MinimapComponent } from '../minimap/minimap.component';
import { BackgroundComponent } from '../background/background.component';
import { GridOverlayComponent } from '../grid-overlay/grid-overlay.component';
import { PropertiesSidebarComponent } from '../properties-sidebar/properties-sidebar.component';
import { ContextMenuComponent } from '../context-menu/context-menu.component';
import { ContextMenuService, ContextMenuItem } from '../../services/context-menu.service';
import { SearchControlsComponent } from '../search-controls/search-controls.component';
import { LayoutAlignmentControlsComponent } from '../layout-alignment-controls/layout-alignment-controls.component';
import { ThemeService, ColorMode } from '../../services/theme.service';
import { ExportService } from '../../services/export.service';
import { ExportControlsComponent } from '../export-controls/export-controls.component';
import { UndoRedoControlsComponent } from '../undo-redo-controls/undo-redo-controls.component';
import { AutoSaveService } from '../../services/auto-save.service';
import { TouchGestureService } from '../../services/touch-gesture.service';
import { CanvasPanZoomService } from '../../services/canvas-pan-zoom.service';
import { NodeDragService } from '../../services/node-drag.service';
import { SelectionBoxService } from '../../services/selection-box.service';
import { ComponentNodeEventService } from '../../services/component-node-event.service';
import { NgxWorkflowChangesControllerDirective } from '../../directives/changes-controller.directive';

export interface EdgeDropEvent {
  sourceNodeId: string;
  sourceHandleId: string;
  position: { x: number, y: number };
}

/** Component class or lazy import factory for custom nodes. */
export type NodeTypeEntry =
  | Type<any>
  | (() => Promise<Type<any> | { default: Type<any> }>);

// Helper function to get a node from the array
function getNode(id: string, nodes: WorkflowNode[]): WorkflowNode | undefined {
  return nodes.find(n => n.id === id);
}

// Helper function to determine handle position based on node and handle id/type
// Helper function removed (moved to DiagramComponent method)

// Helper function to calculate badge position
function getBadgePosition(node: WorkflowNode, position: string | undefined, index: number): XYPosition {
  const nodeWidth = node.width || 170;
  const nodeHeight = node.height || 60;
  const offset = 5; // Distance from corner

  // Default to top-right if not specified
  // We stack badges if multiple are in the same position (simplified stacking for now)
  const stackOffset = index * 20;

  switch (position) {
    case 'top-left':
      return { x: -offset, y: -offset };
    case 'bottom-left':
      return { x: -offset, y: nodeHeight + offset };
    case 'bottom-right':
      return { x: nodeWidth + offset, y: nodeHeight + offset };
    case 'top-right':
    default:
      return { x: nodeWidth + offset, y: -offset };
  }
}

import { HandleComponent } from '../handle/handle.component';
import { HandleRegistryService } from '../../services/handle-registry.service';
import { LayoutService } from '../../services/layout.service';
import { UndoRedoService } from '../../services/undo-redo.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'ngx-workflow-diagram',
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NgComponentOutlet,
    NgTemplateOutlet,
    ZoomControlsComponent,
    MinimapComponent,
    BackgroundComponent,
    GridOverlayComponent,
    PropertiesSidebarComponent,
    SearchControlsComponent,
    ContextMenuComponent,
    ExportControlsComponent,
    LayoutAlignmentControlsComponent,
    UndoRedoControlsComponent,
    HandleComponent,
  ],
  hostDirectives: [
    {
      directive: NgxWorkflowChangesControllerDirective,
      inputs: ['filterNodeTypes', 'filterEdgeTypes'],
      outputs: ['filteredNodeChanges', 'filteredEdgeChanges'],
    },
  ],
  providers: [
    ComponentNodeEventService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DiagramComponent),
      multi: true,
    },
    // Per-diagram instances so multiple <ngx-workflow-diagram> on one page
    // (e.g. landing hero + preview) do not share / clobber state.
    DiagramStateService,
    NodeDragService,
    SelectionBoxService,
    CanvasPanZoomService,
    TouchGestureService,
    HandleRegistryService,
    UndoRedoService,
    ContextMenuService,
    SearchService,
  ]
})
export class DiagramComponent implements OnInit, OnDestroy, ControlValueAccessor {
  private handleRegistryService = inject(HandleRegistryService);

  onChange: (val: any) => void = () => {};
  onTouched: () => void = () => {};
  isDisabled: boolean = false;

  writeValue(val: any): void {
    if (val && typeof val === 'object') {
      if (Array.isArray(val.nodes)) {
        this.diagramStateService.nodes.set(val.nodes);
      }
      if (Array.isArray(val.edges)) {
        this.diagramStateService.edges.set(val.edges);
      }
      if (val.viewport) {
        this.diagramStateService.viewport.set(val.viewport);
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Trigger rebuild
  @ViewChild('svg', { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  // Input properties for declarative usage
  readonly initialNodes = input<WorkflowNode[]>([]);
  readonly initialEdges = input<Edge[]>([]);
  readonly initialViewport = input<Viewport | undefined>(undefined);

  // Inputs for binding (sync with service via effect).
  // `undefined` = uncontrolled (diagram owns state); array (including []) = controlled by parent.
  readonly nodes = input<WorkflowNode[]>([]);
  readonly edges = input<Edge[] | undefined>(undefined);

  readonly showZoomControls = input<boolean>(true);
  /** Customize zoom toolbar items, separators, views, and corner position. */
  readonly zoomControlsConfig = input<ZoomControlsConfig | undefined>(undefined);
  readonly minZoom = input<number>(0.1);
  readonly maxZoom = input<number>(4);
  readonly backgroundImage = input<string | null>(null);

  // Input for showing/hiding undo/redo controls
  readonly showUndoRedoControls = input<boolean>(true);

  // Input for showing/hiding minimap
  readonly showMinimap = input<boolean>(true);

  /** When true, fit and center all nodes once the canvas has measurable size. */
  readonly fitViewOnInit = input<boolean>(false);

  // Input for background configuration
  readonly showBackground = input<boolean>(true);
  readonly backgroundVariant = input<'dots' | 'lines' | 'cross'>('dots');
  readonly backgroundGap = input<number>(20);
  readonly backgroundSize = input<number>(1);
  readonly backgroundColor = input<string>('var(--ngx-workflow-bg-pattern, #81818a)');
  readonly backgroundBgColor = input<string>('var(--ngx-workflow-bg, transparent)');

  // Color mode (theme) configuration.
  // When unset, inherit the host app's theme tokens (do not mutate document).
  readonly colorMode = input<ColorMode | undefined>(undefined);

  // Grid configuration
  readonly gridSize = input<number>(20);
  readonly snapToGrid = input<boolean>(false);
  readonly showGrid = input<boolean>(false);

  // Z-index configuration
  readonly zIndexMode = input<'default' | 'layered'>('default');

  // Search controls configuration
  readonly showSearchControls = input<boolean>(true);

  // Export controls configuration
  readonly showExportControls = input<boolean>(false);

  // Layout controls configuration
  readonly showLayoutControls = input<boolean>(false);

  // Properties sidebar configuration (disabled by default so custom inspectors can be used without conflict)
  readonly showPropertiesSidebar = input<boolean>(false);

  // Auto-save configuration
  readonly autoSave = input<boolean>(false);
  readonly autoSaveInterval = input<number>(1000); // milliseconds
  readonly maxVersions = input<number>(10);

  // Auto-panning configuration
  readonly autoPanOnNodeDrag = input<boolean>(true);
  readonly autoPanOnConnect = input<boolean>(true);
  readonly autoPanSpeed = input<number>(15); // pixels per frame
  readonly autoPanEdgeThreshold = input<number>(50); // pixels from edge

  // Connection validation configuration
  readonly maxConnectionsPerHandle = input<number | undefined>(undefined);

  // Collision detection
  readonly preventNodeOverlap = input<boolean>(false);
  readonly nodeSpacing = input<number>(10);

  // Output events (Signal outputs)
  readonly nodeClick = output<WorkflowNode>();
  readonly edgeClick = output<Edge>();
  readonly connect = output<{ source: string; sourceHandle?: string; target: string; targetHandle?: string }>();
  /** Full node array after mutations (controlled-mode sync). */
  readonly nodesChange = output<WorkflowNode[]>();
  /** Full edge array after mutations (controlled-mode sync). */
  readonly edgesChange = output<Edge[]>();
  /** Typed granular node changes (add/remove/position/select/dimensions/data). */
  readonly nodeChanges = output<NodeChange[]>();
  /** Typed granular edge changes (add/remove/select/reconnect/data). */
  readonly edgeChanges = output<EdgeChange[]>();
  /** Events bubbled from custom node components via ComponentNodeEventService. */
  readonly componentNodeEvent = output<ComponentNodeEvent>();
  readonly nodeDoubleClick = output<WorkflowNode>();
  readonly contextMenu = output<{ type: 'node' | 'edge' | 'canvas'; item?: WorkflowNode | Edge; event: MouseEvent }>();

  // Granular interaction events
  readonly nodeMouseEnter = output<WorkflowNode>();
  readonly nodeMouseLeave = output<WorkflowNode>();
  readonly nodeMouseMove = output<{ node: WorkflowNode; event: MouseEvent }>();
  readonly edgeMouseEnter = output<Edge>();
  readonly edgeMouseLeave = output<Edge>();
  readonly paneClick = output<{ event: MouseEvent; position: XYPosition }>();
  readonly paneScroll = output<WheelEvent>();
  readonly connectStart = output<{ nodeId: string; handleId?: string }>();
  readonly connectEnd = output<{ nodeId: string; handleId?: string }>();
  readonly edgeDrop = output<EdgeDropEvent>();
  readonly connectionDrop = output<{ position: XYPosition; event: PointerEvent; sourceNodeId: string; sourceHandleId?: string }>();

  // Deletion control event
  readonly beforeDelete = output<{ nodes: WorkflowNode[]; edges: Edge[]; cancel: () => void }>();

  // Zoom & Toolbar Controls outputs
  /** Emitted whenever any action button in the zoom controls toolbar is clicked. */
  readonly zoomControlsActionClick = output<{ id: string; action: string; event: MouseEvent }>();
  readonly fullscreen = output<void>();
  readonly undo = output<void>();
  readonly redo = output<void>();

  // Import feedback
  readonly importError = output<{ message: string; error?: unknown }>();
  readonly importNotification = signal<string | null>(null);
  private importNotificationTimer: ReturnType<typeof setTimeout> | null = null;

  // Connection validation callback
  readonly validateConnection = input<((connection: {
    source: string;
    sourceHandle?: string;
    target?: string;
    targetHandle?: string;
  }) => boolean) | undefined>(undefined);

  // Custom edge template (applied when edge.type is not a built-in path type and no edge component is registered)
  readonly edgeTemplate = input<TemplateRef<any> | undefined>(undefined);

  // Custom edge component registry (merged with NGX_WORKFLOW_EDGE_TYPES)
  readonly edgeTypes = input<Record<string, Type<any>>>({});

  // Custom definitions template (for markers, patterns, etc.)
  readonly defsTemplate = input<TemplateRef<any> | undefined>(undefined);

  // Interaction modes
  /** @default 'loose' — set to 'strict' to require source and target handles. */
  readonly connectionMode = input<ConnectionMode>('loose');
  readonly selectionMode = input<SelectionMode>('partial');
  readonly keyboardShortcuts = input<KeyboardShortcuts>({});
  readonly optimization = input<FlowOptimization>({
    detachedGroupsLayer: true,
    lazyLoadTrigger: 'immediate',
    virtualization: true,
    adaptiveBuffer: true,
    keepSelectedVisible: true,
    edgeVirtualization: 'any-endpoint',
  });

  // Custom edge label template
  @ContentChild('edgeLabelTemplate', { read: TemplateRef }) edgeLabelTemplate?: TemplateRef<any>;
  /** Projected HTML node template: `<ng-template #nodeHtmlTemplate let-ctx>`. */
  @ContentChild('nodeHtmlTemplate', { read: TemplateRef }) nodeHtmlTemplate?: TemplateRef<any>;
  /** Projected SVG node template: `<ng-template #nodeSvgTemplate let-ctx>`. */
  @ContentChild('nodeSvgTemplate', { read: TemplateRef }) nodeSvgTemplate?: TemplateRef<any>;
  /** Projected handle template: `<ng-template #handleTemplate let-ctx>`. */
  @ContentChild('handleTemplate', { read: TemplateRef }) handleTemplate?: TemplateRef<any>;

  // Edge reconnection feature
  readonly edgeReconnectable = input<boolean>(false);

  /** Resolved lazy-loaded node components keyed by type. */
  private readonly resolvedLazyNodeTypes = signal<Record<string, Type<any>>>({});
  private readonly lazyLoadInFlight = new Set<string>();

  // Sidebar State
  selectedNodeForEditing: WorkflowNode | null = null;
  selectedEdgeForEditing: Edge | null = null;

  // Edge Editing State
  editingEdgeId: string | null = null;
  editingEdgeLabel: string = '';

  viewport!: WritableSignal<Viewport>;
  viewNodes!: Signal<WorkflowNode[]>;
  filteredNodes!: Signal<WorkflowNode[]>;
  filteredEdges!: Signal<Edge[]>;
  tempEdges!: WritableSignal<TempEdge[]>;
  alignmentGuides!: Signal<AlignmentGuide[]>;
  selectionBox!: Signal<any>;

  // Computed signal for z-index sorted nodes
  sortedNodes!: Signal<WorkflowNode[]>;

  // Expose Math to the template
  Math = Math;

  private _pathFinder: PathFinder | null = null;
  private pathCache = new Map<string, string>();
  private dragAnimationFrameId: number | null = null;
  private unlistenPointerMove: (() => void) | null = null;
  private unlistenPointerUp: (() => void) | null = null;
  private unlistenPointerLeave: (() => void) | null = null;
  private unlistenWindowPointerMove: (() => void) | null = null;
  private unlistenWindowPointerUp: (() => void) | null = null;
  private pathPointsCache = new Map<string, XYPosition[]>();

  private isPanning = false;
  private lastPanPosition: XYPosition = { x: 0, y: 0 };
  private subscriptions = new Subscription();
  /** Skip parent→service node sync while we push service→parent via nodesChange. */
  private syncingNodesToParent = false;
  /** Skip parent→service edge sync while we push service→parent via edgesChange. */
  private syncingEdgesToParent = false;

  // Observable versions of signals for auto-save (initialized in constructor)
  private nodes$!: Observable<WorkflowNode[]>;
  private edges$!: Observable<Edge[]>;
  private viewport$!: Observable<Viewport>;

  // Lasso selection properties
  isSelecting = false;
  selectionStart: XYPosition = { x: 0, y: 0 };
  selectionEnd: XYPosition = { x: 0, y: 0 };

  // Node Dragging delegated to NodeDragService
  get isDraggingNode(): boolean {
    return this.nodeDragService.isDraggingNode;
  }
  get draggingNode(): WorkflowNode | null {
    return this.nodeDragService.draggingNode;
  }
  get draggingNodes(): WorkflowNode[] {
    return this.nodeDragService.draggingNodes;
  }

  // Collision detection
  collidingNodeIds: string[] = [];

  // Connection (Handle)
  private isConnecting = false;
  private currentPreviewEdgeId: string | null = null;
  private currentTargetHandle: { nodeId: string; handleId?: string; type: 'source' | 'target' } | null = null;
  private connectingSourceNodeId: string | null = null;
  private connectingSourceHandleId: string | undefined = undefined;
  private connectingStartPointerPosition: { x: number, y: number } | null = null;

  // Proximity Connect
  readonly proximityThreshold = input<number>(200);
  // Proximity Connect State
  proximityTargetNodeId: string | null = null;
  proximityCandidate: any = null;
  proximityPreviewEdgeId: string | null = null;

  // Grouping State
  hoveredGroupId: WritableSignal<string | null> = signal(null);

  // Accessibility: keyboard focus tracking
  focusedNodeId: WritableSignal<string | null> = signal(null);

  private isResizing = false;
  private resizingNode: WorkflowNode | null = null;
  private resizeHandle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | null = null;
  private startResizePosition: XYPosition = { x: 0, y: 0 };
  private startNodeDimensions: { width: number; height: number; x: number; y: number } = { width: 0, height: 0, x: 0, y: 0 };

  // Selection box (rubber band) delegated to SelectionBoxService
  get isBoxSelecting(): boolean {
    return this.selectionBoxService.isBoxSelecting;
  }
  selectionBoxStart: XYPosition = { x: 0, y: 0 };
  selectionBoxEnd: XYPosition = { x: 0, y: 0 };

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

  /**
   * Live node positions from diagram state (not the possibly-stale [nodes] input).
   * Required so edges track nodes while dragging — nodesChange is deferred until drag end.
   */
  private getLiveNodes(): WorkflowNode[] {
    return this.viewNodes ? this.viewNodes() : this.diagramStateService.nodes();
  }

  /** True when this edge is attached to a node currently being dragged. */
  private isEdgeAttachedToDrag(edge: Edge | TempEdge): boolean {
    if (!this.isDraggingNode || !('source' in edge) || !('target' in edge)) {
      return false;
    }
    const draggingIds = this.nodeDragService.draggingNodes.map((n) => n.id);
    if (draggingIds.length === 0 && this.nodeDragService.draggingNode) {
      draggingIds.push(this.nodeDragService.draggingNode.id);
    }
    return draggingIds.includes(edge.source) || draggingIds.includes(edge.target);
  }



  getBadgeTransform(node: WorkflowNode, badge: any, index: number): string {
    const pos = getBadgePosition(node, badge.position, index);
    return `translate(${pos.x}, ${pos.y})`;
  }

  // --- Node Interaction Handlers ---

  onNodePointerDown(event: PointerEvent, node: WorkflowNode): void {
    // Spacebar panning override
    if (this.isSpacePressed) {
      this.isSpacePanning = true;
      this.panStartPosition = { x: event.clientX, y: event.clientY };
      this.viewportStartPosition = { ...this.viewport() };
      this.svgRef.nativeElement.style.cursor = 'grabbing';
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Ignore if clicking on a handle or resize handle.
    // Target is often an inner <circle>, so use closest() — not classList on the target.
    const target = event.target as HTMLElement;
    const handleEl = target.closest('.ngx-workflow__handle') as HTMLElement | null;
    if (handleEl) {
      if (node.connectable === false) {
        return;
      }
      // Fallback if the handle host listener did not run (SVG component edge cases)
      const handleId =
        handleEl.getAttribute('data-handleid') ||
        handleEl.dataset?.['handleid'] ||
        undefined;
      this.startConnecting(event, handleEl, node.id, handleId);
      return;
    }
    if (
      target.classList.contains('ngx-workflow__resize-handle') ||
      target.closest('.ngx-workflow__resize-handle') ||
      target.closest('.nodrag')
    ) {
      return;
    }

    // Stop propagation so global handler doesn't trigger
    event.stopPropagation();

    if (node.selectable === false && node.draggable === false) {
      return;
    }

    // Easy Connect Logic
    if (node.easyConnect) {
      const isDragHandle =
        target.closest('.drag-handle') ||
        target.closest('[data-drag-handle]') ||
        target.closest('.ngx-workflow__drag-handle');
      if (!isDragHandle) {
        if (node.connectable === false) {
          return;
        }
        // Body click -> Attempt Connection
        const nodeGroup = event.currentTarget as HTMLElement;
        // Find a source handle within this node to connect from
        const sourceHandle = nodeGroup.querySelector('.ngx-workflow__handle[data-type="source"]') as HTMLElement;

        if (sourceHandle) {
          this.startConnecting(event, sourceHandle);
        }
        return; // Skip selection and dragging
      }
      // If it IS a drag handle, proceed to selection and dragging logic below
    }

    if (node.selectable === false) {
      if (node.draggable !== false) {
        this.startDraggingNode(event, node);
      }
      return;
    }

    // Select the node (toggle if ctrl/cmd is pressed)
    const isMultiSelect = event.ctrlKey || event.metaKey;
    if (!isMultiSelect) {
      if (this.selectedNodeForEditing && this.selectedNodeForEditing.id !== node.id) {
        this.selectedNodeForEditing = null;
      }
      if (!node.selected) {
        // Clear other selections and select this node
        this.diagramStateService.nodes.update(nodes =>
          nodes.map(n => ({ ...n, selected: n.id === node.id }))
        );
        this.emitNodeChanges([{ type: 'select', id: node.id, selected: true }]);
      }
      // Always start dragging on normal node click
      if (node.draggable !== false) {
        this.startDraggingNode(event, { ...node, selected: true });
      }
      this.diagramStateService.onNodeClick({ ...node, selected: true });
    } else {
      // Toggle this node's selection
      const isSelectedNow = !node.selected;
      this.diagramStateService.nodes.update(nodes =>
        nodes.map(n => n.id === node.id ? { ...n, selected: isSelectedNow } : n)
      );
      this.emitNodeChanges([{ type: 'select', id: node.id, selected: isSelectedNow }]);
      if (isSelectedNow && node.draggable !== false) {
        this.startDraggingNode(event, { ...node, selected: true });
      }
      this.diagramStateService.onNodeClick({ ...node, selected: isSelectedNow });
    }
  }

  onNodeDoubleClick(event: MouseEvent, node: WorkflowNode): void {
    event.stopPropagation();
    if (this.showPropertiesSidebar()) {
      this.selectedNodeForEditing = node;
    }
    this.nodeDoubleClick.emit(node);
    this.cdRef.detectChanges();
  }

  onNodeMouseEnter(event: MouseEvent, node: WorkflowNode): void {
    this.nodeMouseEnter.emit(node);
  }

  onNodeMouseLeave(event: MouseEvent, node: WorkflowNode): void {
    this.nodeMouseLeave.emit(node);
  }

  onNodeMouseMove(event: MouseEvent, node: WorkflowNode): void {
    this.nodeMouseMove.emit({ node, event });
  }

  onEdgeMouseEnter(event: MouseEvent, edge: Edge): void {
    this.edgeMouseEnter.emit(edge);
  }

  onEdgeMouseLeave(event: MouseEvent, edge: Edge): void {
    this.edgeMouseLeave.emit(edge);
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
        item = this.diagramStateService.edges().find(e => e.id === edgeId);
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

      // Grouping actions
      const selectedNodes = this.diagramStateService.selectedNodes();
      // If multiple nodes are selected, offer Group
      if (selectedNodes.length > 1) {
        actions.push({
          label: 'Group',
          action: () => {
            const ids = selectedNodes.map(n => n.id);
            this.diagramStateService.groupNodes(ids);
          },
          shortcut: 'Ctrl+G'
        });
      }

      // If single node selected and it's a Group, offer Ungroup
      if (selectedNodes.length === 1 && selectedNodes[0].type === 'group') {
        actions.push({
          label: 'Ungroup',
          action: () => {
            this.diagramStateService.ungroupNodes([selectedNodes[0].id]);
          },
          shortcut: 'Ctrl+Shift+G'
        });
      }

      // If single node selected and it is a child, offer Detach (Ungroup)
      if (selectedNodes.length === 1 && selectedNodes[0].parentId) {
        actions.push({
          label: 'Ungroup (Detach)',
          action: () => {
            this.diagramStateService.ungroupNodes([selectedNodes[0].id]);
          },
          shortcut: 'Ctrl+Shift+G'
        });
      }

      // Z-index operations (only in layered mode)
      if (this.zIndexMode() === 'layered') {
        actions.push({
          label: 'Bring to Front',
          action: () => this.diagramStateService.bringToFront(node.id),
          shortcut: 'Ctrl+]'
        });
        actions.push({
          label: 'Send to Back',
          action: () => this.diagramStateService.sendToBack(node.id),
          shortcut: 'Ctrl+['
        });
        actions.push({
          label: 'Raise Layer',
          action: () => this.diagramStateService.raiseLayer(node.id),
          shortcut: 'Ctrl+Shift+]'
        });
        actions.push({
          label: 'Lower Layer',
          action: () => this.diagramStateService.lowerLayer(node.id),
          shortcut: 'Ctrl+Shift+['
        });
      }

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

      const virtualizationEnabled = this.diagramStateService.virtualizationEnabled();
      actions.push({
        label: virtualizationEnabled ? 'Disable Virtualization' : 'Enable Virtualization',
        action: () => {
          this.diagramStateService.virtualizationEnabled.set(!virtualizationEnabled);
        }
      });
      actions.push({
        label: 'Select All',
        action: () => {
          const allNodeIds = this.nodes().map(n => n.id);
          this.diagramStateService.selectNodes(allNodeIds);
        },
        shortcut: 'Ctrl+A'
      });

    }

    if (actions.length > 0) {
      this.contextMenuService.open({ x: event.clientX, y: event.clientY }, actions, item);
    }
  }

  closeSidebar(): void {
    this.selectedNodeForEditing = null;
    this.selectedEdgeForEditing = null;
  }

  onPropertiesChange(changes: Partial<WorkflowNode>): void {
    // Guard: native DOM `change` used to hit `(change)` when Output was named `change`
    if (!changes || typeof changes !== 'object' || changes instanceof Event) {
      return;
    }
    if (!this.selectedNodeForEditing) {
      return;
    }

    const id = this.selectedNodeForEditing.id;
    this.diagramStateService.updateNode(id, changes);

    // Re-read from store so canvas + sidebar share the same style object
    const updated = this.diagramStateService.nodes().find((n) => n.id === id);
    if (updated) {
      this.selectedNodeForEditing = { ...updated, style: { ...(updated.style || {}) } };
    }

    this.cdRef.detectChanges();

    if (changes.ports !== undefined && this.selectedNodeForEditing) {
      this.validateEdgesForNode(this.selectedNodeForEditing);
    }
  }

  /**
   * Include style in track key so color edits always rebind SVG fill/stroke.
   * Do NOT include `selected` — recreating the <g> on select makes CSS
   * `transition: transform` animate from translate(0,0) → real position (jump flash).
   */
  trackNodeStyle(node: WorkflowNode): string {
    const s = node.style || {};
    return [
      node.id,
      s['backgroundColor'] || '',
      s['color'] || '',
      s['borderColor'] || '',
      node.borderColor || '',
      node.borderWidth ?? '',
    ].join('|');
  }

  getNodeFill(node: WorkflowNode): string {
    return node.style?.['backgroundColor'] || 'var(--ngx-workflow-surface, #ffffff)';
  }

  getNodeStroke(node: WorkflowNode): string {
    return (
      node.borderColor ||
      node.style?.['borderColor'] ||
      (node.selected ? 'var(--ngx-workflow-primary, #2dd4bf)' : 'var(--ngx-workflow-border, #e5e7eb)')
    );
  }

  getNodeStrokeWidth(node: WorkflowNode): number {
    if (node.borderWidth != null) return node.borderWidth;
    return node.selected ? 2 : 1.5;
  }

  getNodeLabelFill(node: WorkflowNode): string {
    return node.style?.['color'] || 'var(--ngx-workflow-text-primary, #111827)';
  }

  onEdgePropertiesChange(changes: Partial<Edge>): void {
    if (!changes || typeof changes !== 'object' || changes instanceof Event) {
      return;
    }
    if (!this.selectedEdgeForEditing) return;

    const id = this.selectedEdgeForEditing.id;
    this.diagramStateService.updateEdge(id, changes);

    const updated = this.diagramStateService.edges().find((e) => e.id === id);
    if (updated) {
      this.selectedEdgeForEditing = {
        ...updated,
        style: { ...(updated.style || {}) },
        labelStyle: { ...(updated.labelStyle || {}) },
        animationStyle: { ...(updated.animationStyle || {}) },
      };
    }
    this.cdRef.detectChanges();
  }

  trackEdgeStyle(edge: Edge): string {
    const s = edge.style || {};
    const a = edge.animationStyle || {};
    const l = edge.labelStyle || {};
    return [
      edge.id,
      s['stroke'] || '',
      s['strokeWidth'] || '',
      s['strokeDasharray'] || '',
      a['fill'] || '',
      l['fill'] || '',
      edge.animated ? '1' : '0',
      edge.animationType || 'flow',
      edge.animationDuration || '',
      edge.markerStart || '',
      edge.markerEnd || '',
      // omit selected — same DOM-recycle / transform-jump issue as nodes
    ].join('|');
  }

  /** Treat missing animationType as 'flow' (matches sidebar default). */
  getEdgeAnimationType(edge: Edge): 'flow' | 'dot' | 'both' {
    return edge.animationType || 'flow';
  }

  isEdgeFlowAnimated(edge: Edge): boolean {
    if (!edge.animated) return false;
    const type = this.getEdgeAnimationType(edge);
    return type === 'flow' || type === 'both';
  }

  isEdgeDotAnimated(edge: Edge): boolean {
    if (!edge.animated) return false;
    const type = this.getEdgeAnimationType(edge);
    return type === 'dot' || type === 'both';
  }

  /** Effective stroke used by the path and matching marker fills. */
  getEdgeStrokeColor(edge: Edge): string {
    if (edge.selected) {
      return 'var(--ngx-workflow-primary, #4640de)';
    }
    if (edge.style?.['stroke']) return String(edge.style['stroke']);
    return 'var(--ngx-workflow-edge-stroke, #94a3b8)';
  }

  /** Custom width only; omit when unset so CSS selected/default widths apply. */
  getEdgeStrokeWidth(edge: Edge): number | null {
    if (edge.selected) {
      const raw = edge.style?.['strokeWidth'];
      const base = raw != null && raw !== '' && Number.isFinite(Number(raw)) ? Number(raw) : 1.2;
      return Math.max(base, 2.5);
    }
    const raw = edge.style?.['strokeWidth'];
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Flow animation needs a dash pattern. Prefer an explicit line style;
   * otherwise use the animated default.
   */
  getEdgeStrokeDasharray(edge: Edge): string | null {
    const custom = edge.style?.['strokeDasharray'];
    if (custom) return String(custom);
    if (this.isEdgeFlowAnimated(edge)) return '10';
    if (edge.type === 'dashed') return '5,5';
    return null;
  }

  getEdgeAnimationFill(edge: Edge): string {
    return edge.animationStyle?.['fill'] || '#3b82f6';
  }

  /**
   * Validates and removes edges that are no longer connected to valid ports
   */
  private validateEdgesForNode(node: WorkflowNode): void {
    const edges = this.diagramStateService.edges();
    const ports = node.ports ?? 4; // Default to 4 (all); 0 = none
    const validHandles = new Set<string>();

    if (ports === 1 || ports === 2 || ports === 4) validHandles.add('top');
    if (ports === 2 || ports === 4) validHandles.add('bottom');
    if (ports === 3 || ports === 4) {
      validHandles.add('left');
      validHandles.add('right');
    }

    const edgesToRemove: string[] = [];

    edges.forEach(edge => {
      // Check if this node is the source
      if (edge.source === node.id) {
        if (edge.sourceHandle && !validHandles.has(edge.sourceHandle)) {
          edgesToRemove.push(edge.id);
        }
      }
      // Check if this node is the target
      else if (edge.target === node.id) {
        if (edge.targetHandle && !validHandles.has(edge.targetHandle)) {
          edgesToRemove.push(edge.id);
        }
      }
    });

    if (edgesToRemove.length > 0) {
      edgesToRemove.forEach(edgeId => this.diagramStateService.removeEdge(edgeId));
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
  readonly connectionValidator = input<((sourceNodeId: string, targetNodeId: string) => boolean) | undefined>(undefined);
  // Input for node resizing (global toggle)
  readonly nodesResizable = input<boolean>(true);

  private resizeObserver: ResizeObserver | null = null;
  private hasInitialFitted = false;

  // Helper to check if a connection is allowed
  private isValidConnection(
    sourceId: string,
    targetId: string,
    sourceHandleId?: string,
    targetHandleId?: string
  ): boolean {
    // Use live service state — parent [nodes]/[edges] inputs can lag until sync
    const liveEdges = this.diagramStateService.edges();
    const liveNodes = this.diagramStateService.nodes();

    // Prevent duplicate edges between same source and target (exact match including handles)
    const existing = liveEdges.find(e =>
      e.source === sourceId &&
      e.target === targetId &&
      (e.sourceHandle || '') === (sourceHandleId || '') &&
      (e.targetHandle || '') === (targetHandleId || '')
    );

    if (existing) {
      return false;
    }


    // Strict mode requires explicit handles on both ends
    if (this.connectionMode() === 'strict' && (!sourceHandleId || !targetHandleId)) {
      return false;
    }

    const sourceNode = getNode(sourceId, liveNodes);
    const targetNode = getNode(targetId, liveNodes);
    if (sourceNode?.connectable === false || targetNode?.connectable === false) {
      return false;
    }

    // Check max connections limit
    if (!this.checkConnectionLimits(sourceId, sourceHandleId, 'source')) {
      return false;
    }
    if (!this.checkConnectionLimits(targetId, targetHandleId, 'target')) {
      return false;
    }

    // Check if ports are valid (based on node.ports configuration)
    if (!this.checkPortValidity(sourceId, sourceHandleId)) {
      return false;
    }
    if (!this.checkPortValidity(targetId, targetHandleId)) {
      return false;
    }

    // Check handle-level validation (source handle)
    if (sourceHandleId) {
      const sourceHandleConfig = this.handleRegistry.getHandle(sourceId, sourceHandleId, 'source');
      if (sourceHandleConfig?.isValidConnection) {
        const isValid = sourceHandleConfig.isValidConnection({
          source: sourceId,
          sourceHandle: sourceHandleId,
          target: targetId,
          targetHandle: targetHandleId || ''
        });
        if (!isValid) return false;
      }
    }

    // Check handle-level validation (target handle)
    if (targetHandleId) {
      const targetHandleConfig = this.handleRegistry.getHandle(targetId, targetHandleId, 'target');
      if (targetHandleConfig?.isValidConnection) {
        const isValid = targetHandleConfig.isValidConnection({
          source: sourceId,
          sourceHandle: sourceHandleId || '',
          target: targetId,
          targetHandle: targetHandleId
        });
        if (!isValid) return false;
      }
    }

    // Check handle data type compatibility
    if (!this.handleRegistryService.canConnectTypes(sourceId, sourceHandleId, targetId, targetHandleId)) {
      return false;
    }

    // Use custom validator if provided
    const validator = this.connectionValidator();
    if (validator) {
      return validator(sourceId, targetId);
    }
    return true;
  }

  /**
   * Check if a specific handle is valid based on the node's ports configuration
   */
  private checkPortValidity(nodeId: string, handleId: string | undefined): boolean {
    if (!handleId) return true; // Center connection (if allowed) or no handle specified

    const node = this.getLiveNodes().find(n => n.id === nodeId);
    if (!node) return false;

    const ports = node.ports ?? 4; // Default to 4 (all); 0 = none

    // 0: No ports
    if (ports === 0) {
      return false;
    }
    // 1: Top
    if (ports === 1) {
      return handleId === 'top';
    }
    // 2: Top, Bottom
    if (ports === 2) {
      return handleId === 'top' || handleId === 'bottom';
    }
    // 3: Left, Right
    if (ports === 3) {
      return handleId === 'left' || handleId === 'right';
    }
    // 4: All (Top, Bottom, Left, Right)
    return true;
  }

  /**
   * Check if a handle has reached its maximum connection limit.
   * Priority: handleConfig[handle].maxConnections → node.maxConnectionsPerPort
   * → data.handleConfig (legacy) → diagram [maxConnectionsPerHandle]
   */
  private checkConnectionLimits(
    nodeId: string,
    handleId: string | undefined,
    type: 'source' | 'target'
  ): boolean {
    const node = this.getLiveNodes().find(n => n.id === nodeId);
    if (!node) return true;

    const handleKey = handleId || '';
    const handleLimit =
      node.handleConfig?.[handleKey]?.maxConnections ??
      (typeof node.handleConfig?.[handleKey]?.isConnectable === 'number'
        ? node.handleConfig[handleKey].isConnectable as number
        : undefined) ??
      node.maxConnectionsPerPort ??
      node.data?.handleConfig?.[handleKey]?.maxConnections;

    // maxConnectionsPerHandle is an input signal — must call it
    const limit = handleLimit !== undefined
      ? handleLimit
      : this.maxConnectionsPerHandle();

    // If no limit set, allow connection
    if (limit === undefined) return true;

    // Count existing connections for this handle (live state)
    // Count both as source and as target so the port's total edges is capped
    const connectionCount = this.diagramStateService.edges().filter(edge => {
      if (type === 'source') {
        return edge.source === nodeId && (edge.sourceHandle || '') === handleKey;
      }
      return edge.target === nodeId && (edge.targetHandle || '') === handleKey;
    }).length;

    return connectionCount < limit;
  }

  // ==================== Collision Detection ====================

  /**
   * Check if two nodes overlap using AABB (Axis-Aligned Bounding Box) collision detection
   */
  private checkNodeCollision(node1: WorkflowNode, node2: WorkflowNode, spacing: number = 0): boolean {
    const x1 = node1.position.x - spacing;
    const y1 = node1.position.y - spacing;
    const w1 = (node1.width || 150) + spacing * 2;
    const h1 = (node1.height || 40) + spacing * 2;

    const x2 = node2.position.x;
    const y2 = node2.position.y;
    const w2 = node2.width || 150;
    const h2 = node2.height || 40;

    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1);
  }

  /**
   * Get all nodes that would collide with the given node at a position
   */
  private getCollidingNodes(nodeId: string, position: XYPosition): WorkflowNode[] {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return [];

    const testNode = { ...node, position };

    return this.nodes().filter(n =>
      n.id !== nodeId &&
      this.checkNodeCollision(testNode, n, this.nodeSpacing())
    );
  }

  /**
   * Check if a node is currently colliding
   */
  isNodeColliding(nodeId: string): boolean {
    return this.collidingNodeIds.includes(nodeId);
  }

  // ==================== End Collision Detection ====================

  constructor(
    public el: ElementRef<HTMLElement>, // Host element
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdRef: ChangeDetectorRef,
    public diagramStateService: DiagramStateService,
    private contextMenuService: ContextMenuService,
    private themeService: ThemeService,
    private exportService: ExportService,
    private autoSaveService: AutoSaveService,
    private handleRegistry: HandleRegistryService,
    private layoutService: LayoutService,
    private touchGestureService: TouchGestureService,
    public canvasPanZoomService: CanvasPanZoomService,
    public nodeDragService: NodeDragService,
    public selectionBoxService: SelectionBoxService,
    private componentNodeEventService: ComponentNodeEventService,
    private changesController: NgxWorkflowChangesControllerDirective,
    @Optional() @Inject(NGX_WORKFLOW_NODE_TYPES) private injectedNodeTypes: Record<string, WorkflowNodeComponentType> | null,
    @Optional() @Inject(NGX_WORKFLOW_EDGE_TYPES) private injectedEdgeTypes: Record<string, WorkflowEdgeComponentType> | null
  ) {
    this.nodes$ = toObservable(this.diagramStateService.nodes);
    this.edges$ = toObservable(this.diagramStateService.edges);
    this.viewport$ = toObservable(this.diagramStateService.viewport);

    this.subscriptions.add(
      this.componentNodeEventService.onEvent.subscribe((event) => {
        this.componentNodeEvent.emit(event);
      })
    );

    // Sync input signals to the diagram state service
    // This ensures that when a parent component updates [nodes] or [edges],
    // the diagram renders the new state.
    effect(() => {
      const inputNodes = this.nodes();
      if (inputNodes && inputNodes.length > 0 && !this.isDraggingNode) {
        // Skip no-op writes — avoids parent ↔ child feedback loops via nodesChange
        if (inputNodes === this.diagramStateService.nodes()) return;
        // Don't clobber local store updates with a stale parent snapshot mid-emit
        if (this.syncingNodesToParent) {
          return;
        }
        this.diagramStateService.nodes.set(inputNodes);
      }
    });

    effect(() => {
      // Controlled mode only: sync parent edges, including [] after the last edge is deleted
      const inputEdges = this.edges();
      if (inputEdges === undefined) {
        return;
      }
      // Don't track service edges — otherwise selecting an edge re-runs this and wipes selection.
      const current = untracked(() => this.diagramStateService.edges());
      if (inputEdges === current) {
        return;
      }
      if (this.syncingEdgesToParent) {
        return;
      }
      this.diagramStateService.edges.set(inputEdges);
    });

    // Scope diagram theme to this host only — never write document.documentElement
    effect(() => {
      const mode = this.colorMode();
      const host = this.el.nativeElement;
      if (!mode) {
        this.themeService.unregisterHost(host);
        return;
      }
      this.themeService.registerHost(host);
      this.themeService.setColorMode(mode);
    });

    effect(() => {
      this.diagramStateService.selectionMode = this.selectionMode();
    });

    effect(() => {
      const opt = this.optimization();
      const enabled = opt.virtualization ?? opt.onlyRenderVisibleElements ?? true;
      this.diagramStateService.virtualizationEnabled.set(enabled);
      if (opt.virtualizationBuffer != null) {
        this.diagramStateService.virtualizationBuffer.set(opt.virtualizationBuffer);
      }
      if (opt.adaptiveBuffer != null) {
        this.diagramStateService.virtualizationAdaptiveBuffer.set(opt.adaptiveBuffer);
      }
      if (opt.keepSelectedVisible != null) {
        this.diagramStateService.virtualizationKeepSelected.set(opt.keepSelectedVisible);
      }
      if (opt.maxRenderedNodes !== undefined) {
        this.diagramStateService.virtualizationMaxNodes.set(opt.maxRenderedNodes);
      }
      if (opt.edgeVirtualization) {
        this.diagramStateService.edgeVirtualizationMode.set(opt.edgeVirtualization);
      }
    });

    // Eagerly resolve lazy node factories when optimization.lazyLoadTrigger is immediate
    effect(() => {
      if (this.optimization().lazyLoadTrigger !== 'immediate') return;
      for (const node of this.diagramStateService.nodes()) {
        if (node.type) {
          this.getCustomNodeComponent(node.type);
        }
      }
    });
  }

  readonly nodeTypes = input<Record<string, NodeTypeEntry>>({});

  private static readonly BUILT_IN_EDGE_TYPES = new Set<string>([
    'bezier',
    'straight',
    'step',
    'smoothstep',
    'smart',
    'dashed',
  ]);

  get allNodeTypes(): Record<string, NodeTypeEntry> {
    return {
      ...(this.injectedNodeTypes || {}),
      ...(this.nodeTypes() || {}),
    };
  }

  get allEdgeTypes(): Record<string, Type<any>> {
    return {
      ...(this.injectedEdgeTypes || {}),
      ...(this.edgeTypes() || {}),
    };
  }

  get nodeTypeKeys(): string[] {
    return Object.keys(this.allNodeTypes);
  }

  isCustomNode(node: WorkflowNode): boolean {
    if (!node.type) return false;
    if (node.type === 'html-template' || node.type === 'svg-template') return true;
    const types = this.allNodeTypes;
    return !!(types && types[node.type]);
  }

  /** Render SVG port handles when the node declares `ports` (including custom node types). */
  shouldRenderDefaultHandles(node: WorkflowNode): boolean {
    if (node.type === 'group') {
      return false;
    }
    if (node.ports === 0) {
      return false;
    }
    if (node.ports != null) {
      return node.ports > 0;
    }
    return !this.isCustomNode(node);
  }

  isHtmlTemplateNode(node: WorkflowNode): boolean {
    return node.type === 'html-template' && !!this.nodeHtmlTemplate;
  }

  isSvgTemplateNode(node: WorkflowNode): boolean {
    return node.type === 'svg-template' && !!this.nodeSvgTemplate;
  }

  getCustomNodeComponent(type: string | undefined): Type<any> | undefined {
    if (!type) return undefined;
    const resolved = this.resolvedLazyNodeTypes()[type];
    if (resolved) return resolved;

    const entry = this.allNodeTypes[type];
    if (!entry) return undefined;

    // Angular component classes carry ɵcmp; lazy factories do not.
    if (typeof entry === 'function' && (entry as any).ɵcmp) {
      return entry as Type<any>;
    }

    if (typeof entry === 'function') {
      this.ensureLazyNodeType(type, entry as () => Promise<any>);
      return this.resolvedLazyNodeTypes()[type];
    }

    return entry as Type<any>;
  }

  private ensureLazyNodeType(type: string, factory: () => Promise<any>): void {
    if (this.resolvedLazyNodeTypes()[type] || this.lazyLoadInFlight.has(type)) return;
    this.lazyLoadInFlight.add(type);
    Promise.resolve()
      .then(() => factory())
      .then((mod) => {
        const cmp = mod?.default ?? mod;
        this.resolvedLazyNodeTypes.update((m) => ({ ...m, [type]: cmp }));
        this.cdRef.markForCheck();
      })
      .finally(() => this.lazyLoadInFlight.delete(type));
  }

  isCustomEdge(edge: Edge): boolean {
    if (!edge.type) return false;
    if (DiagramComponent.BUILT_IN_EDGE_TYPES.has(edge.type)) return false;
    return !!this.allEdgeTypes[edge.type] || !!this.edgeTemplate();
  }

  getCustomEdgeComponent(type: string | undefined): Type<any> | undefined {
    if (!type) return undefined;
    return this.allEdgeTypes[type];
  }

  getCustomNodeInputs(node: WorkflowNode): Record<string, unknown> {
    return {
      node,
      id: node.id,
      data: node.data,
      selected: !!node.selected,
      type: node.type,
      pos: node.position,
      easyConnect: node.easyConnect,
      style: node.style,
      ports: node.ports,
      label: node.label,
    };
  }

  getNodeTemplateContext(node: WorkflowNode): Record<string, unknown> {
    return {
      $implicit: {
        id: node.id,
        data: node.data,
        selected: !!node.selected,
        width: node.width || this.defaultNodeWidth,
        height: node.height || this.defaultNodeHeight,
        node,
      },
      node,
    };
  }

  getHandleTemplateContext(
    node: WorkflowNode,
    handleId: string,
    type: 'source' | 'target' = 'source'
  ): Record<string, unknown> {
    return {
      $implicit: { node, handleId, type, selected: !!node.selected },
      node,
      handleId,
      type,
    };
  }

  getEdgeTemplateContext(edge: Edge): Record<string, unknown> {
    const path = this.getEdgePath(edge);
    return {
      $implicit: {
        edge,
        path: () => path,
        markerEnd: () => this.getMarkerUrlForEdge(edge, 'end'),
        markerStart: () => this.getMarkerUrlForEdge(edge, 'start'),
      },
      edge,
      path,
    };
  }

  emitNodeChanges(changes: NodeChange[]): void {
    if (!changes.length) return;
    this.nodeChanges.emit(changes);
    this.changesController.handleNodeChanges(changes);
  }

  emitEdgeChanges(changes: EdgeChange[]): void {
    if (!changes.length) return;
    this.edgeChanges.emit(changes);
    this.changesController.handleEdgeChanges(changes);
  }

  isShortcutEnabled(action: keyof KeyboardShortcuts): boolean {
    const map = this.keyboardShortcuts();
    return map[action] !== false;
  }

  ngOnInit(): void {
    this.diagramStateService.el = this.svgRef;
    this.viewport = this.diagramStateService.viewport;
    this.viewNodes = this.diagramStateService.viewNodes;
    this.filteredNodes = this.diagramStateService.visibleNodes; // Use visibleNodes for rendering
    // Selected edges paint last so their labels sit above overlapping chips.
    this.filteredEdges = computed(() => {
      const edges = this.diagramStateService.visibleEdges();
      return [...edges].sort((a, b) => Number(!!a.selected) - Number(!!b.selected));
    });
    this.tempEdges = this.diagramStateService.tempEdges;
    this.alignmentGuides = this.diagramStateService.alignmentGuides;
    this.diagramStateService.selectionMode = this.selectionMode();

    // Initialize sortedNodes computed signal for z-index handling
    this.sortedNodes = computed(() => {
      const nodes = this.filteredNodes();
      if (this.zIndexMode() === 'layered') {
        return [...nodes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      }
      return nodes;
    });

    // Set grid configuration
    this.diagramStateService.setGridConfig(this.gridSize(), this.snapToGrid());

    if (this.initialNodes().length > 0) {
      this.initialNodes().forEach(node => this.diagramStateService.addNode(node));
    }
    if (this.initialEdges().length > 0) {
      // Add initial edges directly to the signal without triggering connect events
      this.diagramStateService.edges.set([...this.initialEdges()]);
    }
    if (this.initialViewport()) {
      this.diagramStateService.setViewport(this.initialViewport()!);
    }

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
        if (!this.isDraggingNode) {
          this.updatePathFinder(nodes);
          // Prevent parent→service effect from applying a stale snapshot over this emit
          this.syncingNodesToParent = true;
          this.nodesChange.emit(nodes);
          queueMicrotask(() => {
            this.syncingNodesToParent = false;
          });
        }
      })
    );
    this.subscriptions.add(
      this.diagramStateService.edgesChange.subscribe((edges: Edge[]) => {
        this.syncingEdgesToParent = true;
        this.edgesChange.emit(edges);
        queueMicrotask(() => {
          this.syncingEdgesToParent = false;
        });
      })
    );

    // Browser-only observers / listeners (skipped during prerender / SSR)
    if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
      // Initialize ResizeObserver outside Angular to avoid CD storms on every frame
      this.ngZone.runOutsideAngular(() => {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            const prev = this.diagramStateService.containerDimensions();
            const changed =
              Math.abs(prev.width - width) >= 0.5 || Math.abs(prev.height - height) >= 0.5;
            if (!changed) continue;

            this.ngZone.run(() => {
              this.diagramStateService.setContainerDimensions({ width, height });
              if (this.fitViewOnInit() && !this.hasInitialFitted && width > 40 && height > 40) {
                this.hasInitialFitted = true;
                requestAnimationFrame(() => {
                  this.ngZone.run(() => {
                    this.fitView();
                    this.cdRef.markForCheck();
                  });
                });
              } else {
                this.cdRef.markForCheck();
              }
            });
          }
        });
        this.resizeObserver.observe(this.el.nativeElement);
      });

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

        // Window-level space-panning listeners outside Angular Zone to avoid
        // triggering change detection on every mouse pixel movement globally.
        this.unlistenWindowPointerMove = this.renderer.listen('window', 'pointermove', (event: PointerEvent) => {
          this.onWindowPointerMove(event);
        });
        this.unlistenWindowPointerUp = this.renderer.listen('window', 'pointerup', (event: PointerEvent) => {
          this.onWindowPointerUp(event);
        });
      });
    }

    if (this.fitViewOnInit()) {
      this.scheduleInitialFitView();
    }

    // Auto-save: Load saved state if enabled
    if (this.autoSave()) {
      const savedState = this.autoSaveService.loadCurrentState();
      if (savedState) {
        this.setDiagramState(savedState);
      }
    }

    // Auto-save: Watch for changes and save
    if (this.autoSave()) {
      this.subscriptions.add(
        combineLatest([
          this.nodes$,
          this.edges$,
          this.viewport$
        ]).pipe(
          debounceTime(this.autoSaveInterval()),
          skip(1) // Skip initial emission
        ).subscribe(() => {
          const state = this.getDiagramState();
          this.autoSaveService.queueSave(state);
        })
      );
    }

    // Attach services
    this.touchGestureService.attach(this.svgRef.nativeElement, this.diagramStateService);
    this.canvasPanZoomService.attach(this.svgRef, this.diagramStateService);
    this.nodeDragService.attach(this.svgRef, this.diagramStateService);
    this.selectionBoxService.attach(this.svgRef, this.diagramStateService);
  }

  ngOnDestroy(): void {
    this.themeService.unregisterHost(this.el.nativeElement);
    this.subscriptions.unsubscribe();
    if (this.importNotificationTimer) {
      clearTimeout(this.importNotificationTimer);
      this.importNotificationTimer = null;
    }
    if (this.autoPanInterval !== null) {
      if (typeof window !== 'undefined') {
        window.cancelAnimationFrame(this.autoPanInterval);
      }
      this.autoPanInterval = null;
    }
    if (this.dragAnimationFrameId !== null) {
      if (typeof window !== 'undefined') {
        window.cancelAnimationFrame(this.dragAnimationFrameId);
      }
      this.dragAnimationFrameId = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    try {
      this.unlistenPointerMove?.();
      this.unlistenPointerUp?.();
      this.unlistenPointerLeave?.();
      this.unlistenWindowPointerMove?.();
      this.unlistenWindowPointerUp?.();
    } catch {
      // DOM / window may already be torn down during prerender cleanup
    }
    this.unlistenPointerMove = null;
    this.unlistenPointerUp = null;
    this.unlistenPointerLeave = null;
    this.unlistenWindowPointerMove = null;
    this.unlistenWindowPointerUp = null;
    this.touchGestureService.detach();
    this.canvasPanZoomService.detach();
    this.nodeDragService.detach();
    this.selectionBoxService.detach();
  }

  get lodLevel(): string {
    const zoom = this.viewport().zoom;
    const hideBelow = this.optimization().hideEdgesBelowZoom ?? 0.4;
    if (zoom < hideBelow) {
      return 'low';
    }
    if (zoom < Math.max(hideBelow + 0.2, 0.85)) {
      return 'medium';
    }
    return 'high';
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

  /**
   * Delete selected elements with beforeDelete hook support.
   * Emits beforeDelete event which allows users to cancel the deletion.
   */
  deleteSelectedElements(): void {
    const nodesToDelete = this.diagramStateService.selectedNodes();
    const edgesToDelete = this.diagramStateService.selectedEdges();

    // If nothing selected, do nothing
    if (nodesToDelete.length === 0 && edgesToDelete.length === 0) {
      return;
    }

    let cancelled = false;
    const cancel = () => { cancelled = true; };

    this.beforeDelete.emit({
      nodes: nodesToDelete,
      edges: edgesToDelete,
      cancel
    });

    if (!cancelled) {
      this.diagramStateService.deleteSelectedElements();
    }
  }

  @HostListener('window:keydown.delete', ['$event'])
  onDeleteKeyPress(event: any): void {
    if (!this.isShortcutEnabled('delete')) return;
    this.deleteSelectedElements();
  }

  @HostListener('window:keydown.control.z', ['$event'])
  @HostListener('window:keydown.meta.z', ['$event']) // For macOS
  onUndoKeyPress(event: any): void {
    if (!this.isShortcutEnabled('undo')) return;
    event.preventDefault(); // Prevent browser undo
    this.diagramStateService.undo();
  }

  @HostListener('window:keydown.control.shift.z', ['$event'])
  @HostListener('window:keydown.meta.shift.z', ['$event']) // For macOS
  onRedoKeyPress(event: any): void {
    if (!this.isShortcutEnabled('redo')) return;
    event.preventDefault(); // Prevent browser redo
    this.diagramStateService.redo();
  }

  // Duplicate Group/Ungroup listeners removed (superseded by new listeners below)

  @HostListener('window:keydown.control.]', ['$event'])
  @HostListener('window:keydown.meta.]', ['$event'])
  onBringToFrontKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    const selectedNodes = this.diagramStateService.selectedNodes();
    selectedNodes.forEach(node => {
      this.diagramStateService.bringToFront(node.id);
    });
  }

  @HostListener('window:keydown.control.[', ['$event'])
  @HostListener('window:keydown.meta.[', ['$event'])
  onSendToBackKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    const selectedNodes = this.diagramStateService.selectedNodes();
    selectedNodes.forEach(node => {
      this.diagramStateService.sendToBack(node.id);
    });
  }

  @HostListener('window:keydown.control.shift.]', ['$event'])
  @HostListener('window:keydown.meta.shift.]', ['$event'])
  onRaiseLayerKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    const selectedNodes = this.diagramStateService.selectedNodes();
    selectedNodes.forEach(node => {
      this.diagramStateService.raiseLayer(node.id);
    });
  }

  @HostListener('window:keydown.control.shift.[', ['$event'])
  @HostListener('window:keydown.meta.shift.[', ['$event'])
  onLowerLayerKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    event.preventDefault();
    const selectedNodes = this.diagramStateService.selectedNodes();
    selectedNodes.forEach(node => {
      this.diagramStateService.lowerLayer(node.id);
    });
  }

  @HostListener('window:keydown.control.a', ['$event'])
  @HostListener('window:keydown.meta.a', ['$event'])
  onSelectAllKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    if (!this.isShortcutEnabled('selectAll')) return;
    event.preventDefault();
    this.diagramStateService.selectAll();
  }

  @HostListener('window:keydown.control.g', ['$event'])
  @HostListener('window:keydown.meta.g', ['$event'])
  onGroupKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    if (!this.isShortcutEnabled('group')) return;
    event.preventDefault();
    const selectedIds = this.diagramStateService.selectedNodeIds();
    this.diagramStateService.groupNodes(selectedIds);
  }

  @HostListener('window:keydown.control.shift.g', ['$event'])
  @HostListener('window:keydown.meta.shift.g', ['$event'])
  onUngroupKeyPress(event: any): void {
    if (this.isInputActive(event)) return;
    if (!this.isShortcutEnabled('ungroup')) return;
    event.preventDefault();
    const selectedIds = this.diagramStateService.selectedNodeIds();
    this.diagramStateService.ungroupNodes(selectedIds);
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

  // Space-panning handlers — bound outside Angular Zone in ngOnInit
  // to avoid triggering change detection on every mouse pixel movement.
  private onWindowPointerMove(event: PointerEvent): void {
    if (this.isSpacePanning) {
      const dx = event.clientX - this.panStartPosition.x;
      const dy = event.clientY - this.panStartPosition.y;

      const newViewport = {
        ...this.viewportStartPosition,
        x: this.viewportStartPosition.x + dx,
        y: this.viewportStartPosition.y + dy
      };

      this.ngZone.run(() => {
        this.diagramStateService.setViewport(newViewport);
      });
      event.preventDefault();
    }
  }

  private onWindowPointerUp(event: PointerEvent): void {
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

    // Emit paneScroll event
    this.paneScroll.emit(event);

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
      const handle = resizeHandle.dataset['handle'] as 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
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

        // Easy Connect Logic
        if (node.easyConnect) {
          const isDragHandle = target.closest('.drag-handle');
          if (isDragHandle) {
            this.startDraggingNode(event, node);
            return;
          }

          // If not drag handle, treat as connection start (or do nothing)
          // Find a source handle to connect from.
          const sourceHandle = nodeElement.querySelector('.ngx-workflow__handle[data-type="source"]') as HTMLElement;
          if (sourceHandle) {
            this.startConnecting(event, sourceHandle);
          }
          // STRICT: Do NOT drag from body if easyConnect is on.
          return;
        }

        this.startDraggingNode(event, node);
        return;
      }
    }

    // If clicking an edge, let the specific handlers handle it (don't pan)
    if (edgeElement) {
      return;
    }

    // Clicking on empty canvas - potential box selection (shown after drag threshold)
    // If Ctrl key is NOT pressed, clear selection
    if (!event.ctrlKey && !event.metaKey) {
      this.diagramStateService.clearSelection();
      this.selectedNodeForEditing = null;
    }

    // Start box selection
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();
    const canvasX = (event.clientX - svgRect.left - viewport.x) / viewport.zoom;
    const canvasY = (event.clientY - svgRect.top - viewport.y) / viewport.zoom;

    // Emit paneClick event
    this.paneClick.emit({ event, position: { x: canvasX, y: canvasY } });

    this.selectionBoxService.begin(canvasX, canvasY, event.pointerId);
  }



  onPointerMove(event: PointerEvent): void {
    if (this.isResizing) {
      this.resize(event);
    } else if (this.isUpdatingEdge) {
      this.updateEdge(event);
    } else if (this.isConnecting) {
      this.updateConnection(event);
    } else if (this.isDraggingNode) {
      this.dragNode(event);
    } else if (this.isBoxSelecting || this.selectionBoxService.isPendingSelection) {
      this.updateBoxSelection(event);
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
    } else if (this.isBoxSelecting || this.selectionBoxService.isPendingSelection) {
      this.stopBoxSelection(event);
    } else if (this.isPanning) {
      this.stopPanning(event);
    } else if (this.isSelecting) {
      this.endSelecting(event);
    }
  }

  onPointerLeave(event: PointerEvent): void {
    if (
      this.isResizing ||
      this.isUpdatingEdge ||
      this.isPanning ||
      this.isSelecting ||
      this.isBoxSelecting ||
      this.selectionBoxService.isPendingSelection ||
      this.isDraggingNode ||
      this.isConnecting
    ) {
      this.onPointerUp(event);
    }
  }

  // --- Connecting Logic ---

  /**
   * Public method called from template when handle is clicked
   */
  onHandlePointerDown(event: PointerEvent, node: WorkflowNode, handleId: string): void {
    const handleElement = (event.currentTarget as HTMLElement);
    this.startConnecting(event, handleElement, node.id, handleId);
  }

  private startConnecting(
    event: PointerEvent,
    handleElement: HTMLElement,
    nodeId?: string,
    handleId?: string
  ): void {
    event.stopPropagation();
    event.preventDefault();

    // Port drag must not also start a node drag
    if (this.nodeDragService.isDraggingNode) {
      this.nodeDragService.stopDraggingNode(event);
    }

    const resolvedNodeId =
      nodeId ||
      handleElement.getAttribute('data-nodeid') ||
      handleElement.dataset?.['nodeid'] ||
      undefined;
    const resolvedHandleId =
      handleId ||
      handleElement.getAttribute('data-handleid') ||
      handleElement.dataset?.['handleid'] ||
      undefined;

    if (!resolvedNodeId) {
      return;
    }

    // Replace any in-progress connection preview
    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
      this.currentPreviewEdgeId = null;
    }

    this.isConnecting = true;
    // Track start position to prevent accidental clicks triggering drops
    this.connectingStartPointerPosition = { x: event.clientX, y: event.clientY };

    if (event.pointerId !== undefined) {
      try {
        this.svgRef.nativeElement.setPointerCapture(event.pointerId);
      } catch (e) {
        // Safe fallback
      }
    }

    this.connectingSourceNodeId = resolvedNodeId;
    this.connectingSourceHandleId = resolvedHandleId;

    // Emit connectStart event
    this.connectStart.emit({ nodeId: resolvedNodeId, handleId: resolvedHandleId });

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
      source: resolvedNodeId,
      sourceHandle: resolvedHandleId,
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
      // Scale detection radius with zoom so it works reliably at any zoom level
      let minDistance = Math.max(35, 35 / viewport.zoom);

      const nodes = this.getLiveNodes();

      // First pass: check handle proximity (precise snapping)
      for (const node of nodes) {
        const handles = ['top', 'right', 'bottom', 'left'];
        for (const handleId of handles) {
          const handlePos = this.getHandleAbsolutePosition(node, handleId);
          const dist = Math.hypot(handlePos.x - currentPointerX, handlePos.y - currentPointerY);
          if (dist < minDistance) {
            minDistance = dist;
            closestHandle = { nodeId: node.id, handleId: handleId };
          }
        }
      }

      // Second pass: cursor over a node body — pick the handle facing the source
      if (!closestHandle) {
        const sourceNode = nodes.find((n) => n.id === this.connectingSourceNodeId);
        const sourceAnchor = sourceNode
          ? this.getHandleAbsolutePosition(sourceNode, this.connectingSourceHandleId)
          : { x: currentPointerX, y: currentPointerY };

        for (const node of nodes) {
          if (node.id === this.connectingSourceNodeId) continue;

          const absPos = node._renderPosition
            ?? this.diagramStateService.getAbsolutePosition(node, nodes);
          const nodeW = node.width || this.defaultNodeWidth;
          const nodeH = node.height || this.defaultNodeHeight;
          const padding = 10;

          if (
            currentPointerX >= absPos.x - padding &&
            currentPointerX <= absPos.x + nodeW + padding &&
            currentPointerY >= absPos.y - padding &&
            currentPointerY <= absPos.y + nodeH + padding
          ) {
            const nodeCenter = {
              x: absPos.x + nodeW / 2,
              y: absPos.y + nodeH / 2,
            };
            // Prefer the side that faces the source (readable bottom→top / right→left flows)
            const facing = inferHandlePosition(sourceAnchor, nodeCenter, 'target');
            closestHandle = { nodeId: node.id, handleId: facing };
            break;
          }
        }
      }

      this.clearTargetHandleHighlight();

      if (closestHandle) {
        const targetNodeId = closestHandle.nodeId;
        const targetHandleId = closestHandle.handleId;

        // Allow connecting to any handle on a different node OR same node (self-loop)
        if (targetNodeId) {
          this.currentTargetHandle = { nodeId: targetNodeId, handleId: targetHandleId, type: 'target' };

          if (this.isValidConnection(this.connectingSourceNodeId!, targetNodeId, this.connectingSourceHandleId, targetHandleId)) {
            // We need to find the handle element to highlight it
            const handleEl = this.el.nativeElement.querySelector(`.ngx-workflow__handle[data-nodeid="${targetNodeId}"][data-handleid="${targetHandleId}"]`);
            if (handleEl) {
              this.renderer.addClass(handleEl, 'ngx-workflow__handle--valid-target');
            }
          }
        }
      } else {
        this.currentTargetHandle = null;
      }
    });
  }

  private finishConnecting(event: PointerEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.isConnecting = false;
    if (event && event.pointerId !== undefined) {
      try {
        if (this.svgRef.nativeElement.hasPointerCapture(event.pointerId)) {
          this.svgRef.nativeElement.releasePointerCapture(event.pointerId);
        }
      } catch (e) {
        // Safe fallback
      }
    }
    this.clearTargetHandleHighlight();

    if (this.currentPreviewEdgeId) {
      this.diagramStateService.removeEdge(this.currentPreviewEdgeId);
    }

    if (this.currentTargetHandle && this.connectingSourceNodeId) {
      const sourceId = this.connectingSourceNodeId;
      const targetId = this.currentTargetHandle.nodeId;
      const targetHandleId = this.currentTargetHandle.handleId;

      if (this.isValidConnection(sourceId, targetId, this.connectingSourceHandleId, targetHandleId)) {
        const newEdge: Edge = {
          id: uuidv4(),
          source: sourceId,
          sourceHandle: this.connectingSourceHandleId,
          target: targetId,
          targetHandle: targetHandleId,
          type: 'bezier',
        };
        this.diagramStateService.addEdge(newEdge);

        // Emit connectEnd event for successful connection
        this.connectEnd.emit({
          nodeId: targetId,
          handleId: targetHandleId
        });
      } else {
        // Visual feedback for invalid connection: shake the specific target handle port
        const targetHandleEl = this.el.nativeElement.querySelector(
          `.ngx-workflow__handle[data-nodeid="${targetId}"][data-handleid="${targetHandleId}"]`
        );
        if (targetHandleEl) {
          this.renderer.addClass(targetHandleEl, 'ngx-workflow__handle--invalid-shake');
          setTimeout(() => this.renderer.removeClass(targetHandleEl, 'ngx-workflow__handle--invalid-shake'), 1000);
        }

        // Emit connectEnd with target node (connection rejected)
        this.connectEnd.emit({
          nodeId: targetId,
          handleId: targetHandleId
        });
      }
    } else if (this.connectingSourceNodeId && !this.currentTargetHandle) {
      // Connection dropped on canvas (no target handle)
      const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
      const viewport = this.viewport();
      const canvasX = (event.clientX - svgRect.left - viewport.x) / viewport.zoom;
      const canvasY = (event.clientY - svgRect.top - viewport.y) / viewport.zoom;

      this.edgeDrop.emit({
        sourceNodeId: this.connectingSourceNodeId,
        sourceHandleId: this.connectingSourceHandleId!,
        position: { x: canvasX, y: canvasY }
      });
    }

    this.currentPreviewEdgeId = null;
    this.currentTargetHandle = null;
    this.connectingSourceNodeId = null;
    this.connectingSourceHandleId = undefined;
  }

  private clearTargetHandleHighlight(): void {
    const activeHighlights = document.querySelectorAll('.ngx-workflow__handle--valid-target');
    activeHighlights.forEach(el => this.renderer.removeClass(el, 'ngx-workflow__handle--valid-target'));
  }

  // --- Dragging Logic ---

  private startDraggingNode(event: PointerEvent, node: WorkflowNode): void {
    // Use live service nodes (not the possibly-stale [nodes] input) so
    // multi-select drag sees current selection/positions after local updates.
    this.nodeDragService.startDraggingNode(
      event,
      node,
      this.diagramStateService.nodes()
    );
  }

  private dragNode(event: PointerEvent): void {
    this.nodeDragService.dragNode(event, this.viewport(), (currentX, currentY) => {
      this.cdRef.detectChanges();
      if (this.nodeDragService.draggingNode && this.nodeDragService.draggingNodes.length === 1) {
        this.checkGroupProximity(this.nodeDragService.draggingNode, { x: currentX, y: currentY });
        if (this.nodeDragService.draggingNode.type !== 'group') {
          this.checkProximityConnect(this.nodeDragService.draggingNode, { x: currentX, y: currentY });
        }
      }
    });
    this.checkAutoPan(event.clientX, event.clientY);
  }

  private checkProximityConnect(node: WorkflowNode, currentPosition: { x: number, y: number }): void {
    const nodes = this.getLiveNodes();

    // Calculate Absolute Position of the dragged node
    let nodeAbsX = currentPosition.x;
    let nodeAbsY = currentPosition.y;

    if (node.parentId) {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        const parentAbsPos = this.diagramStateService.getAbsolutePosition(parent, nodes);
        nodeAbsX += parentAbsPos.x;
        nodeAbsY += parentAbsPos.y;
      }
    }

    const nodeCenter = {
      x: nodeAbsX + (node.width || this.defaultNodeWidth) / 2,
      y: nodeAbsY + (node.height || this.defaultNodeHeight) / 2
    };

    let closestNodeId: string | null = null;
    let minDist = Infinity;

    nodes.forEach(n => {
      if (n.id === node.id || n.selected || n.type === 'group') return; // Skip self, other selected nodes, and groups

      // Use Absolute Position for candidate node
      const nAbsPos = this.diagramStateService.getAbsolutePosition(n, nodes);

      const nCenter = {
        x: nAbsPos.x + (n.width || this.defaultNodeWidth) / 2,
        y: nAbsPos.y + (n.height || this.defaultNodeHeight) / 2
      };

      const dist = Math.sqrt(Math.pow(nCenter.x - nodeCenter.x, 2) + Math.pow(nCenter.y - nodeCenter.y, 2));

      if (dist < this.proximityThreshold() && dist < minDist) {
        minDist = dist;
        closestNodeId = n.id;
      }
    });

    if (closestNodeId) {
      if (this.proximityTargetNodeId !== closestNodeId) {
        // Target changed, update preview
        if (this.proximityPreviewEdgeId) {
          this.diagramStateService.removeEdge(this.proximityPreviewEdgeId);
        }

        this.proximityTargetNodeId = closestNodeId;
        const previewId = `proximity-preview-${uuidv4()}`;
        this.proximityPreviewEdgeId = previewId;

        const targetNode = nodes.find(n => n.id === closestNodeId)!;
        const targetCenter = {
          x: targetNode.position.x + (targetNode.width || this.defaultNodeWidth) / 2,
          y: targetNode.position.y + (targetNode.height || this.defaultNodeHeight) / 2
        };

        // Determine direction
        const dx = nodeCenter.x - targetCenter.x;
        const dy = nodeCenter.y - targetCenter.y;

        let source: string, target: string, sourceHandle: string, targetHandle: string;
        let startX: number, startY: number, endX: number, endY: number;

        // Horizontal Dominant
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            // Dragging Node (Right) -> Target Node (Left)
            // Connection: Target(Right) -> Dragging(Left)
            source = closestNodeId!;
            target = node.id;
            sourceHandle = 'right';
            targetHandle = 'left';

            // Coords
            startX = targetNode.position.x + (targetNode.width || this.defaultNodeWidth);
            startY = targetCenter.y;
            endX = currentPosition.x;
            endY = nodeCenter.y;
          } else {
            // Dragging Node (Left) -> Target Node (Right)
            // Connection: Dragging(Right) -> Target(Left)
            source = node.id;
            target = closestNodeId!;
            sourceHandle = 'right';
            targetHandle = 'left';

            startX = currentPosition.x + (node.width || this.defaultNodeWidth);
            startY = nodeCenter.y;
            endX = targetNode.position.x;
            endY = targetCenter.y;
          }
        } else {
          // Vertical Dominant
          if (dy > 0) {
            // Dragging (Bottom) -> Target (Top)
            // Connection: Target(Bottom) -> Dragging(Top)
            source = closestNodeId!;
            target = node.id;
            sourceHandle = 'bottom';
            targetHandle = 'top';

            startX = targetCenter.x;
            startY = targetNode.position.y + (targetNode.height || this.defaultNodeHeight);
            endX = nodeCenter.x;
            endY = currentPosition.y;
          } else {
            // Dragging (Top) -> Target (Bottom)
            // Connection: Dragging(Bottom) -> Target(Top)
            source = node.id;
            target = closestNodeId!;
            sourceHandle = 'bottom';
            targetHandle = 'top';

            startX = nodeCenter.x;
            startY = currentPosition.y + (node.height || this.defaultNodeHeight);
            endX = targetCenter.x;
            endY = targetNode.position.y;
          }
        }



        // Respect connection limits / validators (same rules as manual connect)
        const canConnect = this.isValidConnection(source, target, sourceHandle, targetHandle);

        if (canConnect) {
          this.proximityCandidate = { source, target, sourceHandle, targetHandle };
          this.diagramStateService.addTempEdge({
            id: previewId,
            source: source,
            target: target,
            sourceHandle: sourceHandle,
            targetHandle: targetHandle,
            type: 'straight',
            animated: true,
            style: { stroke: 'black', strokeWidth: '2', strokeDasharray: '5,5' },
            sourceX: startX,
            sourceY: startY,
            targetX: endX,
            targetY: endY
          });
        } else {
          this.proximityCandidate = null;
          if (this.proximityPreviewEdgeId) {
            this.diagramStateService.removeEdge(this.proximityPreviewEdgeId);
            this.proximityPreviewEdgeId = null;
          }
        }
      }
    } else {
      this.proximityCandidate = null; // Clear candidate if no node is close
      // No target in range
      if (this.proximityPreviewEdgeId) {
        this.diagramStateService.removeEdge(this.proximityPreviewEdgeId);
        this.proximityPreviewEdgeId = null;
      }
      this.proximityTargetNodeId = null;
    }
  }

  private checkGroupProximity(node: WorkflowNode, currentPosition: { x: number, y: number }): void {
    const nodes = this.nodes();

    const nodeRect = {
      x: currentPosition.x,
      y: currentPosition.y,
      width: node.width || this.defaultNodeWidth,
      height: node.height || this.defaultNodeHeight
    };

    const nodeCenter = {
      x: nodeRect.x + nodeRect.width / 2,
      y: nodeRect.y + nodeRect.height / 2
    };

    const potentialParents = nodes.filter(n => {
      if (n.type !== 'group' || n.id === node.id || n.selected) return false;

      const groupAbsPos = this.diagramStateService.getAbsolutePosition(n, nodes);

      // Check if center is inside group
      return (
        nodeCenter.x >= groupAbsPos.x &&
        nodeCenter.x <= groupAbsPos.x + (n.width || this.defaultNodeWidth) &&
        nodeCenter.y >= groupAbsPos.y &&
        nodeCenter.y <= groupAbsPos.y + (n.height || this.defaultNodeHeight)
      );
    });

    if (potentialParents.length > 0) {
      // Sort by area (smallest first)
      potentialParents.sort((a, b) => {
        const areaA = (a.width || this.defaultNodeWidth) * (a.height || this.defaultNodeHeight);
        const areaB = (b.width || this.defaultNodeWidth) * (b.height || this.defaultNodeHeight);
        return areaA - areaB;
      });

      const targetGroup = potentialParents[0];
      if (this.hoveredGroupId() !== targetGroup.id) {
        this.hoveredGroupId.set(targetGroup.id);
      }
    } else {
      if (this.hoveredGroupId() !== null) {
        this.hoveredGroupId.set(null);
      }
    }
  }

  private stopDraggingNode(event: PointerEvent): void {
    const draggedNodes = [...this.nodeDragService.draggingNodes];
    const primaryDragged = this.nodeDragService.draggingNode;
    this.stopAutoPan();
    this.nodeDragService.stopDraggingNode(event);
    // Use live service state — [nodes] input is stale until we emit nodesChange
    const liveNodes = this.diagramStateService.nodes();
    this.updatePathFinder(liveNodes);
    draggedNodes.forEach(node => {
      this.checkReparenting(node);
    });

    this.hoveredGroupId.set(null); // Clear group hover state

    // Commit Proximity Connection
    if (this.proximityCandidate && primaryDragged) {
      // Create real edge
      const newEdge: Edge = {
        id: uuidv4(),
        source: this.proximityCandidate.source,
        sourceHandle: this.proximityCandidate.sourceHandle,
        target: this.proximityCandidate.target,
        targetHandle: this.proximityCandidate.targetHandle,
        animated: true,
        label: 'auto-connect',
        markerEnd: 'arrowclosed'
      };
      this.diagramStateService.addEdge(newEdge);

      // Cleanup
      if (this.proximityPreviewEdgeId) {
        this.diagramStateService.removeEdge(this.proximityPreviewEdgeId);
        this.proximityPreviewEdgeId = null;
      }
      this.proximityTargetNodeId = null;
      this.proximityCandidate = null;
    }

    // Emit the final live state after drag is complete
    this.nodesChange.emit(this.diagramStateService.nodes());
  }

  private checkReparenting(node: WorkflowNode): void {
    // Find if the node is dropped onto a group
    const nodes = this.getLiveNodes();
    const nodeAbsPos = this.diagramStateService.getAbsolutePosition(node, nodes);

    const nodeRect = {
      x: nodeAbsPos.x,
      y: nodeAbsPos.y,
      width: node.width || this.defaultNodeWidth,
      height: node.height || this.defaultNodeHeight
    };

    const nodeCenter = {
      x: nodeRect.x + nodeRect.width / 2,
      y: nodeRect.y + nodeRect.height / 2
    };

    const potentialParents = nodes.filter(n => {
      if (n.type !== 'group' || n.id === node.id || n.selected) return false;

      const groupAbsPos = this.diagramStateService.getAbsolutePosition(n, nodes);

      // Check if center is inside group
      return (
        nodeCenter.x >= groupAbsPos.x &&
        nodeCenter.x <= groupAbsPos.x + (n.width || this.defaultNodeWidth) &&
        nodeCenter.y >= groupAbsPos.y &&
        nodeCenter.y <= groupAbsPos.y + (n.height || this.defaultNodeHeight)
      );
    });

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
    if (newParentId !== node.parentId) {
      this.diagramStateService.reparentNode(node.id, newParentId);
    }
  }

  // --- Resizing Logic ---

  startResizing(event: PointerEvent, node: WorkflowNode, handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'): void {
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
        case 'n': // North - resize from top edge
          newHeight = this.startNodeDimensions.height - deltaY;
          newY = this.startNodeDimensions.y + deltaY;
          break;
        case 's': // South - resize from bottom edge
          newHeight = this.startNodeDimensions.height + deltaY;
          break;
        case 'e': // East - resize from right edge
          newWidth = this.startNodeDimensions.width + deltaX;
          break;
        case 'w': // West - resize from left edge
          newWidth = this.startNodeDimensions.width - deltaX;
          newX = this.startNodeDimensions.x + deltaX;
          break;
      }

      // Apply aspect ratio locking if Shift key is pressed
      if (event.shiftKey && resizingNode.lockAspectRatio !== false) {
        const aspectRatio = this.startNodeDimensions.width / this.startNodeDimensions.height;

        // For corner handles, maintain aspect ratio
        if (['nw', 'ne', 'se', 'sw'].includes(resizeHandle)) {
          // Use the larger dimension change to maintain aspect ratio
          const widthChange = Math.abs(newWidth - this.startNodeDimensions.width);
          const heightChange = Math.abs(newHeight - this.startNodeDimensions.height);

          if (widthChange > heightChange) {
            newHeight = newWidth / aspectRatio;
            if (resizeHandle === 'nw' || resizeHandle === 'ne') {
              newY = this.startNodeDimensions.y + this.startNodeDimensions.height - newHeight;
            }
          } else {
            newWidth = newHeight * aspectRatio;
            if (resizeHandle === 'nw' || resizeHandle === 'sw') {
              newX = this.startNodeDimensions.x + this.startNodeDimensions.width - newWidth;
            }
          }
        }
        // For edge handles, adjust the other dimension
        else if (resizeHandle === 'n' || resizeHandle === 's') {
          newWidth = newHeight * aspectRatio;
          newX = this.startNodeDimensions.x + (this.startNodeDimensions.width - newWidth) / 2;
        } else if (resizeHandle === 'e' || resizeHandle === 'w') {
          newHeight = newWidth / aspectRatio;
          newY = this.startNodeDimensions.y + (this.startNodeDimensions.height - newHeight) / 2;
        }
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
      this.cdRef.detectChanges();
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

    const sourcePos = this.getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = this.getHandleAbsolutePosition(targetNode, edge.targetHandle);

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
      if (this.isValidConnection(newEdge.source, newEdge.target, newEdge.sourceHandle, newEdge.targetHandle)) {
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

  /** Triangle arrowheads drawn in user space (not SVG markers) for bezier/straight. */
  private isGeometryArrowMarker(marker: string | undefined | null): boolean {
    if (!marker) return false;
    const id = String(marker).trim();
    return id === 'arrow' || id === 'arrowclosed' || id === 'arrowhead';
  }

  usesGeometryArrowhead(edge: Edge | TempEdge): boolean {
    if (!('markerEnd' in edge) || !this.isGeometryArrowMarker(edge.markerEnd)) {
      return false;
    }
    const t = edge.type;
    return t === 'bezier' || t === 'straight' || t === 'dashed';
  }

  getEdgeArrowhead(edge: Edge | TempEdge): ArrowheadGeometry | null {
    if (!this.usesGeometryArrowhead(edge)) {
      return null;
    }
    const endpoints = this.resolveEdgeEndpoints(edge, false);
    if (!endpoints) {
      return null;
    }
    const { sourcePos, targetPos, bezierOpts } = endpoints;
    if ('waypoints' in edge && edge.waypoints && edge.waypoints.length > 0) {
      const prev = edge.waypoints[edge.waypoints.length - 1];
      return this.arrowheadFromSegment(prev, targetPos);
    }
    if (edge.type === 'straight' || edge.type === 'dashed') {
      return this.arrowheadFromSegment(sourcePos, targetPos);
    }
    return getArrowheadGeometry(sourcePos, targetPos, bezierOpts);
  }

  private arrowheadFromSegment(
    from: XYPosition,
    tip: XYPosition,
    size: { length?: number; width?: number } = {}
  ): ArrowheadGeometry {
    const length = size.length ?? 8;
    const width = size.width ?? 6;
    let tx = tip.x - from.x;
    let ty = tip.y - from.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    const pathEnd = { x: tip.x - tx * length, y: tip.y - ty * length };
    const px = -ty;
    const py = tx;
    const half = width / 2;
    return {
      tip,
      pathEnd,
      points: `${tip.x},${tip.y} ${pathEnd.x + px * half},${pathEnd.y + py * half} ${pathEnd.x - px * half},${pathEnd.y - py * half}`,
    };
  }

  private resolveEdgeEndpoints(
    edge: Edge | TempEdge,
    isTemporary: boolean
  ): {
    sourcePos: XYPosition;
    targetPos: XYPosition;
    sourcePosition: HandlePosition;
    targetPosition: HandlePosition;
    bezierOpts: { offset: number; sourcePosition: HandlePosition; targetPosition: HandlePosition };
    isSelfLoop: boolean;
  } | null {
    const nodes = this.getLiveNodes();
    let sourcePos: XYPosition;
    let targetPos: XYPosition;
    let isSelfLoop = false;

    if (isTemporary && 'sourceX' in edge && 'sourceY' in edge && 'targetX' in edge && 'targetY' in edge) {
      sourcePos = { x: edge.sourceX, y: edge.sourceY };
      targetPos = { x: edge.targetX, y: edge.targetY };
    } else {
      const sourceNode = getNode(edge.source, nodes);
      const targetNode = getNode(edge.target, nodes);
      if (!sourceNode || !targetNode) {
        return null;
      }
      sourcePos = this.getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
      targetPos = this.getHandleAbsolutePosition(targetNode, edge.targetHandle);
      isSelfLoop = sourceNode.id === targetNode.id;
    }

    let curvatureOffset = 0;
    let sourcePosResolved = sourcePos;
    let targetPosResolved = targetPos;

    if (!isTemporary && 'source' in edge && 'target' in edge && 'id' in edge) {
      const allEdges = this.diagramStateService.edges();
      // Directed parallels: same lateral slot on BOTH ends, no extra curve offset (avoids braiding).
      const parallelEdges = allEdges
        .filter((e) => e.source === edge.source && e.target === edge.target)
        .sort((a, b) => a.id.localeCompare(b.id));
      const edgeIndex = parallelEdges.findIndex((e) => e.id === edge.id);
      const parallelCount = parallelEdges.length;

      const sourceNodeForSpread = getNode(edge.source, this.getLiveNodes());
      const targetNodeForSpread = getNode(edge.target, this.getLiveNodes());
      const sourceHandleSide = normalizeHandle(edge.sourceHandle) ?? 'bottom';
      const targetHandleSide = normalizeHandle(edge.targetHandle) ?? 'top';
      const lockCenterAnchors =
        edge.data?.centerAnchors === true ||
        (sourceHandleSide === 'bottom' && targetHandleSide === 'top');
      if (
        parallelCount > 1 &&
        edgeIndex !== -1 &&
        sourceNodeForSpread &&
        targetNodeForSpread &&
        !lockCenterAnchors
      ) {
        const alongX =
          (normalizeHandle(edge.sourceHandle) ?? 'bottom') === 'top' ||
          (normalizeHandle(edge.sourceHandle) ?? 'bottom') === 'bottom';
        const srcSize = alongX
          ? sourceNodeForSpread.width || this.defaultNodeWidth
          : sourceNodeForSpread.height || this.defaultNodeHeight;
        const tgtSize = alongX
          ? targetNodeForSpread.width || this.defaultNodeWidth
          : targetNodeForSpread.height || this.defaultNodeHeight;
        // Spread across nearly the full node width so parallel strokes stay distinct.
        const usable = Math.max(0, Math.min(srcSize, tgtSize) - 24);
        const gap = parallelCount > 1 ? usable / (parallelCount - 1) : 0;
        const slot = (edgeIndex - (parallelCount - 1) / 2) * gap;
        sourcePosResolved = alongX
          ? { x: sourcePos.x + slot, y: sourcePos.y }
          : { x: sourcePos.x, y: sourcePos.y + slot };
        targetPosResolved = alongX
          ? { x: targetPos.x + slot, y: targetPos.y }
          : { x: targetPos.x, y: targetPos.y + slot };
      }
    }

    const sourcePosition: HandlePosition =
      normalizeHandle('sourceHandle' in edge ? edge.sourceHandle : undefined) ??
      inferHandlePosition(sourcePosResolved, targetPosResolved, 'source');
    const targetPosition: HandlePosition =
      normalizeHandle('targetHandle' in edge ? edge.targetHandle : undefined) ??
      inferHandlePosition(sourcePosResolved, targetPosResolved, 'target');

    return {
      sourcePos: sourcePosResolved,
      targetPos: targetPosResolved,
      sourcePosition,
      targetPosition,
      isSelfLoop,
      bezierOpts: {
        offset: curvatureOffset,
        sourcePosition,
        targetPosition,
      },
    };
  }

  /**
   * Fan multiple edges that share the same node+handle along the border so each
   * stroke/arrow tip stays on its intended state card instead of stacking at center.
   */
  private spreadHandleAlongEdge(
    edge: Edge,
    end: 'source' | 'target',
    base: XYPosition,
    node: WorkflowNode,
    allEdges: Edge[]
  ): XYPosition {
    const handleId = end === 'source' ? edge.sourceHandle : edge.targetHandle;
    const siblings = allEdges.filter((e) => {
      if (end === 'source') {
        return e.source === edge.source && (e.sourceHandle || '') === (handleId || '');
      }
      return e.target === edge.target && (e.targetHandle || '') === (handleId || '');
    });
    if (siblings.length <= 1) {
      return base;
    }
    const index = siblings.findIndex((e) => e.id === edge.id);
    if (index < 0) {
      return base;
    }

    const handle =
      normalizeHandle(handleId) ?? (end === 'source' ? 'bottom' : 'top');
    const alongX = handle === 'top' || handle === 'bottom';
    const size = alongX ? node.width || this.defaultNodeWidth : node.height || this.defaultNodeHeight;
    const usable = Math.max(0, size - 24);
    const gap = siblings.length > 1 ? Math.min(18, usable / Math.max(1, siblings.length - 1)) : 0;
    const offset = (index - (siblings.length - 1) / 2) * gap;

    return alongX ? { x: base.x + offset, y: base.y } : { x: base.x, y: base.y + offset };
  }

  getEdgePath(edge: Edge | TempEdge, isTemporary: boolean = false): string {
    const endpoints = this.resolveEdgeEndpoints(edge, isTemporary);
    if (!endpoints) {
      return 'M 0 0';
    }

    const { sourcePos, targetPos, sourcePosition, targetPosition, bezierOpts, isSelfLoop } =
      endpoints;

    if (isSelfLoop && !isTemporary) {
      return getSelfLoopPath(sourcePos, 'sourceHandle' in edge ? edge.sourceHandle : undefined);
    }

    if ('waypoints' in edge && edge.waypoints && edge.waypoints.length > 0 && !isTemporary) {
      const arrow = this.getEdgeArrowhead(edge);
      if (arrow) {
        return getWaypointPath(sourcePos, arrow.pathEnd, edge.waypoints);
      }
      return getWaypointPath(sourcePos, targetPos, edge.waypoints);
    }

    const arrow = !isTemporary ? this.getEdgeArrowhead(edge) : null;

    // Use smart routing if type is 'smart' or not specified (default).
    // Only edges attached to the dragged node(s) use a bezier fallback — other edges keep their path.
    if ((edge.type === 'smart' || !edge.type) && !isTemporary) {
      if (this.isEdgeAttachedToDrag(edge)) {
        return getBezierPath(sourcePos, targetPos, bezierOpts);
      }

      const cacheKey = `${edge.id}-${sourcePos.x},${sourcePos.y}-${targetPos.x},${targetPos.y}-${sourcePosition}-${targetPosition}`;

      if (this.pathCache.has(cacheKey)) {
        return this.pathCache.get(cacheKey)!;
      }

      try {
        if (!this._pathFinder) {
          this.updatePathFinder(this.getLiveNodes());
        }
        const path = this._pathFinder!.findPath(sourcePos, targetPos);
        const d = getSmartEdgePath(path);
        this.pathCache.set(cacheKey, d);
        return d;
      } catch (e) {
        console.warn('Pathfinding failed, falling back to bezier path', e);
        return getBezierPath(sourcePos, targetPos, bezierOpts);
      }
    }

    switch (edge.type) {
      case 'bezier': {
        if (arrow) {
          // Keep controls aimed at the tip; only the stroke end moves to the triangle base.
          const { c1, c2 } = getBezierControlPoints(sourcePos, targetPos, bezierOpts);
          return `M ${sourcePos.x},${sourcePos.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${arrow.pathEnd.x},${arrow.pathEnd.y}`;
        }
        return getBezierPath(sourcePos, targetPos, bezierOpts);
      }
      case 'step':
        return getStepPath(sourcePos, targetPos, { sourcePosition, targetPosition });
      case 'smoothstep':
        return getSmoothStepPath(sourcePos, targetPos, { sourcePosition, targetPosition });
      case 'straight':
        return getStraightPath(sourcePos, arrow?.pathEnd ?? targetPos);
      case 'dashed':
        return getStraightPath(sourcePos, arrow?.pathEnd ?? targetPos);
      // Custom edge component/template types still need a geometry path for labels/hit-testing
      default:
        return getBezierPath(sourcePos, targetPos, bezierOpts);
    }
  }

  getMarkerUrl(marker: string | undefined | null): string | null {
    if (!marker) return null;
    const id = String(marker).trim();
    if (!id) return null;
    // Support built-in markers or custom marker IDs
    if (id === 'arrow' || id === 'arrowclosed' || id === 'dot') {
      return `url(#ngx-workflow__${id})`;
    }
    // Legacy alias from older sidebar/tests
    if (id === 'arrowhead') {
      return 'url(#ngx-workflow__arrow)';
    }
    return `url(#${id})`;
  }

  /** Prefer per-edge tinted markers so start/end match the edge stroke color. */
  getMarkerUrlForEdge(edge: Edge, position: 'start' | 'end'): string | null {
    if (position === 'end' && this.usesGeometryArrowhead(edge)) {
      return null;
    }
    const marker = position === 'start' ? edge.markerStart : edge.markerEnd;
    if (!marker) return null;
    const id = String(marker).trim();
    if (!id) return null;
    const type =
      id === 'arrowhead' ? 'arrow' : id === 'arrow' || id === 'arrowclosed' || id === 'dot' ? id : null;
    if (type) {
      return `url(#ngx-workflow__${type}-${edge.id})`;
    }
    return `url(#${id})`;
  }

  getEdgeLabelPosition(edge: Edge, position: EdgeLabelPosition = 'center'): XYPosition {
    const endpoints = this.resolveEdgeEndpoints(edge, false);
    if (!endpoints) {
      return { x: 0, y: 0 };
    }

    const { sourcePos, targetPos, bezierOpts } = endpoints;
    const lerp = (t: number): XYPosition => ({
      x: sourcePos.x + (targetPos.x - sourcePos.x) * t,
      y: sourcePos.y + (targetPos.y - sourcePos.y) * t,
    });

    if (position === 'start') return lerp(0.15);
    if (position === 'end') return lerp(0.85);

    if ((edge.type === 'smart' || !edge.type) && !this.isEdgeAttachedToDrag(edge)) {
      try {
        const cacheKey = `${edge.id}-${sourcePos.x},${sourcePos.y}-${targetPos.x},${targetPos.y}-points`;
        let path: XYPosition[];

        if (this.pathPointsCache.has(cacheKey)) {
          path = this.pathPointsCache.get(cacheKey)!;
        } else {
          if (!this._pathFinder) {
            this.updatePathFinder(this.getLiveNodes());
          }
          path = this._pathFinder!.findPath(sourcePos, targetPos);
          this.pathPointsCache.set(cacheKey, path);
        }

        return this.applyLabelDeconflictOffset(edge, getPolylineMidpoint(path), sourcePos, targetPos);
      } catch (e) {
        console.warn('Pathfinding failed for label position', e);
      }
    }

    // Bezier / straight: place chips along each stroke (fractions for parallels).
    const slot = this.getEdgeLabelSlot(edge);
    if ('waypoints' in edge && edge.waypoints && edge.waypoints.length > 0) {
      return this.pointAlongPolyline([sourcePos, ...edge.waypoints, targetPos], slot.t);
    }
    if (edge.type === 'straight' || edge.type === 'dashed') {
      return lerp(slot.t);
    }

    const { c1, c2 } = getBezierControlPoints(sourcePos, targetPos, bezierOpts);
    return getCubicBezierPoint(sourcePos, c1, c2, targetPos, slot.t);
  }

  /** t ∈ [0,1] along a polyline by cumulative length. */
  private pointAlongPolyline(points: XYPosition[], t: number): XYPosition {
    if (points.length === 0) {
      return { x: 0, y: 0 };
    }
    if (points.length === 1) {
      return points[0];
    }
    let total = 0;
    const segLens: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const len = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      segLens.push(len);
      total += len;
    }
    if (total < 1e-6) {
      return points[0];
    }
    let remaining = Math.min(1, Math.max(0, t)) * total;
    for (let i = 0; i < segLens.length; i++) {
      const len = segLens[i];
      if (remaining <= len || i === segLens.length - 1) {
        const u = len < 1e-6 ? 0 : remaining / len;
        return {
          x: points[i].x + (points[i + 1].x - points[i].x) * u,
          y: points[i].y + (points[i + 1].y - points[i].y) * u,
        };
      }
      remaining -= len;
    }
    return points[points.length - 1];
  }

  /**
   * Spread overlapping edge chips: different t along the path + perpendicular nudge
   * within the densest competing group (same pair → same target → same source).
   */
  private getEdgeLabelSlot(edge: Edge): { t: number; perp: number } {
    // Only stagger labels among parallel edges that share the same directed path.
    const allEdges = this.diagramStateService
      .edges()
      .filter((e) => !!this.edgeLabelText(this.resolveEdgeLabel(e, 'center')));
    const group = allEdges
      .filter((e) => e.source === edge.source && e.target === edge.target)
      .sort((a, b) => a.id.localeCompare(b.id));
    const idx = Math.max(0, group.findIndex((e) => e.id === edge.id));
    const n = Math.max(1, group.length);

    // 1 edge → center (1/2). n edges → 2/(n+2), 3/(n+2), …, (n+1)/(n+2)
    // e.g. 2 edges → 2/4 & 3/4; 3 edges → 2/5, 3/5, 4/5.
    if (n === 1) {
      return { t: 0.5, perp: 0 };
    }
    const t = (idx + 2) / (n + 2);
    return { t, perp: 0 };
  }

  private applyLabelDeconflictOffset(
    edge: Edge,
    base: XYPosition,
    sourcePos: XYPosition,
    targetPos: XYPosition
  ): XYPosition {
    const slot = this.getEdgeLabelSlot(edge);
    return this.offsetPerpendicular(base, sourcePos, targetPos, slot.perp);
  }

  private offsetPerpendicular(
    point: XYPosition,
    from: XYPosition,
    to: XYPosition,
    distance: number
  ): XYPosition {
    if (!distance) {
      return point;
    }
    let tx = to.x - from.x;
    let ty = to.y - from.y;
    const len = Math.hypot(tx, ty) || 1;
    tx /= len;
    ty /= len;
    return { x: point.x + -ty * distance, y: point.y + tx * distance };
  }

  resolveEdgeLabel(edge: Edge, position: EdgeLabelPosition): EdgeLabel | string | undefined {
    const fromMap = edge.edgeLabels?.[position];
    if (fromMap !== undefined) return fromMap;
    if (position === 'center') return edge.label;
    return undefined;
  }

  edgeLabelText(label: EdgeLabel | string | undefined): string {
    if (label == null) return '';
    return typeof label === 'string' ? label : (label.text ?? '');
  }

  hasEdgeLabel(edge: Edge, position: EdgeLabelPosition): boolean {
    const label = this.resolveEdgeLabel(edge, position);
    if (label == null) return false;
    if (typeof label === 'string') return label.length > 0;
    return !!(label.text || label.type === 'html-template' || label.data);
  }

  onEdgeClick(event: MouseEvent, edge: Edge): void {
    event.stopPropagation();
    event.preventDefault();

    this.diagramStateService.onEdgeClick(edge);

    const isMultiSelect = event.ctrlKey || event.metaKey || event.shiftKey;

    // Clear node selection when selecting edges
    this.diagramStateService.nodes.update(nodes =>
      nodes.map(n => ({ ...n, selected: false }))
    );

    // Select the clicked edge (keep multi-select when modifier keys are held)
    this.diagramStateService.edges.update(edges =>
      edges.map(e => ({
        ...e,
        selected: e.id === edge.id
          ? true
          : (isMultiSelect ? e.selected : false)
      }))
    );
  }

  onEdgeDoubleClick(event: MouseEvent, edge: Edge): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.showPropertiesSidebar()) {
      this.selectedEdgeForEditing = edge;
    }
    this.selectedNodeForEditing = null; // Close node sidebar if open
    this.cdRef.detectChanges();
  }

  // --- Node Logic ---


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

  fitView(options?: {
    zoom?: number;
    /** `center` (default) frames the full graph; `top-center` pins the first/top node. */
    align?: 'center' | 'top-center';
    /** Top inset in screen px when `align` is `top-center` (default ~8% of height). */
    paddingTop?: number;
  }): void {
    // Prefer live service state — input can lag one tick behind mount
    const nodes = this.diagramStateService.nodes();
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

    const boundsWidth = Math.max(maxX - minX, 1);
    const boundsHeight = Math.max(maxY - minY, 1);

    // Get SVG dimensions
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    if (svgRect.width < 10 || svgRect.height < 10) return;

    // Keep padding inside the viewport — short mobile canvases used to produce negative zoom
    const padding = Math.min(56, Math.min(svgRect.width, svgRect.height) * 0.12);
    const availW = Math.max(svgRect.width - padding * 2, 1);
    const availH = Math.max(svgRect.height - padding * 2, 1);

    const zoomX = availW / boundsWidth;
    const zoomY = availH / boundsHeight;
    const minZ = this.minZoom() || 0.1;
    const maxZ = Math.min(this.maxZoom() || 4, 1.35);
    const fittedZoom = Math.min(Math.max(Math.min(zoomX, zoomY), minZ), maxZ);
    const zoom =
      options?.zoom != null
        ? Math.min(Math.max(options.zoom, minZ), this.maxZoom() || 4)
        : fittedZoom;

    if (options?.align === 'top-center') {
      // Topmost node (leftmost on ties) — treat as the graph "first" / root after layout.
      const layerTol = 24;
      let first = nodes[0];
      for (const node of nodes) {
        const dy = node.position.y - first.position.y;
        if (dy < -layerTol || (Math.abs(dy) <= layerTol && node.position.x < first.position.x)) {
          first = node;
        }
      }
      const firstW = first.width || this.defaultNodeWidth;
      const anchorX = first.position.x + firstW / 2;
      const anchorY = first.position.y;
      const topPad =
        options.paddingTop ?? Math.min(56, Math.max(24, svgRect.height * 0.08));
      const x = svgRect.width / 2 - anchorX * zoom;
      const y = topPad - anchorY * zoom;
      this.diagramStateService.setViewport({ x, y, zoom });
      return;
    }

    // Calculate center position
    const x = (svgRect.width - boundsWidth * zoom) / 2 - minX * zoom;
    const y = (svgRect.height - boundsHeight * zoom) / 2 - minY * zoom;

    this.diagramStateService.setViewport({ x, y, zoom });
  }

  toggleFullscreen(): void {
    const nativeEl = this.el?.nativeElement;
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      if (nativeEl?.requestFullscreen) {
        nativeEl.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }

  onZoomControlsZoomIn(): void {
    this.onZoomChange(this.viewport().zoom + 0.1);
  }

  onZoomControlsZoomOut(): void {
    this.onZoomChange(this.viewport().zoom - 0.1);
  }

  onZoomControlsResetZoom(): void {
    this.onZoomChange(1);
  }

  onZoomControlsFullscreen(): void {
    this.toggleFullscreen();
    this.fullscreen.emit();
  }

  private scheduleInitialFitView(): void {
    if (typeof requestAnimationFrame === 'undefined') {
      return;
    }
    let attempts = 0;
    const tryFit = () => {
      attempts += 1;
      const rect = this.svgRef?.nativeElement?.getBoundingClientRect();
      const hasNodes = this.diagramStateService.nodes().length > 0;
      if (hasNodes && rect && rect.width > 40 && rect.height > 40) {
        this.hasInitialFitted = true;
        this.fitView();
        this.cdRef.markForCheck();
        return;
      }
      if (attempts < 90) {
        requestAnimationFrame(tryFit);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(tryFit));
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


  // Layout controls


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
          this.showImportNotification('Diagram imported successfully.');
        } else {
          const message = 'Invalid diagram JSON format. Expected nodes, edges, and viewport.';
          console.error(message);
          this.emitImportError(message);
        }
      } catch (error) {
        const message = 'Failed to parse diagram JSON file.';
        console.error(message, error);
        this.emitImportError(message, error);
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

  private emitImportError(message: string, error?: unknown): void {
    this.importError.emit({ message, error });
    this.showImportNotification(message);
  }

  private showImportNotification(message: string): void {
    this.importNotification.set(message);
    if (this.importNotificationTimer) {
      clearTimeout(this.importNotificationTimer);
    }
    this.importNotificationTimer = setTimeout(() => {
      this.importNotification.set(null);
      this.importNotificationTimer = null;
      this.cdRef.markForCheck();
    }, 4000);
    this.cdRef.markForCheck();
  }

  dismissImportNotification(): void {
    this.importNotification.set(null);
    if (this.importNotificationTimer) {
      clearTimeout(this.importNotificationTimer);
      this.importNotificationTimer = null;
    }
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

    const sourcePos = this.getHandleAbsolutePosition(sourceNode, edge.sourceHandle);
    const targetPos = this.getHandleAbsolutePosition(targetNode, edge.targetHandle);

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

  // --- Accessibility: ARIA Label Generators ---

  /**
   * Generate descriptive ARIA label for a node.
   */
  getNodeAriaLabel(node: WorkflowNode): string {
    const label = node.label || node.data?.label || node.type || 'Unnamed';
    const type = node.type ? ` (${node.type})` : '';
    const selected = node.selected ? ', selected' : '';
    return `Node: ${label}${type}${selected}`;
  }

  /**
   * Generate descriptive ARIA label for an edge.
   */
  getEdgeAriaLabel(edge: Edge): string {
    const nodes = this.nodes();
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    const sourceLabel = sourceNode?.label || sourceNode?.id || edge.source;
    const targetLabel = targetNode?.label || targetNode?.id || edge.target;
    const edgeLabel = edge.label ? ` labeled ${edge.label}` : '';
    return `Edge from ${sourceLabel} to ${targetLabel}${edgeLabel}`;
  }

  /**
   * Handle node receiving keyboard focus.
   */
  onNodeFocus(node: WorkflowNode): void {
    this.focusedNodeId.set(node.id);
  }

  /**
   * Handle node losing keyboard focus.
   */
  onNodeBlur(node: WorkflowNode): void {
    if (this.focusedNodeId() === node.id) {
      this.focusedNodeId.set(null);
    }
  }

  /**
   * Handle keyboard events on a focused node.
   * Enter/Space → toggle selection. Shift+Arrows → nudge. Escape → deselect.
   */
  onNodeKeyDown(event: KeyboardEvent, node: WorkflowNode): void {
    const gridStep = this.snapToGrid() ? this.gridSize() : 10;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        event.stopPropagation();
        this.diagramStateService.nodes.update(nodes =>
          nodes.map(n => n.id === node.id ? { ...n, selected: !n.selected } : n)
        );
        break;

      case 'Escape':
        event.preventDefault();
        this.diagramStateService.clearSelection();
        (event.target as HTMLElement).blur();
        break;

      case 'ArrowUp':
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.nudgeSelectedNodes(0, -gridStep);
        } else if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.focusConnectedNode(node, 'incoming');
        }
        break;

      case 'ArrowDown':
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.nudgeSelectedNodes(0, gridStep);
        } else if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.focusConnectedNode(node, 'outgoing');
        }
        break;

      case 'ArrowLeft':
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.nudgeSelectedNodes(-gridStep, 0);
        } else if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.focusConnectedNode(node, 'incoming');
        }
        break;

      case 'ArrowRight':
        if (event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          this.nudgeSelectedNodes(gridStep, 0);
        } else if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.focusConnectedNode(node, 'outgoing');
        }
        break;
    }
  }

  /**
   * Nudge all selected nodes by (dx, dy) pixels.
   */
  private nudgeSelectedNodes(dx: number, dy: number): void {
    this.diagramStateService.nodes.update(nodes =>
      nodes.map(n => {
        if (!n.selected) return n;
        return {
          ...n,
          position: {
            x: n.position.x + dx,
            y: n.position.y + dy
          }
        };
      })
    );
  }

  /**
   * Move keyboard focus to a connected node via edges.
   */
  private focusConnectedNode(node: WorkflowNode, direction: 'outgoing' | 'incoming'): void {
    const edges = this.diagramStateService.edges();
    let targetId: string | undefined;

    if (direction === 'outgoing') {
      const outEdge = edges.find(e => e.source === node.id);
      targetId = outEdge?.target;
    } else {
      const inEdge = edges.find(e => e.target === node.id);
      targetId = inEdge?.source;
    }

    if (targetId) {
      const svgEl = this.svgRef.nativeElement;
      const targetEl = svgEl.querySelector(`[data-id="${targetId}"]`) as HTMLElement;
      if (targetEl) {
        targetEl.focus();
      }
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
        // Ctrl+C: Copy
        event.preventDefault();
        this.diagramStateService.copy();
      } else if (event.key === 'v') {
        // Ctrl+V: Paste
        event.preventDefault();
        this.diagramStateService.paste();
      } else if (event.key === 'x') {
        // Ctrl+X: Cut
        event.preventDefault();
        this.diagramStateService.cut();
      } else if (event.key === 'd') {
        // Ctrl+D: Duplicate
        event.preventDefault();
        this.diagramStateService.duplicate();
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
    if (!this.autoPanOnNodeDrag() && !this.isDraggingNode) return;
    if (!this.autoPanOnConnect() && !this.isConnecting) return;

    const container = this.svgRef.nativeElement.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const threshold = this.autoPanEdgeThreshold();

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
      x: currentViewport.x + (this.autoPanDirection.x * this.autoPanSpeed()),
      y: currentViewport.y + (this.autoPanDirection.y * this.autoPanSpeed())
    };

    this.diagramStateService.setViewport(newViewport);

    // Continue animation
    this.autoPanInterval = window.requestAnimationFrame(() => this.autoPan());
  }

  // --- Box Selection Logic ---

  private updateBoxSelection(event: PointerEvent): void {
    const svgRect = this.svgRef.nativeElement.getBoundingClientRect();
    const viewport = this.viewport();

    const canvasX = (event.clientX - svgRect.left - viewport.x) / viewport.zoom;
    const canvasY = (event.clientY - svgRect.top - viewport.y) / viewport.zoom;

    const active = this.selectionBoxService.moveTo(canvasX, canvasY);
    if (active) {
      // Live-update selection (replace mode, not toggle)
      this.selectNodesInBox();
      this.cdRef.markForCheck();
    }
  }

  private selectNodesInBox(): void {
    const box = this.selectionBoxService.getSelectionBox();
    if (box.width <= 0 && box.height <= 0) return;

    const nodes = this.nodes();
    const nodeIds = nodes.filter((node) => this.isNodeInSelectionBox(node, box)).map((n) => n.id);
    this.diagramStateService.selectNodes(nodeIds, false);
  }

  getSelectionBox(): { x: number; y: number; width: number; height: number } {
    return this.selectionBoxService.getSelectionBox();
  }

  private stopBoxSelection(event?: PointerEvent): void {
    this.selectionBoxService.end(event?.pointerId);
    this.cdRef.markForCheck();
  }

  private isNodeInSelectionBox(node: WorkflowNode, box: { x: number; y: number; width: number; height: number }): boolean {
    const nodeX = node.position.x;
    const nodeY = node.position.y;
    const nodeWidth = node.width || this.defaultNodeWidth;
    const nodeHeight = node.height || this.defaultNodeHeight;

    // Check if node rectangle intersects with selection box
    return !(
      nodeX + nodeWidth < box.x ||
      nodeX > box.x + box.width ||
      nodeY + nodeHeight < box.y ||
      nodeY > box.y + box.height
    );
  }

  // --- Auto-Save & Version History Public Methods ---

  /**
   * Manually save current state as a version
   * @param description Optional description for the version
   */
  saveVersion(description?: string): void {
    const state = this.getDiagramState();
    this.autoSaveService.saveVersion(state, description);
  }

  /**
   * Restore a specific version by ID
   * @param versionId The ID of the version to restore
   */
  restoreVersion(versionId: string): void {
    const state = this.autoSaveService.restoreVersion(versionId);
    if (state) {
      this.setDiagramState(state);
    }
  }

  /**
   * Get all saved versions
   */
  getVersionHistory() {
    return this.autoSaveService.getHistory();
  }

  /**
   * Clear all version history
   */
  clearVersionHistory(): void {
    this.autoSaveService.clearHistory();
  }

  // Helper method for handle position
  getHandleAbsolutePosition(node: WorkflowNode, handleId: string | undefined): XYPosition {
    // Prefer computed absolute render position (keeps edges in sync while dragging)
    const absPos = node._renderPosition
      ?? this.diagramStateService.getAbsolutePosition(node, this.getLiveNodes());

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

    // Apply rotation if present
    if (node.data && typeof node.data.rotation === 'number') {
      const rotation = node.data.rotation;
      const cx = nodeWidth / 2;
      const cy = nodeHeight / 2;

      // Translate to center
      const dx = offsetX - cx;
      const dy = offsetY - cy;

      // Rotate
      const rad = rotation * (Math.PI / 180);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const rotatedDx = dx * cos - dy * sin;
      const rotatedDy = dx * sin + dy * cos;

      return {
        x: absPos.x + cx + rotatedDx,
        y: absPos.y + cy + rotatedDy
      };
    }

    return {
      x: absPos.x + offsetX,
      y: absPos.y + offsetY
    };
  }

  // --- Utility Methods ---

  /**
   * Handle search results - update node highlighting
   */
  onSearchResults(results: WorkflowNode[]): void {
    const resultIds = new Set(results.map(n => n.id));
    const currentNodes = this.nodes();

    const updatedNodes = currentNodes.map(node => ({
      ...node,
      searchHighlight: resultIds.has(node.id) ? ('match' as const) : undefined
    }));

    this.diagramStateService.nodes.set(updatedNodes);
  }

  /**
   * Handle search result selection - pan/zoom to the selected node
   */
  onSearchResultSelected(node: WorkflowNode): void {
    if (!node) return;

    // Center the viewport on the selected node
    const nodeX = node.position.x + (node.width || this.defaultNodeWidth) / 2;
    const nodeY = node.position.y + (node.height || this.defaultNodeHeight) / 2;

    this.diagramStateService.setCenter(nodeX, nodeY);

    // Optionally highlight the node briefly
    // You could add a temporary highlight effect here
  }

  /**
   * Handle search close
   */
  onSearchClose(): void {
    // Clear search highlighting
    const currentNodes = this.nodes();
    const updatedNodes = currentNodes.map(n => ({
      ...n,
      searchHighlight: undefined
    }));
    this.diagramStateService.nodes.set(updatedNodes);
  }

  async onApplyLayout(algorithm: 'auto' | 'force' | 'hierarchical' | 'circular') {
    const nodes = this.getLiveNodes();
    const edges = this.diagramStateService.edges();
    let layoutedNodes: WorkflowNode[] = [];

    // Show loading state?

    try {
      if (algorithm === 'auto' || algorithm === 'hierarchical') {
        layoutedNodes = await this.layoutService.applyElkLayout(nodes, edges, { direction: 'DOWN' });
      } else if (algorithm === 'force') {
        layoutedNodes = this.layoutService.calculateForceDirected(nodes, edges);
      } else if (algorithm === 'circular') {
        layoutedNodes = this.layoutService.calculateCircular(nodes, edges);
      }

      if (layoutedNodes && layoutedNodes.length > 0) {
        this.diagramStateService.nodes.set(layoutedNodes);

        // Wait for render then fit view
        setTimeout(() => {
          this.diagramStateService.fitView();
        }, 100);
      }
    } catch (e) {
      console.error('Layout failed', e);
    }
  }

  onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes('application/ngx-workflow-node')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent): void {
    const rawData = event.dataTransfer?.getData('application/ngx-workflow-node');
    if (!rawData) return;
    event.preventDefault();

    try {
      const nodeData = JSON.parse(rawData);
      const containerRect = this.el?.nativeElement?.getBoundingClientRect() || { left: 0, top: 0 };
      const viewport = this.diagramStateService.viewport();

      const clientX = event.clientX;
      const clientY = event.clientY;

      const canvasX = (clientX - containerRect.left - viewport.x) / viewport.zoom;
      const canvasY = (clientY - containerRect.top - viewport.y) / viewport.zoom;

      const newNode: WorkflowNode = {
        id: uuidv4(),
        position: { x: Math.round(canvasX), y: Math.round(canvasY) },
        label: nodeData.label || 'New Node',
        type: nodeData.type || 'default',
        width: nodeData.width || 170,
        height: nodeData.height || 60,
        data: nodeData.data || {},
        ...(nodeData.nodeOverrides || {}),
      };

      this.diagramStateService.nodes.update((nodes) => [...nodes, newNode]);
      this.diagramStateService.undoRedoService.saveState(this.diagramStateService.getDiagramState());
    } catch (e) {
      console.error('Failed to parse dropped node data:', e);
    }
  }
}
