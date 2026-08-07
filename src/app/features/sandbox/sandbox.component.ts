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
 * Studio IA: left props → canvas → bottom actions (React Flow / Storybook / IDE).
 * Visual shell matches Examples: page header, glass panels, shared tool buttons.
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
      class="sandbox-page container"
      [class.props-collapsed]="!showProps()"
      [class.actions-collapsed]="!showActions()"
    >
      <div class="sandbox-header">
        <span class="badge badge-accent">Studio</span>
        <h1>Canvas Studio</h1>
        <p class="text-muted">
          Tweak every diagram input live, then watch emits in the action log — same API surface as production.
        </p>
      </div>

      <div class="studio-layout">
        @if (showProps()) {
          <aside class="props-panel glass-panel" aria-label="Diagram inputs">
            <div class="panel-head">
              <div>
                <span class="panel-kicker">Inputs</span>
                <h2>Props</h2>
              </div>
              <button type="button" class="icon-btn" (click)="showProps.set(false)" title="Hide props" aria-label="Hide props">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
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
          <main class="viewer-panel glass-panel" aria-label="Workflow canvas">
            <header class="viewer-toolbar">
              <div class="active-info">
                <h3>Live canvas</h3>
              </div>

              <div class="toolbar-controls" role="group" aria-label="Canvas actions">
                <button type="button" class="tool-btn" (click)="addNode()">Add node</button>
                <button type="button" class="tool-btn" (click)="fitView()">Fit view</button>
                <button type="button" class="tool-btn" (click)="reset()">Reset</button>
                <button
                  type="button"
                  class="tool-btn"
                  [class.active]="showProps()"
                  (click)="showProps.set(!showProps())"
                  title="Toggle props panel"
                  [attr.aria-pressed]="showProps()"
                >
                  Props
                </button>
                <button
                  type="button"
                  class="tool-btn"
                  [class.active]="showActions()"
                  (click)="showActions.set(!showActions())"
                  title="Toggle actions panel"
                  [attr.aria-pressed]="showActions()"
                >
                  Actions
                  @if (outputLog().length) {
                    <span class="count-pill">{{ outputLog().length }}</span>
                  }
                </button>
              </div>
            </header>

            <div class="canvas-panel">
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
            </div>
          </main>

          @if (showActions()) {
            <section class="actions-panel glass-panel" aria-label="Output actions">
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
                    aria-label="Hide actions"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
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
    .sandbox-page {
      padding-top: 40px;
      padding-bottom: 80px;
    }

    .sandbox-header {
      margin-bottom: 28px;
    }

    .sandbox-header h1 {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 800;
      margin: 8px 0;
      letter-spacing: -0.03em;
    }

    .sandbox-header .text-muted {
      margin: 0;
      max-width: 40rem;
    }

    .studio-layout {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 24px;
      align-items: stretch;
      min-height: min(72vh, 780px);
    }

    .sandbox-page.props-collapsed .studio-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .props-panel,
    .main-column,
    .viewer-panel,
    .actions-panel {
      min-width: 0;
      min-height: 0;
    }

    .props-panel {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      overflow: hidden;
      max-height: min(72vh, 780px);
    }

    .main-column {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-height: min(72vh, 780px);
    }

    .viewer-panel {
      display: flex;
      flex-direction: column;
      flex: 1;
      border-radius: var(--radius-lg);
      overflow: hidden;
      min-height: 420px;
    }

    .viewer-toolbar {
      height: 56px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 16px;
      flex-wrap: wrap;
    }

    .active-info h3 {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tool-btn,
    .mini-btn,
    .icon-btn {
      background: var(--color-bg-base);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out);
    }

    .tool-btn {
      padding: 6px 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .tool-btn:hover,
    .tool-btn.active,
    .mini-btn:hover,
    .icon-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-soft);
    }

    .mini-btn {
      padding: 4px 10px;
      font-size: 0.75rem;
    }

    .icon-btn {
      width: 30px;
      height: 30px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .count-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: var(--radius-full);
      background: var(--color-primary-soft);
      color: var(--color-primary);
      font-size: 0.68rem;
      font-family: var(--font-mono);
      font-weight: 650;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      padding: 16px 16px 10px;
    }

    .panel-kicker {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--color-text-muted);
      font-weight: 700;
      margin-bottom: 4px;
    }

    .panel-head h2,
    .prop-group h3,
    .filter-group h3 {
      margin: 0;
    }

    .panel-head h2 {
      font-family: var(--font-display);
      font-size: 1.05rem;
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .props-search {
      padding: 0 16px 10px;
    }

    .category-tabs {
      display: flex;
      gap: 4px;
      padding: 0 12px 10px;
      overflow-x: auto;
      border-bottom: 1px solid var(--color-border);
    }

    .cat-tab,
    .bottom-tab {
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out);
    }

    .cat-tab:hover,
    .bottom-tab:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-surface-hover);
    }

    .cat-tab.active,
    .bottom-tab.active {
      color: var(--color-primary);
      border-color: var(--color-border-strong);
      background: var(--color-primary-soft);
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
      border-top: 1px solid var(--color-border);
    }

    .prop-group h3,
    .filter-group h3 {
      padding: 10px 16px 4px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      font-weight: 700;
    }

    .prop-row {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: 8px;
      align-items: center;
      padding: 8px 16px;
    }

    .prop-row:hover {
      background: var(--color-bg-surface-hover);
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
      font-family: var(--font-mono);
      font-size: 0.74rem;
      color: var(--color-text-primary);
    }

    .prop-type,
    .filter-item small,
    .panel-footer,
    .empty-hint,
    .filters-hint {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .prop-control {
      display: flex;
      justify-content: flex-end;
      min-width: 0;
    }

    .field {
      width: 100%;
      background: var(--color-bg-base);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      border-radius: var(--radius-sm);
      padding: 7px 10px;
      font-size: 0.8rem;
      font-family: var(--font-sans);
    }

    .field:focus {
      outline: none;
      border-color: var(--color-primary);
    }

    .field-num {
      max-width: 96px;
    }

    .field.color {
      width: 42px;
      height: 32px;
      padding: 2px;
    }

    .switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--color-text-secondary);
      cursor: pointer;
    }

    .radio-group {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 4px;
    }

    .radio-chip {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--color-border);
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out);
    }

    .radio-chip input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .radio-chip.active {
      border-color: var(--color-border-strong);
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    .optional-number {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .bound-tag {
      font-size: 0.66rem;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      border: 1px solid var(--color-border);
      color: var(--color-text-muted);
      background: var(--color-bg-base);
    }

    .panel-footer {
      padding: 10px 16px;
      border-top: 1px solid var(--color-border);
      line-height: 1.4;
      background: var(--color-bg-surface);
    }

    .canvas-panel {
      flex: 1;
      min-height: 360px;
      position: relative;
      overflow: hidden;
      background: var(--color-bg-base);
    }

    .canvas-panel ngx-workflow-diagram {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .actions-panel {
      display: flex;
      flex-direction: column;
      height: 240px;
      border-radius: var(--radius-lg);
      overflow: hidden;
      flex-shrink: 0;
    }

    .actions-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);
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
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--color-success);
    }

    .log-scroll,
    .filters-scroll {
      padding: 10px 12px 14px;
      background: var(--color-bg-elevated);
    }

    .log-row {
      display: grid;
      grid-template-columns: 180px minmax(0, 1fr);
      gap: 10px;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
    }

    .log-row:hover,
    .log-row.latest {
      background: var(--color-bg-base);
      border-color: var(--color-border);
    }

    .log-row.latest {
      border-color: var(--color-border-strong);
      background: var(--color-primary-soft);
    }

    .log-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .log-meta time {
      font-size: 0.66rem;
      color: var(--color-text-muted);
    }

    .log-row pre {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--color-text-secondary);
      max-height: 96px;
      overflow: auto;
    }

    .filters-hint,
    .empty-hint {
      margin: 0 0 10px;
      line-height: 1.45;
      padding: 0 4px;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 8px;
      padding: 0 0 12px;
    }

    .filter-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
      align-items: start;
      padding: 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      cursor: pointer;
      background: var(--color-bg-base);
      transition: border-color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out);
    }

    .filter-item:hover {
      border-color: var(--color-border-hover);
      background: var(--color-bg-surface-hover);
    }

    .filter-item span {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .filter-item small {
      line-height: 1.35;
    }

    @media (max-width: 960px) {
      .studio-layout {
        grid-template-columns: 1fr;
        min-height: 0;
      }

      .props-panel {
        max-height: 300px;
      }

      .main-column {
        min-height: 0;
      }

      .viewer-toolbar {
        height: auto;
        padding: 12px 14px;
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
