import {
  Injectable,
  signal,
  EventEmitter,
  computed,
  WritableSignal,
  ElementRef,
  effect,
} from '@angular/core';
import { Node, Edge, Viewport, XYPosition, DiagramState, AlignmentGuide } from '../models';
import { Observable, Subject, animationFrameScheduler } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { UndoRedoService } from './undo-redo.service'; // Import UndoRedoService and DiagramState

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

  constructor(private undoRedoService: UndoRedoService) {
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

  selectAll(): void {
    this.nodes.update((currentNodes) => currentNodes.map((node) => ({ ...node, selected: true })));
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
    console.log('Selected elements deleted');
  }

  // --- Alignment & Distribution ---

  alignNodes(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    const selectedNodes = this.selectedNodes();
    if (selectedNodes.length < 2) return;

    this.undoRedoService.saveState(this.getCurrentState());

    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...selectedNodes.map((n) => n.position.x));
        break;
      case 'center': {
        const minX = Math.min(...selectedNodes.map((n) => n.position.x));
        const maxX = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 170)));
        targetValue = minX + (maxX - minX) / 2;
        break;
      }
      case 'right':
        targetValue = Math.max(...selectedNodes.map((n) => n.position.x + (n.width || 170)));
        break;
      case 'top':
        targetValue = Math.min(...selectedNodes.map((n) => n.position.y));
        break;
      case 'middle': {
        const minY = Math.min(...selectedNodes.map((n) => n.position.y));
        const maxY = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 60)));
        targetValue = minY + (maxY - minY) / 2;
        break;
      }
      case 'bottom':
        targetValue = Math.max(...selectedNodes.map((n) => n.position.y + (n.height || 60)));
        break;
    }

    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => {
        if (!node.selected) return node;

        const newPos = { ...node.position };
        const width = node.width || 170;
        const height = node.height || 60;

        switch (alignment) {
          case 'left':
            newPos.x = targetValue;
            break;
          case 'center':
            newPos.x = targetValue - width / 2;
            break;
          case 'right':
            newPos.x = targetValue - width;
            break;
          case 'top':
            newPos.y = targetValue;
            break;
          case 'middle':
            newPos.y = targetValue - height / 2;
            break;
          case 'bottom':
            newPos.y = targetValue - height;
            break;
        }
        return { ...node, position: newPos };
      })
    );
  }

  distributeNodes(distribution: 'horizontal' | 'vertical'): void {
    const selectedNodes = this.selectedNodes();
    if (selectedNodes.length < 3) return;

    this.undoRedoService.saveState(this.getCurrentState());

    // Sort nodes by position
    const sortedNodes = [...selectedNodes].sort((a, b) => {
      return distribution === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y;
    });

    const firstNode = sortedNodes[0];
    const lastNode = sortedNodes[sortedNodes.length - 1];

    if (distribution === 'horizontal') {
      const totalSpan = lastNode.position.x - firstNode.position.x;
      const step = totalSpan / (sortedNodes.length - 1);

      this.nodes.update(nodes => nodes.map(node => {
        const index = sortedNodes.findIndex(n => n.id === node.id);
        if (index === -1) return node;
        return {
          ...node,
          position: {
            ...node.position,
            x: firstNode.position.x + (step * index)
          }
        };
      }));
    } else {
      const totalSpan = lastNode.position.y - firstNode.position.y;
      const step = totalSpan / (sortedNodes.length - 1);

      this.nodes.update(nodes => nodes.map(node => {
        const index = sortedNodes.findIndex(n => n.id === node.id);
        if (index === -1) return node;
        return {
          ...node,
          position: {
            ...node.position,
            y: firstNode.position.y + (step * index)
          }
        };
      }));
    }
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
        return {
          ...node,
          position: {
            x: node.position.x + dx,
            y: node.position.y + dy
          }
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
    const GRID_SIZE = 20;

    // 1. Snap to Grid (lower priority)
    snappedX = Math.round(snappedX / GRID_SIZE) * GRID_SIZE;
    snappedY = Math.round(snappedY / GRID_SIZE) * GRID_SIZE;

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

}
