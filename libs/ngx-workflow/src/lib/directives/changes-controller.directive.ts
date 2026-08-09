import { Directive, input, output } from '@angular/core';
import { EdgeChange, NodeChange, NodeChangeType, EdgeChangeType } from '../models/changes.model';

/**
 * Optional filterable change-stream controller.
 * Applied as a hostDirective on DiagramComponent; also usable standalone
 * via {@link handleNodeChanges} / {@link handleEdgeChanges}.
 */
@Directive({
  selector: '[ngxWorkflowChangesController]',
  standalone: true,
  exportAs: 'ngxWorkflowChanges',
})
export class NgxWorkflowChangesControllerDirective {
  readonly filterNodeTypes = input<NodeChangeType[] | undefined>(undefined);
  readonly filterEdgeTypes = input<EdgeChangeType[] | undefined>(undefined);

  readonly filteredNodeChanges = output<NodeChange[]>();
  readonly filteredEdgeChanges = output<EdgeChange[]>();

  handleNodeChanges(changes: NodeChange[]): void {
    if (!changes?.length) return;
    const types = this.filterNodeTypes();
    this.filteredNodeChanges.emit(
      types?.length ? changes.filter((c) => types.includes(c.type)) : changes
    );
  }

  handleEdgeChanges(changes: EdgeChange[]): void {
    if (!changes?.length) return;
    const types = this.filterEdgeTypes();
    this.filteredEdgeChanges.emit(
      types?.length ? changes.filter((c) => types.includes(c.type)) : changes
    );
  }
}
