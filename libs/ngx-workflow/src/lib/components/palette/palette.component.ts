import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PaletteItem {
  type: string;
  label: string;
  description?: string;
  icon?: string;
  width?: number;
  height?: number;
  data?: any;
  nodeOverrides?: Record<string, any>;
}

@Component({
  selector: 'ngx-workflow-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaletteComponent {
  @Input() title: string = 'Node Palette';
  @Input() orientation: 'vertical' | 'horizontal' = 'vertical';

  @Input() items: PaletteItem[] = [
    {
      type: 'default',
      label: 'Process Node',
      description: 'Standard workflow step',
      icon: '⚙️',
      width: 170,
      height: 60,
    },
    {
      type: 'input',
      label: 'Start Node',
      description: 'Trigger or entry point',
      icon: '🚀',
      width: 150,
      height: 50,
    },
    {
      type: 'output',
      label: 'End Node',
      description: 'Result or exit point',
      icon: '🏁',
      width: 150,
      height: 50,
    },
    {
      type: 'group',
      label: 'Group Container',
      description: 'Sub-flow parent box',
      icon: '📦',
      width: 300,
      height: 200,
    },
  ];

  onDragStart(event: DragEvent, item: PaletteItem): void {
    if (!event.dataTransfer) return;

    event.dataTransfer.setData('application/ngx-workflow-node', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  }
}
