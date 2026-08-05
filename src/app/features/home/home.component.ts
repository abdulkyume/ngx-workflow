import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

interface DiagramPreset {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg-glow"></div>
      
      <div class="container hero-container animate-fade-in">
        
        <!-- Top Announcement Badge -->
        <a routerLink="/docs/intro" class="hero-badge">
          <span class="badge-sparkle">✨</span>
          <span>Built for Angular 18/19 & Signals</span>
          <span class="badge-arrow">→</span>
        </a>

        <!-- Headline & Subtitle -->
        <h1 class="hero-title">
          The Flowchart Engine for<br>
          <span class="text-gradient">Modern Angular Applications</span>.
        </h1>
        
        <p class="hero-subtitle">
          A high-performance, fully customizable node-based workflow builder. Pure Signals reactivity,
          built-in ELK.js layout algorithms, and zero heavy dependency overhead.
        </p>
        
        <!-- Call to Actions -->
        <div class="hero-actions">
          <a routerLink="/docs" class="btn btn-primary btn-lg">
            <span>Get Started Docs</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a routerLink="/sandbox" class="btn btn-secondary btn-lg">
            <span>Launch Sandbox</span>
          </a>

          <!-- Install snippet widget -->
          <div class="install-widget">
            <div class="pkg-tabs">
              <span [class.active]="pkgManager() === 'npm'" (click)="setPkg('npm')">npm</span>
              <span [class.active]="pkgManager() === 'pnpm'" (click)="setPkg('pnpm')">pnpm</span>
              <span [class.active]="pkgManager() === 'yarn'" (click)="setPkg('yarn')">yarn</span>
            </div>
            <div class="install-cmd" (click)="copyInstallCommand()">
              <span class="cmd-text">{{ getInstallCommand() }}</span>
              <button class="copy-btn" [class.copied]="copied()">
                @if (copied()) { Copied! } @else { Copy }
              </button>
            </div>
          </div>
        </div>

        <!-- Interactive Hero Flowchart Demo Window -->
        <div class="hero-visual">
          <div class="editor-window glass-panel">
            <div class="editor-bar">
              <div class="traffic-lights">
                <span class="light red"></span>
                <span class="light yellow"></span>
                <span class="light green"></span>
              </div>

              <!-- Preset Selector -->
              <div class="preset-selector">
                @for (preset of presets; track preset.id) {
                  <button 
                    class="preset-btn" 
                    [class.active]="activePreset().id === preset.id"
                    (click)="selectPreset(preset)">
                    {{ preset.name }}
                  </button>
                }
              </div>

              <!-- Controls Right -->
              <div class="editor-actions">
                <button class="editor-tool-btn" [class.active]="animatedEdges()" (click)="toggleAnimated()" title="Toggle Edge Animation">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Anim
                </button>
                <button class="editor-tool-btn" (click)="cycleBg()" title="Cycle Background Variant">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {{ bgVariant() }}
                </button>
              </div>
            </div>

            <!-- Canvas Viewport -->
            <div class="editor-content">
              <ngx-workflow-diagram
                [nodes]="activePreset().nodes"
                [edges]="getEdgesWithAnim()"
                [showBackground]="true"
                [backgroundVariant]="bgVariant()"
                [showZoomControls]="true"
                [showMinimap]="true"
                [showLayoutControls]="true"
              ></ngx-workflow-diagram>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Code & Live Preview Split Section -->
    <section class="code-preview-section">
      <div class="container">
        <div class="section-header text-center">
          <span class="badge badge-accent">Developer Experience</span>
          <h2>Simple, Clean & Signal-Native API</h2>
          <p class="text-muted">Define reactive state with Angular Signals and bind directly to the diagram component.</p>
        </div>

        <div class="code-preview-grid glass-panel">
          <!-- Code Side -->
          <div class="code-side">
            <div class="code-header">
              <span class="file-tab active">app.component.ts</span>
            </div>
            <pre><code><span class="token-keyword">import</span> &#123; Component, signal &#125; <span class="token-keyword">from</span> <span class="token-string">'&#64;angular/core'</span>;
<span class="token-keyword">import</span> &#123; NgxWorkflowModule, Node, Edge &#125; <span class="token-keyword">from</span> <span class="token-string">'ngx-workflow'</span>;

<span class="token-decorator">&#64;Component</span>(&#123;
  selector: <span class="token-string">'app-root'</span>,
  standalone: <span class="token-boolean">true</span>,
  imports: [NgxWorkflowModule],
  template: <span class="token-string">\`
    &lt;ngx-workflow-diagram
      [nodes]="nodes()"
      [edges]="edges()"
      [showBackground]="true"
      [showZoomControls]="true"
      [showMinimap]="true"
    &gt;&lt;/ngx-workflow-diagram&gt;
  \`</span>
&#125;)
<span class="token-keyword">export class</span> AppComponent &#123;
  nodes = signal&lt;Node[]&gt;([
    &#123; id: <span class="token-string">'1'</span>, label: <span class="token-string">'Input Trigger'</span>, position: &#123; x: 100, y: 120 &#125;, ports: 2 &#125;,
    &#123; id: <span class="token-string">'2'</span>, label: <span class="token-string">'Data Processing'</span>, position: &#123; x: 380, y: 120 &#125;, ports: 4 &#125;,
    &#123; id: <span class="token-string">'3'</span>, label: <span class="token-string">'Database Storage'</span>, position: &#123; x: 660, y: 120 &#125;, ports: 2 &#125;
  ]);

  edges = signal&lt;Edge[]&gt;([
    &#123; id: <span class="token-string">'e1-2'</span>, source: <span class="token-string">'1'</span>, target: <span class="token-string">'2'</span>, animated: <span class="token-boolean">true</span> &#125;,
    &#123; id: <span class="token-string">'e2-3'</span>, source: <span class="token-string">'2'</span>, target: <span class="token-string">'3'</span> &#125;
  ]);
&#125;</code></pre>
          </div>

          <!-- Preview Side -->
          <div class="preview-side">
            <div class="preview-header">
              <span class="preview-title">Rendered Output</span>
            </div>
            <div class="preview-canvas">
              <ngx-workflow-diagram
                [nodes]="sampleCodeNodes"
                [edges]="sampleCodeEdges"
                [showBackground]="true"
                backgroundVariant="dots"
                [showZoomControls]="true"
              ></ngx-workflow-diagram>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section class="features-section">
      <div class="container">
        <div class="section-header text-center">
          <span class="badge badge-accent">Everything You Need</span>
          <h2>Architected for Power & Flexibility</h2>
          <p class="text-muted">Built from the ground up for modern Angular enterprise applications.</p>
        </div>

        <div class="bento-grid">
          
          <!-- Row 1, Card 1: Performance (Span 2) -->
          <div class="bento-card col-span-2 glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">⚡</div>
              <h3>Signals-Native Performance</h3>
              <p>Renders 1000+ nodes smoothly at 60FPS. Built on OnPush change detection strategies and Angular Signals, avoiding heavy Zone.js digest cycles.</p>
            </div>
            <div class="card-metric">
              <div class="metric-item">
                <span class="metric-val">60 FPS</span>
                <span class="metric-label">Smooth Pan & Zoom</span>
              </div>
              <div class="metric-item">
                <span class="metric-val">&lt; 15 KB</span>
                <span class="metric-label">Minimal Gzip Overhead</span>
              </div>
            </div>
          </div>

          <!-- Row 1, Card 2: Auto Layout (Span 1) -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">📐</div>
              <h3>ELK.js Auto-Layout Engine</h3>
              <p>Integrated automatic hierarchical, tree, and force-directed diagram positioning algorithm powered by ELK.js.</p>
            </div>
          </div>

          <!-- Row 2, Card 3: Customization (Span 1) -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">🎨</div>
              <h3>Template Projection</h3>
              <p>Bring your own HTML/CSS or Angular components. Custom node headers, handles, ports, and edge paths seamlessly project.</p>
            </div>
          </div>

          <!-- Row 2, Card 4: History & State (Span 1) -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">🔄</div>
              <h3>State Sync & Undo/Redo</h3>
              <p>Built-in reactive state service with state snapshots, undo/redo stack, and instant JSON export/import capability.</p>
            </div>
          </div>

          <!-- Row 2, Card 5: Type Safety (Span 1) -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">🛡️</div>
              <h3>100% Type-Safe API</h3>
              <p>Strict TypeScript definitions for Nodes, Edges, Handles, Viewport state, and Connection events out of the box.</p>
            </div>
          </div>

          <!-- Row 3, Card 6: Overlays & Controls (Span 3 - Full Width) -->
          <div class="bento-card col-span-3 glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">🎛️</div>
              <h3>Composable Plugin System</h3>
              <p>Plug-and-play UI controls: Interactive Minimap, Zoom toolbar, Undo/Redo panel, Node search overlay, Properties sidebar, and Context menu.</p>
            </div>
            <div class="card-tags">
              <span class="tag">Minimap</span>
              <span class="tag">Zoom Controls</span>
              <span class="tag">Undo/Redo</span>
              <span class="tag">Search Panel</span>
              <span class="tag">Layout Align</span>
              <span class="tag">Properties Sidebar</span>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Comparison Matrix -->
    <section class="comparison-section">
      <div class="container">
        <div class="section-header text-center">
          <span class="badge badge-accent">Why Choose Us</span>
          <h2>ngx-workflow vs Generic Graph Libraries</h2>
        </div>

        <div class="matrix-table-wrapper glass-panel">
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th class="highlight-col">ngx-workflow</th>
                <th>Generic Flow Libraries</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="feat-name">Angular Signals Native</td>
                <td class="highlight-col text-success">✓ Built-in Signals</td>
                <td class="text-muted">✗ RxJS / Zone.js Heavy</td>
              </tr>
              <tr>
                <td class="feat-name">HTML & Component Projection</td>
                <td class="highlight-col text-success">✓ Direct Template Projection</td>
                <td class="text-muted">✗ Complex Canvas Bridge</td>
              </tr>
              <tr>
                <td class="feat-name">Auto-Layout Algorithms</td>
                <td class="highlight-col text-success">✓ ELK.js Built-in Service</td>
                <td class="text-muted">✗ Requires Third-party Setup</td>
              </tr>
              <tr>
                <td class="feat-name">Built-in Undo/Redo & State Service</td>
                <td class="highlight-col text-success">✓ Included</td>
                <td class="text-muted">✗ Manual Implementation</td>
              </tr>
              <tr>
                <td class="feat-name">Standalone Component Support</td>
                <td class="highlight-col text-success">✓ 100% Standalone</td>
                <td class="text-muted">Partial / Legacy NgModule</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- Quickstart 4 Steps -->
    <section class="quickstart-section">
      <div class="container">
        <div class="section-header text-center">
          <span class="badge badge-accent">Quick Onboarding</span>
          <h2>Up and Running in 4 Steps</h2>
        </div>

        <div class="steps-grid">
          <div class="step-card glass-panel">
            <div class="step-num">01</div>
            <h4>Install Package</h4>
            <pre><code>npm i ngx-workflow</code></pre>
          </div>

          <div class="step-card glass-panel">
            <div class="step-num">02</div>
            <h4>Import Module</h4>
            <pre><code>imports: [NgxWorkflowModule]</code></pre>
          </div>

          <div class="step-card glass-panel">
            <div class="step-num">03</div>
            <h4>Define Signals</h4>
            <pre><code>nodes = signal([...])</code></pre>
          </div>

          <div class="step-card glass-panel">
            <div class="step-num">04</div>
            <h4>Render Canvas</h4>
            <pre><code>&lt;ngx-workflow-diagram ...&gt;</code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Banner -->
    <section class="cta-section">
      <div class="container text-center">
        <div class="cta-box glass-panel">
          <h2>Ready to Supercharge Your Angular Diagrams?</h2>
          <p class="text-muted">Open-source, developer-friendly, and free to use under MIT license.</p>
          <div class="cta-actions">
            <a routerLink="/docs" class="btn btn-primary btn-lg">Explore Documentation</a>
            <a routerLink="/sandbox" class="btn btn-secondary btn-lg">Open Interactive Sandbox</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; overflow-x: hidden; }

    /* Hero Section */
    .hero-section {
      padding: 90px 0 60px;
      position: relative;
    }

    .hero-bg-glow {
      position: absolute;
      top: -150px;
      left: 50%;
      transform: translateX(-50%);
      width: 900px;
      height: 500px;
      background: radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%);
      pointer-events: none;
      z-index: -1;
      filter: blur(60px);
    }

    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 32px;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: var(--radius-full);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);
    }

    .hero-badge:hover {
      border-color: var(--color-primary);
      transform: translateY(-1px);
    }

    .badge-sparkle { color: #f59e0b; }
    .badge-arrow { color: var(--color-primary); font-weight: 700; }

    .hero-title {
      font-size: 3.8rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.04em;
      margin: 0;
      max-width: 900px;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: var(--color-text-secondary);
      max-width: 680px;
      line-height: 1.6;
      margin: 0;
    }

    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      justify-content: center;
      margin-top: 8px;
    }

    /* Install Widget */
    .install-widget {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .pkg-tabs {
      display: flex;
      background: rgba(0,0,0,0.1);
      width: 100%;
      border-bottom: 1px solid var(--color-border);
    }

    .pkg-tabs span {
      padding: 4px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      font-family: var(--font-mono);
      transition: color 0.2s;
    }

    .pkg-tabs span.active {
      color: var(--color-primary);
      border-bottom: 2px solid var(--color-primary);
    }

    .install-cmd {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      font-family: var(--font-mono);
      font-size: 0.88rem;
      color: var(--color-text-primary);
      cursor: pointer;
    }

    .copy-btn {
      background: var(--color-bg-surface-hover);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn.copied {
      background: var(--color-success);
      color: #ffffff;
      border-color: var(--color-success);
    }

    /* Hero Visual Window */
    .hero-visual {
      width: 100%;
      max-width: 1180px;
      margin-top: 24px;
    }

    .editor-window {
      height: 620px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: var(--shadow-xl);
    }

    .editor-bar {
      height: 48px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
    }

    .traffic-lights {
      display: flex;
      gap: 8px;
    }

    .light {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .red { background: #ef4444; }
    .yellow { background: #f59e0b; }
    .green { background: #10b981; }

    .preset-selector {
      display: flex;
      gap: 6px;
    }

    .preset-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--color-text-secondary);
      padding: 4px 12px;
      font-size: 0.8rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preset-btn:hover {
      color: var(--color-text-primary);
    }

    .preset-btn.active {
      background: var(--color-bg-surface-hover);
      border-color: var(--color-border);
      color: var(--color-primary);
      font-weight: 600;
    }

    .editor-actions {
      display: flex;
      gap: 8px;
    }

    .editor-tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: var(--color-bg-base);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .editor-tool-btn:hover, .editor-tool-btn.active {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .editor-content {
      flex: 1;
      position: relative;
      background: var(--color-bg-base);
    }

    /* Code Preview Section */
    .code-preview-section {
      padding: 100px 0;
    }

    .section-header {
      margin-bottom: 48px;
    }

    .section-header h2 {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 12px 0 8px;
      letter-spacing: -0.03em;
    }

    .code-preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .code-side {
      background: #0b0f19;
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
    }

    .code-header, .preview-header {
      height: 44px;
      background: rgba(0,0,0,0.3);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      padding: 0 16px;
    }

    .file-tab {
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--color-primary);
      font-weight: 600;
    }

    .code-side pre {
      margin: 0;
      padding: 20px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.6;
      color: #e2e8f0;
      overflow-x: auto;
    }

    .token-keyword { color: #f472b6; font-weight: 600; }
    .token-string { color: #34d399; }
    .token-decorator { color: #60a5fa; }
    .token-boolean { color: #fbbf24; }

    .preview-side {
      display: flex;
      flex-direction: column;
      background: var(--color-bg-surface);
    }

    .preview-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-secondary);
    }

    .preview-canvas {
      flex: 1;
      height: 440px;
      position: relative;
    }

    /* Bento Grid */
    .features-section {
      padding: 80px 0;
    }

    .bento-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    .col-span-2 {
      grid-column: span 2;
    }

    .col-span-3 {
      grid-column: span 3;
    }

    .bento-card {
      padding: 32px;
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 24px;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--color-bg-surface-hover);
      border: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 16px;
    }

    .bento-card h3 {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0 0 10px;
      letter-spacing: -0.02em;
    }

    .bento-card p {
      color: var(--color-text-secondary);
      font-size: 0.98rem;
      line-height: 1.6;
      margin: 0;
    }

    .card-metric {
      display: flex;
      gap: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
    }

    .metric-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--color-primary);
      display: block;
    }

    .metric-label {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag {
      font-size: 0.78rem;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--color-bg-surface-hover);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }

    /* Comparison Section */
    .comparison-section {
      padding: 80px 0;
    }

    .matrix-table-wrapper {
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-top: 32px;
    }

    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .matrix-table th, .matrix-table td {
      padding: 18px 24px;
      border-bottom: 1px solid var(--color-border);
    }

    .matrix-table th {
      font-size: 0.9rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
    }

    .highlight-col {
      background: rgba(59, 130, 246, 0.06);
      font-weight: 600;
    }

    .feat-name {
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .text-success { color: var(--color-success); }

    /* Quickstart Steps */
    .quickstart-section {
      padding: 80px 0;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 32px;
    }

    .step-card {
      padding: 24px;
      border-radius: var(--radius-md);
      position: relative;
    }

    .step-num {
      font-size: 2.2rem;
      font-weight: 800;
      color: var(--color-primary);
      opacity: 0.4;
      margin-bottom: 8px;
    }

    .step-card h4 {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 12px;
    }

    .step-card pre {
      background: #0b0f19;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      margin: 0;
      color: #38bdf8;
      overflow-x: auto;
    }

    /* CTA Banner */
    .cta-section {
      padding: 80px 0 40px;
    }

    .cta-box {
      padding: 64px 32px;
      border-radius: var(--radius-xl);
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-xl);
      position: relative;
      overflow: hidden;
    }

    .cta-box h2 {
      font-size: 2.4rem;
      font-weight: 800;
      margin: 0 0 12px;
      letter-spacing: -0.03em;
      color: var(--color-text-primary);
    }

    .cta-box p {
      font-size: 1.1rem;
      margin: 0 0 32px;
      color: var(--color-text-secondary);
    }

    .cta-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .bento-grid { grid-template-columns: 1fr; }
      .col-span-2, .col-span-3 { grid-column: span 1; }
      .code-preview-grid { grid-template-columns: 1fr; }
      .steps-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
      .steps-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent {
  pkgManager = signal<'npm' | 'pnpm' | 'yarn'>('npm');
  copied = signal(false);

  animatedEdges = signal(true);
  bgVariant = signal<'dots' | 'lines' | 'cross'>('dots');

  // Presets for Hero Flowchart
  presets: DiagramPreset[] = [
    {
      id: 'cicd',
      name: 'CI/CD Pipeline',
      nodes: [
        { id: 'git', position: { x: 50, y: 140 }, label: 'Git Commit', type: 'default', ports: 2 },
        { id: 'build', position: { x: 280, y: 50 }, label: 'Build & Test', type: 'default', ports: 3 },
        { id: 'lint', position: { x: 280, y: 230 }, label: 'Lint Security', type: 'default', ports: 3 },
        { id: 'deploy', position: { x: 560, y: 140 }, label: 'Deploy Staging', type: 'default', ports: 3 },
        { id: 'prod', position: { x: 840, y: 140 }, label: 'Production', type: 'default', ports: 2 }
      ],
      edges: [
        { id: 'e1', source: 'git', target: 'build', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'git', target: 'lint', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'build', target: 'deploy', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e4', source: 'lint', target: 'deploy', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e5', source: 'deploy', target: 'prod', sourceHandle: 'right', targetHandle: 'left' }
      ]
    },
    {
      id: 'ai-agent',
      name: 'AI Agent Router',
      nodes: [
        { id: 'user', position: { x: 60, y: 140 }, label: 'User Prompt', type: 'default', ports: 2 },
        { id: 'router', position: { x: 320, y: 140 }, label: 'Intent Classifier', type: 'default', ports: 4 },
        { id: 'tool', position: { x: 620, y: 50 }, label: 'Tool Invocation', type: 'default', ports: 2 },
        { id: 'rag', position: { x: 620, y: 230 }, label: 'RAG Retrieval', type: 'default', ports: 2 },
        { id: 'response', position: { x: 880, y: 140 }, label: 'Synthesized Answer', type: 'default', ports: 1 }
      ],
      edges: [
        { id: 'ae1', source: 'user', target: 'router', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae2', source: 'router', target: 'tool', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae3', source: 'router', target: 'rag', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae4', source: 'tool', target: 'response', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae5', source: 'rag', target: 'response', sourceHandle: 'right', targetHandle: 'left' }
      ]
    },
    {
      id: 'data-eng',
      name: 'Data Processing',
      nodes: [
        { id: 'kafka', position: { x: 80, y: 140 }, label: 'Kafka Event Stream', type: 'default', ports: 2 },
        { id: 'spark', position: { x: 360, y: 140 }, label: 'Spark Streaming', type: 'default', ports: 3 },
        { id: 'warehouse', position: { x: 680, y: 140 }, label: 'Snowflake Warehouse', type: 'default', ports: 2 }
      ],
      edges: [
        { id: 'de1', source: 'kafka', target: 'spark', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'de2', source: 'spark', target: 'warehouse', sourceHandle: 'right', targetHandle: 'left' }
      ]
    }
  ];

  activePreset = signal<DiagramPreset>(this.presets[0]);

  // Code preview sample data
  sampleCodeNodes: Node[] = [
    { id: '1', label: 'Input Trigger', position: { x: 40, y: 120 }, ports: 2 },
    { id: '2', label: 'Data Processing', position: { x: 260, y: 120 }, ports: 4 },
    { id: '3', label: 'Database Storage', position: { x: 500, y: 120 }, ports: 2 }
  ];

  sampleCodeEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e2-3', source: '2', target: '3', sourceHandle: 'right', targetHandle: 'left' }
  ];

  setPkg(mgr: 'npm' | 'pnpm' | 'yarn') {
    this.pkgManager.set(mgr);
  }

  getInstallCommand(): string {
    switch (this.pkgManager()) {
      case 'pnpm': return 'pnpm add ngx-workflow';
      case 'yarn': return 'yarn add ngx-workflow';
      default: return 'npm install ngx-workflow';
    }
  }

  copyInstallCommand() {
    navigator.clipboard.writeText(this.getInstallCommand());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  selectPreset(preset: DiagramPreset) {
    this.activePreset.set(preset);
  }

  toggleAnimated() {
    this.animatedEdges.update(v => !v);
  }

  cycleBg() {
    const current = this.bgVariant();
    if (current === 'dots') this.bgVariant.set('lines');
    else if (current === 'lines') this.bgVariant.set('cross');
    else this.bgVariant.set('dots');
  }

  getEdgesWithAnim(): Edge[] {
    const isAnim = this.animatedEdges();
    return this.activePreset().edges.map(e => ({
      ...e,
      animated: isAnim
    }));
  }
}
