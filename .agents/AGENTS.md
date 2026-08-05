# AI Agent Guidelines & Project Architecture Map (`ngx-workflow`)

> **IMPORTANT FOR AI AGENTS**: Read this document first before exploring the workspace. This map contains exact file paths, architecture guidelines, and instructions designed to minimize token usage when performing tasks in this repository.

---

## ⚡ Token-Efficient Workflow Rules
1. **Never do recursive directory listings** across `node_modules`, `dist`, `.angular`, or documentation folders. Use the **Directory & Architecture Map** below to jump directly to the target file.
2. **Use Bounded Line Ranges for Large Files**:
   - `diagram-state.service.ts` is ~58 KB. When viewing state service methods, specify `StartLine` and `EndLine` in `view_file`.
3. **Use Targeted Grep**: When searching for symbols, pass `Includes: ["libs/ngx-workflow/src/**/*.ts"]` or `Includes: ["src/**/*.ts"]` to `grep_search`.
4. **Commands**: Use exact Angular CLI commands specified below without unnecessary trial-and-error runs.

---

## 🏗️ Repository Architecture & Directory Map

### 📦 Library Core: `libs/ngx-workflow/src/lib/`

| Feature Area | Folder / File Path | Key Responsibilities |
| :--- | :--- | :--- |
| **Main Diagram** | [`components/diagram/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/diagram) | Main `<ngx-workflow-diagram>` container & canvas |
| **Background & Grid** | [`components/background/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/background), [`components/grid-overlay/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/grid-overlay) | Grid rendering & background patterns |
| **Nodes & Handles** | [`components/custom-node/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/custom-node), [`components/handle/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/handle) | Node wrappers & connection ports/handles |
| **Toolbars & Panels** | [`components/node-toolbar/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/node-toolbar), [`components/panel/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/panel), [`components/properties-sidebar/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/properties-sidebar) | Floating node toolbar, custom panels, sidebar editor |
| **Controls** | [`components/zoom-controls/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/zoom-controls), [`components/undo-redo-controls/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/undo-redo-controls), [`components/export-controls/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/export-controls), [`components/search-controls/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/search-controls), [`components/layout-alignment-controls/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/layout-alignment-controls) | Interactive control overlays |
| **Minimap & History** | [`components/minimap/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/minimap), [`components/version-history/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/version-history) | Minimap navigation & diagram version control |
| **Context Menu** | [`components/context-menu/`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/components/context-menu) | Canvas & node right-click context menu |

---

### ⚙️ Services: `libs/ngx-workflow/src/lib/services/`

| Service File | Purpose |
| :--- | :--- |
| [`diagram-state.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/diagram-state.service.ts) | Central RxJS state (nodes, edges, selection, viewport, history) |
| [`layout.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/layout.service.ts) | Automatic layout calculations via ELK.js (`elkjs`) |
| [`auto-layout.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/auto-layout.service.ts) | Trigger auto-layout execution |
| [`export.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/export.service.ts) | Exporting canvas to PNG, SVG, or JSON |
| [`undo-redo.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/undo-redo.service.ts) | Undo/Redo history stack manager |
| [`search.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/search.service.ts) | Node & edge search/filter operations |
| [`theme.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/theme.service.ts) | Light / Dark / Custom theme switcher |
| [`handle-registry.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/handle-registry.service.ts) | Manages node handle port positions |

---

### 📐 Models & Utilities

| Type / Model | File Location | Key Types |
| :--- | :--- | :--- |
| **Node Models** | [`models/node.model.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/models/node.model.ts) | `WorkflowNode`, `NodeData`, `Position`, `Dimensions` |
| **Edge Models** | [`models/edge.model.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/models/edge.model.ts) | `WorkflowEdge`, `EdgeType`, `Connection` |
| **Viewport State** | [`models/viewport.model.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/models/viewport.model.ts) | `ZoomState`, `PanState`, `Viewport` |
| **Path Calculations**| [`utils/path-finder.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/utils/path-finder.ts), [`utils/path-getters.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/utils/path-getters.ts) | SVG curve, orthogonal step & straight path routing |

---

### 🚀 Public API & Entry Points
- Public API exports: [`libs/ngx-workflow/src/public-api.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/public-api.ts)
- Root Module: [`libs/ngx-workflow/src/lib/ngx-workflow.module.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/ngx-workflow.module.ts)
- Demo Application Root: [`src/app/app.ts`](file:///d:/personal/uparjon/ngx-workflow/src/app/app.ts)

---

## 🛠️ Build & Test Commands

| Task | Command |
| :--- | :--- |
| **Build Library** | `npx ng build ngx-workflow` |
| **Watch Library Build** | `npx ng build ngx-workflow --watch` |
| **Serve Demo App** | `npx ng serve` |
| **Run Unit Tests** | `npm test` |
| **Build Demo App** | `npx ng build` |

---

## 🎨 Coding & Component Conventions
1. **Angular Standalone & Signal Inputs Architecture**: All components MUST use modern Signal inputs (`input()`, `input.required()`) and Dependency Injection via `inject()` instead of `@Input()` decorators and constructor injection.
2. **Reactivity & Effects**: Use `effect()` and `computed()` signals for reactive state synchronization instead of manual `ngOnChanges` where applicable.
3. **State Management**: Modify diagram state via [`diagram-state.service.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/lib/services/diagram-state.service.ts). Do not mutate state objects directly.
4. **Exporting New Symbols**: Any component, service, or model intended for public library consumers **must** be exported in [`public-api.ts`](file:///d:/personal/uparjon/ngx-workflow/libs/ngx-workflow/src/public-api.ts).

---

## 🧪 Mandatory Unit Testing & High Coverage Rule
1. **Mandatory Test Writing**: Whenever creating a new component, service, utility, or modifying existing implementation logic, AI agents **MUST** immediately write or update the corresponding `.spec.ts` unit test file.
2. **Test Verification**: Before declaring any feature or bug fix complete, run `npx ng test ngx-workflow --watch=false` to verify that all unit tests execute with a **100% pass rate**.
3. **Coverage Retention**: High statement, branch, and function coverage across the library must be preserved for all future features.

