import { Component, signal, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { NgxWorkflowModule, Node, Edge, DiagramComponent, LayoutService } from 'ngx-workflow';

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
    <div class="examples-page container">
      <!-- Header -->
      <div class="examples-header">
        <span class="badge badge-accent">Interactive Gallery</span>
        <h1>Interactive Examples & Code Playground</h1>
        <p class="text-muted">Explore real-world use cases, auto-layout algorithms, custom nodes, and edge routing styles.</p>
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
              <!-- Animated Edges Toggle -->
              <button class="tool-btn" [class.active]="animated()" (click)="toggleAnimated()" title="Toggle Edge Animation">
                ⚡ Anim
              </button>
              
              <!-- Background Variant Selector -->
              <button class="tool-btn" (click)="cycleBg()" title="Change Background">
                🎨 {{ bgVariant() }}
              </button>

              <!-- Fit View Button -->
              <button class="tool-btn" (click)="fitView()" title="Center Diagram">
                🔍 Fit View
              </button>

              <!-- Auto Layout Button (if scenario 2) -->
              @if (activeScenario().id === 'autolayout') {
                <button class="tool-btn btn-primary-sm" (click)="triggerAutoLayout()">
                  📐 Auto Layout
                </button>
              }

              <!-- Code View Toggle -->
              <button class="tool-btn" [class.active]="showCode()" (click)="toggleCode()">
                &lt;/&gt; {{ showCode() ? 'Hide Code' : 'View Code' }}
              </button>
            </div>
          </div>

          <!-- Content Body (Canvas or Code) -->
          <div class="viewer-body">
            @if (showCode()) {
              <div class="code-view animate-fade-in">
                <div class="code-banner">
                  <span>TypeScript & Component Setup</span>
                  <button class="copy-code-btn" (click)="copyCode()">{{ copied() ? 'Copied!' : 'Copy Code' }}</button>
                </div>
                <pre><code>{{ activeScenario().codeSnippet }}</code></pre>
              </div>
            } @else {
              <div class="canvas-view">
                <ngx-workflow-diagram
                  [nodes]="activeScenario().nodes"
                  [edges]="getEdges()"
                  [showMinimap]="true"
                  [showZoomControls]="true"
                  [showBackground]="true"
                  [backgroundVariant]="bgVariant()"
                  [showLayoutControls]="true"
                ></ngx-workflow-diagram>
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
      padding-top: 40px;
      padding-bottom: 80px;
    }

    .examples-header {
      margin-bottom: 32px;
    }

    .examples-header h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin: 8px 0;
      letter-spacing: -0.03em;
    }

    .examples-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 24px;
      min-height: 680px;
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
      height: 56px;
      background: var(--color-bg-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
    }

    .active-info h3 {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 8px;
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

    @media (max-width: 900px) {
      .examples-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ExamplesComponent implements AfterViewInit {
  @ViewChild(DiagramComponent) diagram!: DiagramComponent;

  animated = signal(true);
  bgVariant = signal<'dots' | 'lines' | 'cross'>('dots');
  showCode = signal(false);
  copied = signal(false);

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
      description: 'Bezier smooth curves, Orthogonal steps, and Straight connection paths.',
      nodes: [
        { id: 'r1', label: 'Origin Source', position: { x: 80, y: 150 }, ports: 4 },
        { id: 'r2', label: 'Bezier Target', position: { x: 420, y: 50 }, ports: 2 },
        { id: 'r3', label: 'Step Target', position: { x: 420, y: 180 }, ports: 2 },
        { id: 'r4', label: 'Straight Target', position: { x: 420, y: 310 }, ports: 2 }
      ],
      edges: [
        { id: 're1', source: 'r1', target: 'r2', type: 'bezier', sourceHandle: 'right', targetHandle: 'left', animated: true },
        { id: 're2', source: 'r1', target: 'r3', type: 'step', sourceHandle: 'right', targetHandle: 'left', animated: true },
        { id: 're3', source: 'r1', target: 'r4', type: 'straight', sourceHandle: 'right', targetHandle: 'left', animated: true }
      ],
      codeSnippet: `edges = signal<Edge[]>([
  { id: 're1', source: 'r1', target: 'r2', type: 'bezier' },
  { id: 're2', source: 'r1', target: 'r3', type: 'step' },
  { id: 're3', source: 'r1', target: 'r4', type: 'straight' }
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
    setTimeout(() => this.fitView(), 100);
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

  copyCode() {
    navigator.clipboard.writeText(this.activeScenario().codeSnippet);
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
