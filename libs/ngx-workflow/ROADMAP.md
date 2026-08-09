# ngx-workflow Roadmap

## Currently Available (v0.6.0)

### Core Features
- Node grouping with parent/child relationships
- Grid overlay & snap-to-grid
- Fit view & viewport management (animated `duration` supported)
- Edge types (bezier, straight, step, smoothstep, smart) + custom edge components/templates
- Smart edge routing with obstacle avoidance
- Edge animation (`flow` / `dot` / `both`) with duration + animation color
- Multi-position edge labels (`start` / `center` / `end`)
- Built-in markers tinted to match edge stroke (incl. `rgba`)
- RGBA node/edge colors via properties sidebar or `style` fields
- Export controls (JSON, PNG, SVG)
- Layout controls (ELK + force / hierarchical / circular helpers)
- Background patterns (dots, lines, cross)
- Node resizing (corners + mid-edge handles)
- Edge reconnection (`edgeReconnectable`)
- Manual port-to-port connect + proximity auto-connect
- `connectionMode` (`loose` | `strict`) and `selectionMode` (`partial` | `full`)
- Connection limits: global (`maxConnectionsPerHandle`), per-node (`maxConnectionsPerPort`), per-port (`handleConfig.maxConnections`)
- Properties sidebar: port limits, RGBA pickers, edge animation & markers (`nodeChange` / `edgeChange`)
- Copy/paste/duplicate
- Undo/redo (including built-in controls)
- Configurable `keyboardShortcuts` map
- Before delete hook
- Z-index layer management
- Edge label components
- Batch operations
- Mini-map enhancements
- Collision detection
- Search & filtering UI
- Touch gestures (pinch zoom / two-finger pan)
- Format adapters (Mermaid, React Flow)
- Reactive forms (`ControlValueAccessor`) + validators
- Execution simulator controls
- Node palette
- Angular 17.1–22 peer support (`@if` / `@for`, signal I/O)

### Customization & DX (ngx-vflow parity)
- Custom node components via `NGX_WORKFLOW_NODE_TYPES` / `[nodeTypes]` (passes `node` input)
- HTML / SVG projected node templates (`html-template` / `svg-template`)
- Custom edge components via `NGX_WORKFLOW_EDGE_TYPES` / `[edgeTypes]` + `[edgeTemplate]`
- `createNode` / `createEdge` / `createNodes` / `createEdges` factories
- Typed `(nodeChanges)` / `(edgeChanges)` streams + ChangesController host directive
- `(componentNodeEvent)` bridge via `ComponentNodeEventService`
- `NgxWorkflowConnectionControllerDirective` for validation helpers
- `ngxWorkflowDragHandle` directive
- `selectable` / `connectable` node flags
- Lazy node type factories + `[optimization]` (`lazyLoadTrigger`, `detachedGroupsLayer`, virtualization knobs)
- Viewport virtualization: spatial-index culling, adaptive buffer, hysteresis, selected stickiness, soft `maxRenderedNodes`, edge modes
- `ngx-workflow/testing` mocks (`NgxWorkflowMocks`, fixtures, `provideNgxWorkflowTesting`)
- Generated Compodoc API site at `/compodoc/` (built with the marketing site)

---

## Upcoming

### v0.7.0 - Selection & Ergonomics
- Shift+Click range selection refinements
- Selection counter UI
- Invert selection command
- Custom tooltip templates for nodes/edges

### v0.7.0 - Advanced Layouts
- Swimlanes (horizontal & vertical)
- Lane constraints and nested lanes
- Richer layout transition animations

### v1.0.0 - Production Hardening
- DOM recycle pool for custom node component instances (beyond spatial cull)
- Web Workers for heavy layout/routing
- E2E + visual regression suite
- WCAG 2.1 AA certification push
- Plugin registration API

---

## Quick Wins (shipped)

1. Node Badges ✅
2. Node Shadows ✅
3. Background Images ✅
4. Zoom Limits ✅
5. Custom Cursors ✅
6. Selection Indicators ✅
7. Connection Previews ✅
8. Quick Actions Menu ✅
9. Custom edge wiring ✅
10. Testing entrypoint ✅

---

Help prioritize on [GitHub Discussions](https://github.com/abdulkyume/ngx-workflow/discussions) or [open a feature request](https://github.com/abdulkyume/ngx-workflow/issues/new).

**Last Updated**: August 2026
