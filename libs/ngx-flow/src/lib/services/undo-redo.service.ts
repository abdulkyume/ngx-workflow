import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { Node, Edge, Viewport, DiagramState } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UndoRedoService {
  private undoStack: WritableSignal<DiagramState[]> = signal([]);
  private redoStack: WritableSignal<DiagramState[]> = signal([]);

  constructor() {}

  // Saves the current state of the diagram to the undo stack
  saveState(currentState: DiagramState): void {
    this.undoStack.update((stack) => [...stack, currentState]);
    this.redoStack.set([]); // Clear redo stack on new action
    console.log('State saved:', currentState);
    console.log('Undo Stack size:', this.undoStack().length);
  }

  // Undoes the last action
  undo(currentState: DiagramState): DiagramState | undefined {
    const previousState = this.undoStack().pop();
    if (previousState) {
      this.redoStack.update((stack) => [...stack, currentState]);
      console.log('Undo performed. Undo Stack size:', this.undoStack().length);
      console.log('Redo Stack size:', this.redoStack().length);
      return previousState;
    }
    console.log('Nothing to undo.');
    return undefined;
  }

  // Redoes the last undone action
  redo(currentState: DiagramState): DiagramState | undefined {
    const nextState = this.redoStack().pop();
    if (nextState) {
      this.undoStack.update((stack) => [...stack, currentState]);
      console.log('Redo performed. Undo Stack size:', this.undoStack().length);
      console.log('Redo Stack size:', this.redoStack().length);
      return nextState;
    }
    console.log('Nothing to redo.');
    return undefined;
  }

  canUndo = computed(() => this.undoStack().length > 0);
  canRedo = computed(() => this.redoStack().length > 0);

  clearStacks(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
  }
}
