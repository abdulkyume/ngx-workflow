import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiagramComponent, Edge, NgxWorkflowModule, Node } from 'ngx-workflow';
import { INPUT_CATEGORIES, INPUT_DOCS, InputDoc } from '../docs/data/input-docs.data';
import { OUTPUT_CATEGORIES, OUTPUT_DOCS, OutputDoc } from '../docs/data/output-docs.data';

type BackgroundVariant = 'dots' | 'lines' | 'cross';
type ColorMode = 'light' | 'dark';
type ZIndexMode = 'default' | 'layered';

interface OutputLogEntry {
  id: number;
  name: string;
  time: string;
  payload: unknown;
}

/** Inputs driven by the left sidebar (excludes data arrays / templates / validators). */
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
    <div class="sandbox-page">
      <header class="sandbox-toolbar glass-panel">
        <div class="toolbar-left">
          <span class="badge badge-accent">Studio</span>
          <div>
            <h1>Canvas Studio</h1>
            <p>Toggle inputs, watch output emits, and inspect live event payloads.</p>
          </div>
        </div>
        <div class="toolbar-actions">
          <button type="button" class="tool-btn" (click)="addNode()">+ Add Node</button>
          <button type="button" class="tool-btn" (click)="fitView()">Fit View</button>
          <button type="button" class="tool-btn" (click)="reset()">Reset</button>
        </div>
      </header>

      <!-- Upper: all output emit functions -->
      <section class="outputs-bar glass-panel" aria-label="Output emitters">
        <div class="outputs-bar-header">
          <div>
            <span class="panel-kicker">Outputs</span>
            <h2>Emit functions</h2>
          </div>
          <p class="outputs-hint">Click a chip to mute/unmute logging. Live emits appear in the right sidebar.</p>
        </div>
        <div class="outputs-groups">
          @for (category of outputCategories; track category) {
            <div class="outputs-group">
              <span class="group-label">{{ category }}</span>
              <div class="chip-row">
                @for (out of outputsByCategory(category); track out.name) {
                  <button
                    type="button"
                    class="emit-chip"
                    [class.active]="isOutputEnabled(out.name)"
                    [class.flash]="lastEmitName() === out.name"
                    [title]="out.description"
                    (click)="toggleOutput(out.name)"
                  >
                    <span class="emit-dot"></span>
                    {{ out.name }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <div class="sandbox-workspace">
        <!-- Left: all inputs -->
        <aside class="sidebar inputs-sidebar glass-panel" aria-label="Diagram inputs">
          <div class="sidebar-header">
            <span class="panel-kicker">Inputs</span>
            <h2>All inputs</h2>
          </div>
          <div class="sidebar-scroll">
            @for (category of inputCategories; track category) {
              <div class="input-category">
                <h3>{{ category }}</h3>
                @for (item of inputsByCategory(category); track item.name) {
                  <div class="input-row" [title]="item.description">
                    <div class="input-meta">
                      <code>{{ item.name }}</code>
                      <span class="input-type">{{ item.type }}</span>
                    </div>
                    @if (isControllable(item.name)) {
                      @switch (controlKind(item)) {
                        @case ('boolean') {
                          <label class="toggle">
                            <input
                              type="checkbox"
                              [checked]="boolValue(item.name)"
                              (change)="setBool(item.name, $any($event.target).checked)"
                            />
                            <span>{{ boolValue(item.name) ? 'on' : 'off' }}</span>
                          </label>
                        }
                        @case ('number') {
                          <input
                            class="field"
                            type="number"
                            [ngModel]="numberValue(item.name)"
                            (ngModelChange)="setNumber(item.name, $event)"
                          />
                        }
                        @case ('select') {
                          <select
                            class="field"
                            [ngModel]="stringValue(item.name)"
                            (ngModelChange)="setString(item.name, $event)"
                          >
                            @for (opt of selectOptions(item.name); track opt) {
                              <option [value]="opt">{{ opt }}</option>
                            }
                          </select>
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
                              class="field"
                              type="number"
                              [disabled]="numberValue(item.name) === undefined"
                              [ngModel]="numberValue(item.name) ?? null"
                              [placeholder]="numberValue(item.name) === undefined ? 'unlimited' : ''"
                              (ngModelChange)="setOptionalNumber(item.name, $event)"
                            />
                            <button
                              type="button"
                              class="mini-btn"
                              (click)="toggleOptionalNumber(item.name)"
                            >
                              {{ numberValue(item.name) === undefined ? 'Set' : 'Clear' }}
                            </button>
                          </div>
                        }
                      }
                    } @else {
                      <span class="readonly-badge">bound</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </aside>

        <!-- Center: canvas -->
        <main class="sandbox-canvas glass-panel">
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

        <!-- Right: output log -->
        <aside class="sidebar output-sidebar glass-panel" aria-label="Output log">
          <div class="sidebar-header output-header">
            <div>
              <span class="panel-kicker">Output</span>
              <h2>Event log</h2>
            </div>
            <div class="output-actions">
              <span class="log-count">{{ outputLog().length }}</span>
              <button type="button" class="mini-btn" (click)="clearOutputLog()">Clear</button>
            </div>
          </div>
          <div class="sidebar-scroll output-scroll">
            @if (outputLog().length === 0) {
              <p class="empty-log">Interact with the canvas to see emitted outputs here.</p>
            } @else {
              @for (entry of outputLog(); track entry.id) {
                <article class="log-entry" [class.latest]="entry.id === latestLogId()">
                  <div class="log-top">
                    <code class="log-name">{{ entry.name }}</code>
                    <time>{{ entry.time }}</time>
                  </div>
                  <pre class="log-payload">{{ entry.payload | json }}</pre>
                </article>
              }
            }
          </div>
        </aside>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .sandbox-page {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px 20px 40px;
      min-height: calc(100vh - 120px);
    }

    .sandbox-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding: 14px 18px;
    }

    .toolbar-left {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .sandbox-toolbar h1,
    .outputs-bar h2,
    .sidebar-header h2 {
      margin: 0 0 4px;
      font-size: 1.15rem;
    }

    .sandbox-toolbar p,
    .outputs-hint,
    .empty-log {
      margin: 0;
      color: var(--color-text-secondary, #94a3b8);
      font-size: 0.85rem;
    }

    .toolbar-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tool-btn,
    .mini-btn {
      background: var(--color-bg-base, #090d16);
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-secondary, #94a3b8);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }

    .mini-btn {
      padding: 4px 8px;
      font-size: 0.75rem;
    }

    .tool-btn:hover,
    .mini-btn:hover,
    .emit-chip:hover {
      border-color: var(--color-primary, #3b82f6);
      color: var(--color-primary, #3b82f6);
    }

    .panel-kicker {
      display: inline-block;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary, #3b82f6);
      font-weight: 600;
      margin-bottom: 2px;
    }

    .outputs-bar {
      padding: 14px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .outputs-bar-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .outputs-groups {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .outputs-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .group-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748b);
      font-weight: 600;
    }

    .chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .emit-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--color-border, #1e293b);
      background: var(--color-bg-base, #090d16);
      color: var(--color-text-secondary, #94a3b8);
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 0.75rem;
      font-family: var(--font-mono, monospace);
      cursor: pointer;
      transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.2s ease;
    }

    .emit-chip.active {
      border-color: rgba(59, 130, 246, 0.55);
      color: var(--color-text-primary, #f8fafc);
      background: rgba(59, 130, 246, 0.12);
    }

    .emit-chip.flash {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
    }

    .emit-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-text-muted, #64748b);
    }

    .emit-chip.active .emit-dot {
      background: var(--color-success, #10b981);
    }

    .sandbox-workspace {
      display: grid;
      grid-template-columns: minmax(240px, 300px) minmax(0, 1fr) minmax(240px, 320px);
      gap: 14px;
      min-height: min(70vh, 760px);
      align-items: stretch;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 14px 14px 10px;
      border-bottom: 1px solid var(--color-border, #1e293b);
    }

    .output-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }

    .output-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .log-count {
      font-size: 0.75rem;
      color: var(--color-text-muted, #64748b);
      font-family: var(--font-mono, monospace);
    }

    .sidebar-scroll {
      overflow: auto;
      padding: 10px 12px 16px;
      flex: 1;
    }

    .input-category + .input-category {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--color-border, #1e293b);
    }

    .input-category h3 {
      margin: 0 0 8px;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted, #64748b);
    }

    .input-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 8px 0;
    }

    .input-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: baseline;
    }

    .input-meta code,
    .log-name {
      font-family: var(--font-mono, monospace);
      font-size: 0.78rem;
      color: var(--color-text-primary, #f8fafc);
    }

    .input-type {
      font-size: 0.68rem;
      color: var(--color-text-muted, #64748b);
    }

    .field {
      width: 100%;
      background: var(--color-bg-base, #090d16);
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-primary, #f8fafc);
      border-radius: 8px;
      padding: 6px 8px;
      font-size: 0.8rem;
    }

    .field.color {
      padding: 2px;
      height: 34px;
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #94a3b8);
      cursor: pointer;
    }

    .optional-number {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .readonly-badge {
      align-self: flex-start;
      font-size: 0.68rem;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid var(--color-border, #1e293b);
      color: var(--color-text-muted, #64748b);
    }

    .sandbox-canvas {
      min-height: 520px;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .log-entry {
      border: 1px solid var(--color-border, #1e293b);
      border-radius: 10px;
      padding: 8px 10px;
      margin-bottom: 8px;
      background: var(--color-bg-base, #090d16);
    }

    .log-entry.latest {
      border-color: rgba(59, 130, 246, 0.5);
    }

    .log-top {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 6px;
    }

    .log-top time {
      font-size: 0.68rem;
      color: var(--color-text-muted, #64748b);
      white-space: nowrap;
    }

    .log-payload {
      margin: 0;
      white-space: pre-wrap;
      word-break: break-word;
      font-family: var(--font-mono, monospace);
      font-size: 0.7rem;
      color: var(--color-text-secondary, #94a3b8);
      max-height: 160px;
      overflow: auto;
    }

    @media (max-width: 1100px) {
      .sandbox-workspace {
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(420px, 56vh) auto;
      }

      .inputs-sidebar,
      .output-sidebar {
        max-height: 320px;
      }
    }

    @media (max-width: 768px) {
      .sandbox-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .outputs-bar-header {
        align-items: stretch;
      }
    }
  `,
})
export class SandboxComponent {
  @ViewChild(DiagramComponent) diagram?: DiagramComponent;

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

  /** Outputs muted by default when they fire very frequently. */
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

  outputLog = signal<OutputLogEntry[]>([]);
  lastEmitName = signal<string | null>(null);
  latestLogId = computed(() => this.outputLog()[0]?.id ?? -1);

  private logSeq = 0;
  private flashTimer: ReturnType<typeof setTimeout> | null = null;

  inputsByCategory(category: string): InputDoc[] {
    return this.allInputs.filter((item) => item.category === category);
  }

  outputsByCategory(category: string): OutputDoc[] {
    return this.allOutputs.filter((item) => item.category === category);
  }

  isControllable(name: string): boolean {
    return CONTROLLABLE_INPUTS.has(name as keyof SandboxInputState);
  }

  controlKind(item: InputDoc): 'boolean' | 'number' | 'select' | 'color' | 'optionalNumber' {
    if (item.name === 'maxConnectionsPerHandle') return 'optionalNumber';
    if (item.name === 'backgroundColor' || item.name === 'backgroundBgColor') return 'color';
    if (item.name === 'backgroundVariant' || item.name === 'colorMode' || item.name === 'zIndexMode') {
      return 'select';
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
    // Empty/partial edit: keep prior value and refresh the binding so the field does not stick at 0/blank.
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

  /** Ignore empty/partial edits so clearing a number field does not apply `0`. */
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
    // Always keep controlled graph state in sync for change events.
    if (name === 'nodesChange') {
      // handled separately via onNodesChange
    }

    if (!this.isOutputEnabled(name)) return;

    this.lastEmitName.set(name);
    if (this.flashTimer) clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => this.lastEmitName.set(null), 450);

    const entry: OutputLogEntry = {
      id: ++this.logSeq,
      name,
      time: new Date().toLocaleTimeString(),
      payload: this.safeClone(payload),
    };
    this.outputLog.update((log) => [entry, ...log].slice(0, 80));
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

  summarizeContextMenu(event: {
    type: string;
    item?: Node | Edge;
  }): unknown {
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
          if (v instanceof Event) {
            return { type: v.type };
          }
          if (typeof v === 'function') {
            return '[Function]';
          }
          return v;
        }),
      );
    } catch {
      return String(value);
    }
  }
}
