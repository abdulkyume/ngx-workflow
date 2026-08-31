# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.2] - 2026-08-31

### Added
- **`edge.data.centerAnchors`**: When `true`, parallel edges between the same node pair keep a **single shared anchor** at `sourceHandle` / `targetHandle` instead of spreading along the node border. Also applies automatically for **`bottom` → `top`** handle pairs (typical top-down state graphs).
- **`shouldRenderDefaultHandles()`**: Custom node types with `ports > 0` now render the built-in SVG port handles (top/bottom/left/right) so edge attachment matches default nodes.

### Fixed
- Custom node components (`nodeTypes` registry) with `ports: 2` no longer miss top/bottom handle anchors used by edge routing.

### Notes
- Peer dependencies remain `@angular/core|common|forms` **`>=17.1.0 <23.0.0`**. For strict template checking, use the same Angular major version as this workspace when linking locally (`file:` / `npm link`).

## [0.6.1] - 2026-08-23

### Added
- **Dynamic Overlay Panels (`<ngx-workflow-panel>`)**: Anchor arbitrary overlay components into the canvas with 9 viewport position presets (`top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`) and dynamic inline styles/classes.
- **Configurable Properties Sidebar (`[showPropertiesSidebar]`)**: Configurable input (defaults to `false`) allowing developers to handle `(nodeDoubleClick)` and `(edgeDoubleClick)` with custom dialogs, drawers, or REST API inspectors without unwanted default sidebar popups.
- **Interactive Workflow Legend & API Inspector Example**: Scenario in Examples gallery demonstrating live node status legends, active configuration inspector, and dynamic API syncing.
- **Node Defocus & Pane Click Auto-Dismiss**: Canvas deselection and node clicking automatically clear active inspector states and node focus.

### Changed
- Built-in properties editing sidebar (`[showPropertiesSidebar]`) defaults to `false` for cleaner headless integration.
- Expanded Examples gallery and Canvas Studio to edge-to-edge desktop layouts for higher diagram visibility.

## [0.5.2] - 2026-08-07

### Fixed
- Diagram theme is scoped to the diagram host only (`ThemeService` no longer mutates `document.documentElement`)
- Rubber-band selection no longer flashes on plain canvas clicks (drag threshold before the box appears)
- Safer browser API teardown for prerender/SSR hosts (`ResizeObserver` / `window` listeners skipped when unavailable)
- Node/edge colors from the properties sidebar now apply on the canvas (inline SVG styles; CSS no longer overrides custom fills/strokes)
- Edge flow animation applies when `animated: true` even if `animationType` is omitted (defaults to `'flow'`)
- Built-in edge markers (`arrow`, `arrowclosed`, `dot`) match the edge stroke color, including `rgba(...)`
- Controlled `[nodes]` / `[edges]` sync no longer clobbers in-flight sidebar style updates

### Added
- Properties sidebar RGBA color pickers (swatch + `rgba()` text + opacity) for node background / text / border and edge stroke / label / animation colors

### Changed
- Selection box API: `begin` / `moveTo` / `end` with pending-selection state (legacy `startSelecting` aliases retained where needed)
- Package metadata: docs homepage (`https://ngx-workflow.vercel.app`), richer keywords, `rxjs` peer, `publishConfig.access: public`
- Public API now exports `path-finder` utilities
- `CHANGELOG.md` is included in the published npm package
- Properties sidebar output renamed: `(change)` → `(nodeChange)` (avoids collision with native DOM `change` from color/range inputs). `(edgeChange)` is unchanged.
- `updateNode` / `updateEdge` deep-merge `style`, `labelStyle`, `animationStyle`, and `handleConfig`

### Breaking
- If you use `<ngx-workflow-properties-sidebar>` directly, bind `(nodeChange)` instead of `(change)` for node edits

## [0.5.1] - 2026-08-05

### Fixed
- Multiple `<ngx-workflow-diagram>` instances on one page no longer share state (per-diagram providers for state, drag, handles, undo/redo, etc.)
- Manual port-to-port connecting (handle clicks no longer start node drag)
- `maxConnectionsPerHandle` input signal was read without `()`, rejecting every manual connection
- Edges follow live node positions while dragging; proximity auto-connect respects the same validators/limits
- Controlled `[edges]` sync includes empty `[]` after the last edge is deleted

### Added
- `Node.maxConnectionsPerPort` and `handleConfig[port].maxConnections` for per-node / per-port edge limits
- Properties sidebar fields: **Max connections / port** and **Per-port limits**
- `ports: 0` option (hide all default handles)

### Changed
- CI / `engines` require Node.js **>= 22.22.3** (Angular 22 CLI)

### Notes
- Connection limit priority: `handleConfig[port].maxConnections` → `maxConnectionsPerPort` → `[maxConnectionsPerHandle]`

## [0.5.0] - 2026-08-05

### Changed
- Workspace upgraded to **Angular 22.1**
- Peer dependencies set to `@angular/core|common|forms` **`>=17.1.0 <23.0.0`** (Angular 17.1 through 22)
- Migrated all library and demo templates from `*ngIf` / `*ngFor` to built-in `@if` / `@for` control flow
- Demo site header no longer shows a hardcoded package version badge

### Notes
- Angular 14–16 are not supported: control flow and signal `input()`/`output()` require 17.1+

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
