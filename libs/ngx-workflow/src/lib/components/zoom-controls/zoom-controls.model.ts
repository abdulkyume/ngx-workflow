/** Built-in zoom control actions emitted by the toolbar. */
export type ZoomControlBuiltInAction =
  | 'zoomIn'
  | 'zoomOut'
  | 'fitView'
  | 'resetZoom'
  | 'fullscreen';

/** Built-in icon keys rendered by the toolbar. */
export type ZoomControlBuiltInIcon =
  | 'plus'
  | 'minus'
  | 'fit'
  | 'reset'
  | 'fullscreen'
  | 'exitFullscreen';

/** Built-in view keys (read-only displays in the toolbar). */
export type ZoomControlBuiltInView = 'zoomPercent';

export type ZoomControlItemType = 'action' | 'view' | 'separator';

export type ZoomControlsPosition =
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

/**
 * One toolbar slot. Consumers fully control order, visibility, labels, icons,
 * and which built-in / custom actions fire.
 */
export interface ZoomControlItem {
  /** Stable id used for tracking and custom action callbacks. */
  id: string;
  type: ZoomControlItemType;
  /** When type is `action` — built-in or any custom action id. */
  action?: ZoomControlBuiltInAction | (string & {});
  /** When type is `view` — built-in view or custom text via `label`. */
  view?: ZoomControlBuiltInView | (string & {});
  /** Optional static label (used for custom views / button text). */
  label?: string;
  title?: string;
  ariaLabel?: string;
  /** Built-in icon key, or raw SVG markup for a custom icon. */
  icon?: ZoomControlBuiltInIcon | (string & {});
  /** Raw SVG markup; takes precedence over `icon` when set. */
  svg?: string;
  disabled?: boolean;
  /** Defaults to true when omitted. */
  visible?: boolean;
}

export interface ZoomControlsConfig {
  /** Toolbar corner. Default: `bottom-left`. */
  position?: ZoomControlsPosition;
  /**
   * Ordered items (actions, views, separators).
   * When omitted, Figma default is used: + | % | − | divider | fit.
   */
  items?: ZoomControlItem[];
}

/** Default Figma toolbar: zoom in, percent, zoom out, separator, fit view. */
export const DEFAULT_ZOOM_CONTROLS_ITEMS: readonly ZoomControlItem[] = [
  {
    id: 'zoomIn',
    type: 'action',
    action: 'zoomIn',
    icon: 'plus',
    title: 'Zoom In',
    ariaLabel: 'Zoom in',
  },
  {
    id: 'zoomPercent',
    type: 'view',
    view: 'zoomPercent',
    title: 'Zoom level',
  },
  {
    id: 'zoomOut',
    type: 'action',
    action: 'zoomOut',
    icon: 'minus',
    title: 'Zoom Out',
    ariaLabel: 'Zoom out',
  },
  {
    id: 'separator',
    type: 'separator',
  },
  {
    id: 'fitView',
    type: 'action',
    action: 'fitView',
    icon: 'fit',
    title: 'Fit View',
    ariaLabel: 'Fit all nodes in view',
  },
];
