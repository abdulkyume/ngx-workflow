import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { Node, Edge, Viewport, DiagramState } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private readonly MAX_HISTORY = 50; // Maximum number of states to keep
  private undoStack: WritableSignal<DiagramState[]> = signal([]);
  private redoStack: WritableSignal<DiagramState[]> = signal([]);

  constructor() { }

  /**
   * Structurally clone diagram state.
   * Reuses object references for unchanged nodes and edges to minimize heap memory overhead.
   */
  private cloneState(state: DiagramState, previousState?: DiagramState): DiagramState {
    if (!previousState) {
      return {
        nodes: state.nodes.map(n => ({
          ...n,
          position: { ...n.position },
          data: n.data ? { ...n.data } : undefined
        })),
        edges: state.edges.map(e => ({ ...e })),
        viewport: { ...state.viewport }
      };
    }

    const prevNodeMap = new Map(previousState.nodes.map(n => [n.id, n]));
    const nodes = state.nodes.map(n => {
      const prev = prevNodeMap.get(n.id);
      if (prev && this.isNodeEqual(prev, n)) {
        return prev; // Structural sharing: reuse reference for unchanged node
      }
      return {
        ...n,
        position: { ...n.position },
        data: n.data ? { ...n.data } : undefined
      };
    });

    const prevEdgeMap = new Map(previousState.edges.map(e => [e.id, e]));
    const edges = state.edges.map(e => {
      const prev = prevEdgeMap.get(e.id);
      if (prev && this.isEdgeEqual(prev, e)) {
        return prev; // Structural sharing: reuse reference for unchanged edge
      }
      return { ...e };
    });

    return {
      nodes,
      edges,
      viewport: { ...state.viewport }
    };
  }

  private isNodeEqual(a: Node, b: Node): boolean {
    return (
      a.id === b.id &&
      a.position.x === b.position.x &&
      a.position.y === b.position.y &&
      a.selected === b.selected &&
      a.width === b.width &&
      a.height === b.height &&
      a.label === b.label &&
      a.type === b.type
    );
  }

  private isEdgeEqual(a: Edge, b: Edge): boolean {
    return (
      a.id === b.id &&
      a.source === b.source &&
      a.target === b.target &&
      a.sourceHandle === b.sourceHandle &&
      a.targetHandle === b.targetHandle &&
      a.selected === b.selected &&
      a.label === b.label &&
      a.type === b.type &&
      a.animated === b.animated &&
      a.hidden === b.hidden
    );
  }

  // Saves the current state of the diagram to the undo stack
  saveState(currentState: DiagramState): void {
    const stack = this.undoStack();
    const previousState = stack.length > 0 ? stack[stack.length - 1] : undefined;
    const clonedState = this.cloneState(currentState, previousState);

    this.undoStack.update(s => {
      const newStack = [...s, clonedState];
      // Keep only last MAX_HISTORY items to prevent memory leaks
      return newStack.slice(-this.MAX_HISTORY);
    });

    // Clear redo stack on new action
    this.redoStack.set([]);
  }

  // Undoes the last action
  undo(currentState: DiagramState): DiagramState | undefined {
    const stack = this.undoStack();
    if (stack.length === 0) {
      return undefined;
    }

    // Get the last state and remove it from undo stack
    const previousState = stack[stack.length - 1];
    this.undoStack.set(stack.slice(0, -1));

    // Add current state to redo stack
    this.redoStack.update(s => [...s, this.cloneState(currentState, s.length > 0 ? s[s.length - 1] : undefined)]);

    return previousState;
  }

  // Redoes the last undone action
  redo(currentState: DiagramState): DiagramState | undefined {
    const stack = this.redoStack();
    if (stack.length === 0) {
      return undefined;
    }

    // Get the last state and remove it from redo stack
    const nextState = stack[stack.length - 1];
    this.redoStack.set(stack.slice(0, -1));

    // Add current state to undo stack
    this.undoStack.update(s => [...s, this.cloneState(currentState, s.length > 0 ? s[s.length - 1] : undefined)]);

    return nextState;
  }

  canUndo = computed(() => this.undoStack().length > 0);
  canRedo = computed(() => this.redoStack().length > 0);

  clearStacks(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
  }
}
