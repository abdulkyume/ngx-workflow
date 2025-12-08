import {
  Injectable,
  signal,
  EventEmitter,
  computed,
  WritableSignal,
  ElementRef,
  effect,
} from '@angular/core';
import { Node, Edge, Viewport, XYPosition, DiagramState, AlignmentGuide, ZoomOptions, ZoomToOptions, FitViewOptions, SetCenterOptions, FitBoundsOptions, Bounds } from '../models';
import { Observable, Subject, animationFrameScheduler } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { UndoRedoService } from './undo-redo.service';
import { AutoLayoutService } from './auto-layout.service';
import { LayoutService } from './layout.service';

export interface Connection {
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

// Interface for temporary edges (preview edges)
interface TempEdge extends Edge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

// Interface for box selection
export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable({
  providedIn: 'root',
})
export class DiagramStateService {
  readonly nodes: WritableSignal<Node[]> = signal<Node[]>([]);
  readonly edges: WritableSignal<Edge[]> = signal<Edge[]>([]);
  readonly tempEdges: WritableSignal<TempEdge[]> = signal<TempEdge[]>([]);
  readonly viewport: WritableSignal<Viewport> = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
  readonly alignmentGuides = signal<AlignmentGuide[]>([]);
  readonly searchQuery = signal<string>('');
  readonly filterType = signal<string | null>(null);
  readonly containerDimensions = signal<{ width: number; height: number }>({ width: 0, height: 0 });
  readonly selectionBox = signal<SelectionBox | null>(null);

  // Computed signals
  readonly selectedNodes = computed(() => this.nodes().filter((n) => n.selected));
  readonly selectedEdges = computed(() => this.edges().filter((e) => e.selected));

  readonly viewNodes = computed(() => {
    const nodes = this.nodes();
    const query = this.searchQuery().toLowerCase();
    const type = this.filterType();

    return nodes.map(node => {
      const matchesSearch = !query ||
        (node.label && node.label.toLowerCase().includes(query)) ||
        (node.data && JSON.stringify(node.data).toLowerCase().includes(query));

      const matchesType = !type || node.type === type;

      const isMatch = matchesSearch && matchesType;

      // If there is a search/filter active, highlight matches and dim non-matches
      // If no search/filter, reset (no highlight, no dim)
      const isActive = !!query || !!type;

      return {
        ...node,
        highlighted: isActive && isMatch,
        dimmed: isActive && !isMatch
      };
    }).sort((a, b) => {
      // Render groups first so they are behind other nodes
      if (a.type === 'group' && b.type !== 'group') return -1;
      if (a.type !== 'group' && b.type === 'group') return 1;
      return 0;
    });
  });

  readonly visibleNodes = computed(() => {
    const nodes = this.viewNodes();
    const viewport = this.viewport();
    const dimensions = this.containerDimensions();
    const buffer = 500; // Buffer in pixels

    if (dimensions.width === 0 || dimensions.height === 0) {
      return nodes; // Render all if dimensions not set
    }

    const minX = -viewport.x / viewport.zoom - buffer;
    const maxX = (-viewport.x + dimensions.width) / viewport.zoom + buffer;
    const minY = -viewport.y / viewport.zoom - buffer;
    const maxY = (-viewport.y + dimensions.height) / viewport.zoom + buffer;

    return nodes.filter(node => {
      const nodeX = node.position.x;
      const nodeY = node.position.y;
      const nodeWidth = node.width || 150; // Default width
      const nodeHeight = node.height || 60; // Default height

      return (
        nodeX + nodeWidth >= minX &&
        nodeX <= maxX &&
        nodeY + nodeHeight >= minY &&
        nodeY <= maxY
      );
    });
  });

  readonly visibleEdges = computed(() => {
    const edges = this.edges();
    const visibleNodes = this.visibleNodes();
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

    return edges.filter(edge => {
      return visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target);
    });
  });

  readonly lodLevel = computed(() => {
    const zoom = this.viewport().zoom;
    if (zoom < 0.4) return 'low';
    if (zoom < 0.8) return 'medium';
    return 'high';
  });

  // Reference to the main SVG element, set by DiagramComponent
  el: ElementRef<HTMLElement | SVGSVGElement> | undefined;

  readonly dragEnd = new EventEmitter<Node>();
  readonly nodesChange = new EventEmitter<Node[]>();
  readonly edgesChange = new EventEmitter<Edge[]>();
  readonly viewportChange = new EventEmitter<Viewport>();
  readonly nodeClick = new EventEmitter<Node>();
  readonly edgeClick = new EventEmitter<Edge>();
  readonly connect = new EventEmitter<Connection>();
  readonly dragStart = new EventEmitter<Node>();

  // Internal subjects for batched updates
  private nodeUpdates$ = new Subject<Node[]>();
  private edgeUpdates$ = new Subject<Edge[]>();
  private viewportUpdates$ = new Subject<Viewport>();

  constructor(
    public undoRedoService: UndoRedoService,
    private autoLayoutService: AutoLayoutService,
    private layoutService: LayoutService
  ) {
    // Sync internal subjects to signals (for batched updates)
    this.nodeUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((nodes) => {
        this.nodes.set(nodes);
      });

    this.edgeUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((edges) => {
        this.edges.set(edges);
      });

    this.viewportUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((viewport) => {
        this.viewport.set(viewport);
      });

    // Emit changes whenever signals update
    effect(() => {
      this.nodesChange.emit(this.nodes());
    });

    effect(() => {
      this.edgesChange.emit(this.edges());
    });

    effect(() => {
      this.viewportChange.emit(this.viewport());
    });
  }

  // Helper to get current state for undo/redo
  private getCurrentState(): DiagramState {
    return {
      nodes: [...this.nodes()],
      edges: [...this.edges()],
      viewport: { ...this.viewport() },
    };
  }
  // Public method to retrieve the current diagram state (for export)
  getDiagramState(): DiagramState {
    return this.getCurrentState();
  }

  /**
   * Get a single node by ID.
   * @param id - The node ID to find
   * @returns The node if found, undefined otherwise
   */
  getNode(id: string): Node | undefined {
    return this.nodes().find(n => n.id === id);
  }

  /**
   * Computed signal for selected node IDs (for convenience).
   */
  readonly selectedNodeIds = computed(() => this.selectedNodes().map(n => n.id));

  /**
   * Replace the entire diagram state (nodes, edges, viewport) with the given state.
   * Used for importing diagram JSON.
   */
  setDiagramState(state: DiagramState): void {
    // Save current state for undo
    this.undoRedoService.saveState(this.getCurrentState());
    // Replace signals
    this.nodes.set(state.nodes.map(n => ({ ...n, selected: false, dragging: false, draggable: true })));
    this.edges.set(state.edges.map(e => ({ ...e, selected: false })));
    this.viewport.set(state.viewport);
    // Emit changes
    this.nodesChange.emit(this.nodes());
    this.edgesChange.emit(this.edges());
    this.viewportChange.emit(this.viewport());
  }
  // Apply state from undo/redo service
  private applyState(state: DiagramState): void {
    this.nodes.set(state.nodes);
    this.edges.set(state.edges);
    this.viewport.set(state.viewport);
  }

  undo(): void {
    const currentState = this.getCurrentState();
    const previousState = this.undoRedoService.undo(currentState);
    if (previousState) {
      this.applyState(previousState);
    }
  }

  redo(): void {
    const currentState = this.getCurrentState();
    const nextState = this.undoRedoService.redo(currentState);
    if (nextState) {
      this.applyState(nextState);
    }
  }

  // Public method to save current state for undo (used by components)
  saveStateForUndo(): void {
    this.undoRedoService.saveState(this.getCurrentState());
  }

  onResizeStart(node: Node): void {
    this.undoRedoService.saveState(this.getCurrentState());
  }

  onResizeEnd(node: Node): void {
    // Optional: emit resize end event if needed in the future
  }

  // --- Edge Management ---

  addEdge(edge: Edge): void {
    console.log('DiagramStateService.addEdge: start', edge);
    this.undoRedoService.saveState(this.getCurrentState());
    this.edges.update((currentEdges) => [...currentEdges, { ...edge, selected: false }]);
    this.connect.emit({
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    });
    console.log('DiagramStateService.addEdge: end');
  }

  updateEdge(id: string, changes: Partial<Edge>): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.edges.update((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id === id) {
          return { ...edge, ...changes };
        }
        return edge;
      })
    );
  }

  removeEdge(id: string): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.edges.update((currentEdges) => currentEdges.filter((edge) => edge.id !== id));
    this.tempEdges.update((currentTempEdges) => currentTempEdges.filter((edge) => edge.id !== id)); // Remove from tempEdges as well
  }

  // --- Temporary Edge (Preview Edge) Management ---

  addTempEdge(edge: TempEdge): void {
    this.tempEdges.update((currentTempEdges) => [...currentTempEdges, edge]);
  }

  updateTempEdgeTarget(id: string, targetPosition: XYPosition): void {
    this.tempEdges.update((currentTempEdges) =>
      currentTempEdges.map((edge) =>
        edge.id === id ? { ...edge, targetX: targetPosition.x, targetY: targetPosition.y } : edge
      )
    );
  }

  // --- Viewport Management ---

  setViewport(viewport: Partial<Viewport>): void {
    this.viewport.update((currentViewport) => ({ ...currentViewport, ...viewport }));
  }

  setContainerDimensions(dimensions: { width: number; height: number }): void {
    console.log('DiagramStateService.setContainerDimensions', dimensions);
    this.containerDimensions.set(dimensions);
  }

  focusNode(nodeId: string): void {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return;

    const container = this.containerDimensions();
    // Default to some reasonable size if container dimensions are missing (e.g. testing)
    const width = container.width || 800;
    const height = container.height || 600;

    // Target zoom level
    const targetZoom = 1.2;

    // Center of the node
    const nodeCenterX = node.position.x + (node.width || 170) / 2;
    const nodeCenterY = node.position.y + (node.height || 60) / 2;

    // Center of the container
    const containerCenterX = width / 2;
    const containerCenterY = height / 2;

    // Calculate viewport x, y
    // viewport.x + nodeCenterX * zoom = containerCenterX
    // viewport.x = containerCenterX - nodeCenterX * zoom
    const newX = containerCenterX - nodeCenterX * targetZoom;
    const newY = containerCenterY - nodeCenterY * targetZoom;

    this.setViewport({ x: newX, y: newY, zoom: targetZoom });
    this.selectNodes([nodeId]);
  }

  // --- Viewport Helper Methods ---

  /**
   * Zoom in by a fixed step.
   * @param options - Optional zoom options (step, duration)
   */
  zoomIn(options?: ZoomOptions): void {
    const step = options?.step ?? 0.1;
    const currentZoom = this.viewport().zoom;
    const newZoom = Math.min(10, currentZoom + step);
    this.setViewport({ zoom: newZoom });
  }

  /**
   * Zoom out by a fixed step.
   * @param options - Optional zoom options (step, duration)
   */
  zoomOut(options?: ZoomOptions): void {
    const step = options?.step ?? 0.1;
    const currentZoom = this.viewport().zoom;
    const newZoom = Math.max(0.1, currentZoom - step);
    this.setViewport({ zoom: newZoom });
  }

  /**
   * Zoom to a specific level.
   * @param zoomLevel - Target zoom level (0.1 - 10)
   * @param options - Optional zoom options (center point, duration)
   */
  zoomTo(zoomLevel: number, options?: ZoomToOptions): void {
    const clampedZoom = Math.max(0.1, Math.min(10, zoomLevel));

    if (options?.center) {
      // Zoom to specific point, keeping that point in the same screen position
      const viewport = this.viewport();
      const container = this.containerDimensions();

      const pointX = options.center.x;
      const pointY = options.center.y;

      // Calculate new viewport position to keep center point in place
      const newX = container.width / 2 - pointX * clampedZoom;
      const newY = container.height / 2 - pointY * clampedZoom;

      this.setViewport({ x: newX, y: newY, zoom: clampedZoom });
    } else {
      this.setViewport({ zoom: clampedZoom });
    }
  }

  /**
   * Get current zoom level.
   * @returns Current zoom level
   */
  getZoom(): number {
    return this.viewport().zoom;
  }

  /**
   * Get current viewport state.
   * @returns Copy of current viewport
   */
  getViewport(): Viewport {
    return { ...this.viewport() };
  }

  /**
   * Fit all nodes (or specific nodes) to the viewport.
   * @param options - Optional fit view options
   */
  fitView(options?: FitViewOptions): void {
    const padding = options?.padding ?? 50;
    const minZoom = options?.minZoom ?? 0.1;
    const maxZoom = options?.maxZoom ?? 2;
    const includeHiddenNodes = options?.includeHiddenNodes ?? false;

    let nodesToFit = this.nodes();

    // Filter by specific nodes if provided
    if (options?.nodes && options.nodes.length > 0) {
      nodesToFit = nodesToFit.filter(n => options.nodes!.includes(n.id));
    }

    // Filter hidden nodes
    if (!includeHiddenNodes) {
      nodesToFit = nodesToFit.filter(n => !n.dimmed);
    }

    if (nodesToFit.length === 0) {
      console.warn('fitView: No nodes to fit');
      return;
    }

    // Calculate bounding box
    const bounds = this.getNodesBounds(nodesToFit);

    // Fit to bounds
    this.fitBounds(bounds, { padding, minZoom, maxZoom });
  }

  /**
   * Center viewport on specific coordinates.
   * @param x - Flow X coordinate
   * @param y - Flow Y coordinate
   * @param options - Optional center options (zoom level)
   */
  setCenter(x: number, y: number, options?: SetCenterOptions): void {
    const container = this.containerDimensions();
    const zoom = options?.zoom ?? this.viewport().zoom;

    const newX = container.width / 2 - x * zoom;
    const newY = container.height / 2 - y * zoom;

    this.setViewport({ x: newX, y: newY, zoom });
  }

  /**
   * Fit viewport to specific bounds.
   * @param bounds - Bounding box to fit
   * @param options - Optional fit bounds options
   */
  fitBounds(bounds: Bounds, options?: FitBoundsOptions): void {
    const padding = options?.padding ?? 50;
    const minZoom = options?.minZoom ?? 0.1;
    const maxZoom = options?.maxZoom ?? 2;

    const container = this.containerDimensions();

    if (container.width === 0 || container.height === 0) {
      console.warn('fitBounds: Container dimensions not available');
      return;
    }

    // Calculate zoom to fit bounds
    const availableWidth = container.width - padding * 2;
    const availableHeight = container.height - padding * 2;

    const zoomX = availableWidth / bounds.width;
    const zoomY = availableHeight / bounds.height;

    // Use the smaller zoom to ensure everything fits
    let zoom = Math.min(zoomX, zoomY);

    // Clamp zoom to limits
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

    // Calculate center of bounds
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Calculate viewport position to center the bounds
    const x = container.width / 2 - centerX * zoom;
    const y = container.height / 2 - centerY * zoom;

    this.setViewport({ x, y, zoom });
  }

  /**
   * Convert screen coordinates to flow coordinates.
   * @param screenPosition - Screen/client coordinates
   * @returns Flow coordinates
   */
  screenToFlowPosition(screenPosition: XYPosition): XYPosition {
    const viewport = this.viewport();
    const svgEl = this.el?.nativeElement;

    if (!svgEl) {
      console.warn('screenToFlowPosition: SVG element not available');
      return { x: 0, y: 0 };
    }

    const svgRect = svgEl.getBoundingClientRect();

    return {
      x: (screenPosition.x - svgRect.left - viewport.x) / viewport.zoom,
      y: (screenPosition.y - svgRect.top - viewport.y) / viewport.zoom
    };
  }

  /**
   * Convert flow coordinates to screen coordinates.
   * @param flowPosition - Flow coordinates
   * @returns Screen/client coordinates
   */
  flowToScreenPosition(flowPosition: XYPosition): XYPosition {
    const viewport = this.viewport();
    const svgEl = this.el?.nativeElement;

    if (!svgEl) {
      console.warn('flowToScreenPosition: SVG element not available');
      return { x: 0, y: 0 };
    }

    const svgRect = svgEl.getBoundingClientRect();

    return {
      x: svgRect.left + flowPosition.x * viewport.zoom + viewport.x,
      y: svgRect.top + flowPosition.y * viewport.zoom + viewport.y
    };
  }

  /**
   * Alias for screenToFlowPosition.
   * Convert screen coordinates to flow coordinates.
   * @param position - Screen/client coordinates
   * @returns Flow coordinates
   */
  project(position: XYPosition): XYPosition {
    return this.screenToFlowPosition(position);
  }

  /**
   * Get bounding box of nodes.
   * @param nodes - Nodes to calculate bounds for
   * @returns Bounding box
   */
  private getNodesBounds(nodes: Node[]): Bounds {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 170;
      const height = node.height || 60;

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // --- Selection Management ---

  selectNodes(nodeIds: string[], multi: boolean = false): void {
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: multi
          ? nodeIds.includes(node.id)
            ? !node.selected
            : node.selected
          : nodeIds.includes(node.id),
      }))
    );
  }

  clearSelection(): void {
    this.nodes.update((currentNodes) => currentNodes.map((node) => ({ ...node, selected: false })));
    this.edges.update((currentEdges) => currentEdges.map((edge) => ({ ...edge, selected: false })));
  }

  multiSelect(nodeId: string): void {
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: node.id === nodeId ? !node.selected : node.selected,
      }))
    );
  }

  deleteSelectedElements(): void {
    this.undoRedoService.saveState(this.getCurrentState());
    const nodesToDelete = this.selectedNodes().map((node) => node.id);
    const edgesToDelete = this.selectedEdges().map((edge) => edge.id);

    // Remove nodes and associated edges
    this.nodes.update((currentNodes) =>
      currentNodes.filter((node) => !nodesToDelete.includes(node.id))
    );
    this.edges.update((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          !edgesToDelete.includes(edge.id) &&
          !nodesToDelete.includes(edge.source) &&
          !nodesToDelete.includes(edge.target)
      )
    );

    // Clear selection after deletion
    this.clearSelection();
    console.log('Selected elements deleted. Nodes:', nodesToDelete, 'Edges:', edgesToDelete);
  }

  // --- Internal batching methods for components to use ---
  batchUpdateNodes(updatedNodes: Node[]): void {
    this.nodeUpdates$.next(updatedNodes);
  }

  batchUpdateEdges(updatedEdges: Edge[]): void {
    this.edgeUpdates$.next(updatedEdges);
  }

  batchUpdateViewport(updatedViewport: Viewport): void {
    this.viewportUpdates$.next(updatedViewport);
  }

  // --- Event Emitters triggered by components ---
  onNodeClick(node: Node): void {
    this.nodeClick.emit(node);
  }

  onEdgeClick(edge: Edge): void {
    this.edgeClick.emit(edge);
  }



  onDragStart(node: Node): void {
    this.undoRedoService.saveState(this.getCurrentState()); // Save state before drag starts
    this.dragStart.emit(node);
    this.updateNode(node.id, { dragging: true });
  }

  onDragEnd(node: Node): void {
    this.dragEnd.emit(node);
    this.updateNode(node.id, { dragging: false });
    this.alignmentGuides.set([]); // Clear alignment guides
    // State is already saved at dragStart, so no need to save again here unless
    // a single drag operation is considered a single undoable action.
    // If multiple small state changes during drag need to be undone as one,
    // then the saveState logic here would be different (e.g., debounced save).
  }
  // --- Clipboard Operations ---

  private get clipboard(): { nodes: Node[]; edges: Edge[] } {
    try {
      const data = localStorage.getItem('ngx-workflow-clipboard');
      return data ? JSON.parse(data) : { nodes: [], edges: [] };
    } catch (e) {
      console.warn('Failed to read from clipboard', e);
      return { nodes: [], edges: [] };
    }
  }

  private set clipboard(data: { nodes: Node[]; edges: Edge[] }) {
    try {
      localStorage.setItem('ngx-workflow-clipboard', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write to clipboard', e);
    }
  }

  copy(): void {
    const selectedNodes = this.selectedNodes();
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));

    // Find edges that are connected ONLY to selected nodes
    const internalEdges = this.edges().filter(
      (edge) => selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );

    // Deep copy to avoid reference issues
    this.clipboard = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(internalEdges)),
    };
    console.log('Copied to clipboard');
  }

  paste(): void {
    const clipboardData = this.clipboard;
    if (clipboardData.nodes.length === 0) return;

    this.undoRedoService.saveState(this.getCurrentState());

    const idMap = new Map<string, string>();
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create new nodes with new IDs and offset position
    // Calculate center of pasted nodes to position them relative to viewport center or mouse?
    // For now, just offset by 20px from original position (simple)
    clipboardData.nodes.forEach((node) => {
      const newId = uuidv4();
      idMap.set(node.id, newId);
      newNodes.push({
        ...node,
        id: newId,
        position: { x: node.position.x + 20, y: node.position.y + 20 },
        selected: true, // Select pasted nodes
      });
    });

    // Create new edges with updated source/target IDs
    clipboardData.edges.forEach((edge) => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);
      if (newSource && newTarget) {
        newEdges.push({
          ...edge,
          id: uuidv4(),
          source: newSource,
          target: newTarget,
          selected: true, // Select pasted edges
        });
      }
    });

    // Deselect existing elements
    this.clearSelection();

    // Add new elements
    this.nodes.update((nodes) => [...nodes, ...newNodes]);
    this.edges.update((edges) => [...edges, ...newEdges]);
  }

  cut(): void {
    this.copy();
    this.deleteSelectedElements();
  }

  duplicate(): void {
    this.copy();
    this.paste();
  }
  // --- Grouping Operations ---

  groupNodes(nodeIds: string[]): void {
    if (nodeIds.length < 2) return;
    this.undoRedoService.saveState(this.getCurrentState());

    const nodesToGroup = this.nodes().filter((n) => nodeIds.includes(n.id));
    if (nodesToGroup.length === 0) return;

    // Calculate bounding box
    const minX = Math.min(...nodesToGroup.map((n) => n.position.x));
    const minY = Math.min(...nodesToGroup.map((n) => n.position.y));
    const maxX = Math.max(...nodesToGroup.map((n) => n.position.x + (n.width || 150)));
    const maxY = Math.max(...nodesToGroup.map((n) => n.position.y + (n.height || 60)));

    const padding = 20;
    const groupNode: Node = {
      id: uuidv4(),
      type: 'group',
      position: { x: minX - padding, y: minY - padding },
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
      data: { label: 'Group' },
      expanded: true,
      selected: true,
    };

    // Update children to point to parent
    // Note: We are keeping absolute coordinates for now, so no position update needed for children
    const updatedChildren = nodesToGroup.map((n) => ({ ...n, parentId: groupNode.id, selected: false }));
    const otherNodes = this.nodes().filter((n) => !nodeIds.includes(n.id));

    this.nodes.set([...otherNodes, groupNode, ...updatedChildren]);
    this.clearSelection();
    this.selectNodes([groupNode.id]);
  }

  ungroupNodes(groupId: string): void {
    const groupNode = this.nodes().find((n) => n.id === groupId);
    if (!groupNode || groupNode.type !== 'group') return;

    this.undoRedoService.saveState(this.getCurrentState());

    // Remove parentId from children
    const updatedNodes = this.nodes().map((n) => {
      if (n.parentId === groupId) {
        const { parentId, ...rest } = n;
        return { ...rest, selected: true };
      }
      return n;
    });

    // Remove group node
    this.nodes.set(updatedNodes.filter((n) => n.id !== groupId));
  }

  addNode(node: Node): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.nodes.update((nodes) => [...nodes, { ...node, selected: false }]);
  }

  removeNode(id: string): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.nodes.update((nodes) => nodes.filter((n) => n.id !== id));
    this.edges.update((edges) => edges.filter((e) => e.source !== id && e.target !== id));
  }

  updateNode(id: string, changes: Partial<Node>): void {
    if (!changes.dragging && !changes.position) {
      this.undoRedoService.saveState(this.getCurrentState());
    }
    this.nodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === id) {
          return { ...n, ...changes };
        }
        return n;
      })
    );
  }

  // --- Z-Index Management ---

  /**
   * Bring node to front (highest z-index).
   * @param nodeId - ID of the node to bring to front
   */
  bringToFront(nodeId: string): void {
    const nodes = this.nodes();
    const maxZ = Math.max(...nodes.map(n => n.zIndex || 0), 0);
    this.updateNode(nodeId, { zIndex: maxZ + 1 });
  }

  /**
   * Send node to back (lowest z-index).
   * @param nodeId - ID of the node to send to back
   */
  sendToBack(nodeId: string): void {
    const nodes = this.nodes();
    const minZ = Math.min(...nodes.map(n => n.zIndex || 0), 0);
    this.updateNode(nodeId, { zIndex: minZ - 1 });
  }

  /**
   * Raise node one layer (increase z-index by 1).
   * @param nodeId - ID of the node to raise
   */
  raiseLayer(nodeId: string): void {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return;
    this.updateNode(nodeId, { zIndex: (node.zIndex || 0) + 1 });
  }

  /**
   * Lower node one layer (decrease z-index by 1).
   * @param nodeId - ID of the node to lower
   */
  lowerLayer(nodeId: string): void {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return;
    this.updateNode(nodeId, { zIndex: (node.zIndex || 0) - 1 });
  }

  // ==================== Batch Operations ====================

  /**
   * Select all nodes in the diagram
   */
  selectAll(): void {
    const allNodeIds = this.nodes().map(n => n.id);
    this.selectNodes(allNodeIds);
  }

  /**
   * Deselect all nodes and edges
   */
  deselectAll(): void {
    this.clearSelection();
  }

  /**
   * Delete all nodes and edges from the diagram
   */
  deleteAll(): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.nodes.set([]);
    this.edges.set([]);
  }

  /**
   * Align selected nodes
   * @param alignment - Alignment type: 'left', 'right', 'center', 'top', 'bottom', 'middle'
   */
  alignNodes(alignment: 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle'): void {
    const selected = this.selectedNodes();
    if (selected.length < 2) return;

    this.undoRedoService.saveState(this.getCurrentState());

    // Calculate positions with widths and heights
    const positions = selected.map(n => ({
      id: n.id,
      x: n.position.x,
      y: n.position.y,
      width: n.width || 150,
      height: n.height || 40
    }));

    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...positions.map(p => p.x));
        selected.forEach(node => this.updateNode(node.id, { position: { x: targetValue, y: node.position.y } }));
        break;
      case 'right':
        targetValue = Math.max(...positions.map(p => p.x + p.width));
        selected.forEach((node, i) => {
          const width = positions[i].width;
          this.updateNode(node.id, { position: { x: targetValue - width, y: node.position.y } });
        });
        break;
      case 'center':
        const avgX = positions.reduce((sum, p) => sum + p.x + p.width / 2, 0) / positions.length;
        selected.forEach((node, i) => {
          const width = positions[i].width;
          this.updateNode(node.id, { position: { x: avgX - width / 2, y: node.position.y } });
        });
        break;
      case 'top':
        targetValue = Math.min(...positions.map(p => p.y));
        selected.forEach(node => this.updateNode(node.id, { position: { x: node.position.x, y: targetValue } }));
        break;
      case 'bottom':
        targetValue = Math.max(...positions.map(p => p.y + p.height));
        selected.forEach((node, i) => {
          const height = positions[i].height;
          this.updateNode(node.id, { position: { x: node.position.x, y: targetValue - height } });
        });
        break;
      case 'middle':
        const avgY = positions.reduce((sum, p) => sum + p.y + p.height / 2, 0) / positions.length;
        selected.forEach((node, i) => {
          const height = positions[i].height;
          this.updateNode(node.id, { position: { x: node.position.x, y: avgY - height / 2 } });
        });
        break;
    }
  }

  /**
   * Distribute selected nodes evenly along an axis
   * @param axis - 'horizontal' or 'vertical'
   */
  distributeNodes(axis: 'horizontal' | 'vertical'): void {
    const selected = this.selectedNodes();
    if (selected.length < 3) return; // Need at least 3 nodes to distribute

    this.undoRedoService.saveState(this.getCurrentState());

    // Sort nodes by position
    const sorted = [...selected].sort((a, b) => {
      return axis === 'horizontal'
        ? a.position.x - b.position.x
        : a.position.y - b.position.y;
    });

    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    if (axis === 'horizontal') {
      const totalWidth = last.position.x - first.position.x;
      const spacing = totalWidth / (sorted.length - 1);

      sorted.forEach((node, i) => {
        if (i === 0 || i === sorted.length - 1) return; // Keep first and last positions
        const newX = first.position.x + spacing * i;
        this.updateNode(node.id, { position: { x: newX, y: node.position.y } });
      });
    } else {
      const totalHeight = last.position.y - first.position.y;
      const spacing = totalHeight / (sorted.length - 1);

      sorted.forEach((node, i) => {
        if (i === 0 || i === sorted.length - 1) return; // Keep first and last positions
        const newY = first.position.y + spacing * i;
        this.updateNode(node.id, { position: { x: node.position.x, y: newY } });
      });
    }
  }

  // ==================== End Batch Operations ====================

  // Existing methods continue below...

  /**
   * Set explicit z-index for a node.
   * @param nodeId - ID of the node
   * @param zIndex - Z-index value
   */
  setNodeZIndex(nodeId: string, zIndex: number): void {
    this.updateNode(nodeId, { zIndex });
  }


  resizeNode(id: string, width: number, height: number, position?: XYPosition): void {
    this.nodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === id) {
          return { ...n, width, height, ...(position ? { position } : {}) };
        }
        return n;
      })
    );
  }


  toggleGroup(groupId: string): void {
    this.nodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === groupId) {
          return { ...n, expanded: !n.expanded };
        }
        return n;
      })
    );
  }

  // Move node and handle group children
  moveNodesByDelta(nodeIds: string[], dx: number, dy: number): void {
    if (nodeIds.length === 0 || (dx === 0 && dy === 0)) return;

    this.undoRedoService.saveState(this.getCurrentState());

    this.nodes.update(nodes => nodes.map(node => {
      if (nodeIds.includes(node.id)) {
        const newPosition = {
          x: node.position.x + dx,
          y: node.position.y + dy
        };
        return {
          ...node,
          position: this.snapPosition(newPosition)
        };
      }
      return node;
    }));
  }

  moveNode(id: string, newPosition: XYPosition): void {
    // console.log('moveNode', id, newPosition);
    const node = this.nodes().find((n) => n.id === id);
    if (!node) return;

    // Snapping Logic
    let snappedX = newPosition.x;
    let snappedY = newPosition.y;
    const guides: AlignmentGuide[] = [];
    const SNAP_DISTANCE = 5;

    // 1. Snap to Grid (lower priority) - use configurable grid settings
    if (this.snapToGrid && this.gridSize > 0) {
      snappedX = Math.round(snappedX / this.gridSize) * this.gridSize;
      snappedY = Math.round(snappedY / this.gridSize) * this.gridSize;
    }

    // 2. Snap to Nodes (higher priority)
    // Only snap if dragging a single node (for simplicity for now)
    const otherNodes = this.nodes().filter(n => n.id !== id && n.parentId === node.parentId && !n.selected);

    let snappedXNode = false;
    let snappedYNode = false;

    // Horizontal Alignment (aligning Y coordinates)
    // Check Top, Center, Bottom
    const myHeight = node.height || 150; // Default height
    const myCenterY = newPosition.y + myHeight / 2;
    const myBottomY = newPosition.y + myHeight;

    for (const other of otherNodes) {
      const otherHeight = other.height || 150;
      const otherY = other.position.y;
      const otherCenterY = otherY + otherHeight / 2;
      const otherBottomY = otherY + otherHeight;

      // Top to Top
      if (Math.abs(newPosition.y - otherY) < SNAP_DISTANCE) {
        snappedY = otherY;
        snappedYNode = true;
        guides.push({ type: 'horizontal', position: otherY, start: Math.min(newPosition.x, other.position.x), end: Math.max(newPosition.x + (node.width || 150), other.position.x + (other.width || 150)) });
      }
      // Top to Bottom
      else if (Math.abs(newPosition.y - otherBottomY) < SNAP_DISTANCE) {
        snappedY = otherBottomY;
        snappedYNode = true;
        guides.push({ type: 'horizontal', position: otherBottomY, start: Math.min(newPosition.x, other.position.x), end: Math.max(newPosition.x + (node.width || 150), other.position.x + (other.width || 150)) });
      }
      // Center to Center
      else if (Math.abs(myCenterY - otherCenterY) < SNAP_DISTANCE) {
        snappedY = otherCenterY - myHeight / 2;
        snappedYNode = true;
        guides.push({ type: 'horizontal', position: otherCenterY, start: Math.min(newPosition.x, other.position.x), end: Math.max(newPosition.x + (node.width || 150), other.position.x + (other.width || 150)) });
      }
      // Bottom to Top
      else if (Math.abs(myBottomY - otherY) < SNAP_DISTANCE) {
        snappedY = otherY - myHeight;
        snappedYNode = true;
        guides.push({ type: 'horizontal', position: otherY, start: Math.min(newPosition.x, other.position.x), end: Math.max(newPosition.x + (node.width || 150), other.position.x + (other.width || 150)) });
      }
      // Bottom to Bottom
      else if (Math.abs(myBottomY - otherBottomY) < SNAP_DISTANCE) {
        snappedY = otherBottomY - myHeight;
        snappedYNode = true;
        guides.push({ type: 'horizontal', position: otherBottomY, start: Math.min(newPosition.x, other.position.x), end: Math.max(newPosition.x + (node.width || 150), other.position.x + (other.width || 150)) });
      }

      if (snappedYNode) break; // Snap to first match
    }

    // Vertical Alignment (aligning X coordinates)
    // Check Left, Center, Right
    const myWidth = node.width || 150; // Default width
    const myCenterX = newPosition.x + myWidth / 2;
    const myRightX = newPosition.x + myWidth;

    for (const other of otherNodes) {
      const otherWidth = other.width || 150;
      const otherX = other.position.x;
      const otherCenterX = otherX + otherWidth / 2;
      const otherRightX = otherX + otherWidth;

      // Left to Left
      if (Math.abs(newPosition.x - otherX) < SNAP_DISTANCE) {
        snappedX = otherX;
        snappedXNode = true;
        guides.push({ type: 'vertical', position: otherX, start: Math.min(newPosition.y, other.position.y), end: Math.max(newPosition.y + (node.height || 60), other.position.y + (other.height || 60)) });
      }
      // Left to Right
      else if (Math.abs(newPosition.x - otherRightX) < SNAP_DISTANCE) {
        snappedX = otherRightX;
        snappedXNode = true;
        guides.push({ type: 'vertical', position: otherRightX, start: Math.min(newPosition.y, other.position.y), end: Math.max(newPosition.y + (node.height || 60), other.position.y + (other.height || 60)) });
      }
      // Center to Center
      else if (Math.abs(myCenterX - otherCenterX) < SNAP_DISTANCE) {
        snappedX = otherCenterX - myWidth / 2;
        snappedXNode = true;
        guides.push({ type: 'vertical', position: otherCenterX, start: Math.min(newPosition.y, other.position.y), end: Math.max(newPosition.y + (node.height || 60), other.position.y + (other.height || 60)) });
      }
      // Right to Left
      else if (Math.abs(myRightX - otherX) < SNAP_DISTANCE) {
        snappedX = otherX - myWidth;
        snappedXNode = true;
        guides.push({ type: 'vertical', position: otherX, start: Math.min(newPosition.y, other.position.y), end: Math.max(newPosition.y + (node.height || 60), other.position.y + (other.height || 60)) });
      }
      // Right to Right
      else if (Math.abs(myRightX - otherRightX) < SNAP_DISTANCE) {
        snappedX = otherRightX - myWidth;
        snappedXNode = true;
        guides.push({ type: 'vertical', position: otherRightX, start: Math.min(newPosition.y, other.position.y), end: Math.max(newPosition.y + (node.height || 60), other.position.y + (other.height || 60)) });
      }

      if (snappedXNode) break;
    }

    this.alignmentGuides.set(guides);

    const finalPosition = { x: snappedX, y: snappedY };
    const dx = finalPosition.x - node.position.x;
    const dy = finalPosition.y - node.position.y;

    if (dx === 0 && dy === 0) return;

    // Update the moved node
    const updatedNodes = this.nodes().map((n) => {
      if (n.id === id) {
        return { ...n, position: finalPosition };
      }
      return n;
    });

    // If it's a group, move all children recursively
    if (node.type === 'group') {
      this.moveChildren(id, dx, dy, updatedNodes);
    }

    this.nodes.set(updatedNodes);
  }

  private moveChildren(parentId: string, dx: number, dy: number, nodes: Node[], visited = new Set<string>()): void {
    if (visited.has(parentId)) {
      console.warn('Cycle detected in group hierarchy, stopping recursion for', parentId);
      return;
    }
    visited.add(parentId);

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].parentId === parentId) {
        nodes[i] = {
          ...nodes[i],
          position: {
            x: nodes[i].position.x + dx,
            y: nodes[i].position.y + dy,
          },
        };
        // Recursively move children of children (nested groups)
        if (nodes[i].type === 'group') {
          this.moveChildren(nodes[i].id, dx, dy, nodes, visited);
        }
      }
    }
  }

  // Move multiple nodes (batch movement)
  moveNodes(moves: { id: string; position: XYPosition }[]): void {
    console.log('moveNodes', moves.length);
    const GRID_SIZE = 20;

    let currentNodes = [...this.nodes()];
    this.alignmentGuides.set([]); // Clear guides during batch move for now

    moves.forEach(move => {
      const node = currentNodes.find(n => n.id === move.id);
      if (!node) return;

      // Simple grid snap for batch move
      const snappedX = Math.round(move.position.x / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round(move.position.y / GRID_SIZE) * GRID_SIZE;
      const finalPosition = { x: snappedX, y: snappedY };

      const dx = finalPosition.x - node.position.x;
      const dy = finalPosition.y - node.position.y;

      // Update parent node
      currentNodes = currentNodes.map(n => n.id === move.id ? { ...n, position: finalPosition } : n);

      // If group, move children
      if (node.type === 'group') {
        this.moveChildren(node.id, dx, dy, currentNodes);
      }
    });

    this.nodes.set(currentNodes);
  }

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setFilterType(type: string | null): void {
    this.filterType.set(type);
  }

  setZoom(zoom: number): void {
    this.viewport.update(v => ({ ...v, zoom }));
  }

  applyLayout(algorithm: 'auto' | 'force' | 'hierarchical' | 'circular' = 'auto', options?: any): void {
    const currentNodes = this.nodes();
    const currentEdges = this.edges();

    this.undoRedoService.saveState(this.getCurrentState());

    let newNodes: Node[];

    switch (algorithm) {
      case 'force':
        newNodes = this.layoutService.calculateForceDirected(currentNodes, currentEdges, options);
        break;
      case 'hierarchical':
        newNodes = this.layoutService.calculateHierarchical(currentNodes, currentEdges, options);
        break;
      case 'circular':
        newNodes = this.layoutService.calculateCircular(currentNodes, currentEdges, options);
        break;
      case 'auto':
      default:
        newNodes = this.autoLayoutService.calculateLayout(currentNodes, currentEdges, options?.direction || 'TB');
        break;
    }

    this.nodes.set(newNodes);
  }

  // Box Selection Methods
  startBoxSelection(x: number, y: number): void {
    this.selectionBox.set({ x, y, width: 0, height: 0 });
  }

  updateBoxSelection(x: number, y: number): void {
    const box = this.selectionBox();
    if (!box) return;

    // Calculate width and height based on drag direction
    const width = x - box.x;
    const height = y - box.y;

    this.selectionBox.set({
      x: width < 0 ? x : box.x,
      y: height < 0 ? y : box.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  }

  endBoxSelection(): void {
    const box = this.selectionBox();
    if (!box) return;

    // Select all nodes that intersect with the selection box
    const currentNodes = this.nodes();
    const selectedNodeIds = new Set<string>();

    currentNodes.forEach((node) => {
      if (this.isNodeInSelectionBox(node, box)) {
        selectedNodeIds.add(node.id);
      }
    });

    // Update node selection
    this.nodes.set(
      currentNodes.map((node) => ({
        ...node,
        selected: selectedNodeIds.has(node.id),
      }))
    );

    // Clear selection box
    this.selectionBox.set(null);
  }

  cancelBoxSelection(): void {
    this.selectionBox.set(null);
  }

  private isNodeInSelectionBox(node: Node, box: SelectionBox): boolean {
    const nodeWidth = node.width || 150;
    const nodeHeight = node.height || 60;

    // Check if node intersects with selection box
    return !(
      node.position.x > box.x + box.width ||
      node.position.x + nodeWidth < box.x ||
      node.position.y > box.y + box.height ||
      node.position.y + nodeHeight < box.y
    );
  }

  // --- Grid Configuration ---
  private gridSize: number = 20;
  private snapToGrid: boolean = false;

  setGridConfig(gridSize: number, snapToGrid: boolean): void {
    this.gridSize = gridSize;
    this.snapToGrid = snapToGrid;
  }

  private snapPosition(position: XYPosition): XYPosition {
    if (!this.snapToGrid || this.gridSize <= 0) {
      return position;
    }

    return {
      x: Math.round(position.x / this.gridSize) * this.gridSize,
      y: Math.round(position.y / this.gridSize) * this.gridSize
    };
  }

  selectAllNodes(): void {
    this.nodes.update((nodes) => nodes.map((n) => ({ ...n, selected: true })));
  }
}
