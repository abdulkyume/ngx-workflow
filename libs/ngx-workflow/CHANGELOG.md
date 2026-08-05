# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-08-05

### Added
- `Node.maxConnectionsPerPort` and `handleConfig[port].maxConnections` for per-node / per-port edge limits
- Properties sidebar fields: **Max connections / port** and **Per-port limits**
- `ports: 0` option (hide all default handles)
- Docs site: full Inputs/Outputs catalogs with examples; connection-limits guides on API / Concepts / Customization

### Fixed
- Manual port-to-port connecting (handle clicks no longer start node drag)
- `maxConnectionsPerHandle` input signal was read without `()`, rejecting every manual connection
- Edges follow live node positions while dragging; proximity auto-connect respects the same validators/limits
- Controlled `[edges]` sync includes empty `[]` after the last edge is deleted

### Changed
- Workspace upgraded to **Angular 22.1**
- Peer dependencies set to `@angular/core|common|forms` **`>=17.1.0 <23.0.0`** (Angular 17.1 through 22)
- Migrated all library and demo templates from `*ngIf` / `*ngFor` to built-in `@if` / `@for` control flow
- Demo site header no longer shows a hardcoded package version badge

### Notes
- Angular 14–16 are not supported: control flow and signal `input()`/`output()` require 17.1+
- Connection limit priority: `handleConfig[port].maxConnections` → `maxConnectionsPerPort` → `[maxConnectionsPerHandle]`

## [0.4.2] - 2026-08-05

### Fixed
- Export `HandleComponent` from the public API and `NgxWorkflowModule` so custom nodes can use `<ngx-workflow-handle>`
- Wire `showUndoRedoControls` into the diagram shell (controls were documented but never rendered)
- Zoom controls **Fit View** now calls `fitView()` instead of resetting zoom to `1`
- Add `@angular/forms` peer dependency (required by CVA, validators, and form-bound UI)
- Restore Canvas Studio (`/sandbox`) demo route previously gitignored/missing
- Surface JSON import failures via `importError` output and an inline notification

### Changed
- Peer dependency floor set to Angular `>=17.1.0` (signal `input()` / `output()`)
- Export additional services (`AutoSaveService`, `SearchService`, `ContextMenuService`, `HandleRegistryService`) and `version.model`
- Export `VersionHistoryComponent`, `ContextMenuComponent`, `GridOverlayComponent`, and `RoundedRectNodeComponent` from `NgxWorkflowModule`
- Documentation scrub: remove Dagre/`BaseEdge`/`NgxFlowModule` claims; document `edgeReconnectable` and ELK layouts accurately

### Added
- GitHub Actions CI (library build, tests, demo build, format check)
- Root scripts: `build:lib`, `build:web`, `test:lib`, `lint`, `format`, `pack:lib`

## [0.4.1] - 2026-01-18

### Added
- Execution simulator controls and status tracking
- Mermaid and React Flow adapters
- Node palette stencil panel
- Typed port/`dataType` validation on handles
- Manual edge waypoints
- Reactive forms `ControlValueAccessor` support and graph validators

### Changed
- Packaging and documentation updates for the 0.4.x line

## [0.4.0] - 2025-12-20

### Added
- Smart edge routing (`type: 'smart'`) with obstacle avoidance
- Touch gesture support (pinch-zoom, two-finger pan)
- Collapsible groups / nested sub-flows
- Parallel edge offsetting
- Performance virtualization (off-screen culling)

## [0.3.0] - 2025-12-15

### Added
- Search controls (`Ctrl+F`)
- Properties sidebar for node/edge editing
- Auto-save + version history helpers
- Theme/`colorMode` support
- Export controls UI (PNG, SVG, clipboard, JSON import/export)

## [0.2.0] - 2025-12-12

### Added
- Enhanced multi-selection and alignment guides
- Layout alignment controls (ELK + force/hierarchical/circular helpers)
- Keyboard navigation improvements
- Context menu actions

## [0.1.0] - 2025-12-08

### Added
- Before delete hook
- Z-index layer management
- Connection limits
- Edge label components
- Batch operations (`selectAll`, `alignNodes`, `distributeNodes`, …)
- Mini-map enhancements
- Node collision detection
- Additional interaction events (`nodeMouseEnter`, `paneClick`, `connectStart`, …)

### Fixed
- `foreignObject` blocking mouse events on edges with custom label components
- `toObservable()` injection context error (NG0203)

## [0.0.2] - Previous Release

Initial public release with core functionality.

---

## Migration Guide

### From 0.4.x to 0.5.0

- Requires Angular **17.1+** (through 22); Angular 14–16 are unsupported
- Consumer apps should prefer `@if` / `@for` when copying library examples
- No breaking public TypeScript API changes beyond the peer range clarification

### From 0.4.1 to 0.4.2

- Ensure `@angular/forms` is installed (now a peer dependency)
- Prefer Angular 17.1+
- Rename any documented `edgeReconnection` bindings to **`edgeReconnectable`**
- Use `fitView()` method (there is no `fitView` input)
- Import `HandleComponent` from `ngx-workflow` for custom nodes

### From 0.0.x to 0.1.0

All 0.1.0 changes were backward compatible and opt-in via inputs.
