export interface InputDoc {
  name: string;
  type: string;
  default: string;
  description: string;
  category: string;
  /** Optional TypeScript / template example shown on the detail page */
  example?: string;
}

export const INPUT_DOCS: InputDoc[] = [
  // --- Data ---
  {
    name: 'nodes',
    type: 'Node[]',
    default: '[]',
    description: 'Controlled array of nodes to display. Syncs into diagram state when provided.',
    category: 'Data',
    example: `<ngx-workflow-diagram
  [nodes]="nodes()"
  (nodesChange)="nodes.set($event)"
/>`
  },
  {
    name: 'edges',
    type: 'Edge[] | undefined',
    default: 'undefined',
    description: 'Controlled edges array. Pass an array (including []) for controlled mode; omit for uncontrolled internal state.',
    category: 'Data',
    example: `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  (edgesChange)="edges.set($event)"
/>`
  },
  {
    name: 'initialNodes',
    type: 'Node[]',
    default: '[]',
    description: 'Seed nodes used once on first init when not driving [nodes] as controlled state.',
    category: 'Data',
    example: `<ngx-workflow-diagram [initialNodes]="seedNodes" [initialEdges]="seedEdges" />`
  },
  {
    name: 'initialEdges',
    type: 'Edge[]',
    default: '[]',
    description: 'Seed edges used once on first init when not driving [edges] as controlled state.',
    category: 'Data',
    example: `<ngx-workflow-diagram [initialNodes]="seedNodes" [initialEdges]="seedEdges" />`
  },
  {
    name: 'nodeTypes',
    type: 'Record<string, Type<any>>',
    default: '{}',
    description: 'Map of custom node type name → Angular component class.',
    category: 'Data',
    example: `<ngx-workflow-diagram
  [nodes]="nodes()"
  [nodeTypes]="{ card: CustomCardNodeComponent }"
/>`
  },
  {
    name: 'defsTemplate',
    type: 'TemplateRef<any>',
    default: 'undefined',
    description: 'Angular template containing SVG <defs> (markers, gradients, filters).',
    category: 'Data',
    example: `<ngx-workflow-diagram [defsTemplate]="myDefs">
  <ng-template #myDefs>
    <marker id="my-arrow" ...>...</marker>
  </ng-template>
</ngx-workflow-diagram>`
  },
  {
    name: 'edgeTemplate',
    type: 'TemplateRef<any>',
    default: 'undefined',
    description: 'Custom template for rendering edge labels / overlays.',
    category: 'Data'
  },

  // --- Viewport & Navigation ---
  {
    name: 'initialViewport',
    type: 'Viewport',
    default: 'undefined',
    description: 'Initial viewport state { x, y, zoom }. Useful for restoring saved views.',
    category: 'Viewport',
    example: `<ngx-workflow-diagram [initialViewport]="{ x: 0, y: 0, zoom: 1 }" />`
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
    description: 'Pan canvas automatically when dragging a node near the viewport edge.',
    category: 'Viewport'
  },
  {
    name: 'autoPanOnConnect',
    type: 'boolean',
    default: 'true',
    description: 'Pan canvas automatically when dragging a connection near the viewport edge.',
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
    description: 'Distance in pixels from the viewport edge to trigger auto-pan.',
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
    description: 'Background pattern style.',
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
    description: 'Size of background pattern elements (e.g. dot radius).',
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
    default: "'transparent'",
    description: 'Base canvas background color.',
    category: 'Appearance'
  },
  {
    name: 'colorMode',
    type: "'light' | 'dark' | 'system'",
    default: 'undefined (inherit host app)',
    description: 'Color theme for this diagram only. When unset, inherits the host page theme and never mutates document.documentElement.',
    category: 'Appearance'
  },
  {
    name: 'zIndexMode',
    type: "'default' | 'layered'",
    default: "'default'",
    description: 'Strategy for node z-indexing / stacking.',
    category: 'Appearance'
  },
  {
    name: 'showGrid',
    type: 'boolean',
    default: 'false',
    description: 'Show a grid overlay on the canvas.',
    category: 'Appearance'
  },

  // --- Controls & UI ---
  {
    name: 'showZoomControls',
    type: 'boolean',
    default: 'true',
    description: 'Show zoom in / out / fit view controls.',
    category: 'Controls'
  },
  {
    name: 'showMinimap',
    type: 'boolean',
    default: 'true',
    description: 'Show the minimap overlay.',
    category: 'Controls'
  },
  {
    name: 'showExportControls',
    type: 'boolean',
    default: 'false',
    description: 'Show export controls UI (PNG, SVG, clipboard, JSON).',
    category: 'Controls'
  },
  {
    name: 'showUndoRedoControls',
    type: 'boolean',
    default: 'true',
    description: 'Show undo / redo history controls.',
    category: 'Controls'
  },
  {
    name: 'showLayoutControls',
    type: 'boolean',
    default: 'false',
    description: 'Show auto-layout / alignment controls.',
    category: 'Controls'
  },

  // --- Behavior & Interaction ---
  {
    name: 'connectionValidator',
    type: '(source: string, target: string) => boolean',
    default: 'undefined',
    description: 'Global custom validator for new connections (node ids only).',
    category: 'Behavior',
    example: `<ngx-workflow-diagram
  [connectionValidator]="(s, t) => s !== t"
/>`
  },
  {
    name: 'validateConnection',
    type: '(connection) => boolean',
    default: 'undefined',
    description: 'Richer connection validation including source/target handle ids.',
    category: 'Behavior',
    example: `<ngx-workflow-diagram
  [validateConnection]="(c) => c.sourceHandle !== c.targetHandle"
/>`
  },
  {
    name: 'maxConnectionsPerHandle',
    type: 'number | undefined',
    default: 'undefined',
    description:
      'Global max edges per port. Overridden by node.maxConnectionsPerPort and handleConfig[port].maxConnections. Leave undefined for unlimited.',
    category: 'Behavior',
    example: `<!-- Global: every port on every node -->
<ngx-workflow-diagram [maxConnectionsPerHandle]="1" />

<!-- Or per node / per port (Node model) -->
nodes = [{
  id: 'a',
  position: { x: 0, y: 0 },
  maxConnectionsPerPort: 2,
  handleConfig: {
    bottom: { maxConnections: 1 }
  }
}];`
  },
  {
    name: 'proximityThreshold',
    type: 'number',
    default: '200',
    description: 'Distance (graph units) for auto-connect when dragging a node near another.',
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
    description: 'Snap node positions to the grid while dragging.',
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
    description: 'Enable collision detection to prevent nodes overlapping.',
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
    name: 'edgeReconnectable',
    type: 'boolean',
    default: 'false',
    description: 'Allow dragging edge endpoints to reconnect them to other ports.',
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
    description: 'Throttled auto-save interval in milliseconds.',
    category: 'Persistence'
  },
  {
    name: 'maxVersions',
    type: 'number',
    default: '10',
    description: 'Max number of auto-save version snapshots to keep.',
    category: 'Persistence'
  }
];

export const INPUT_CATEGORIES = [
  'Data',
  'Viewport',
  'Appearance',
  'Controls',
  'Behavior',
  'Persistence'
] as const;
