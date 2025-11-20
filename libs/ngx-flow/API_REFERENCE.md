# API Reference for ngx-flow

This document provides a comprehensive overview of the public API for the `ngx-flow` library.

---

## `NgxFlowModule`

The main Angular module to import into your application. It provides all necessary components, services, and directives.

**Usage (Standalone App - `app.config.ts`):**

```typescript
import { importProvidersFrom } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxFlowModule } from 'ngx-flow';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(CommonModule, NgxFlowModule),
    // ... other providers, including custom node/edge types
  ]
};
```

---

## Components

### `<ngx-diagram>`

The main container for your flow chart. All nodes, edges, and interactions happen within this component.

**Selector:** `ngx-diagram`

**Inputs:**
None (currently, all data and state are managed via `DiagramStateService`).

**Outputs:**
None (all events are emitted via `DiagramStateService`).

---

### `<ngx-node>`

The wrapper component for rendering individual nodes. It handles positioning, dragging, selection, and embedding custom node types.

**Selector:** `ngx-node`

**Inputs:**
-   `node: Node` (required): The `Node` object to be rendered.

**Outputs:**
None (all node-related events are emitted via `DiagramStateService`).

---

### `<ngx-edge>`

The wrapper component for rendering individual edges. It handles path calculation, interaction, and embedding custom edge types (though currently, custom edge *types* are handled via path generation functions).

**Selector:** `ngx-edge`

**Inputs:**
-   `edge: Edge | TempEdge` (required): The `Edge` or `TempEdge` object to be rendered.
-   `isTemporary: boolean` (optional): If true, renders a temporary (preview) edge.

**Outputs:**
None (all edge-related events are emitted via `DiagramStateService`).

---

### `<ngx-handle>`

Represents a connectable handle on a node, used for initiating and completing connections.

**Selector:** `ngx-handle`

**Inputs:**
-   `type: 'source' | 'target'` (required): Specifies if the handle is for source or target connections.
-   `position: 'top' | 'right' | 'bottom' | 'left'` (required): Relative position of the handle on the node.
-   `id?: string`: Unique identifier for the handle within its node.
-   `nodeId: string` (required): The ID of the parent node.

**Outputs:**
None (connection events are handled internally and emitted via `DiagramStateService`).

---

### `RoundedRectNodeComponent` (Example Custom Node)

A sample custom node component provided by the library.

**Selector:** `ngx-rounded-rect-node`

**Inputs:**
-   `node: Node`: The `Node` object to display.

---

## Services

### `DiagramStateService`

A singleton service managing the entire state of the diagram (nodes, edges, viewport) using Angular Signals. It's the central hub for modifying and querying the diagram's state.

**Properties (Signals):**
-   `nodes: WritableSignal<Node[]>`: A signal holding the array of all nodes in the diagram.
-   `edges: WritableSignal<Edge[]>`: A signal holding the array of all edges in the diagram.
-   `tempEdges: WritableSignal<TempEdge[]>`: A signal holding temporary (preview) edges during connection.
-   `viewport: WritableSignal<Viewport>`: A signal holding the current pan and zoom state.
-   `selectedNodes: Signal<Node[]>`: A computed signal returning currently selected nodes.
-   `selectedEdges: Signal<Edge[]>`: A computed signal returning currently selected edges.

**Methods:**
-   `addNode(node: Node): void`: Adds a new node to the diagram.
-   `updateNode(id: string, changes: Partial<Node>): void`: Updates properties of an existing node.
-   `removeNode(id: string): void`: Removes a node and its associated edges.
-   `moveNode(id: string, newPosition: XYPosition): void`: Updates a node's position.
-   `addEdge(edge: Edge): void`: Adds a new edge to the diagram.
-   `removeEdge(id: string): void`: Removes an edge.
-   `addTempEdge(edge: TempEdge): void`: Adds a temporary edge (for connection preview).
-   `updateTempEdgeTarget(id: string, targetPosition: XYPosition): void`: Updates the target position of a temporary edge.
-   `setViewport(viewport: Partial<Viewport>): void`: Updates the viewport (pan/zoom).
-   `selectNodes(nodeIds: string[], multi: boolean = false): void`: Selects/deselects nodes. If `multi` is true, it toggles selection for `nodeIds`.
-   `clearSelection(): void`: Deselects all nodes and edges.
-   `multiSelect(nodeId: string): void`: Toggles the selection state of a single node.
-   `deleteSelectedElements(): void`: Deletes all currently selected nodes and edges.
-   `undo(): void`: Undoes the last diagram modification.
-   `redo(): void`: Redoes the last undone diagram modification.

**Events (Emitters):**
-   `nodeClick: EventEmitter<Node>`: Emits the `Node` object when a node is clicked.
-   `edgeClick: EventEmitter<Edge>`: Emits the `Edge` object when an edge is clicked.
-   `connect: EventEmitter<{ source: string; sourceHandle?: string; target: string; targetHandle?: string }>`: Emits connection details when a new edge is successfully created.
-   `dragStart: EventEmitter<Node>`: Emits the `Node` being dragged when dragging starts.
-   `dragEnd: EventEmitter<Node>`: Emits the `Node` that was dragged when dragging ends.
-   `nodesChange: EventEmitter<Node[]>`: Emits the updated array of nodes when it changes.
-   `edgesChange: EventEmitter<Edge[]>`: Emits the updated array of edges when it changes.
-   `viewportChange: EventEmitter<Viewport>`: Emits the updated viewport object when it changes.

---

### `LayoutService`

Provides methods for applying automatic graph layout algorithms to your nodes and edges.

**Methods:**
-   `applyDagreLayout(nodes: Node[], edges: Edge[], options?: { rankdir?: 'TB' | 'LR'; align?: 'UL' | 'UR' | 'DL' | 'DR'; nodesep?: number; ranksep?: number }): Promise<Node[]>`: Applies the Dagre layout algorithm. Returns a Promise resolving to an array of nodes with updated positions.
-   `applyElkLayout(nodes: Node[], edges: Edge[], options?: any): Promise<Node[]>`: Applies the ELK layout algorithm. Returns a Promise resolving to an array of nodes with updated positions.

---

### `UndoRedoService`

Manages the history of diagram states, allowing for undo and redo operations. Typically injected and used by `DiagramStateService`.

**Properties (Signals):**
-   `canUndo: Signal<boolean>`: A computed signal indicating if an undo operation is possible.
-   `canRedo: Signal<boolean>`: A computed signal indicating if a redo operation is possible.

**Methods:**
-   `saveState(currentState: DiagramState): void`: Saves the current state to the undo stack.
-   `undo(currentState: DiagramState): DiagramState | undefined`: Pops the last state from the undo stack and returns it. Moves the current state to the redo stack.
-   `redo(currentState: DiagramState): DiagramState | undefined`: Pops the last state from the redo stack and returns it. Moves the current state to the undo stack.
-   `clearStacks(): void`: Clears both the undo and redo stacks.

---

## Data Models

### `Node`

Interface representing a node in the diagram.

```typescript
export interface Node<T = any> {
  id: string;
  position: XYPosition; // Top-left corner of the node
  data?: T;             // Custom data associated with the node
  type?: string;        // Identifier for custom node component lookup
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
  draggable?: boolean;  // Can this node be dragged?
  class?: string;       // Custom CSS class for the node
  style?: Record<string, string>; // Inline styles for the node
}
```

### `Edge`

Interface representing an edge (connection) between two nodes.

```typescript
export interface Edge {
  id: string;
  source: string;        // ID of the source node
  target: string;        // ID of the target node
  sourceHandle?: string; // ID of the source handle on the source node
  targetHandle?: string; // ID of the target handle on the target node
  type?: string;         // Identifier for edge type (e.g., 'bezier', 'step', 'straight')
  animated?: boolean;
  selected?: boolean;
  data?: any;            // Custom data associated with the edge
  class?: string;
  style?: Record<string, string>;
}
```

### `TempEdge`

Extended interface for temporary edges (used for connection previews).

```typescript
export interface TempEdge extends Edge {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}
```

### `Viewport`

Interface representing the current state of the diagram's viewport.

```typescript
export interface Viewport {
  x: number;    // X-translation
  y: number;    // Y-translation
  zoom: number; // Zoom level
}
```

### `XYPosition`

Simple interface for 2D coordinates.

```typescript
export interface XYPosition {
  x: number;
  y: number;
}
```

### `Dimensions`

Simple interface for 2D dimensions.

```typescript
export interface Dimensions {
  width: number;
  height: number;
}
```

### `DiagramState`

Interface representing a full snapshot of the diagram's state, used by `UndoRedoService`.

```typescript
export interface DiagramState {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}
```

---

## Injection Tokens

### `NGX_FLOW_NODE_TYPES`

An `InjectionToken` used to provide a map of custom node types (string keys to `NodeComponentType` values).

```typescript
export const NGX_FLOW_NODE_TYPES = new InjectionToken<Record<string, NodeComponentType>>('NGX_FLOW_NODE_TYPES');
```

### `NGX_FLOW_EDGE_TYPES`

An `InjectionToken` used to provide a map of custom edge types (string keys to `EdgeComponentType` values).
(Currently not fully utilized for custom *components*, but available for future expansion if custom edge *components* are needed beyond path styles).

```typescript
export const NGX_FLOW_EDGE_TYPES = new InjectionToken<Record<string, EdgeComponentType>>('NGX_FLOW_EDGE_TYPES');
```
