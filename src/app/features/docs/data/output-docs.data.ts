export interface OutputDoc {
  name: string;
  type: string;
  description: string;
  category: string;
  /** Optional binding example shown on the detail page */
  example?: string;
}

export const OUTPUT_DOCS: OutputDoc[] = [
  // --- Node Events ---
  {
    name: 'nodeClick',
    type: 'output<Node>',
    description: 'Emitted when a node is clicked.',
    category: 'Node Events',
    example: `<ngx-workflow-diagram (nodeClick)="onNodeClick($event)" />`
  },
  {
    name: 'nodeDoubleClick',
    type: 'output<Node>',
    description: 'Emitted when a node is double-clicked.',
    category: 'Node Events'
  },
  {
    name: 'nodeMouseEnter',
    type: 'output<Node>',
    description: 'Emitted when the pointer enters a node.',
    category: 'Node Events'
  },
  {
    name: 'nodeMouseLeave',
    type: 'output<Node>',
    description: 'Emitted when the pointer leaves a node.',
    category: 'Node Events'
  },
  {
    name: 'nodeMouseMove',
    type: 'output<{ node: Node; event: MouseEvent }>',
    description: 'Emitted when the pointer moves over a node.',
    category: 'Node Events'
  },
  {
    name: 'nodesChange',
    type: 'output<Node[]>',
    description: 'Emitted when the nodes array changes (move, add, delete, property edits).',
    category: 'Node Events',
    example: `<ngx-workflow-diagram
  [nodes]="nodes()"
  (nodesChange)="nodes.set($event)"
/>`
  },

  // --- Edge Events ---
  {
    name: 'edgeClick',
    type: 'output<Edge>',
    description: 'Emitted when an edge is clicked.',
    category: 'Edge Events'
  },
  {
    name: 'edgeMouseEnter',
    type: 'output<Edge>',
    description: 'Emitted when the pointer enters an edge.',
    category: 'Edge Events'
  },
  {
    name: 'edgeMouseLeave',
    type: 'output<Edge>',
    description: 'Emitted when the pointer leaves an edge.',
    category: 'Edge Events'
  },
  {
    name: 'edgesChange',
    type: 'output<Edge[]>',
    description: 'Emitted when the edges array changes (connect, reconnect, delete).',
    category: 'Edge Events',
    example: `<ngx-workflow-diagram
  [edges]="edges()"
  (edgesChange)="edges.set($event)"
/>`
  },
  {
    name: 'connect',
    type: 'output<{ source: string; sourceHandle?: string; target: string; targetHandle?: string }>',
    description: 'Emitted when a new connection is successfully created between ports.',
    category: 'Edge Events',
    example: `<ngx-workflow-diagram
  (connect)="onConnect($event)"
/>

// Prefer (edgesChange) for controlled edge state —
// (connect) is a convenience event with the new link payload.`
  },
  {
    name: 'connectStart',
    type: 'output<{ nodeId: string; handleId?: string }>',
    description: 'Emitted when the user starts dragging a connection from a port.',
    category: 'Edge Events',
    example: `<ngx-workflow-diagram (connectStart)="onConnectStart($event)" />`
  },
  {
    name: 'connectEnd',
    type: 'output<{ nodeId: string; handleId?: string }>',
    description: 'Emitted when a connection drag ends (success or reject) over a target port.',
    category: 'Edge Events',
    example: `<ngx-workflow-diagram (connectEnd)="onConnectEnd($event)" />`
  },
  {
    name: 'edgeDrop',
    type: 'output<{ sourceNodeId: string; sourceHandleId: string; position: XYPosition }>',
    description: 'Emitted when a connection is dropped on empty canvas (no target port). Useful for “create node on drop” UX.',
    category: 'Edge Events',
    example: `<ngx-workflow-diagram (edgeDrop)="onEdgeDrop($event)" />`
  },
  {
    name: 'connectionDrop',
    type: 'output<{ position: XYPosition; event: PointerEvent; sourceNodeId: string; sourceHandleId?: string }>',
    description: 'Emitted when a connection line is dropped, including pointer event details.',
    category: 'Edge Events'
  },

  // --- Global / Canvas Events ---
  {
    name: 'paneClick',
    type: 'output<{ event: MouseEvent; position: XYPosition }>',
    description: 'Emitted when the empty canvas (pane) is clicked. Includes graph-space position.',
    category: 'Global Events',
    example: `<ngx-workflow-diagram (paneClick)="onPaneClick($event)" />`
  },
  {
    name: 'paneScroll',
    type: 'output<WheelEvent>',
    description: 'Emitted when the user scrolls / zooms with the wheel on the canvas.',
    category: 'Global Events'
  },
  {
    name: 'contextMenu',
    type: "output<{ type: 'node' | 'edge' | 'canvas'; item?: Node | Edge; event: MouseEvent }>",
    description: 'Emitted on right-click on the canvas, a node, or an edge.',
    category: 'Global Events'
  },
  {
    name: 'beforeDelete',
    type: 'output<{ nodes: Node[]; edges: Edge[]; cancel: () => void }>',
    description: 'Cancellable event before deletion. Call cancel() to prevent removing the selection.',
    category: 'Global Events',
    example: `<ngx-workflow-diagram
  (beforeDelete)="onBeforeDelete($event)"
/>

onBeforeDelete(e: { nodes: Node[]; edges: Edge[]; cancel: () => void }) {
  if (!confirm('Delete selection?')) e.cancel();
}`
  },
  {
    name: 'importError',
    type: 'output<{ message: string; error?: unknown }>',
    description: 'Emitted when JSON import fails validation or parsing.',
    category: 'Global Events',
    example: `<ngx-workflow-diagram (importError)="toast.error($event.message)" />`
  },

  // --- Toolbar & Zoom Controls ---
  {
    name: 'zoomControlsActionClick',
    type: 'output<{ id: string; action: string; event: MouseEvent }>',
    description: 'Emitted whenever any custom or built-in action button on the zoom & workflow toolbar is clicked.',
    category: 'Toolbar & Zoom Controls',
    example: `<ngx-workflow-diagram
  [zoomControlsConfig]="zoomConfig"
  (zoomControlsActionClick)="onToolbarAction($event)"
/>`
  },
  {
    name: 'fullscreen',
    type: 'output<void>',
    description: 'Emitted when canvas fullscreen is toggled via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  },
  {
    name: 'undo',
    type: 'output<void>',
    description: 'Emitted when undo is triggered via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  },
  {
    name: 'redo',
    type: 'output<void>',
    description: 'Emitted when redo is triggered via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  },
  {
    name: 'zoomIn',
    type: 'output<void>',
    description: 'Emitted when zoom-in is triggered via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  },
  {
    name: 'zoomOut',
    type: 'output<void>',
    description: 'Emitted when zoom-out is triggered via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  },
  {
    name: 'resetZoom',
    type: 'output<void>',
    description: 'Emitted when 1:1 zoom reset is triggered via the toolbar.',
    category: 'Toolbar & Zoom Controls'
  }
];

export const OUTPUT_CATEGORIES = [
  'Node Events',
  'Edge Events',
  'Global Events',
  'Toolbar & Zoom Controls'
] as const;

