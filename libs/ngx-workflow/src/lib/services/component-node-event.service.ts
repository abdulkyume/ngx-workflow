import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ComponentNodeEvent } from '../models/changes.model';

/**
 * Bridge for custom node components to emit events to the host diagram
 * without depending on DiagramStateService.
 */
@Injectable()
export class ComponentNodeEventService {
  private readonly events$ = new Subject<ComponentNodeEvent>();

  readonly onEvent = this.events$.asObservable();

  emit<T = unknown>(event: ComponentNodeEvent<T>): void {
    this.events$.next(event);
  }
}
