export interface InputDoc {
  name: string;
  type: string;
  default: string;
  description: string;
  category: string;
}

export const INPUT_DOCS: InputDoc[] = [
  // --- Data ---
  {
    name: 'nodes',
    type: 'Node[]',
    default: '[]',
    description: 'Array of nodes to display (Signal-based sync). Key input for rendering the graph.',
    category: 'Data'
  },
  {
    name: 'edges',
    type: 'Edge[]',
    default: '[]',
    description: 'Array of edges to display (Signal-based sync). Defines connections between nodes.',
    category: 'Data'
  },
  {
    name: 'defsTemplate',
    type: 'TemplateRef<any>',
    default: 'undefined',
    description: 'Angular template containing SVG <defs> (markers, gradients, etc).',
    category: 'Data'
  },
  {
    name: 'edgeTemplate',
    type: 'TemplateRef<any>',
    default: 'undefined',
    description: 'Custom template for rendering edges.',
    category: 'Data'
  },

  // --- Viewport & Navigation ---
  {
    name: 'initialViewport',
    type: 'Viewport',
    default: 'undefined',
    description: 'Initial viewport state containing { x, y, zoom }. Useful for restoring saved states.',
    category: 'Viewport'
  },
  {
    name: 'fitView',
    type: 'boolean',
    default: 'false',
    description: 'Automatically fit all nodes in view on load.',
    category: 'Viewport'
  },
  {
    name: 'minZoom',
    type: 'number',
    default: '0.1',
    description: 'Minimum allowed zoom level.',
    category: 'Viewport'
  },
  {
    name: 'maxZoom',
    type: 'number',
    default: '4',
    description: 'Maximum allowed zoom level.',
    category: 'Viewport'
  },
  {
    name: 'autoPanOnNodeDrag',
    type: 'boolean',
    default: 'true',
    description: 'Pan canvas automatically when dragging node near edge.',
    category: 'Viewport'
  },
  {
    name: 'autoPanOnConnect',
    type: 'boolean',
    default: 'true',
    description: 'Pan canvas automatically when connecting edges near boundary.',
    category: 'Viewport'
  },
  {
    name: 'autoPanSpeed',
    type: 'number',
    default: '15',
    description: 'Pixels per frame for auto-pan.',
    category: 'Viewport'
  },
  {
    name: 'autoPanEdgeThreshold',
    type: 'number',
    default: '50',
    description: 'Distance in pixels from edge to trigger auto-pan.',
    category: 'Viewport'
  },

  // --- Appearance ---
  {
    name: 'showBackground',
    type: 'boolean',
    default: 'true',
    description: 'Whether to show the background pattern (dots/lines/cross).',
    category: 'Appearance'
  },
  {
    name: 'backgroundVariant',
    type: "'dots' | 'lines' | 'cross'",
    default: "'dots'",
    description: 'The pattern style of the background.',
    category: 'Appearance'
  },
  {
    name: 'backgroundImage',
    type: 'string | null',
    default: 'null',
    description: 'URL for a custom background image. Overrides pattern if set.',
    category: 'Appearance'
  },
  {
    name: 'backgroundGap',
    type: 'number',
    default: '20',
    description: 'Gap between background pattern elements in pixels.',
    category: 'Appearance'
  },
  {
    name: 'backgroundSize',
    type: 'number',
    default: '1',
    description: 'Size of background pattern elements (e.g., dot radius).',
    category: 'Appearance'
  },
  {
    name: 'backgroundColor',
    type: 'string',
    default: "'#81818a'",
    description: 'Color of the background pattern dots/lines.',
    category: 'Appearance'
  },
  {
    name: 'backgroundBgColor',
    type: 'string',
    default: "'#f0f0f0'",
    description: 'Background color of the canvas itself.',
    category: 'Appearance'
  },
  {
    name: 'colorMode',
    type: "'light' | 'dark'",
    default: "'light'",
    description: 'Color theme mode for the diagram.',
    category: 'Appearance'
  },
  {
    name: 'zIndexMode',
    type: "'default' | 'layered'",
    default: "'default'",
    description: 'Strategy for node z-indexing.',
    category: 'Appearance'
  },

  // --- Controls & UI ---
  {
    name: 'showZoomControls',
    type: 'boolean',
    default: 'true',
    description: 'Whether to show the zoom control buttons (usually bottom-left).',
    category: 'Controls'
  },
  {
    name: 'showMinimap',
    type: 'boolean',
    default: 'true',
    description: 'Whether to show the minimap (usually bottom-right).',
    category: 'Controls'
  },
  {
    name: 'showExportControls',
    type: 'boolean',
    default: 'false',
    description: 'Show export controls UI (PNG, SVG, Clipboard).',
    category: 'Controls'
  },
  {
    name: 'showUndoRedoControls',
    type: 'boolean',
    default: 'true',
    description: 'Show history controls UI (undo/redo).',
    category: 'Controls'
  },
  {
    name: 'showLayoutControls',
    type: 'boolean',
    default: 'false',
    description: 'Show auto-layout controls.',
    category: 'Controls'
  },

  // --- Behavior & Interaction ---
  {
    name: 'connectionValidator',
    type: '(source: string, target: string) => boolean',
    default: 'undefined',
    description: 'Custom function to validate connections globally.',
    category: 'Behavior'
  },
  {
    name: 'nodesResizable',
    type: 'boolean',
    default: 'true',
    description: 'Global toggle to enable/disable node resizing.',
    category: 'Behavior'
  },
  {
    name: 'snapToGrid',
    type: 'boolean',
    default: 'false',
    description: 'Enable snap-to-grid for node positioning.',
    category: 'Behavior'
  },
  {
    name: 'gridSize',
    type: 'number',
    default: '20',
    description: 'Grid size in pixels for snap-to-grid.',
    category: 'Behavior'
  },
  {
    name: 'preventNodeOverlap',
    type: 'boolean',
    default: 'false',
    description: 'Enable collision detection to prevent partial overlaps.',
    category: 'Behavior'
  },
  {
    name: 'nodeSpacing',
    type: 'number',
    default: '10',
    description: 'Minimum spacing between nodes when preventNodeOverlap is true.',
    category: 'Behavior'
  },
  {
    name: 'edgeReconnection',
    type: 'boolean',
    default: 'false',
    description: 'Allow dragging edge endpoints to reconnect them.',
    category: 'Behavior'
  },
  {
    name: 'maxConnectionsPerHandle',
    type: 'number',
    default: 'undefined',
    description: 'Global limit for connections per handle.',
    category: 'Behavior'
  },

  // --- Persistence ---
  {
    name: 'autoSave',
    type: 'boolean',
    default: 'false',
    description: 'Enable auto-saving of diagram state to localStorage.',
    category: 'Persistence'
  },
  {
    name: 'autoSaveInterval',
    type: 'number',
    default: '1000',
    description: 'Throttled auto-save interval in ms.',
    category: 'Persistence'
  }
];
