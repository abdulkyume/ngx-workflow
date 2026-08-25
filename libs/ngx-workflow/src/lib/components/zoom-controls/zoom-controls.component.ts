import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import {
  DEFAULT_ZOOM_CONTROLS_ITEMS,
  ZoomControlBuiltInAction,
  ZoomControlItem,
  ZoomControlsConfig,
  ZoomControlsPosition,
} from './zoom-controls.model';

@Component({
  selector: 'ngx-workflow-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomControlsComponent {
  readonly zoom = input(1);
  readonly minZoom = input(0.1);
  readonly maxZoom = input(10);
  /** Full toolbar config from the host (position + items). */
  readonly config = input<ZoomControlsConfig | undefined>(undefined);
  /** Convenience override for items only (merged over `config.items`). */
  readonly items = input<ZoomControlItem[] | undefined>(undefined);
  readonly position = input<ZoomControlsPosition | undefined>(undefined);

  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly fitView = output<void>();
  readonly resetZoom = output<void>();
  readonly fullscreen = output<void>();
  /** Fires for every action click; use for custom `action` ids. */
  readonly actionClick = output<{ id: string; action: string }>();

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly resolvedPosition = computed<ZoomControlsPosition>(() => {
    return this.position() ?? this.config()?.position ?? 'bottom-left';
  });

  readonly visibleItems = computed(() => {
    const fromItems = this.items();
    const fromConfig = this.config()?.items;
    const list = fromItems ?? fromConfig ?? [...DEFAULT_ZOOM_CONTROLS_ITEMS];
    return list.filter(item => item.visible !== false);
  });

  isActionDisabled(item: ZoomControlItem): boolean {
    if (item.disabled) {
      return true;
    }
    if (item.action === 'zoomIn') {
      return this.zoom() >= this.maxZoom();
    }
    if (item.action === 'zoomOut') {
      return this.zoom() <= this.minZoom();
    }
    return false;
  }

  viewText(item: ZoomControlItem): string {
    if (item.view === 'zoomPercent') {
      return `${this.zoomPercent()}%`;
    }
    return item.label ?? '';
  }

  iconKey(item: ZoomControlItem): string {
    return item.icon ?? item.action ?? '';
  }

  onItemClick(item: ZoomControlItem): void {
    if (item.type !== 'action' || this.isActionDisabled(item)) {
      return;
    }
    const action = String(item.action ?? item.id);
    this.actionClick.emit({ id: item.id, action });

    switch (action as ZoomControlBuiltInAction) {
      case 'zoomIn':
        this.zoomIn.emit();
        break;
      case 'zoomOut':
        this.zoomOut.emit();
        break;
      case 'fitView':
        this.fitView.emit();
        break;
      case 'resetZoom':
        this.resetZoom.emit();
        break;
      case 'fullscreen':
        this.fullscreen.emit();
        break;
      default:
        break;
    }
  }
}
