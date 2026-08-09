import { Directive, input, output } from '@angular/core';
import { ConnectionMode } from '../models/changes.model';

export interface ConnectionEvent {
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

/**
 * Optional host directive that centralizes connection validation.
 * Provide `[connectionValidator]` and optionally bind `connectionMode`.
 */
@Directive({
  selector: '[ngxWorkflowConnectionController]',
  standalone: true,
})
export class NgxWorkflowConnectionControllerDirective {
  readonly connectionMode = input<ConnectionMode>('strict');
  readonly connectionValidator = input<
    ((connection: ConnectionEvent) => boolean) | undefined
  >(undefined);

  readonly connectionAccepted = output<ConnectionEvent>();
  readonly connectionRejected = output<ConnectionEvent>();

  validate(connection: ConnectionEvent): boolean {
    if (this.connectionMode() === 'strict') {
      if (!connection.sourceHandle || !connection.targetHandle) {
        this.connectionRejected.emit(connection);
        return false;
      }
    }
    const validator = this.connectionValidator();
    if (validator && !validator(connection)) {
      this.connectionRejected.emit(connection);
      return false;
    }
    this.connectionAccepted.emit(connection);
    return true;
  }
}
