# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-12-08

### 🎉 Major Feature Release

This release adds 8 powerful new features to enhance your workflow diagram experience!

### Added

#### Before Delete Hook
- New `beforeDelete` event emitter for controlling deletion operations
- Supports cancellation via `event.cancel()` callback
- Allows user confirmation before deleting nodes/edges

#### Z-Index Layer Management
- New `zIndexMode` input (`'default'` | `'layered'`)
- Keyboard shortcuts for layer management:
  - `Ctrl/Cmd + ]` - Bring to front
  - `Ctrl/Cmd + [` - Send to back
  - `Ctrl/Cmd + Shift + ]` - Raise layer
  - `Ctrl/Cmd + Shift + [` - Lower layer
- Context menu integration for z-index operations
- Node stacking order control with visual feedback

#### Connection Limits
- New `maxConnectionsPerHandle` input for global connection limits
- Per-handle configuration via `node.data.handleConfig`
- Automatic validation during connection creation
- Prevents invalid connections based on limits

#### Edge Label Components
- Support for custom Angular components as edge labels
- New `edgeLabelTemplate` content child for template reference
- Full component lifecycle support
- Backward compatible with text-based labels
- Interactive elements support (buttons, inputs, etc.)

#### Batch Operations
- New `DiagramStateService` methods:
  - `selectAll()` - Select all nodes
  - `deselectAll()` - Clear selection
  - `deleteAll()` - Delete all nodes and edges
  - `alignNodes(alignment)` - Align selected nodes (6 modes)
  - `distributeNodes(axis)` - Evenly distribute nodes (2 axes)
- Keyboard shortcut `Ctrl/Cmd + A` for select all
- Alignment modes: left, right, center, top, bottom, middle
- Distribution modes: horizontal, vertical

#### Mini-Map Enhancements
- New `showNodeColors` input for displaying node colors
- Selection highlighting with glow effects
- Pulse animation on viewport indicator
- Enhanced hover effects
- Better visual hierarchy

#### Node Collision Detection
- New `preventNodeOverlap` input to enable collision detection
- New `nodeSpacing` input for configurable spacing (default: 10px)
- Visual feedback with red border and shake animation
- AABB (Axis-Aligned Bounding Box) collision algorithm
- Real-time collision detection during drag
- Auto-clear on drag end

#### Additional Events
- `nodeMouseEnter` - Mouse entered node
- `nodeMouseLeave` - Mouse left node  
- `nodeMouseMove` - Mouse moved over node
- `edgeMouseEnter` - Mouse entered edge
- `edgeMouseLeave` - Mouse left edge
- `paneClick` - Canvas clicked
- `paneScroll` - Canvas scrolled
- `connectStart` - Connection drag started
- `connectEnd` - Connection drag ended
- `connectionDrop` - Connection dropped

### Fixed

- Fixed `foreignObject` blocking mouse events on edges with custom label components
- Fixed `toObservable()` injection context error (NG0203)
- Improved edge interaction when using custom label components

### Documentation

- Comprehensive README.md with complete API reference
- New FEATURES.md with detailed usage examples
- Updated keyboard shortcuts documentation
- Added interface definitions for all types
- Complete input/output documentation organized by category

### Changed

- Edge label rendering now supports both templates and text
- Improved visual feedback for all interactions
- Enhanced context menu with z-index operations

## [0.0.2] - Previous Release

Initial public release with core functionality.

---

## Migration Guide

### From 0.0.x to 0.1.0

All changes are **backward compatible**. New features are opt-in via inputs.

#### Enable New Features

```typescript
<!-- Before Delete Hook -->
<ngx-workflow-diagram (beforeDelete)="onBeforeDelete($event)">
</ngx-workflow-diagram>

<!-- Z-Index Management -->
<ngx-workflow-diagram [zIndexMode]="'layered'">
</ngx-workflow-diagram>

<!-- Connection Limits -->
<ngx-workflow-diagram [maxConnectionsPerHandle]="1">
</ngx-workflow-diagram>

<!-- Collision Detection -->
<ngx-workflow-diagram 
  [preventNodeOverlap]="true"
  [nodeSpacing]="10">
</ngx-workflow-diagram>

<!-- Mini-Map with Colors -->
<ngx-workflow-minimap [showNodeColors]="true">
</ngx-workflow-minimap>
```

No breaking changes - existing code continues to work without modification.
