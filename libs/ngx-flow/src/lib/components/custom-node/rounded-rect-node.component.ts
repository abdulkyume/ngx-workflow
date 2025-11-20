import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../models/node.model';

@Component({
  selector: 'ngx-rounded-rect-node',
  template: `
    <svg:g class="ngx-flow__custom-node ngx-flow__rounded-rect-node">
      <rect
        [attr.x]="0"
        [attr.y]="0"
        [attr.width]="node.width || 170"
        [attr.height]="node.height || 60"
        rx="10"
        ry="10"
        fill="#a7f3d0"
        stroke="#065f46"
        stroke-width="1.5"
      ></rect>
      <text
        [attr.x]="(node.width || 170) / 2"
        [attr.y]="(node.height || 60) / 2"
        text-anchor="middle"
        alignment-baseline="middle"
        fill="#065f46"
        font-size="14px"
        font-family="sans-serif"
      >
        {{ node.data?.label || 'Custom Node' }}
      </text>
    </svg:g>
  `,
  styles: [`
    .ngx-flow__rounded-rect-node {
      /* Specific styles for this custom node if needed */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule]
})
export class RoundedRectNodeComponent {
  @Input() node!: Node;
}