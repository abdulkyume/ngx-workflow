import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ngx-workflow-zoom-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZoomControlsComponent {
  @Input() zoom: number = 1;
  @Input() minZoom: number = 0.1;
  @Input() maxZoom: number = 10;

  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() fitView = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();

  get zoomPercent(): number {
    return Math.round(this.zoom * 100);
  }

  onZoomIn(): void {
    this.zoomIn.emit();
  }

  onZoomOut(): void {
    this.zoomOut.emit();
  }

  onFitView(): void {
    this.fitView.emit();
  }

  onResetZoom(): void {
    this.resetZoom.emit();
  }
}
