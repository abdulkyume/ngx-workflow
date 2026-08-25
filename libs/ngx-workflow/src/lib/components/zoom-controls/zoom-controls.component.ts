import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  SecurityContext,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { DiagramStateService } from '../../services/diagram-state.service';
import {
  DEFAULT_ZOOM_CONTROLS_ITEMS,
  ZoomControlBuiltInAction,
  ZoomControlItem,
  ZoomControlsConfig,
  ZoomControlsOrientation,
  ZoomControlsPosition,
} from './zoom-controls.model';

@Component({
  selector: 'ngx-workflow-zoom-controls',
  templateUrl: './zoom-controls.component.html',
  styleUrls: ['./zoom-controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoomControlsComponent {
  private readonly diagramStateService = inject(DiagramStateService, { optional: true });
  private readonly sanitizer = inject(DomSanitizer);

  readonly zoom = input(1);
  readonly minZoom = input(0.1);
  readonly maxZoom = input(10);
  /** Full toolbar config from the host (position, orientation, style, class, items). */
  readonly config = input<ZoomControlsConfig | undefined>(undefined);
  /** Convenience override for items only (merged over `config.items`). */
  readonly items = input<ZoomControlItem[] | undefined>(undefined);
  readonly position = input<ZoomControlsPosition | undefined>(undefined);
  readonly orientation = input<ZoomControlsOrientation | undefined>(undefined);
  readonly customStyle = input<string | Record<string, string | number> | undefined>(undefined, {
    alias: 'style',
  });
  readonly customClassName = input<string | undefined>(undefined, {
    alias: 'className',
  });

  readonly zoomIn = output<void>();
  readonly zoomOut = output<void>();
  readonly fitView = output<void>();
  readonly resetZoom = output<void>();
  readonly fullscreen = output<void>();
  readonly undo = output<void>();
  readonly redo = output<void>();
  /** Fires for every action click; contains id, action string, and mouse event. */
  readonly actionClick = output<{ id: string; action: string; event: MouseEvent }>();

  readonly zoomPercent = computed(() => Math.round(this.zoom() * 100));

  readonly resolvedPosition = computed<ZoomControlsPosition>(() => {
    return this.position() ?? this.config()?.position ?? 'bottom-left';
  });

  readonly resolvedOrientation = computed<ZoomControlsOrientation>(() => {
    return this.orientation() ?? this.config()?.orientation ?? 'horizontal';
  });

  readonly resolvedStyle = computed<string | Record<string, string | number> | undefined>(() => {
    return this.customStyle() ?? this.config()?.style;
  });

  readonly resolvedClassName = computed<string>(() => {
    return this.customClassName() ?? this.config()?.className ?? '';
  });

  readonly canUndo = computed(() => {
    return this.diagramStateService?.undoRedoService?.canUndo() ?? false;
  });

  readonly canRedo = computed(() => {
    return this.diagramStateService?.undoRedoService?.canRedo() ?? false;
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
    if (item.action === 'undo') {
      return this.diagramStateService ? !this.canUndo() : false;
    }
    if (item.action === 'redo') {
      return this.diagramStateService ? !this.canRedo() : false;
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

  safeSvg(rawSvg?: string): SafeHtml | null {
    if (!rawSvg) return null;
    return this.sanitizer.sanitize(SecurityContext.HTML, rawSvg) ?? null;
  }

  onItemClick(item: ZoomControlItem, event?: MouseEvent): void {
    if (item.type !== 'action' || this.isActionDisabled(item)) {
      return;
    }
    const action = String(item.action ?? item.id);
    this.actionClick.emit({ id: item.id, action, event: event as MouseEvent });

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
      case 'undo':
        this.undo.emit();
        this.diagramStateService?.undo();
        break;
      case 'redo':
        this.redo.emit();
        this.diagramStateService?.redo();
        break;
      default:
        break;
    }
  }
}
