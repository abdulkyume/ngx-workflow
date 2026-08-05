import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Node, Edge } from '../models';

export interface WorkflowFormValue {
  nodes?: Node[];
  edges?: Edge[];
}

export class NgxWorkflowValidators {
  /**
   * Validates that the workflow contains no directed cycles (loops).
   */
  static noCycles(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: WorkflowFormValue = control.value;
      if (!value || !value.nodes || !value.edges) return null;

      const adj = new Map<string, string[]>();
      for (const node of value.nodes) {
        adj.set(node.id, []);
      }
      for (const edge of value.edges) {
        if (adj.has(edge.source)) {
          adj.get(edge.source)!.push(edge.target);
        }
      }

      const visited = new Set<string>();
      const recStack = new Set<string>();

      const hasCycle = (nodeId: string): boolean => {
        if (recStack.has(nodeId)) return true;
        if (visited.has(nodeId)) return false;

        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (hasCycle(neighbor)) return true;
        }

        recStack.delete(nodeId);
        return false;
      };

      for (const node of value.nodes) {
        if (hasCycle(node.id)) {
          return { hasCycles: true };
        }
      }

      return null;
    };
  }

  /**
   * Validates that every node has at least one connection.
   */
  static noOrphanNodes(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: WorkflowFormValue = control.value;
      if (!value || !value.nodes) return null;

      const connectedNodeIds = new Set<string>();
      for (const edge of value.edges || []) {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      }

      const orphans = value.nodes.filter((n) => !connectedNodeIds.has(n.id));
      if (orphans.length > 0) {
        return { orphanNodes: orphans.map((n) => n.id) };
      }

      return null;
    };
  }

  /**
   * Validates minimum node count.
   */
  static minNodes(count: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: WorkflowFormValue = control.value;
      if (!value || !value.nodes || value.nodes.length < count) {
        return { minNodes: { required: count, actual: value?.nodes?.length || 0 } };
      }
      return null;
    };
  }
}
