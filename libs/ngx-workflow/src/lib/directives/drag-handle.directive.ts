import { Directive } from '@angular/core';

/**
 * Marks an element inside a custom node as the drag handle.
 * When the node has `easyConnect: true`, only elements with this directive
 * (or the legacy `.drag-handle` class) start a node drag; body clicks start a connection.
 */
@Directive({
  selector: '[ngxWorkflowDragHandle], .drag-handle',
  standalone: true,
  host: {
    class: 'drag-handle ngx-workflow__drag-handle',
    '[attr.data-drag-handle]': 'true',
  },
})
export class DragHandleDirective {}
