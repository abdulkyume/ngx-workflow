import { Component, ChangeDetectionStrategy, inject, Input } from '@angular/core';

import { ExecutionSimulatorService } from '../../services/execution-simulator.service';

@Component({
  selector: 'ngx-workflow-execution-controls',
  standalone: true,
  imports: [],
  templateUrl: './execution-controls.component.html',
  styleUrls: ['./execution-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionControlsComponent {
  public simulator = inject(ExecutionSimulatorService);

  @Input() position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'top-right';

  togglePlay(): void {
    if (this.simulator.isPlaying()) {
      this.simulator.pause();
    } else {
      if (this.simulator.currentStepIndex() === -1) {
        this.simulator.start();
      } else {
        this.simulator.resume();
      }
    }
  }

  onSpeedChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.simulator.setSpeed(Number(input.value));
  }
}
