import {
  Injectable,
  signal,
  EventEmitter,
  computed,
  WritableSignal,
  ElementRef,
} from '@angular/core';
import { Node, Edge, Viewport, XYPosition, DiagramState } from '../models';
import { Observable, Subject, animationFrameScheduler } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { UndoRedoService } from './undo-redo.service'; // Import UndoRedoService and DiagramState

interface Connection {
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
  readonly tempEdges: WritableSignal<TempEdge[]> = signal<TempEdge[]>([]); // New signal for preview edges
  readonly viewport: WritableSignal<Viewport> = signal<Viewport>({ x: 0, y: 0, zoom: 1 });

  // Reference to the main SVG element, set by DiagramComponent
  el!: ElementRef<SVGSVGElement>;

  // Computed signals for derived state
  readonly selectedNodes = computed(() => this.nodes().filter((node) => node.selected));
  readonly selectedEdges = computed(() => this.edges().filter((edge) => edge.selected));

  // Event Emitters
  readonly nodeClick = new EventEmitter<Node>();
  readonly edgeClick = new EventEmitter<Edge>();
  readonly connect = new EventEmitter<Connection>();
  readonly dragStart = new EventEmitter<Node>();
  readonly dragEnd = new EventEmitter<Node>();
  readonly nodesChange = new EventEmitter<Node[]>();
  readonly edgesChange = new EventEmitter<Edge[]>();
  readonly viewportChange = new EventEmitter<Viewport>();

  // Internal subjects for batched updates
  private nodeUpdates$ = new Subject<Node[]>();
  private edgeUpdates$ = new Subject<Edge[]>();
  private viewportUpdates$ = new Subject<Viewport>();

  constructor(private undoRedoService: UndoRedoService) {
    this.nodeUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((nodes) => {
        this.nodes.set(nodes);
        this.nodesChange.emit(nodes);
      });

    this.edgeUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((edges) => {
        this.edges.set(edges);
        this.edgesChange.emit(edges);
      });

    this.viewportUpdates$
      .pipe(throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }))
      .subscribe((viewport) => {
        this.viewport.set(viewport);
        this.viewportChange.emit(viewport);
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

  // --- Node Management ---

  addNode(node: Node): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.nodes.update((currentNodes) => [
      ...currentNodes,
      { ...node, selected: false, dragging: false, draggable: true },
    ]);
  }

  updateNode(id: string, changes: Partial<Node>): void {
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => (node.id === id ? { ...node, ...changes } : node))
    );
  }

  removeNode(id: string): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.nodes.update((currentNodes) => currentNodes.filter((node) => !id.includes(node.id)));
    this.edges.update((currentEdges) =>
      currentEdges.filter((edge) => !id.includes(edge.source) && !id.includes(edge.target))
    );
    this.tempEdges.update((currentTempEdges) =>
      currentTempEdges.filter((edge) => !id.includes(edge.source) && !id.includes(edge.target))
    );
  }

  moveNode(id: string, newPosition: XYPosition): void {
    // Only save state once when drag starts, not on every move
    // This is handled by onDragStart/End
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => (node.id === id ? { ...node, position: newPosition } : node))
    );
  }

  // --- Edge Management ---

  addEdge(edge: Edge): void {
    this.undoRedoService.saveState(this.getCurrentState());
    this.edges.update((currentEdges) => [...currentEdges, { ...edge, selected: false }]);
    this.connect.emit({
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    });
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
    console.log('Selected elements deleted');
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
    // State is already saved at dragStart, so no need to save again here unless
    // a single drag operation is considered a single undoable action.
    // If multiple small state changes during drag need to be undone as one,
    // then the saveState logic here would be different (e.g., debounced save).
  }
}
