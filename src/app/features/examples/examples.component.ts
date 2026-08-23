import { Component, signal, computed, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, DiagramComponent, LayoutService, PanelPosition } from 'ngx-workflow';

interface ExampleScenario {
  id: string;
  title: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  codeSnippet: string;
}

@Component({
  selector: 'app-examples',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: `
    <div class="examples-page">
      <!-- Header -->
      <div class="examples-header">
        <span class="badge badge-accent">Interactive Gallery</span>
        <h1>Interactive Examples & Code Playground</h1>
        <p class="text-muted">Explore real-world use cases, auto-layout algorithms, custom nodes, path routing, and workflow legends.</p>
      </div>

      <!-- Main Layout -->
      <div class="examples-grid">
        
        <!-- Sidebar Navigation -->
        <aside class="examples-sidebar glass-panel">
          <span class="sidebar-title">Select Scenario</span>
          <div class="scenario-list">
            @for (scen of scenarios; track scen.id) {
              <button 
                class="scenario-item" 
                [class.active]="activeScenario().id === scen.id"
                (click)="selectScenario(scen)">
                <span class="scenario-name">{{ scen.title }}</span>
                <span class="scenario-desc">{{ scen.description }}</span>
              </button>
            }
          </div>
        </aside>

        <!-- Main Viewer Container -->
        <main class="examples-viewer glass-panel">
          <!-- Toolbar -->
          <div class="viewer-toolbar">
            <div class="active-info">
              <h3>{{ activeScenario().title }}</h3>
            </div>

            <div class="toolbar-controls">
              @if (activeScenario().id === 'legend') {
                <button type="button" class="tool-btn" [class.active]="inspectorOpen()" (click)="toggleInspector()" title="Double-click any node or click here to inspect API config">
                  {{ inspectorOpen() ? 'Close Inspector' : '🔍 API Inspector' }}
                </button>
              }
              <button type="button" class="tool-btn" [class.active]="showSearchControls()" (click)="toggleSearchControls()" [attr.aria-pressed]="showSearchControls()">
                {{ showSearchControls() ? 'Search: ON' : 'Search: OFF' }}
              </button>
              <button type="button" class="tool-btn" [class.active]="showBackground()" (click)="toggleBackground()" [attr.aria-pressed]="showBackground()">
                {{ showBackground() ? 'Bg: ON' : 'Bg: OFF' }}
              </button>
              <button type="button" class="tool-btn" [class.active]="showMinimap()" (click)="toggleMinimap()" [attr.aria-pressed]="showMinimap()">
                Minimap
              </button>
              <button type="button" class="tool-btn" [class.active]="animated()" (click)="toggleAnimated()" [attr.aria-pressed]="animated()">
                Animate
              </button>
              @if (showBackground()) {
                <button type="button" class="tool-btn" (click)="cycleBg()" [attr.aria-label]="'Background ' + bgVariant()">
                  {{ bgVariant() }}
                </button>
              }
              <button type="button" class="tool-btn" (click)="fitView()">Fit view</button>
              @if (activeScenario().id === 'autolayout') {
                <button type="button" class="tool-btn btn-primary-sm" (click)="triggerAutoLayout()">
                  Auto layout
                </button>
              }
              <button type="button" class="tool-btn" [class.active]="showCode()" (click)="toggleCode()" [attr.aria-pressed]="showCode()">
                {{ showCode() ? 'Hide code' : 'View code' }}
              </button>
            </div>
          </div>

          <!-- Scenario Subtoolbar for Legend Customization -->
          @if (activeScenario().id === 'legend') {
            <div class="scenario-subtoolbar animate-fade-in">
              <div class="subtoolbar-left">
                <span class="subtoolbar-heading">Legend Customizer:</span>
                <div class="legend-pos-control">
                  <label for="legend-pos-top" class="toolbar-pos-label">Position:</label>
                  <select id="legend-pos-top" class="tool-btn select-btn" [value]="legendPosition()" (change)="onLegendPosChange($event)">
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                    <option value="center-left">Center Left</option>
                    <option value="center">Center</option>
                    <option value="center-right">Center Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                  </select>
                </div>

                <div class="legend-pos-control">
                  <label for="legend-theme-top" class="toolbar-pos-label">Theme / Color:</label>
                  <select id="legend-theme-top" class="tool-btn select-btn" [value]="legendTheme()" (change)="onLegendThemeChange($event)">
                    <option value="default">Default Surface</option>
                    <option value="dark">Dark Slate</option>
                    <option value="indigo">Cyber Indigo</option>
                    <option value="emerald">Emerald Forest</option>
                    <option value="white">Clean White</option>
                  </select>
                </div>

                <div class="legend-pos-control">
                  <label for="legend-width-top" class="toolbar-pos-label">Width:</label>
                  <select id="legend-width-top" class="tool-btn select-btn" [value]="legendWidth()" (change)="onLegendWidthChange($event)">
                    <option value="compact">Compact (260px)</option>
                    <option value="normal">Standard (310px)</option>
                    <option value="wide">Wide (370px)</option>
                  </select>
                </div>

                <button type="button" class="tool-btn" [class.active]="showPropertiesSidebar()" (click)="togglePropertiesSidebar()" title="Toggle built-in properties editing sidebar">
                  {{ showPropertiesSidebar() ? 'Built-in Sidebar: ON' : 'Built-in Sidebar: OFF' }}
                </button>
              </div>

              <div class="subtoolbar-hint">
                <span class="hint-icon">💡</span>
                <span>Double-click any node to open API & I/O Inspector (or toggle built-in sidebar)</span>
              </div>
            </div>
          }

          <!-- Content Body (Canvas or Code) -->
          <div class="viewer-body">
            @if (showCode()) {
              <div class="code-view animate-fade-in">
                <div class="code-banner">
                  <span>TypeScript & Component Setup</span>
                  <button class="copy-code-btn" (click)="copyCode()">{{ copied() ? 'Copied!' : 'Copy Code' }}</button>
                </div>
                <pre><code>{{ getActiveCodeSnippet() }}</code></pre>
              </div>
            } @else {
              <div class="canvas-view">
                @defer (on timer(1ms)) {
                  <ngx-workflow-diagram
                    [nodes]="activeScenario().nodes"
                    [edges]="getEdges()"
                    (nodeDoubleClick)="onNodeDoubleClick($event)"
                    (paneClick)="onPaneClick()"
                    (nodeClick)="onNodeClick($event)"
                    [showMinimap]="showMinimap()"
                    [showZoomControls]="showZoomControls()"
                    [showBackground]="showBackground()"
                    [backgroundVariant]="bgVariant()"
                    [showLayoutControls]="showLayoutControls()"
                    [showSearchControls]="showSearchControls()"
                    [showPropertiesSidebar]="showPropertiesSidebar()"
                  >
                    @if (activeScenario().id === 'legend') {
                      <ngx-workflow-panel [position]="legendPosition()" [style]="legendPanelStyle()">
                        <div class="workflow-legend-panel glass-panel" [class.collapsed]="legendCollapsed()" [style.color]="legendTextColor()">
                          <div class="legend-panel-header" (click)="toggleLegendCollapsed()">
                            <div class="legend-title-wrapper">
                              <svg class="legend-header-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="9" y1="21" x2="9" y2="9"></line>
                              </svg>
                              <span class="legend-title-text" [style.color]="legendTextColor()">Workflow Legend</span>
                            </div>
                            <button type="button" class="legend-toggle-btn" [attr.aria-label]="legendCollapsed() ? 'Expand legend' : 'Collapse legend'">
                              {{ legendCollapsed() ? '＋' : '—' }}
                            </button>
                          </div>

                          @if (!legendCollapsed()) {
                            <div class="legend-panel-body animate-fade-in">
                              <div class="legend-group">
                                <span class="legend-group-heading">Node Semantic Status</span>
                                <div class="legend-row">
                                  <span class="status-swatch status-blue"></span>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Ingestion / Active</span>
                                    <span class="status-desc">Inbound webhooks & API streams</span>
                                  </div>
                                </div>
                                <div class="legend-row">
                                  <span class="status-swatch status-amber"></span>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Validator / Processing</span>
                                    <span class="status-desc">Schema & inference step</span>
                                  </div>
                                </div>
                                <div class="legend-row">
                                  <span class="status-swatch status-green"></span>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Database Sink / Success</span>
                                    <span class="status-desc">Persisted to PostgreSQL</span>
                                  </div>
                                </div>
                                <div class="legend-row">
                                  <span class="status-swatch status-red"></span>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Dead-Letter / Alert</span>
                                    <span class="status-desc">Error capture queue</span>
                                  </div>
                                </div>
                              </div>

                              <div class="legend-divider"></div>

                              <div class="legend-group">
                                <span class="legend-group-heading">Edge Connection Types</span>
                                <div class="legend-row">
                                  <div class="edge-swatch edge-solid"></div>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Primary Pipeline</span>
                                    <span class="status-desc">Direct synchronous flow</span>
                                  </div>
                                </div>
                                <div class="legend-row">
                                  <div class="edge-swatch edge-dashed"></div>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Fallback & Retry</span>
                                    <span class="status-desc">Asynchronous retry queue</span>
                                  </div>
                                </div>
                                <div class="legend-row">
                                  <div class="edge-swatch edge-dotted"></div>
                                  <div class="status-text">
                                    <span class="status-name" [style.color]="legendTextColor()">Error Notification</span>
                                    <span class="status-desc">Incident webhook dispatch</span>
                                  </div>
                                </div>
                              </div>

                              <div class="legend-divider"></div>

                              <div class="legend-config-grid">
                                <div class="legend-config-item">
                                  <label for="panel-pos-select" class="pos-footer-label">Position:</label>
                                  <select id="panel-pos-select" class="legend-select-sm" [value]="legendPosition()" (change)="onLegendPosChange($event)">
                                    <option value="top-left">Top Left</option>
                                    <option value="top-center">Top Center</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="center-left">Center Left</option>
                                    <option value="center">Center</option>
                                    <option value="center-right">Center Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                  </select>
                                </div>

                                <div class="legend-config-item">
                                  <label for="panel-theme-select" class="pos-footer-label">Theme:</label>
                                  <select id="panel-theme-select" class="legend-select-sm" [value]="legendTheme()" (change)="onLegendThemeChange($event)">
                                    <option value="default">Default</option>
                                    <option value="dark">Dark Slate</option>
                                    <option value="indigo">Indigo</option>
                                    <option value="emerald">Emerald</option>
                                    <option value="white">White</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      </ngx-workflow-panel>
                    }

                    @if (activeScenario().id === 'legend' && inspectorOpen()) {
                      <ngx-workflow-panel [position]="inspectorPosition()" [style]="inspectorPanelStyle()">
                        <div class="node-inspector-panel glass-panel" [style.color]="legendTextColor()">
                          <div class="inspector-header">
                            <div class="inspector-title-group">
                              <span class="inspector-badge">{{ activeNodeConfig()?.method || 'NODE' }}</span>
                              <strong class="inspector-title-text">{{ activeNodeConfig()?.label || 'Node Configuration' }}</strong>
                            </div>
                            <button type="button" class="inspector-close-btn" (click)="closeInspector()" aria-label="Close inspector">×</button>
                          </div>

                          @if (isFetchingConfig()) {
                            <div class="inspector-loading">
                              <div class="loading-spinner"></div>
                              <span>Fetching live API config & I/O schema...</span>
                            </div>
                          } @else if (activeNodeConfig(); as cfg) {
                            <div class="inspector-body">
                              @if (saveToastMessage()) {
                                <div class="toast-pill">{{ saveToastMessage() }}</div>
                              }

                              <div class="metrics-grid">
                                <div class="metric-card">
                                  <span class="metric-label">Live Status</span>
                                  <span class="metric-value">{{ cfg.status }}</span>
                                </div>
                                <div class="metric-card">
                                  <span class="metric-label">Latency & Load</span>
                                  <span class="metric-value">{{ cfg.latency }} · {{ cfg.throughput }}</span>
                                </div>
                              </div>

                              <div class="form-group">
                                <label class="form-label" for="node-label-input">Node Label / Service Name:</label>
                                <input id="node-label-input" class="form-input" [value]="editFormLabel()" (input)="onEditLabel($event)" />
                              </div>

                              <div class="form-group">
                                <label class="form-label" for="node-endpoint-input">API Endpoint / Connection URI:</label>
                                <input id="node-endpoint-input" class="form-input" [value]="editFormEndpoint()" (input)="onEditEndpoint($event)" />
                              </div>

                              <div class="form-group">
                                <label class="form-label">Input / Output Payload Schema:</label>
                                <pre class="schema-block"><code>{{ cfg.inputSchema }}</code></pre>
                              </div>

                              <div class="inspector-actions">
                                <button type="button" class="tool-btn" (click)="closeInspector()">Close</button>
                                <button type="button" class="tool-btn btn-primary-sm" (click)="saveNodeConfig()">Save & Sync API</button>
                              </div>
                            </div>
                          }
                        </div>
                      </ngx-workflow-panel>
                    }
                  </ngx-workflow-diagram>
                } @placeholder {
                  <div class="canvas-placeholder">Diagram canvas</div>
                }
              </div>
            }
          </div>
        </main>

      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .examples-page {
      padding: 24px 32px 80px;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }

    .examples-header {
      margin-bottom: 24px;
    }

    .examples-header h1 {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 800;
      margin: 8px 0;
      letter-spacing: -0.03em;
    }

    .examples-grid {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 24px;
      min-height: 750px;
      width: 100%;
    }

    /* Sidebar */
    .examples-sidebar {
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sidebar-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .scenario-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .scenario-item {
      background: transparent;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 16px;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: all 0.2s;
    }

    .scenario-item:hover {
      background: var(--color-bg-surface-hover);
      border-color: var(--color-border-hover);
    }

    .scenario-item.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: var(--color-primary);
    }

    .scenario-name {
      font-weight: 600;
      font-size: 0.92rem;
      color: var(--color-text-primary);
    }

    .scenario-desc {
      font-size: 0.78rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    /* Viewer */
    .examples-viewer {
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .viewer-toolbar {
      min-height: 56px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      gap: 16px;
    }

    .active-info {
      flex-shrink: 0;
    }

    .active-info h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
      white-space: nowrap;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .scenario-subtoolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 20px;
      background: var(--color-bg-surface-hover, rgba(241, 245, 249, 0.6));
      border-bottom: 1px solid var(--color-border);
      gap: 12px;
      flex-wrap: wrap;
    }

    .subtoolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .subtoolbar-heading {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .subtoolbar-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .tool-btn {
      background: var(--color-bg-base);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tool-btn:hover, .tool-btn.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .btn-primary-sm {
      background: var(--color-primary);
      color: #ffffff;
      border: none;
    }

    .btn-primary-sm:hover {
      opacity: 0.9;
    }

    .viewer-body {
      flex: 1;
      position: relative;
      background: var(--color-bg-base);
      min-height: 600px;
    }

    .canvas-view {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0; left: 0;
    }

    .code-view {
      padding: 24px;
      height: 100%;
      overflow-y: auto;
      background: #0b0f19;
    }

    .code-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-family: var(--font-mono);
    }

    .copy-code-btn {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.78rem;
    }

    .code-view pre {
      margin: 0;
      font-family: var(--font-mono);
      font-size: 0.88rem;
      line-height: 1.6;
      color: #38bdf8;
    }

    /* Workflow Legend Panel Styles */
    .workflow-legend-panel {
      background: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      min-width: 270px;
      max-width: 310px;
      font-size: 0.82rem;
      overflow: hidden;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(12px);
      user-select: none;
    }

    .workflow-legend-panel.collapsed {
      min-width: 190px;
      max-width: 210px;
    }

    .legend-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--color-bg-surface-hover, rgba(241, 245, 249, 0.8));
      cursor: pointer;
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .legend-title-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-header-icon {
      color: var(--color-primary, #3b82f6);
      flex-shrink: 0;
    }

    .legend-title-text {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--color-text-primary, #0f172a);
    }

    .legend-toggle-btn {
      background: transparent;
      border: none;
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }

    .legend-panel-body {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 480px;
      overflow-y: auto;
    }

    .legend-group-heading {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #64748b);
      margin-bottom: 6px;
      display: block;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 0;
    }

    .status-swatch {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8), 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .status-blue { background-color: #3b82f6; }
    .status-amber { background-color: #f59e0b; }
    .status-green { background-color: #10b981; }
    .status-red { background-color: #ef4444; }

    .status-text {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }

    .status-name {
      font-weight: 600;
      font-size: 0.8rem;
      color: var(--color-text-primary, #1e293b);
    }

    .status-desc {
      font-size: 0.7rem;
      color: var(--color-text-muted, #64748b);
    }

    .edge-swatch {
      width: 24px;
      height: 2px;
      flex-shrink: 0;
    }

    .edge-solid {
      background-color: #3b82f6;
      height: 2px;
    }

    .edge-dashed {
      border-top: 2px dashed #f59e0b;
    }

    .edge-dotted {
      border-top: 2px dotted #ef4444;
    }

    .legend-divider {
      height: 1px;
      background: var(--color-border, #e2e8f0);
      margin: 2px 0;
    }

    .legend-config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 4px;
    }

    .legend-config-item {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .pos-footer-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--color-text-secondary, #475569);
    }

    .legend-select-sm {
      background: var(--color-bg-base, #f8fafc);
      border: 1px solid var(--color-border, #cbd5e1);
      color: var(--color-text-primary, #0f172a);
      font-size: 0.75rem;
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      outline: none;
      width: 100%;
    }

    .legend-pos-control {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .toolbar-pos-label {
      font-size: 0.8rem;
      color: var(--color-text-muted, #64748b);
      font-weight: 500;
    }

    /* Node API & Config Inspector */
    .node-inspector-panel {
      background: var(--color-bg-surface, rgba(255, 255, 255, 0.96));
      border: 1px solid var(--color-border, #cbd5e1);
      border-radius: var(--radius-md, 8px);
      box-shadow: 0 20px 30px -5px rgba(0, 0, 0, 0.3), 0 10px 15px -5px rgba(0, 0, 0, 0.1);
      width: 360px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      backdrop-filter: blur(16px);
      animation: inspectorFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes inspectorFadeIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .inspector-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: var(--color-bg-surface-hover, rgba(241, 245, 249, 0.9));
      border-bottom: 1px solid var(--color-border, #e2e8f0);
    }

    .inspector-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .inspector-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      background: #3b82f6;
      color: #ffffff;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .inspector-title-text {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .inspector-close-btn {
      background: transparent;
      border: none;
      font-size: 1.2rem;
      color: var(--color-text-muted, #64748b);
      cursor: pointer;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .inspector-close-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--color-text-primary, #0f172a);
    }

    .inspector-body {
      padding: 12px 14px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      font-size: 0.78rem;
    }

    .inspector-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      gap: 10px;
      color: var(--color-text-muted, #64748b);
      font-size: 0.8rem;
    }

    .loading-spinner {
      width: 26px;
      height: 26px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .metric-card {
      background: var(--color-bg-base, #f8fafc);
      border: 1px solid var(--color-border, #e2e8f0);
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .metric-label {
      font-size: 0.65rem;
      color: var(--color-text-muted, #64748b);
      font-weight: 600;
      text-transform: uppercase;
    }

    .metric-value {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--color-text-primary, #0f172a);
      font-family: var(--font-mono, monospace);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .form-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-secondary, #475569);
    }

    .form-input {
      background: var(--color-bg-base, #f8fafc);
      border: 1px solid var(--color-border, #cbd5e1);
      color: var(--color-text-primary, #0f172a);
      padding: 5px 8px;
      border-radius: 5px;
      font-size: 0.78rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    }

    .schema-block {
      background: #0b0f19;
      color: #38bdf8;
      font-family: var(--font-mono, monospace);
      font-size: 0.7rem;
      padding: 6px 8px;
      border-radius: 6px;
      margin: 0;
      max-height: 85px;
      overflow-y: auto;
      white-space: pre-wrap;
    }

    .inspector-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      padding-top: 6px;
      border-top: 1px solid var(--color-border, #e2e8f0);
    }

    .toast-pill {
      background: #10b981;
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 0.72rem;
      font-weight: 600;
      text-align: center;
      animation: fadeIn 0.2s;
    }

    .select-btn {
      padding: 5px 8px;
      cursor: pointer;
    }
  `]
})
export class ExamplesComponent implements AfterViewInit {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  animated = signal(true);
  bgVariant = signal<'dots' | 'lines' | 'cross'>('dots');
  showCode = signal(false);
  copied = signal(false);
  showSearchControls = signal(false);
  showBackground = signal(true);
  showMinimap = signal(false);
  showZoomControls = signal(true);
  showLayoutControls = signal(true);
  showPropertiesSidebar = signal(false);
  legendPosition = signal<PanelPosition>('top-right');
  legendCollapsed = signal(false);
  legendTheme = signal<'default' | 'dark' | 'indigo' | 'emerald' | 'white'>('default');
  legendWidth = signal<'compact' | 'normal' | 'wide'>('normal');

  inspectorOpen = signal(false);
  isFetchingConfig = signal(false);
  activeNodeConfig = signal<any>(null);
  selectedNode = signal<Node | null>(null);
  editFormLabel = signal('');
  editFormEndpoint = signal('');
  saveToastMessage = signal<string | null>(null);
  inspectorPosition = signal<PanelPosition>('center-right');

  scenarios: ExampleScenario[] = [
    {
      id: 'pipeline',
      title: 'Basic Pipeline',
      description: 'Simple linear workflow with source, processing, and destination.',
      nodes: [
        { id: 'n1', label: 'HTTP Webhook Input', position: { x: 80, y: 180 }, ports: 2 },
        { id: 'n2', label: 'JSON Schema Validation', position: { x: 360, y: 180 }, ports: 4 },
        { id: 'n3', label: 'PostgreSQL Database Sink', position: { x: 680, y: 180 }, ports: 2 }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'right', targetHandle: 'left' }
      ],
      codeSnippet: `import { Component, signal } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-basic-pipeline',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: \`<ngx-workflow-diagram [nodes]="nodes()" [edges]="edges()"></ngx-workflow-diagram>\`
})
export class BasicPipelineComponent {
  nodes = signal<Node[]>([
    { id: 'n1', label: 'HTTP Webhook Input', position: { x: 80, y: 180 }, ports: 2 },
    { id: 'n2', label: 'JSON Schema Validation', position: { x: 360, y: 180 }, ports: 4 },
    { id: 'n3', label: 'PostgreSQL Database Sink', position: { x: 680, y: 180 }, ports: 2 }
  ]);

  edges = signal<Edge[]>([
    { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'right', targetHandle: 'left' },
    { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'right', targetHandle: 'left' }
  ]);
}`
    },
    {
      id: 'legend',
      title: 'Workflow Legend & Panels',
      description: 'Interactive overlay panel displaying node status semantics, edge connection styles, and 9-point positioning.',
      nodes: [
        {
          id: 'leg-1',
          label: 'HTTP Ingestion',
          position: { x: 80, y: 130 },
          ports: 4,
          style: { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3b82f6', color: 'var(--color-text-primary, #f8fafc)' },
          badges: [{ content: 'Active', backgroundColor: '#3b82f6' }]
        },
        {
          id: 'leg-2',
          label: 'Schema Validator',
          position: { x: 380, y: 130 },
          ports: 4,
          style: { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#f59e0b', color: 'var(--color-text-primary, #f8fafc)' },
          badges: [{ content: 'Validating', backgroundColor: '#f59e0b' }]
        },
        {
          id: 'leg-3',
          label: 'PostgreSQL Sink',
          position: { x: 680, y: 130 },
          ports: 4,
          style: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: 'var(--color-text-primary, #f8fafc)' },
          badges: [{ content: 'Success', backgroundColor: '#10b981' }]
        },
        {
          id: 'leg-4',
          label: 'Fallback Queue',
          position: { x: 380, y: 290 },
          ports: 4,
          style: { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#d97706', color: 'var(--color-text-primary, #f8fafc)' },
          borderStyle: 'dashed'
        },
        {
          id: 'leg-5',
          label: 'Alert Dispatcher',
          position: { x: 680, y: 290 },
          ports: 4,
          style: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', color: 'var(--color-text-primary, #f8fafc)' },
          badges: [{ content: 'P1 Alert', backgroundColor: '#ef4444' }]
        }
      ],
      edges: [
        {
          id: 'e-leg-1',
          source: 'leg-1',
          target: 'leg-2',
          type: 'bezier',
          sourceHandle: 'right',
          targetHandle: 'left',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
          animated: true,
          edgeLabels: { center: 'json payload' }
        },
        {
          id: 'e-leg-2',
          source: 'leg-2',
          target: 'leg-3',
          type: 'bezier',
          sourceHandle: 'right',
          targetHandle: 'left',
          style: { stroke: '#10b981', strokeWidth: 2 },
          animated: true,
          edgeLabels: { center: 'verified' }
        },
        {
          id: 'e-leg-3',
          source: 'leg-2',
          target: 'leg-4',
          type: 'step',
          sourceHandle: 'bottom',
          targetHandle: 'top',
          style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' },
          edgeLabels: { center: 'retry flow' }
        },
        {
          id: 'e-leg-4',
          source: 'leg-4',
          target: 'leg-5',
          type: 'step',
          sourceHandle: 'right',
          targetHandle: 'left',
          style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '2,3' },
          edgeLabels: { center: 'error dispatch' }
        }
      ],
      codeSnippet: `import { Component, signal } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, PanelPosition } from 'ngx-workflow';

@Component({
  selector: 'app-workflow-legend-demo',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: \`
    <ngx-workflow-diagram [nodes]="nodes()" [edges]="edges()" [showBackground]="true" [showSearchControls]="false">
      <!-- Overlay Legend Panel with 9-point positioning -->
      <ngx-workflow-panel [position]="legendPosition()">
        <div class="legend-card glass-panel">
          <div class="legend-header">
            <h4>Workflow Legend</h4>
          </div>

          <div class="legend-section">
            <span class="section-title">Node Semantic Status</span>
            <div class="legend-item"><span class="dot bg-blue"></span> Active / Ingestion</div>
            <div class="legend-item"><span class="dot bg-amber"></span> Validator / Processing</div>
            <div class="legend-item"><span class="dot bg-emerald"></span> Database Sink / Success</div>
            <div class="legend-item"><span class="dot bg-rose"></span> Dead-Letter / Alert</div>
          </div>

          <div class="legend-section">
            <span class="section-title">Edge Connection Types</span>
            <div class="legend-item"><span class="line line-solid"></span> Primary Pipeline</div>
            <div class="legend-item"><span class="line line-dashed"></span> Fallback & Retry</div>
            <div class="legend-item"><span class="line line-dotted"></span> Error Notification</div>
          </div>
        </div>
      </ngx-workflow-panel>
    </ngx-workflow-diagram>
  \`
})
export class WorkflowLegendDemoComponent {
  legendPosition = signal<PanelPosition>('top-right');

  nodes = signal<Node[]>([
    { id: '1', label: 'HTTP Ingestion', position: { x: 80, y: 130 }, badges: [{ content: 'Active', backgroundColor: '#3b82f6' }] },
    { id: '2', label: 'Schema Validator', position: { x: 380, y: 130 }, badges: [{ content: 'Validating', backgroundColor: '#f59e0b' }] },
    { id: '3', label: 'PostgreSQL Sink', position: { x: 680, y: 130 }, badges: [{ content: 'Success', backgroundColor: '#10b981' }] },
    { id: '4', label: 'Fallback Queue', position: { x: 380, y: 290 }, borderStyle: 'dashed' },
    { id: '5', label: 'Alert Dispatcher', position: { x: 680, y: 290 }, badges: [{ content: 'P1 Alert', backgroundColor: '#ef4444' }] }
  ]);

  edges = signal<Edge[]>([
    { id: 'e1', source: '1', target: '2', type: 'bezier', style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e2', source: '2', target: '3', type: 'bezier', style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e3', source: '2', target: '4', type: 'step', style: { stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '5,5' } },
    { id: 'e4', source: '4', target: '5', type: 'step', style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '2,3' } }
  ]);
}`
    },
    {
      id: 'autolayout',
      title: 'ELK.js Auto Layout',
      description: 'Automatic graph layout computation using ELK algorithm engine.',
      nodes: [
        { id: 'a1', label: 'Root Ingestion', position: { x: 0, y: 0 }, ports: 2 },
        { id: 'a2', label: 'Branch A (Auth)', position: { x: 0, y: 0 }, ports: 3 },
        { id: 'a3', label: 'Branch B (Billing)', position: { x: 0, y: 0 }, ports: 3 },
        { id: 'a4', label: 'Stripe API', position: { x: 0, y: 0 }, ports: 2 },
        { id: 'a5', label: 'JWT Signer', position: { x: 0, y: 0 }, ports: 2 }
      ],
      edges: [
        { id: 'ae1', source: 'a1', target: 'a2', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae2', source: 'a1', target: 'a3', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae3', source: 'a3', target: 'a4', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae4', source: 'a2', target: 'a5', sourceHandle: 'right', targetHandle: 'left' }
      ],
      codeSnippet: `import { Component, inject } from '@angular/core';
import { LayoutService } from 'ngx-workflow';

@Component({ ... })
export class AutoLayoutDemoComponent {
  private layoutService = inject(LayoutService);

  async arrange() {
    const updated = await this.layoutService.applyElkLayout(nodes, edges, { direction: 'RIGHT' });
  }
}`
    },
    {
      id: 'routing',
      title: 'Path Routing Variants',
      description:
        'Direction-aware Bezier curves (handle-aware), orthogonal steps, and straight paths — including vertical bottom→top flows.',
      nodes: [
        { id: 'r1', label: 'Origin Source', position: { x: 80, y: 160 }, ports: 4 },
        { id: 'r2', label: 'Bezier →', position: { x: 420, y: 40 }, ports: 4 },
        { id: 'r3', label: 'Step →', position: { x: 420, y: 160 }, ports: 4 },
        { id: 'r4', label: 'Straight →', position: { x: 420, y: 280 }, ports: 4 },
        { id: 'r5', label: 'Start', position: { x: 700, y: 40 }, ports: 4 },
        { id: 'r6', label: 'End (vertical)', position: { x: 700, y: 260 }, ports: 4 },
      ],
      edges: [
        { id: 're1', source: 'r1', target: 'r2', type: 'bezier', sourceHandle: 'right', targetHandle: 'left', animated: true },
        { id: 're2', source: 'r1', target: 'r3', type: 'step', sourceHandle: 'right', targetHandle: 'left', animated: true },
        { id: 're3', source: 'r1', target: 'r4', type: 'straight', sourceHandle: 'right', targetHandle: 'left', animated: true },
        {
          id: 're4',
          source: 'r5',
          target: 'r6',
          type: 'bezier',
          sourceHandle: 'bottom',
          targetHandle: 'top',
          animated: true,
          edgeLabels: { center: 'bezier ↓' },
        },
      ],
      codeSnippet: `edges = signal<Edge[]>([
  // Horizontal: curves leave the right handle and enter the left
  { id: 're1', source: 'r1', target: 'r2', type: 'bezier', sourceHandle: 'right', targetHandle: 'left' },
  // Vertical: curves leave the bottom handle and enter the top
  { id: 're4', source: 'r5', target: 'r6', type: 'bezier', sourceHandle: 'bottom', targetHandle: 'top' },
  { id: 're2', source: 'r1', target: 'r3', type: 'step', sourceHandle: 'right', targetHandle: 'left' },
  { id: 're3', source: 'r1', target: 'r4', type: 'straight', sourceHandle: 'right', targetHandle: 'left' },
]);`
    },
    {
      id: 'highdensity',
      title: 'High Density Network',
      description: 'Multi-node network exhibiting pan, zoom, and minimap efficiency.',
      nodes: [
        { id: 'h1', label: 'Core Node', position: { x: 300, y: 200 }, ports: 4 },
        { id: 'h2', label: 'Worker 1', position: { x: 100, y: 80 }, ports: 2 },
        { id: 'h3', label: 'Worker 2', position: { x: 500, y: 80 }, ports: 2 },
        { id: 'h4', label: 'Worker 3', position: { x: 100, y: 320 }, ports: 2 },
        { id: 'h5', label: 'Worker 4', position: { x: 500, y: 320 }, ports: 2 },
        { id: 'h6', label: 'Monitor', position: { x: 300, y: 400 }, ports: 2 }
      ],
      edges: [
        { id: 'he1', source: 'h2', target: 'h1' },
        { id: 'he2', source: 'h3', target: 'h1' },
        { id: 'he3', source: 'h1', target: 'h4' },
        { id: 'he4', source: 'h1', target: 'h5' },
        { id: 'he5', source: 'h1', target: 'h6' }
      ],
      codeSnippet: `// Renders high-density node networks with OnPush change detection & Signals state synchronization.`
    }
  ];

  activeScenario = signal<ExampleScenario>(this.scenarios[0]);

  constructor(private layoutService: LayoutService) {}

  ngAfterViewInit() {
    setTimeout(() => this.fitView(), 100);
  }

  selectScenario(scen: ExampleScenario) {
    this.activeScenario.set(scen);
    this.showCode.set(false);
    this.closeInspector();
    this.showPropertiesSidebar.set(false);
    this.showSearchControls.set(scen.id !== 'legend');
    setTimeout(() => this.fitView(), 100);
  }

  togglePropertiesSidebar() {
    this.showPropertiesSidebar.update(v => !v);
  }

  onPaneClick() {
    if (this.inspectorOpen()) {
      this.closeInspector();
    }
  }

  onNodeClick(node: Node) {
    if (this.selectedNode() && this.selectedNode()!.id !== node.id && this.inspectorOpen()) {
      this.closeInspector();
    }
  }

  toggleSearchControls() {
    this.showSearchControls.update(s => !s);
  }

  toggleBackground() {
    this.showBackground.update(b => !b);
  }

  toggleMinimap() {
    this.showMinimap.update(m => !m);
  }

  toggleZoomControls() {
    this.showZoomControls.update(z => !z);
  }

  toggleAnimated() {
    this.animated.update(v => !v);
  }

  cycleBg() {
    const current = this.bgVariant();
    if (current === 'dots') this.bgVariant.set('lines');
    else if (current === 'lines') this.bgVariant.set('cross');
    else this.bgVariant.set('dots');
  }

  fitView() {
    if (this.diagram) {
      this.diagram.fitView();
    }
  }

  legendPanelStyle = computed(() => {
    const widthMap = {
      compact: '260px',
      normal: '310px',
      wide: '370px'
    };

    const themeMap: Record<string, Record<string, string>> = {
      default: {},
      dark: {
        background: 'rgba(15, 23, 42, 0.94)',
        color: '#f8fafc',
        borderColor: 'rgba(51, 65, 85, 0.9)',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      },
      indigo: {
        background: 'rgba(30, 27, 75, 0.94)',
        color: '#e0e7ff',
        borderColor: 'rgba(99, 102, 241, 0.6)',
        boxShadow: '0 20px 25px -5px rgba(49, 46, 129, 0.4)'
      },
      emerald: {
        background: 'rgba(6, 78, 59, 0.94)',
        color: '#ecfdf5',
        borderColor: 'rgba(16, 185, 129, 0.6)',
        boxShadow: '0 20px 25px -5px rgba(6, 78, 59, 0.4)'
      },
      white: {
        background: '#ffffff',
        color: '#0f172a',
        borderColor: '#cbd5e1',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
      }
    };

    return {
      width: this.legendCollapsed() ? '200px' : widthMap[this.legendWidth()],
      ...themeMap[this.legendTheme()]
    };
  });

  legendTextColor = computed(() => {
    switch (this.legendTheme()) {
      case 'dark':
        return '#f8fafc';
      case 'indigo':
        return '#e0e7ff';
      case 'emerald':
        return '#ecfdf5';
      case 'white':
        return '#0f172a';
      default:
        return 'inherit';
    }
  });

  onLegendPosChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.legendPosition.set(target.value as PanelPosition);
    }
  }

  onLegendThemeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.legendTheme.set(target.value as any);
    }
  }

  onLegendWidthChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    if (target?.value) {
      this.legendWidth.set(target.value as any);
    }
  }

  toggleLegendCollapsed() {
    this.legendCollapsed.update(c => !c);
  }

  async triggerAutoLayout() {
    const updated = await this.layoutService.applyElkLayout(
      this.activeScenario().nodes,
      this.activeScenario().edges,
      { direction: 'RIGHT' }
    );
    this.activeScenario.update(s => ({ ...s, nodes: updated }));
    setTimeout(() => this.fitView(), 50);
  }

  toggleCode() {
    this.showCode.update(v => !v);
  }

  inspectorPanelStyle = computed(() => {
    return {
      zIndex: 20,
      filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.2))'
    };
  });

  async onNodeDoubleClick(node: Node) {
    this.selectedNode.set(node);
    this.inspectorOpen.set(true);
    this.isFetchingConfig.set(true);

    // Simulate async API fetch latency (e.g. 250ms)
    await new Promise(r => setTimeout(r, 250));

    const mockConfigs: Record<string, any> = {
      'leg-1': {
        nodeId: 'leg-1',
        label: node.label || 'HTTP Ingestion',
        endpoint: '/v1/webhooks/orders',
        method: 'POST',
        status: 'Healthy (200 OK)',
        throughput: '1,420 req/s',
        latency: '12ms',
        inputSchema: '{\n  "orderId": "uuid",\n  "amount": 299.99,\n  "currency": "USD"\n}',
        outputSchema: '{\n  "validated": true,\n  "streamId": "str_89a1f"\n}'
      },
      'leg-2': {
        nodeId: 'leg-2',
        label: node.label || 'Schema Validator',
        endpoint: '/v1/validators/schema',
        method: 'POST',
        status: 'Active (99.8% match)',
        throughput: '1,380 req/s',
        latency: '4ms',
        inputSchema: '{\n  "streamId": "str_89a1f",\n  "schemaVersion": "2.4"\n}',
        outputSchema: '{\n  "status": "VALID",\n  "sanitized": true\n}'
      },
      'leg-3': {
        nodeId: 'leg-3',
        label: node.label || 'PostgreSQL Sink',
        endpoint: 'postgresql://prod-db:5432/transactions',
        method: 'INSERT BATCH',
        status: 'Connected (Pool 16/20)',
        throughput: '950 writes/s',
        latency: '8ms',
        inputSchema: '{\n  "table": "public.orders",\n  "batchSize": 500\n}',
        outputSchema: '{\n  "inserted": 500,\n  "lagMs": 2\n}'
      },
      'leg-4': {
        nodeId: 'leg-4',
        label: node.label || 'Fallback Queue',
        endpoint: 'amqp://rabbitmq:5672/dead-letter',
        method: 'ENQUEUE',
        status: 'Standby (0 pending)',
        throughput: '0 msgs/s',
        latency: '1ms',
        inputSchema: '{\n  "queue": "retry_dlq",\n  "backoff": "exponential"\n}',
        outputSchema: '{\n  "enqueued": true,\n  "retryIn": "30s"\n}'
      },
      'leg-5': {
        nodeId: 'leg-5',
        label: node.label || 'Alert Dispatcher',
        endpoint: 'https://events.pagerduty.com/v2/enqueue',
        method: 'POST',
        status: 'Ready (P1 Trigger)',
        throughput: 'On Demand',
        latency: '45ms',
        inputSchema: '{\n  "service": "Core-Pipeline",\n  "severity": "P1-CRITICAL"\n}',
        outputSchema: '{\n  "incidentId": "INC-89412",\n  "notified": ["oncall-eng"]\n}'
      }
    };

    const cfg = mockConfigs[node.id] || {
      nodeId: node.id,
      label: node.label || node.id,
      endpoint: `/api/nodes/${node.id}/config`,
      method: 'GET',
      status: 'Connected',
      throughput: '100 req/s',
      latency: '10ms',
      inputSchema: '{\n  "nodeId": "' + node.id + '"\n}',
      outputSchema: '{\n  "status": "OK"\n}'
    };

    this.activeNodeConfig.set(cfg);
    this.editFormLabel.set(cfg.label);
    this.editFormEndpoint.set(cfg.endpoint);
    this.isFetchingConfig.set(false);
  }

  onEditLabel(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.editFormLabel.set(target.value);
    }
  }

  onEditEndpoint(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      this.editFormEndpoint.set(target.value);
    }
  }

  saveNodeConfig() {
    const node = this.selectedNode();
    if (!node) return;

    const newLabel = this.editFormLabel().trim() || node.label;
    const newEndpoint = this.editFormEndpoint().trim();

    // Update the diagram node label in the active scenario
    this.activeScenario.update(scen => ({
      ...scen,
      nodes: scen.nodes.map(n => n.id === node.id ? { ...n, label: newLabel } : n)
    }));

    if (this.activeNodeConfig()) {
      this.activeNodeConfig.update(c => c ? { ...c, label: newLabel, endpoint: newEndpoint } : null);
    }

    this.saveToastMessage.set(`Node "${newLabel}" synced & updated!`);
    setTimeout(() => this.saveToastMessage.set(null), 2500);
  }

  closeInspector() {
    this.inspectorOpen.set(false);
    this.selectedNode.set(null);
    this.activeNodeConfig.set(null);
  }

  toggleInspector() {
    if (this.inspectorOpen()) {
      this.closeInspector();
    } else {
      const firstNode = this.activeScenario().nodes[0];
      if (firstNode) {
        this.onNodeDoubleClick(firstNode);
      }
    }
  }

  getActiveCodeSnippet(): string {
    if (this.activeScenario().id === 'legend') {
      const pos = this.legendPosition();
      const styleObj = this.legendPanelStyle();
      const styleStr = JSON.stringify(styleObj, null, 6).replace(/"/g, "'");

      return `import { Component, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgxWorkflowModule, Node, Edge, PanelPosition } from 'ngx-workflow';

@Component({
  selector: 'app-workflow-legend-demo',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: \`
    <ngx-workflow-diagram
      [nodes]="nodes()"
      [edges]="edges()"
      [showPropertiesSidebar]="false"
      (nodeDoubleClick)="onNodeDoubleClick($event)"
      (paneClick)="closeInspector()"
      [showBackground]="true"
      [showSearchControls]="false"
    >
      <!-- Overlay Legend Panel -->
      <ngx-workflow-panel
        [position]="legendPosition()"
        [style]="legendStyle()"
      >
        <div class="legend-card">
          <div class="legend-header">
            <h4>Workflow Legend</h4>
          </div>
          <div class="legend-section">
            <span class="section-title">Node Semantic Status</span>
            <div class="legend-item"><span class="dot bg-blue"></span> Active / Ingestion</div>
            <div class="legend-item"><span class="dot bg-amber"></span> Validator / Processing</div>
            <div class="legend-item"><span class="dot bg-emerald"></span> Database Sink / Success</div>
            <div class="legend-item"><span class="dot bg-rose"></span> Dead-Letter / Alert</div>
          </div>
        </div>
      </ngx-workflow-panel>

      <!-- Projected Node API & I/O Inspector on Double-Click -->
      @if (inspectorOpen()) {
        <ngx-workflow-panel [position]="'center-right'">
          <div class="inspector-card">
            @if (loading()) {
              <div class="spinner">Fetching live API details...</div>
            } @else if (selectedConfig(); as cfg) {
              <h4>{{ cfg.label }} API Config</h4>
              <p><strong>Endpoint:</strong> {{ cfg.endpoint }}</p>
              <p><strong>Throughput:</strong> {{ cfg.throughput }}</p>
              <label>Service Label: <input [(ngModel)]="cfg.label" /></label>
              <button (click)="saveNode(cfg)">Save & Sync API</button>
            }
          </div>
        </ngx-workflow-panel>
      }
    </ngx-workflow-diagram>
  \`
})
export class WorkflowLegendDemoComponent {
  legendPosition = signal<PanelPosition>('${pos}');
  legendStyle = signal<Record<string, string>>(${styleStr});
  inspectorOpen = signal(false);
  loading = signal(false);
  selectedConfig = signal<any>(null);

  nodes = signal<Node[]>([ ... ]);
  edges = signal<Edge[]>([ ... ]);

  constructor(private http: HttpClient) {}

  /** Triggered when double clicking any node on canvas */
  async onNodeDoubleClick(node: Node) {
    this.inspectorOpen.set(true);
    this.loading.set(true);

    // Fetch live backend API / I/O configuration:
    const data = await this.http.get('/api/nodes/' + node.id + '/config').toPromise();
    this.selectedConfig.set(data);
    this.loading.set(false);
  }

  saveNode(updated: any) {
    // Update diagram node state:
    this.nodes.update(list => list.map(n => n.id === updated.id ? { ...n, label: updated.label } : n));
  }
}`;
    }
    return this.activeScenario().codeSnippet;
  }

  copyCode() {
    navigator.clipboard.writeText(this.getActiveCodeSnippet());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  getEdges(): Edge[] {
    const isAnim = this.animated();
    return this.activeScenario().edges.map(e => ({
      ...e,
      animated: isAnim
    }));
  }
}
