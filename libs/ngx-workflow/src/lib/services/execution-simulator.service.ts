import { Injectable, signal, computed, WritableSignal, inject } from '@angular/core';
import { DiagramStateService } from './diagram-state.service';
import { Node, Edge } from '../models';

export type NodeExecutionStatus = 'idle' | 'running' | 'success' | 'error' | 'skipped';

export interface NodeExecutionState {
  nodeId: string;
  status: NodeExecutionStatus;
  payload?: any;
  errorMsg?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutionSimulatorService {
  private diagramStateService = inject(DiagramStateService);

  readonly isPlaying: WritableSignal<boolean> = signal(false);
  readonly speedMs: WritableSignal<number> = signal(1000);
  readonly currentStepIndex: WritableSignal<number> = signal(-1);
  readonly executionStates: WritableSignal<Map<string, NodeExecutionState>> = signal(new Map());

  private executionOrder: string[] = [];
  private timer: any = null;

  readonly activeNodeId = computed(() => {
    const idx = this.currentStepIndex();
    if (idx >= 0 && idx < this.executionOrder.length) {
      return this.executionOrder[idx];
    }
    return null;
  });

  /**
   * Calculates topological execution order of nodes in the diagram.
   */
  private computeTopologicalOrder(): string[] {
    const nodes = this.diagramStateService.nodes();
    const edges = this.diagramStateService.edges();

    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const n of nodes) {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    }

    for (const e of edges) {
      if (adj.has(e.source) && inDegree.has(e.target)) {
        adj.get(e.source)!.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    }

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    const order: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      order.push(u);

      const neighbors = adj.get(u) || [];
      for (const v of neighbors) {
        const d = (inDegree.get(v) || 1) - 1;
        inDegree.set(v, d);
        if (d === 0) queue.push(v);
      }
    }

    // Add any remaining unvisited orphan nodes
    for (const n of nodes) {
      if (!order.includes(n.id)) {
        order.push(n.id);
      }
    }

    return order;
  }

  /**
   * Starts or restarts execution simulation from beginning.
   */
  start(): void {
    this.reset();
    this.executionOrder = this.computeTopologicalOrder();
    if (this.executionOrder.length === 0) return;

    this.isPlaying.set(true);
    this.stepNext();
    this.scheduleTimer();
  }

  /**
   * Advances to the next node in the execution order.
   */
  stepNext(): void {
    const nextIdx = this.currentStepIndex() + 1;

    if (nextIdx >= this.executionOrder.length) {
      this.pause();
      return;
    }

    // Mark previous node as success
    if (this.currentStepIndex() >= 0) {
      const prevId = this.executionOrder[this.currentStepIndex()];
      this.setNodeStatus(prevId, 'success');
    }

    this.currentStepIndex.set(nextIdx);
    const currId = this.executionOrder[nextIdx];
    this.setNodeStatus(currId, 'running');

    // Pan to focus active node
    const currNode = this.diagramStateService.nodes().find((n) => n.id === currId);
    if (currNode) {
      const w = currNode.width || 170;
      const h = currNode.height || 60;
      this.diagramStateService.setCenter(currNode.position.x + w / 2, currNode.position.y + h / 2);
    }
  }

  /**
   * Steps back to previous node.
   */
  stepBack(): void {
    const prevIdx = this.currentStepIndex() - 1;
    if (prevIdx < 0) {
      this.reset();
      return;
    }

    const currId = this.executionOrder[this.currentStepIndex()];
    this.setNodeStatus(currId, 'idle');

    this.currentStepIndex.set(prevIdx);
    const prevId = this.executionOrder[prevIdx];
    this.setNodeStatus(prevId, 'running');
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resume(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.scheduleTimer();
  }

  reset(): void {
    this.pause();
    this.currentStepIndex.set(-1);
    this.executionOrder = [];
    const map = new Map<string, NodeExecutionState>();
    for (const n of this.diagramStateService.nodes()) {
      map.set(n.id, { nodeId: n.id, status: 'idle' });
    }
    this.executionStates.set(map);
  }

  setNodeStatus(nodeId: string, status: NodeExecutionStatus, payload?: any, errorMsg?: string): void {
    this.executionStates.update((map) => {
      const newMap = new Map(map);
      newMap.set(nodeId, { nodeId, status, payload, errorMsg });
      return newMap;
    });
  }

  setSpeed(ms: number): void {
    this.speedMs.set(ms);
    if (this.isPlaying()) {
      this.pause();
      this.resume();
    }
  }

  private scheduleTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.currentStepIndex() >= this.executionOrder.length - 1) {
        // Finished
        if (this.currentStepIndex() >= 0) {
          const lastId = this.executionOrder[this.currentStepIndex()];
          this.setNodeStatus(lastId, 'success');
        }
        this.pause();
      } else {
        this.stepNext();
      }
    }, this.speedMs());
  }
}
