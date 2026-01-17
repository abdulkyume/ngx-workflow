export interface OutputDoc {
    name: string;
    type: string;
    description: string;
    category: string;
}

export const OUTPUT_DOCS: OutputDoc[] = [
    // --- Node Events ---
    {
        name: 'nodeClick',
        type: 'EventEmitter<Node>',
        description: 'Emitted when a node is clicked.',
        category: 'Node Events'
    },
    {
        name: 'nodeDoubleClick',
        type: 'EventEmitter<Node>',
        description: 'Emitted when a node is double-clicked.',
        category: 'Node Events'
    },
    {
        name: 'nodeMouseEnter',
        type: 'EventEmitter<Node>',
        description: 'Emitted when mouse enters a node.',
        category: 'Node Events'
    },
    {
        name: 'nodeMouseLeave',
        type: 'EventEmitter<Node>',
        description: 'Emitted when mouse leaves a node.',
        category: 'Node Events'
    },
    {
        name: 'nodesChange',
        type: 'EventEmitter<Node[]>',
        description: 'Emitted when the nodes array changes (move, add, delete).',
        category: 'Node Events'
    },

    // --- Edge Events ---
    {
        name: 'edgeClick',
        type: 'EventEmitter<Edge>',
        description: 'Emitted when an edge is clicked.',
        category: 'Edge Events'
    },
    {
        name: 'edgeMouseEnter',
        type: 'EventEmitter<Edge>',
        description: 'Emitted when mouse enters an edge.',
        category: 'Edge Events'
    },
    {
        name: 'edgeMouseLeave',
        type: 'EventEmitter<Edge>',
        description: 'Emitted when mouse leaves an edge.',
        category: 'Edge Events'
    },
    {
        name: 'edgesChange',
        type: 'EventEmitter<Edge[]>',
        description: 'Emitted when the edges array changes.',
        category: 'Edge Events'
    },
    {
        name: 'connect',
        type: 'EventEmitter<Connection>',
        description: 'Emitted when a new connection is created between handles.',
        category: 'Edge Events'
    },

    // --- Global / Canvas Events ---
    {
        name: 'paneClick',
        type: 'EventEmitter<MouseEvent>',
        description: 'Emitted when the empty canvas (pane) is clicked.',
        category: 'Global Events'
    },
    {
        name: 'contextMenu',
        type: 'EventEmitter<Event>',
        description: 'Emitted on right-click (context menu event) on the canvas or items.',
        category: 'Global Events'
    },
    {
        name: 'beforeDelete',
        type: 'EventEmitter<{nodes, edges, cancel}>',
        description: 'Cancellable event emitted before deletion. Call cancel() to prevent default deletion.',
        category: 'Global Events'
    }
];
