# ngx-workflow Roadmap

## Currently Available (v0.5.0)

### Core Features
- Node grouping with parent/child relationships
- Grid overlay & snap-to-grid
- Fit view & viewport management
- Edge types (bezier, straight, step, smoothstep, smart)
- Smart edge routing with obstacle avoidance
- Export controls (JSON, PNG, SVG)
- Layout controls (ELK + force / hierarchical / circular helpers)
- Background patterns (dots, lines, cross)
- Node resizing
- Edge reconnection (`edgeReconnectable`)
- Manual port-to-port connect + proximity auto-connect
- Connection limits: global (`maxConnectionsPerHandle`), per-node (`maxConnectionsPerPort`), per-port (`handleConfig.maxConnections`)
- Properties sidebar port / connection-limit editors
- Copy/paste/duplicate
- Undo/redo (including built-in controls)
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

---

## Upcoming

### v0.6.0 - Selection & Ergonomics
- Shift+Click range selection refinements
- Include edges in lasso selection
- Selection counter UI
- Invert selection command
- Custom tooltip templates for nodes/edges

### v0.6.0 - Advanced Layouts
- Swimlanes (horizontal & vertical)
- Lane constraints and nested lanes
- Richer layout transition animations

### v1.0.0 - Production Hardening
- Virtual rendering for 1000+ nodes (expand current culling)
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

---

Help prioritize on [GitHub Discussions](https://github.com/abdulkyume/ngx-workflow/discussions) or [open a feature request](https://github.com/abdulkyume/ngx-workflow/issues/new).

**Last Updated**: August 2026
