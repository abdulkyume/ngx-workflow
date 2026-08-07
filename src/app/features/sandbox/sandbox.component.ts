import { JsonPipe } from '@angular/common';
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramComponent, Edge, NgxWorkflowModule, Node } from 'ngx-workflow';
import { INPUT_CATEGORIES, INPUT_DOCS, InputDoc } from '../docs/data/input-docs.data';
import { OUTPUT_CATEGORIES, OUTPUT_DOCS, OutputDoc } from '../docs/data/output-docs.data';

type BackgroundVariant = 'dots' | 'lines' | 'cross';
type ColorMode = 'light' | 'dark';
type ZIndexMode = 'default' | 'layered';
type BottomTab = 'log' | 'filters';

interface OutputLogEntry {
  id: number;
  name: string;
  time: string;
  payload: unknown;
}

/**
 * Layout follows researched developer-tool patterns:
 * - React Flow Playground: left props sidebar → canvas result
 * - Storybook: dominant preview + bottom Actions panel for emits
 * - Evil Martians: left controls right; canvas is primary; ≤3 options use radios;
 *   label–value property rows; compact toolbar; collapsible panels
 * - IDE (Unity / Luna Park): console/logs along the bottom, not a second sidebar
 */
interface SandboxInputState {
  showBackground: boolean;
  backgroundVariant: BackgroundVariant;
  backgroundGap: number;
  backgroundSize: number;
  backgroundColor: string;
  backgroundBgColor: string;
  colorMode: ColorMode;
  zIndexMode: ZIndexMode;
  showGrid: boolean;
  showZoomControls: boolean;
  showMinimap: boolean;
  showExportControls: boolean;
  showUndoRedoControls: boolean;
  showLayoutControls: boolean;
  minZoom: number;
  maxZoom: number;
  autoPanOnNodeDrag: boolean;
  autoPanOnConnect: boolean;
  autoPanSpeed: number;
  autoPanEdgeThreshold: number;
  maxConnectionsPerHandle: number | undefined;
  proximityThreshold: number;
  nodesResizable: boolean;
  snapToGrid: boolean;
  gridSize: number;
  preventNodeOverlap: boolean;
  nodeSpacing: number;
  edgeReconnectable: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  maxVersions: number;
}

const CONTROLLABLE_INPUTS = new Set<keyof SandboxInputState>([
  'showBackground',
  'backgroundVariant',
  'backgroundGap',
  'backgroundSize',
  'backgroundColor',
  'backgroundBgColor',
  'colorMode',
  'zIndexMode',
  'showGrid',
  'showZoomControls',
  'showMinimap',
  'showExportControls',
  'showUndoRedoControls',
  'showLayoutControls',
  'minZoom',
  'maxZoom',
  'autoPanOnNodeDrag',
  'autoPanOnConnect',
  'autoPanSpeed',
  'autoPanEdgeThreshold',
  'maxConnectionsPerHandle',
  'proximityThreshold',
  'nodesResizable',
  'snapToGrid',
  'gridSize',
  'preventNodeOverlap',
  'nodeSpacing',
  'edgeReconnectable',
  'autoSave',
  'autoSaveInterval',
  'maxVersions',
]);

@Component({
  selector: 'app-sandbox',
  standalone: true,
  imports: [NgxWorkflowModule, FormsModule, JsonPipe],
  template: `
    <div
      class="studio"
      [class.props-collapsed]="!showProps()"
      [class.actions-collapsed]="!showActions()"
    >
      <!-- Compact toolbar (Evil Martians: reduce chrome; keep frequent actions) -->
      <header class="studio-toolbar">
        <div class="toolbar-brand">
          <span class="badge badge-accent">Studio</span>
          <h1>Canvas Studio</h1>
        </div>

        <div class="toolbar-group" role="group" aria-label="Canvas actions">
          <button type="button" class="tool-btn" (click)="addNode()">Add node</button>
          <button type="button" class="tool-btn" (click)="fitView()">Fit view</button>
          <button type="button" class="tool-btn" (click)="reset()">Reset</button>
        </div>

        <div class="toolbar-group panel-toggles" role="group" aria-label="Panel visibility">
          <button
            type="button"
            class="tool-btn"
            [class.active]="showProps()"
            (click)="showProps.set(!showProps())"
            title="Toggle props panel"
          >
            Props
          </button>
          <button
            type="button"
            class="tool-btn"
            [class.active]="showActions()"
            (click)="showActions.set(!showActions())"
            title="Toggle actions panel"
          >
            Actions
            @if (outputLog().length) {
              <span class="count-pill">{{ outputLog().length }}</span>
            }
          </button>
        </div>
      </header>

      <div class="studio-body">
        <!-- Left: props / inputs (React Flow Playground + Storybook Controls) -->
        @if (showProps()) {
          <aside class="props-panel" aria-label="Diagram inputs">
            <div class="panel-head">
              <div>
                <span class="panel-kicker">Inputs</span>
                <h2>Props</h2>
              </div>
              <button type="button" class="icon-btn" (click)="showProps.set(false)" title="Hide props">
                ✕
              </button>
            </div>

            <div class="props-search">
              <input
                type="search"
                class="field"
                placeholder="Filter props…"
                [ngModel]="propsQuery()"
                (ngModelChange)="propsQuery.set($event)"
                aria-label="Filter props"
              />
            </div>

            <!-- Top-of-panel tabs control content below (Evil Martians layout rule) -->
            <div class="category-tabs" role="tablist" aria-label="Input categories">
              <button
                type="button"
                role="tab"
                class="cat-tab"
                [class.active]="activeInputCategory() === 'All'"
                (click)="activeInputCategory.set('All')"
              >
                All
              </button>
              @for (category of inputCategories; track category) {
                <button
                  type="button"
                  role="tab"
                  class="cat-tab"
                  [class.active]="activeInputCategory() === category"
                  (click)="activeInputCategory.set(category)"
                >
                  {{ category }}
                </button>
              }
            </div>

            <div class="props-scroll">
              @for (group of filteredInputGroups(); track group.category) {
                <section class="prop-group">
                  <h3>{{ group.category }}</h3>
                  @for (item of group.items; track item.name) {
                    <div class="prop-row" [title]="item.description">
                      <div class="prop-label">
                        <code>{{ item.name }}</code>
                        <span class="prop-type">{{ shortType(item.type) }}</span>
                      </div>

                      <div class="prop-control">
                        @if (isControllable(item.name)) {
                          @switch (controlKind(item)) {
                            @case ('boolean') {
                              <label class="switch">
                                <input
                                  type="checkbox"
                                  [checked]="boolValue(item.name)"
                                  (change)="setBool(item.name, $any($event.target).checked)"
                                />
                                <span>{{ boolValue(item.name) ? 'On' : 'Off' }}</span>
                              </label>
                            }
                            @case ('number') {
                              <input
                                class="field field-num"
                                type="number"
                                [ngModel]="numberValue(item.name)"
                                (ngModelChange)="setNumber(item.name, $event)"
                              />
                            }
                            @case ('radio') {
                              <div class="radio-group" role="radiogroup">
                                @for (opt of selectOptions(item.name); track opt) {
                                  <label class="radio-chip" [class.active]="stringValue(item.name) === opt">
                                    <input
                                      type="radio"
                                      [name]="item.name"
                                      [value]="opt"
                                      [checked]="stringValue(item.name) === opt"
                                      (change)="setString(item.name, opt)"
                                    />
                                    {{ opt }}
                                  </label>
                                }
                              </div>
                            }
                            @case ('color') {
                              <input
                                class="field color"
                                type="color"
                                [ngModel]="stringValue(item.name)"
                                (ngModelChange)="setString(item.name, $event)"
                              />
                            }
                            @case ('optionalNumber') {
                              <div class="optional-number">
                                <input
                                  class="field field-num"
                                  type="number"
                                  [disabled]="numberValue(item.name) === undefined"
                                  [ngModel]="numberValue(item.name) ?? null"
                                  [placeholder]="numberValue(item.name) === undefined ? 'unlimited' : ''"
                                  (ngModelChange)="setOptionalNumber(item.name, $event)"
                                />
                                <button type="button" class="mini-btn" (click)="toggleOptionalNumber(item.name)">
                                  {{ numberValue(item.name) === undefined ? 'Set' : 'Clear' }}
                                </button>
                              </div>
                            }
                          }
                        } @else {
                          <span class="bound-tag" title="Driven by the studio graph state">bound</span>
                        }
                      </div>
                    </div>
                  }
                </section>
              } @empty {
                <p class="empty-hint">No props match “{{ propsQuery() }}”.</p>
              }
            </div>

            <footer class="panel-footer">
              Hover a row for the prop description. Changes apply live to the canvas.
            </footer>
          </aside>
        }

        <div class="main-column">
          <!-- Dominant canvas (Evil Martians / React Flow) -->
          <main class="canvas-panel" aria-label="Workflow canvas">
            <ngx-workflow-diagram
              [nodes]="nodes()"
              [edges]="edges()"
              [showBackground]="inputs().showBackground"
              [backgroundVariant]="inputs().backgroundVariant"
              [backgroundGap]="inputs().backgroundGap"
              [backgroundSize]="inputs().backgroundSize"
              [backgroundColor]="inputs().backgroundColor"
              [backgroundBgColor]="inputs().backgroundBgColor"
              [colorMode]="inputs().colorMode"
              [zIndexMode]="inputs().zIndexMode"
              [showGrid]="inputs().showGrid"
              [showZoomControls]="inputs().showZoomControls"
              [showMinimap]="inputs().showMinimap"
              [showExportControls]="inputs().showExportControls"
              [showUndoRedoControls]="inputs().showUndoRedoControls"
              [showLayoutControls]="inputs().showLayoutControls"
              [minZoom]="inputs().minZoom"
              [maxZoom]="inputs().maxZoom"
              [autoPanOnNodeDrag]="inputs().autoPanOnNodeDrag"
              [autoPanOnConnect]="inputs().autoPanOnConnect"
              [autoPanSpeed]="inputs().autoPanSpeed"
              [autoPanEdgeThreshold]="inputs().autoPanEdgeThreshold"
              [maxConnectionsPerHandle]="inputs().maxConnectionsPerHandle"
              [proximityThreshold]="inputs().proximityThreshold"
              [nodesResizable]="inputs().nodesResizable"
              [snapToGrid]="inputs().snapToGrid"
              [gridSize]="inputs().gridSize"
              [preventNodeOverlap]="inputs().preventNodeOverlap"
              [nodeSpacing]="inputs().nodeSpacing"
              [edgeReconnectable]="inputs().edgeReconnectable"
              [autoSave]="inputs().autoSave"
              [autoSaveInterval]="inputs().autoSaveInterval"
              [maxVersions]="inputs().maxVersions"
              (nodesChange)="onNodesChange($event)"
              (edgesChange)="onEdgesChange($event)"
              (nodeClick)="onEmit('nodeClick', $event)"
              (nodeDoubleClick)="onEmit('nodeDoubleClick', $event)"
              (nodeMouseEnter)="onEmit('nodeMouseEnter', $event)"
              (nodeMouseLeave)="onEmit('nodeMouseLeave', $event)"
              (nodeMouseMove)="onEmit('nodeMouseMove', summarizeMouseMove($event))"
              (edgeClick)="onEmit('edgeClick', $event)"
              (edgeMouseEnter)="onEmit('edgeMouseEnter', $event)"
              (edgeMouseLeave)="onEmit('edgeMouseLeave', $event)"
              (connect)="onEmit('connect', $event)"
              (connectStart)="onEmit('connectStart', $event)"
              (connectEnd)="onEmit('connectEnd', $event)"
              (edgeDrop)="onEmit('edgeDrop', $event)"
              (connectionDrop)="onEmit('connectionDrop', summarizeConnectionDrop($event))"
              (paneClick)="onEmit('paneClick', summarizePaneClick($event))"
              (paneScroll)="onEmit('paneScroll', summarizeWheel($event))"
              (contextMenu)="onEmit('contextMenu', summarizeContextMenu($event))"
              (beforeDelete)="onEmit('beforeDelete', summarizeBeforeDelete($event))"
              (importError)="onEmit('importError', $event)"
            ></ngx-workflow-diagram>
          </main>

          <!-- Bottom: Actions / console (Storybook Actions + IDE console) -->
          @if (showActions()) {
            <section class="actions-panel" aria-label="Output actions">
              <div class="actions-head">
                <div class="bottom-tabs" role="tablist" aria-label="Actions views">
                  <button
                    type="button"
                    role="tab"
                    class="bottom-tab"
                    [class.active]="bottomTab() === 'log'"
                    (click)="bottomTab.set('log')"
                  >
                    Event log
                    <span class="count-pill">{{ outputLog().length }}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    class="bottom-tab"
                    [class.active]="bottomTab() === 'filters'"
                    (click)="bottomTab.set('filters')"
                  >
                    Emit filters
                  </button>
                </div>

                <div class="actions-tools">
                  @if (lastEmitName()) {
                    <span class="live-emit">{{ lastEmitName() }}</span>
                  }
                  <button type="button" class="mini-btn" (click)="clearOutputLog()">Clear</button>
                  <button
                    type="button"
                    class="icon-btn"
                    (click)="showActions.set(false)"
                    title="Hide actions"
                  >
                    ✕
                  </button>
                </div>
              </div>

              @if (bottomTab() === 'log') {
                <div class="log-scroll" #logScroll>
                  @if (outputLog().length === 0) {
                    <p class="empty-hint">
                      Interact with the canvas. Enabled output emits appear here (newest at the bottom).
                    </p>
                  } @else {
                    @for (entry of outputLog(); track entry.id) {
                      <article class="log-row" [class.latest]="entry.id === latestLogId()">
                        <div class="log-meta">
                          <code>{{ entry.name }}</code>
                          <time>{{ entry.time }}</time>
                        </div>
                        <pre>{{ entry.payload | json }}</pre>
                      </article>
                    }
                  }
                </div>
              } @else {
                <div class="filters-scroll">
                  <p class="filters-hint">
                    Mute noisy emits. High-frequency pointer events start muted.
                  </p>
                  @for (category of outputCategories; track category) {
                    <section class="filter-group">
                      <h3>{{ category }}</h3>
                      <div class="filter-grid">
                        @for (out of outputsByCategory(category); track out.name) {
                          <label class="filter-item" [title]="out.description">
                            <input
                              type="checkbox"
                              [checked]="isOutputEnabled(out.name)"
                              (change)="toggleOutput(out.name)"
                            />
                            <span>
                              <code>{{ out.name }}</code>
                              <small>{{ out.description }}</small>
                            </span>
                          </label>
                        }
                      </div>
                    </section>
                  }
                </div>
              }
            </section>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .studio {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      min-height: 560px;
      margin: 0 12px 20px;
      border: 1px solid var(--color-border, #1e293b);
      border-radius: 14px;
      overflow: hidden;
      background: var(--color-bg-surface, #111827);
    }

    .studio-toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border, #1e293b);
      background: var(--color-bg-glass, rgba(17, 24, 39, 0.85));
      backdrop-filter: blur(8px);
    }

    .toolbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-right: auto;
    }

    .toolbar-brand h1 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tool-btn,
    .mini-btn,
    .icon-btn {
      background: var(--color-bg-base, #090d16);
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-secondary, #94a3b8);
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
    }

    .tool-btn {
      padding: 6px 10px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .tool-btn.active {
      border-color: rgba(59, 130, 246, 0.55);
      color: var(--color-text-primary, #f8fafc);
      background: rgba(59, 130, 246, 0.12);
    }

    .mini-btn {
      padding: 4px 8px;
      font-size: 0.72rem;
    }

    .icon-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      line-height: 1;
    }

    .tool-btn:hover,
    .mini-btn:hover,
    .icon-btn:hover {
      border-color: var(--color-primary, #3b82f6);
      color: var(--color-primary, #3b82f6);
    }

    .count-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.2);
      color: var(--color-text-primary, #f8fafc);
      font-size: 0.68rem;
      font-family: var(--font-mono, monospace);
    }

    .studio-body {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      min-height: 0;
      flex: 1;
    }

    .studio.props-collapsed .studio-body {
      grid-template-columns: minmax(0, 1fr);
    }

    .props-panel,
    .main-column {
      min-height: 0;
      min-width: 0;
    }

    .props-panel {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--color-border, #1e293b);
      background: var(--color-bg-surface, #111827);
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 12px 8px;
    }

    .panel-kicker {
      display: block;
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary, #3b82f6);
      font-weight: 600;
      margin-bottom: 2px;
    }

    .panel-head h2,
    .prop-group h3,
    .filter-group h3 {
      margin: 0;
    }

    .panel-head h2 {
      font-size: 1rem;
    }

    .props-search {
      padding: 0 12px 8px;
    }

    .category-tabs {
      display: flex;
      gap: 4px;
      padding: 0 12px 8px;
      overflow-x: auto;
      border-bottom: 1px solid var(--color-border, #1e293b);
    }

    .cat-tab,
    .bottom-tab {
      border: 0;
      background: transparent;
      color: var(--color-text-muted, #64748b);
      font-size: 0.72rem;
      font-weight: 600;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      white-space: nowrap;
    }

    .cat-tab.active,
    .bottom-tab.active {
      background: rgba(59, 130, 246, 0.14);
      color: var(--color-text-primary, #f8fafc);
    }

    .props-scroll,
    .log-scroll,
    .filters-scroll {
      overflow: auto;
      flex: 1;
      min-height: 0;
    }

    .props-scroll {
      padding: 8px 0 0;
    }

    .prop-group {
      padding: 4px 0 8px;
    }

    .prop-group + .prop-group {
      border-top: 1px solid var(--color-border, #1e293b);
    }

    .prop-group h3,
    .filter-group h3 {
      padding: 8px 12px 4px;
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748b);
    }

    /* Label–value property rows (Evil Martians / Figma / Storybook Controls) */
    .prop-row {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      padding: 7px 12px;
    }

    .prop-row:hover {
      background: var(--color-bg-surface-hover, #1f293d);
    }

    .prop-label {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .prop-label code,
    .log-meta code,
    .filter-item code {
      font-family: var(--font-mono, monospace);
      font-size: 0.74rem;
      color: var(--color-text-primary, #f8fafc);
    }

    .prop-type,
    .filter-item small,
    .panel-footer,
    .empty-hint,
    .filters-hint {
      font-size: 0.68rem;
      color: var(--color-text-muted, #64748b);
    }

    .prop-control {
      display: flex;
      justify-content: flex-end;
      min-width: 0;
    }

    .field {
      width: 100%;
      background: var(--color-bg-base, #090d16);
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-primary, #f8fafc);
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 0.78rem;
    }

    .field-num {
      max-width: 96px;
    }

    .field.color {
      width: 42px;
      height: 30px;
      padding: 2px;
    }

    .switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.72rem;
      color: var(--color-text-secondary, #94a3b8);
      cursor: pointer;
    }

    /* ≤3 options → radios (Evil Martians friction rule) */
    .radio-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;
    }

    .radio-chip {
      display: inline-flex;
      align-items: center;
      gap: 0;
      border: 1px solid var(--color-border, #1e293b);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 0.68rem;
      color: var(--color-text-secondary, #94a3b8);
      cursor: pointer;
    }

    .radio-chip input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .radio-chip.active {
      border-color: rgba(59, 130, 246, 0.55);
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-text-primary, #f8fafc);
    }

    .optional-number {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .bound-tag {
      font-size: 0.66rem;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-muted, #64748b);
    }

    .panel-footer {
      padding: 8px 12px;
      border-top: 1px solid var(--color-border, #1e293b);
      line-height: 1.35;
    }

    .main-column {
      display: flex;
      flex-direction: column;
    }

    .canvas-panel {
      flex: 1;
      min-height: 280px;
      position: relative;
      overflow: hidden;
      background: var(--color-bg-base, #090d16);
    }

    .actions-panel {
      display: flex;
      flex-direction: column;
      height: 240px;
      border-top: 1px solid var(--color-border, #1e293b);
      background: var(--color-bg-surface, #111827);
    }

    .actions-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border-bottom: 1px solid var(--color-border, #1e293b);
    }

    .bottom-tabs {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .actions-tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .live-emit {
      font-family: var(--font-mono, monospace);
      font-size: 0.7rem;
      color: var(--color-success, #10b981);
    }

    .log-scroll,
    .filters-scroll {
      padding: 8px 10px 12px;
    }

    .log-row {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 10px;
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid transparent;
    }

    .log-row:hover,
    .log-row.latest {
      background: var(--color-bg-base, #090d16);
      border-color: var(--color-border, #1e293b);
    }

    .log-row.latest {
      border-color: rgba(59, 130, 246, 0.45);
    }

    .log-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .log-meta time {
      font-size: 0.66rem;
      color: var(--color-text-muted, #64748b);
    }

    .log-row pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--font-mono, monospace);
      font-size: 0.68rem;
      color: var(--color-text-secondary, #94a3b8);
      max-height: 96px;
      overflow: auto;
    }

    .filters-hint,
    .empty-hint {
      margin: 0 0 10px;
      line-height: 1.4;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 6px;
      padding: 0 0 12px;
    }

    .filter-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
      padding: 8px;
      border: 1px solid var(--color-border, #1e293b);
      border-radius: 8px;
      cursor: pointer;
      background: var(--color-bg-base, #090d16);
    }

    .filter-item span {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .filter-item small {
      line-height: 1.3;
    }

    @media (max-width: 960px) {
      .studio {
        height: auto;
        min-height: calc(100vh - 100px);
      }

      .studio-body {
        grid-template-columns: 1fr;
      }

      .props-panel {
        border-right: 0;
        border-bottom: 1px solid var(--color-border, #1e293b);
        max-height: 280px;
      }

      .canvas-panel {
        min-height: 420px;
      }

      .log-row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SandboxComponent implements AfterViewChecked {
  @ViewChild(DiagramComponent) diagram?: DiagramComponent;
  @ViewChild('logScroll') logScroll?: ElementRef<HTMLDivElement>;

  readonly inputCategories = INPUT_CATEGORIES;
  readonly outputCategories = OUTPUT_CATEGORIES;
  readonly allInputs = INPUT_DOCS;
  readonly allOutputs = OUTPUT_DOCS;

  private readonly initialNodes: Node[] = [
    { id: 'start', label: 'Start', position: { x: 120, y: 180 }, ports: 4 },
    { id: 'process', label: 'Process', position: { x: 380, y: 180 }, ports: 4 },
    { id: 'end', label: 'End', position: { x: 640, y: 180 }, ports: 4 },
  ];

  private readonly initialEdges: Edge[] = [
    { id: 'e1', source: 'start', target: 'process', sourceHandle: 'right', targetHandle: 'left' },
    {
      id: 'e2',
      source: 'process',
      target: 'end',
      sourceHandle: 'right',
      targetHandle: 'left',
      animated: true,
    },
  ];

  nodes = signal<Node[]>(this.cloneNodes(this.initialNodes));
  edges = signal<Edge[]>(this.cloneEdges(this.initialEdges));
  private nodeCounter = 4;

  showProps = signal(true);
  showActions = signal(true);
  bottomTab = signal<BottomTab>('log');
  propsQuery = signal('');
  activeInputCategory = signal<string>('All');

  inputs = signal<SandboxInputState>({
    showBackground: true,
    backgroundVariant: 'dots',
    backgroundGap: 20,
    backgroundSize: 1,
    backgroundColor: '#81818a',
    backgroundBgColor: '#090d16',
    colorMode: 'dark',
    zIndexMode: 'default',
    showGrid: false,
    showZoomControls: true,
    showMinimap: true,
    showExportControls: true,
    showUndoRedoControls: true,
    showLayoutControls: true,
    minZoom: 0.1,
    maxZoom: 4,
    autoPanOnNodeDrag: true,
    autoPanOnConnect: true,
    autoPanSpeed: 15,
    autoPanEdgeThreshold: 50,
    maxConnectionsPerHandle: undefined,
    proximityThreshold: 200,
    nodesResizable: true,
    snapToGrid: false,
    gridSize: 20,
    preventNodeOverlap: false,
    nodeSpacing: 10,
    edgeReconnectable: true,
    autoSave: false,
    autoSaveInterval: 1000,
    maxVersions: 10,
  });

  private readonly defaultMuted = new Set([
    'nodeMouseMove',
    'paneScroll',
    'nodeMouseEnter',
    'nodeMouseLeave',
    'edgeMouseEnter',
    'edgeMouseLeave',
  ]);

  enabledOutputs = signal<Record<string, boolean>>(
    Object.fromEntries(OUTPUT_DOCS.map((o) => [o.name, !this.defaultMuted.has(o.name)])),
  );

  /** Chronological log; newest at the bottom (Storybook Actions). */
  outputLog = signal<OutputLogEntry[]>([]);
  lastEmitName = signal<string | null>(null);
  latestLogId = computed(() => this.outputLog().at(-1)?.id ?? -1);

  filteredInputGroups = computed(() => {
    const q = this.propsQuery().trim().toLowerCase();
    const cat = this.activeInputCategory();
    const groups: { category: string; items: InputDoc[] }[] = [];

    for (const category of this.inputCategories) {
      if (cat !== 'All' && cat !== category) continue;
      const items = this.allInputs.filter((item) => {
        if (item.category !== category) return false;
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      });
      if (items.length) groups.push({ category, items });
    }
    return groups;
  });

  private logSeq = 0;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldStickLogToBottom = true;
  private pendingLogScroll = false;

  ngAfterViewChecked(): void {
    if (!this.pendingLogScroll) return;
    this.pendingLogScroll = false;
    const el = this.logScroll?.nativeElement;
    if (!el || !this.shouldStickLogToBottom) return;
    el.scrollTop = el.scrollHeight;
  }

  outputsByCategory(category: string): OutputDoc[] {
    return this.allOutputs.filter((item) => item.category === category);
  }

  shortType(type: string): string {
    return type.replace(/^output</, '').replace(/>$/, '').slice(0, 42);
  }

  isControllable(name: string): boolean {
    return CONTROLLABLE_INPUTS.has(name as keyof SandboxInputState);
  }

  controlKind(item: InputDoc): 'boolean' | 'number' | 'radio' | 'color' | 'optionalNumber' {
    if (item.name === 'maxConnectionsPerHandle') return 'optionalNumber';
    if (item.name === 'backgroundColor' || item.name === 'backgroundBgColor') return 'color';
    if (item.name === 'backgroundVariant' || item.name === 'colorMode' || item.name === 'zIndexMode') {
      return 'radio';
    }
    if (item.type.includes('boolean')) return 'boolean';
    if (item.type.includes('number')) return 'number';
    return 'boolean';
  }

  selectOptions(name: string): string[] {
    if (name === 'backgroundVariant') return ['dots', 'lines', 'cross'];
    if (name === 'colorMode') return ['light', 'dark'];
    if (name === 'zIndexMode') return ['default', 'layered'];
    return [];
  }

  boolValue(name: string): boolean {
    return Boolean(this.inputs()[name as keyof SandboxInputState]);
  }

  numberValue(name: string): number | undefined {
    return this.inputs()[name as keyof SandboxInputState] as number | undefined;
  }

  stringValue(name: string): string {
    return String(this.inputs()[name as keyof SandboxInputState] ?? '');
  }

  setBool(name: string, value: boolean): void {
    this.patchInput(name, value);
  }

  setNumber(name: string, value: number | string | null | undefined): void {
    const n = this.parseFiniteNumber(value);
    if (n !== undefined) {
      this.patchInput(name, n);
      return;
    }
    this.refreshInputs();
  }

  setString(name: string, value: string): void {
    this.patchInput(name, value);
  }

  setOptionalNumber(name: string, value: number | string | null | undefined): void {
    const n = this.parseFiniteNumber(value);
    if (n !== undefined) {
      this.patchInput(name, n);
      return;
    }
    this.refreshInputs();
  }

  toggleOptionalNumber(name: string): void {
    const current = this.numberValue(name);
    this.patchInput(name, current === undefined ? 1 : undefined);
  }

  private parseFiniteNumber(value: number | string | null | undefined): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : undefined;
  }

  private patchInput(name: string, value: unknown): void {
    if (!this.isControllable(name)) return;
    this.inputs.update((state) => ({ ...state, [name]: value }));
  }

  private refreshInputs(): void {
    this.inputs.update((state) => ({ ...state }));
  }

  isOutputEnabled(name: string): boolean {
    return !!this.enabledOutputs()[name];
  }

  toggleOutput(name: string): void {
    this.enabledOutputs.update((map) => ({ ...map, [name]: !map[name] }));
  }

  onEmit(name: string, payload: unknown): void {
    if (!this.isOutputEnabled(name)) return;

    this.lastEmitName.set(name);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.lastEmitName.set(null), 450);

    const el = this.logScroll?.nativeElement;
    if (el) {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      this.shouldStickLogToBottom = distanceFromBottom < 40;
    } else {
      this.shouldStickLogToBottom = true;
    }

    const entry: OutputLogEntry = {
      id: ++this.logSeq,
      name,
      time: new Date().toLocaleTimeString(),
      payload: this.safeClone(payload),
    };
    this.outputLog.update((log) => [...log, entry].slice(-80));
    this.pendingLogScroll = true;
  }

  onNodesChange(nodes: Node[]): void {
    this.nodes.set(nodes);
    this.onEmit('nodesChange', { count: nodes.length, ids: nodes.map((n) => n.id) });
  }

  onEdgesChange(edges: Edge[]): void {
    this.edges.set(edges);
    this.onEmit('edgesChange', { count: edges.length, ids: edges.map((e) => e.id) });
  }

  summarizeMouseMove(event: { node: Node; event: MouseEvent }): unknown {
    return { nodeId: event.node.id, x: event.event.clientX, y: event.event.clientY };
  }

  summarizeConnectionDrop(event: {
    position: { x: number; y: number };
    sourceNodeId: string;
    sourceHandleId?: string;
  }): unknown {
    return {
      position: event.position,
      sourceNodeId: event.sourceNodeId,
      sourceHandleId: event.sourceHandleId,
    };
  }

  summarizePaneClick(event: { position: { x: number; y: number } }): unknown {
    return { position: event.position };
  }

  summarizeWheel(event: WheelEvent): unknown {
    return { deltaY: event.deltaY, deltaX: event.deltaX, ctrlKey: event.ctrlKey };
  }

  summarizeContextMenu(event: { type: string; item?: Node | Edge }): unknown {
    const item = event.item as { id?: string } | undefined;
    return { type: event.type, itemId: item?.id };
  }

  summarizeBeforeDelete(event: { nodes: Node[]; edges: Edge[] }): unknown {
    return {
      nodes: event.nodes.map((n) => n.id),
      edges: event.edges.map((e) => e.id),
    };
  }

  clearOutputLog(): void {
    this.outputLog.set([]);
  }

  addNode(): void {
    const id = `node-${this.nodeCounter++}`;
    this.nodes.update((nodes) => [
      ...nodes,
      {
        id,
        label: `Node ${this.nodeCounter - 1}`,
        position: { x: 160 + (nodes.length % 4) * 40, y: 120 + (nodes.length % 3) * 40 },
        ports: 4,
      },
    ]);
  }

  fitView(): void {
    this.diagram?.fitView();
  }

  reset(): void {
    this.nodes.set(this.cloneNodes(this.initialNodes));
    this.edges.set(this.cloneEdges(this.initialEdges));
    this.nodeCounter = 4;
    this.clearOutputLog();
    setTimeout(() => this.diagram?.fitView(), 0);
  }

  private cloneNodes(nodes: Node[]): Node[] {
    return nodes.map((node) => ({ ...node, position: { ...node.position } }));
  }

  private cloneEdges(edges: Edge[]): Edge[] {
    return edges.map((edge) => ({ ...edge }));
  }

  private safeClone(value: unknown): unknown {
    try {
      return JSON.parse(
        JSON.stringify(value, (_key, v) => {
          if (v instanceof Event) return { type: v.type };
          if (typeof v === 'function') return '[Function]';
          return v;
        }),
      );
    } catch {
      return String(value);
    }
  }
}
