import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { Node } from '../../models/node.model';

@Component({
  selector: 'ngx-workflow-rounded-rect-node',
  template: `
    <svg:g class="ngx-workflow__custom-node ngx-workflow__rounded-rect-node">
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
    .ngx-workflow__rounded-rect-node {
      /* Specific styles for this custom node if needed */
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class RoundedRectNodeComponent {
  @Input() node!: Node;
}