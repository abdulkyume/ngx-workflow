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

  // Deep clone a diagram state to prevent reference issues
  private cloneState(state: DiagramState): DiagramState {
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

  // Saves the current state of the diagram to the undo stack
  saveState(currentState: DiagramState): void {
    const clonedState = this.cloneState(currentState);

    this.undoStack.update(stack => {
      const newStack = [...stack, clonedState];
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
    this.redoStack.update(s => [...s, this.cloneState(currentState)]);

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
    this.undoStack.update(s => [...s, this.cloneState(currentState)]);

    return nextState;
  }

  canUndo = computed(() => this.undoStack().length > 0);
  canRedo = computed(() => this.redoStack().length > 0);

  clearStacks(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
  }
}
