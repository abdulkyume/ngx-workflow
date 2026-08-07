import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';
import { AmbientCanvasComponent } from '../../shared/three/ambient-canvas.component';
import { InstallWidgetComponent } from '../../shared/ui/install-widget.component';
import { RevealDirective } from '../../shared/motion/reveal.directive';
import { MagneticDirective } from '../../shared/motion/magnetic.directive';
import { SeoService } from '../../core/services/seo.service';
import { homeSeoConfig } from '../../core/seo/seo-pages';

interface DiagramPreset {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    NgxWorkflowModule,
    AmbientCanvasComponent,
    InstallWidgetComponent,
    RevealDirective,
    MagneticDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <app-ambient-canvas />
      <div class="hero-veil"></div>

      <div class="container hero-inner">
        <div class="hero-copy animate-fade-in">
          <p class="brand-mark">ngx-workflow</p>
          <h1 class="hero-title">
            Node editors for Angular,<br />
            <span class="text-gradient">built on Signals.</span>
          </h1>
          <p class="hero-subtitle">
            A cinematic, high-performance workflow canvas with ELK layout,
            smart edges, and zero Zone.js overhead.
          </p>
          <div class="hero-cta">
            <a routerLink="/docs" class="btn btn-primary btn-lg" appMagnetic>Get started</a>
            <a routerLink="/sandbox" class="btn btn-secondary btn-lg" appMagnetic>Open studio</a>
          </div>
          <app-install-widget />
        </div>
      </div>
    </section>

    <section class="stage-section">
      <div class="container">
        <div class="stage-chrome glass-panel" appReveal>
          <div class="stage-bar">
            <div class="preset-selector" role="tablist" aria-label="Workflow presets">
              @for (preset of presets; track preset.id) {
                <button
                  type="button"
                  role="tab"
                  class="preset-btn"
                  [class.active]="activePreset().id === preset.id"
                  [attr.aria-selected]="activePreset().id === preset.id"
                  (click)="selectPreset(preset)">
                  {{ preset.name }}
                </button>
              }
            </div>
            <div class="stage-actions">
              <button
                type="button"
                class="tool-btn"
                [class.active]="animatedEdges()"
                (click)="toggleAnimated()"
                [attr.aria-pressed]="animatedEdges()">
                Animate
              </button>
              <button type="button" class="tool-btn" (click)="cycleBg()">
                {{ bgVariant() }}
              </button>
            </div>
          </div>
          <div class="stage-canvas">
            @if (diagramReady()) {
              <ngx-workflow-diagram
                [nodes]="heroNodes()"
                [edges]="heroEdges()"
                [showBackground]="true"
                [backgroundVariant]="bgVariant()"
                [showSearchControls]="!compactStage()"
                [showZoomControls]="!compactStage()"
                [showUndoRedoControls]="!compactStage()"
                [showLayoutControls]="!compactStage()"
                [showMinimap]="false"
                [fitViewOnInit]="true"
                (nodesChange)="onHeroNodesChange($event)"
                (edgesChange)="onHeroEdgesChange($event)"
              />
            }
          </div>
        </div>
      </div>
    </section>

    <section class="proof-section">
      <div class="container">
        <div class="section-header" appReveal>
          <span class="badge badge-accent">Developer experience</span>
          <h2>Signal-native API. Instant canvas.</h2>
          <p class="text-muted">Define nodes and edges as signals — the diagram stays in sync.</p>
        </div>

        <div class="proof-grid glass-panel" appReveal>
          <div class="code-side">
            <div class="pane-header"><span>app.component.ts</span></div>
            <pre><code><span class="tok-kw">import</span> &#123; Component, signal &#125; <span class="tok-kw">from</span> <span class="tok-str">'&#64;angular/core'</span>;
<span class="tok-kw">import</span> &#123; NgxWorkflowModule, Node, Edge &#125; <span class="tok-kw">from</span> <span class="tok-str">'ngx-workflow'</span>;

<span class="tok-dec">&#64;Component</span>(&#123;
  standalone: <span class="tok-bool">true</span>,
  imports: [NgxWorkflowModule],
  template: <span class="tok-str">\`&lt;ngx-workflow-diagram [nodes]="nodes()" [edges]="edges()" /&gt;\`</span>
&#125;)
<span class="tok-kw">export class</span> App &#123;
  nodes = signal&lt;Node[]&gt;([
    &#123; id: <span class="tok-str">'1'</span>, label: <span class="tok-str">'Input Trigger'</span>,
      position: &#123; x: 40, y: 120 &#125;, ports: 2 &#125;,
    &#123; id: <span class="tok-str">'2'</span>, label: <span class="tok-str">'Data Processing'</span>,
      position: &#123; x: 260, y: 120 &#125;, ports: 4 &#125;,
    &#123; id: <span class="tok-str">'3'</span>, label: <span class="tok-str">'Database Storage'</span>,
      position: &#123; x: 500, y: 120 &#125;, ports: 2 &#125;,
  ]);
  edges = signal&lt;Edge[]&gt;([
    &#123; id: <span class="tok-str">'e1-2'</span>, source: <span class="tok-str">'1'</span>, target: <span class="tok-str">'2'</span>,
      sourceHandle: <span class="tok-str">'right'</span>, targetHandle: <span class="tok-str">'left'</span>, animated: <span class="tok-bool">true</span> &#125;,
    &#123; id: <span class="tok-str">'e2-3'</span>, source: <span class="tok-str">'2'</span>, target: <span class="tok-str">'3'</span>,
      sourceHandle: <span class="tok-str">'right'</span>, targetHandle: <span class="tok-str">'left'</span> &#125;,
  ]);
&#125;</code></pre>
          </div>
          <div class="preview-side">
            <div class="pane-header"><span>Live output</span></div>
            <div class="preview-canvas">
              @if (previewReady()) {
                <ngx-workflow-diagram
                  [nodes]="sampleCodeNodes()"
                  [edges]="sampleCodeEdges()"
                  [showBackground]="true"
                  backgroundVariant="dots"
                  [showSearchControls]="false"
                  [showZoomControls]="false"
                  [showUndoRedoControls]="false"
                  [showMinimap]="false"
                  [fitViewOnInit]="true"
                  (nodesChange)="onSampleNodesChange($event)"
                  (edgesChange)="onSampleEdgesChange($event)"
                />
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <div class="section-header" appReveal>
          <span class="badge badge-accent">Capabilities</span>
          <h2>Enterprise graph tooling, Angular-native.</h2>
          <p class="text-muted">Performance, layout, projection, and studio chrome — without the canvas bridge tax.</p>
        </div>

        <div class="feature-list">
          @for (feature of features; track feature.title; let i = $index) {
            <article class="feature-row" appReveal [revealDelay]="i * 60">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.body }}</p>
            </article>
          }
        </div>
      </div>
    </section>

    <section class="compare-section">
      <div class="container">
        <div class="section-header" appReveal>
          <span class="badge badge-accent">Why ngx-workflow</span>
          <h2>Built for Angular, not ported to it.</h2>
        </div>
        <div class="matrix-wrap glass-panel" appReveal>
          <table class="matrix">
            <thead>
              <tr>
                <th>Capability</th>
                <th class="hi">ngx-workflow</th>
                <th>Generic libraries</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Angular Signals</td>
                <td class="hi text-success">Native</td>
                <td class="text-muted">Zone / RxJS heavy</td>
              </tr>
              <tr>
                <td>Component projection</td>
                <td class="hi text-success">Direct templates</td>
                <td class="text-muted">Canvas bridge</td>
              </tr>
              <tr>
                <td>Auto-layout</td>
                <td class="hi text-success">ELK built-in</td>
                <td class="text-muted">Third-party setup</td>
              </tr>
              <tr>
                <td>Undo / redo</td>
                <td class="hi text-success">Included</td>
                <td class="text-muted">Manual</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <div class="cta-box glass-panel" appReveal>
          <h2>Ship your next diagram surface.</h2>
          <p class="text-muted">MIT licensed. Angular 17.1–22. Ready for production editors.</p>
          <div class="cta-actions">
            <a routerLink="/docs" class="btn btn-primary btn-lg">Explore docs</a>
            <a routerLink="/sandbox" class="btn btn-outline btn-lg">Launch sandbox</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    .hero {
      position: relative;
      min-height: min(92vh, 860px);
      display: flex;
      align-items: center;
      overflow: hidden;
      isolation: isolate;
    }

    .hero-veil {
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        linear-gradient(180deg, color-mix(in srgb, var(--color-bg-base) 35%, transparent) 0%, transparent 28%, transparent 58%, var(--color-bg-base) 100%),
        radial-gradient(65% 50% at 40% 40%, transparent 0%, color-mix(in srgb, var(--color-bg-base) 72%, transparent) 100%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      z-index: 2;
      width: 100%;
      padding: 120px 24px 72px;
    }

    .hero-copy {
      max-width: 720px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
      overflow: visible;
    }

    .brand-mark {
      margin: 0 0 -0.2em;
      display: inline-block;
      font-family: var(--font-display);
      font-size: clamp(2.1rem, 5vw, 3.4rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.5;
      padding: 0.1em 0.04em 0.28em;
      overflow: visible;
      color: var(--color-primary);
      background-image: var(--color-accent-gradient);
      background-repeat: no-repeat;
      background-size: 100% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3.8vw, 2.65rem);
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.5;
      overflow: visible;
      color: var(--color-text-primary);
    }

    .hero-title .text-gradient {
      display: inline-block;
      margin-bottom: -0.18em;
      padding: 0.08em 0.04em 0.24em;
      line-height: 1.5;
      overflow: visible;
      background-image: var(--color-accent-gradient);
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }

    .hero-subtitle {
      margin: 0;
      max-width: 34rem;
      font-size: 1.1rem;
      color: var(--color-text-secondary);
      line-height: 1.65;
    }

    .hero-cta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .stage-section {
      padding: 0 0 96px;
      margin-top: -48px;
      position: relative;
      z-index: 3;
    }

    .stage-chrome {
      border-radius: var(--radius-xl);
      overflow: hidden;
      box-shadow: var(--shadow-xl), var(--shadow-glow);
      transform: translateZ(0);
    }

    .stage-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      flex-wrap: wrap;
      min-width: 0;
    }

    .preset-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-width: 0;
    }

    .stage-canvas ngx-workflow-diagram {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }

    .preset-btn, .tool-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--color-text-secondary);
      padding: 6px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out),
        transform var(--motion-fast) var(--ease-out);
    }

    .preset-btn:hover, .tool-btn:hover {
      color: var(--color-text-primary);
      background: var(--color-bg-surface-hover);
    }

    .preset-btn.active, .tool-btn.active {
      color: var(--color-primary);
      border-color: var(--color-border-strong);
      background: var(--color-primary-soft);
    }

    .stage-actions { display: flex; gap: 8px; }

    .stage-canvas {
      position: relative;
      height: min(58vh, 560px);
      min-height: 360px;
      background: var(--color-bg-base);
    }

    .proof-section, .features-section, .compare-section { padding: 88px 0; }
    .cta-section { padding: 40px 0 96px; }

    .section-header {
      text-align: center;
      margin-bottom: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .section-header h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .section-header p { margin: 0; max-width: 36rem; }

    .proof-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .code-side {
      background: var(--color-bg-elevated);
      border-right: 1px solid var(--color-border);
    }

    .pane-header {
      height: 44px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      border-bottom: 1px solid var(--color-border);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--color-text-muted);
    }

    .code-side pre {
      margin: 0;
      padding: 20px;
      overflow: auto;
      font-family: var(--font-mono);
      font-size: 0.82rem;
      line-height: 1.65;
      color: var(--color-text-secondary);
    }

    .tok-kw { color: #7dd3fc; }
    .tok-str { color: #5eead4; }
    .tok-bool { color: #fbbf24; }
    .tok-dec { color: #a5b4fc; }

    .preview-side {
      display: flex;
      flex-direction: column;
      min-height: 360px;
    }

    .preview-canvas {
      position: relative;
      flex: 1;
      min-height: 320px;
      height: 320px;
      background: var(--color-bg-base);
    }

    .preview-canvas ngx-workflow-diagram {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }

    .feature-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .feature-row {
      padding: 28px 28px 24px;
      border-top: 1px solid var(--color-border);
      background: linear-gradient(180deg, var(--color-bg-surface) 0%, transparent 100%);
      border-radius: 0 0 var(--radius-md) var(--radius-md);
      transition: transform var(--motion-base) var(--ease-out),
        border-color var(--motion-base) var(--ease-out);
    }

    .feature-row:hover {
      transform: translate3d(0, -3px, 0);
      border-top-color: var(--color-primary);
    }

    .feature-row h3 {
      margin: 0 0 8px;
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
    }

    .feature-row p {
      margin: 0;
      color: var(--color-text-secondary);
      line-height: 1.65;
    }

    .matrix-wrap {
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .matrix {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    .matrix th, .matrix td {
      padding: 16px 20px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }

    .matrix th {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-muted);
      background: var(--color-bg-elevated);
    }

    .matrix .hi {
      background: var(--color-primary-soft);
      color: var(--color-text-primary);
      font-weight: 600;
    }

    .cta-box {
      padding: 64px 32px;
      border-radius: var(--radius-xl);
      text-align: center;
    }

    .cta-box h2 {
      margin: 0 0 12px;
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      letter-spacing: -0.03em;
    }

    .cta-box p { margin: 0 0 28px; }

    .cta-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    @media (max-width: 960px) {
      .proof-grid { grid-template-columns: 1fr; }
      .code-side { border-right: none; border-bottom: 1px solid var(--color-border); }
      .feature-list { grid-template-columns: 1fr; }
      .proof-section, .features-section, .compare-section { padding: 64px 0; }
    }

    @media (max-width: 768px) {
      .hero {
        min-height: min(85vh, 720px);
      }

      .hero-inner {
        padding: 104px 16px 56px;
      }

      .hero-subtitle { font-size: 1rem; }

      .hero-cta .btn-lg {
        flex: 1 1 140px;
        justify-content: center;
      }

      .stage-section {
        margin-top: -32px;
        padding-bottom: 64px;
      }

      .stage-bar {
        flex-wrap: nowrap;
        gap: 8px;
        padding: 10px 12px;
      }

      .preset-selector {
        flex: 1 1 auto;
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        mask-image: linear-gradient(90deg, #000 85%, transparent);
      }

      .preset-selector::-webkit-scrollbar { display: none; }

      .preset-btn {
        flex: 0 0 auto;
        padding: 6px 10px;
        font-size: 0.75rem;
        white-space: nowrap;
      }

      .stage-actions {
        flex: 0 0 auto;
        gap: 6px;
      }

      .stage-actions .tool-btn {
        padding: 6px 10px;
        font-size: 0.75rem;
      }

      .stage-canvas {
        height: min(50vh, 420px);
        min-height: 260px;
      }

      .preview-side { min-height: 280px; }
      .preview-canvas {
        min-height: 260px;
        height: 260px;
      }

      .code-side pre {
        font-size: 0.76rem;
        max-height: 280px;
        padding: 16px;
      }

      .matrix-wrap {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .matrix { min-width: 560px; }

      .matrix th, .matrix td {
        padding: 12px 14px;
        font-size: 0.88rem;
      }

      .feature-row { padding: 22px 20px 20px; }

      .cta-box { padding: 48px 24px; }
    }

    @media (max-width: 640px) {
      .hero-inner { padding-top: 96px; padding-bottom: 48px; }
      .stage-section { margin-top: -24px; }

      .hero-title br { display: none; }

      .hero-cta {
        width: 100%;
      }

      .hero-cta .btn-lg {
        width: 100%;
        flex: 1 1 100%;
      }

      .stage-canvas {
        height: min(46vh, 360px);
        min-height: 220px;
      }

      .preview-side { min-height: 240px; }
      .preview-canvas {
        min-height: 220px;
        height: 220px;
      }

      .code-side pre {
        font-size: 0.72rem;
        max-height: 240px;
      }

      .cta-box { padding: 40px 20px; }

      .cta-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .cta-actions .btn-lg { width: 100%; }
    }
  `],
})
export class HomeComponent implements OnInit {
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  diagramReady = signal(false);
  previewReady = signal(false);
  /** Hide diagram chrome on narrow viewports so the graph can fit. */
  compactStage = signal(false);

  animatedEdges = signal(true);
  bgVariant = signal<'dots' | 'lines' | 'cross'>('dots');

  features = [
    {
      title: 'Signals-native performance',
      body: 'OnPush rendering and signal sync keep pan, zoom, and drag smooth at scale — without Zone.js digest churn.',
    },
    {
      title: 'ELK auto-layout',
      body: 'Hierarchical, force, and circular helpers ship with the library so complex graphs settle in one call.',
    },
    {
      title: 'Template projection',
      body: 'Bring Angular components into nodes and edges. No canvas bridge, no foreign rendering model.',
    },
    {
      title: 'Studio chrome included',
      body: 'Minimap, undo/redo, search, properties sidebar, context menu, and export — composable out of the box.',
    },
  ];

  presets: DiagramPreset[] = [
    {
      id: 'cicd',
      name: 'CI/CD Pipeline',
      nodes: [
        { id: 'git', position: { x: 50, y: 140 }, label: 'Git Commit', type: 'default', ports: 2 },
        { id: 'build', position: { x: 280, y: 50 }, label: 'Build & Test', type: 'default', ports: 3 },
        { id: 'lint', position: { x: 280, y: 230 }, label: 'Lint Security', type: 'default', ports: 3 },
        { id: 'deploy', position: { x: 560, y: 140 }, label: 'Deploy Staging', type: 'default', ports: 3 },
        { id: 'prod', position: { x: 840, y: 140 }, label: 'Production', type: 'default', ports: 2 },
      ],
      edges: [
        { id: 'e1', source: 'git', target: 'build', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e2', source: 'git', target: 'lint', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e3', source: 'build', target: 'deploy', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e4', source: 'lint', target: 'deploy', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'e5', source: 'deploy', target: 'prod', sourceHandle: 'right', targetHandle: 'left' },
      ],
    },
    {
      id: 'ai-agent',
      name: 'AI Agent Router',
      nodes: [
        { id: 'user', position: { x: 60, y: 140 }, label: 'User Prompt', type: 'default', ports: 2 },
        { id: 'router', position: { x: 320, y: 140 }, label: 'Intent Classifier', type: 'default', ports: 4 },
        { id: 'tool', position: { x: 620, y: 50 }, label: 'Tool Invocation', type: 'default', ports: 2 },
        { id: 'rag', position: { x: 620, y: 230 }, label: 'RAG Retrieval', type: 'default', ports: 2 },
        { id: 'response', position: { x: 880, y: 140 }, label: 'Synthesized Answer', type: 'default', ports: 1 },
      ],
      edges: [
        { id: 'ae1', source: 'user', target: 'router', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae2', source: 'router', target: 'tool', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae3', source: 'router', target: 'rag', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae4', source: 'tool', target: 'response', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'ae5', source: 'rag', target: 'response', sourceHandle: 'right', targetHandle: 'left' },
      ],
    },
    {
      id: 'data-eng',
      name: 'Data Processing',
      nodes: [
        { id: 'kafka', position: { x: 80, y: 140 }, label: 'Kafka Event Stream', type: 'default', ports: 2 },
        { id: 'spark', position: { x: 360, y: 140 }, label: 'Spark Streaming', type: 'default', ports: 3 },
        { id: 'warehouse', position: { x: 680, y: 140 }, label: 'Snowflake Warehouse', type: 'default', ports: 2 },
      ],
      edges: [
        { id: 'de1', source: 'kafka', target: 'spark', sourceHandle: 'right', targetHandle: 'left' },
        { id: 'de2', source: 'spark', target: 'warehouse', sourceHandle: 'right', targetHandle: 'left' },
      ],
    },
  ];

  activePreset = signal<DiagramPreset>(this.presets[0]);
  heroNodes = signal<Node[]>(this.cloneNodes(this.presets[0].nodes));
  heroEdges = signal<Edge[]>(this.withAnimated(this.cloneEdges(this.presets[0].edges), true));

  sampleCodeNodes = signal<Node[]>([
    { id: '1', label: 'Input Trigger', position: { x: 40, y: 120 }, ports: 2 },
    { id: '2', label: 'Data Processing', position: { x: 260, y: 120 }, ports: 4 },
    { id: '3', label: 'Database Storage', position: { x: 500, y: 120 }, ports: 2 },
  ]);

  sampleCodeEdges = signal<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e2-3', source: '2', target: '3', sourceHandle: 'right', targetHandle: 'left' },
  ]);

  constructor() {
    afterNextRender(() => {
      const mq = window.matchMedia('(max-width: 768px)');
      const syncCompact = () => {
        const next = mq.matches;
        if (this.compactStage() === next) return;
        this.compactStage.set(next);
        // Remount so fitViewOnInit runs without chrome crowding the bounds
        if (this.diagramReady()) {
          this.diagramReady.set(false);
          requestAnimationFrame(() => this.diagramReady.set(true));
        }
      };
      syncCompact();
      mq.addEventListener('change', syncCompact);

      // Defer diagram mount past first paint for better LCP
      const heroTimer = setTimeout(() => this.diagramReady.set(true), 60);
      const previewTimer = setTimeout(() => this.previewReady.set(true), 480);

      this.destroyRef.onDestroy(() => {
        mq.removeEventListener('change', syncCompact);
        clearTimeout(heroTimer);
        clearTimeout(previewTimer);
      });
    });
  }

  ngOnInit(): void {
    this.seo.apply(homeSeoConfig());
  }

  private cloneNodes(nodes: Node[]): Node[] {
    return nodes.map((n) => ({ ...n, position: { ...n.position } }));
  }

  private cloneEdges(edges: Edge[]): Edge[] {
    return edges.map((e) => ({ ...e }));
  }

  private withAnimated(edges: Edge[], animated: boolean): Edge[] {
    return edges.map((e) => ({ ...e, animated }));
  }

  private nodesMatch(a: Node[], b: Node[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (
        x.id !== y.id ||
        x.label !== y.label ||
        x.position.x !== y.position.x ||
        x.position.y !== y.position.y ||
        x.ports !== y.ports ||
        x.selected !== y.selected
      ) {
        return false;
      }
    }
    return true;
  }

  private edgesMatch(a: Edge[], b: Edge[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (
        x.id !== y.id ||
        x.source !== y.source ||
        x.target !== y.target ||
        x.sourceHandle !== y.sourceHandle ||
        x.targetHandle !== y.targetHandle ||
        !!x.animated !== !!y.animated
      ) {
        return false;
      }
    }
    return true;
  }

  selectPreset(preset: DiagramPreset): void {
    this.activePreset.set(preset);
    this.heroNodes.set(this.cloneNodes(preset.nodes));
    this.heroEdges.set(this.withAnimated(this.cloneEdges(preset.edges), this.animatedEdges()));
    // Remount so fitViewOnInit re-centers the new preset in the canvas
    this.diagramReady.set(false);
    requestAnimationFrame(() => this.diagramReady.set(true));
  }

  onHeroNodesChange(nodes: Node[]): void {
    if (this.nodesMatch(this.heroNodes(), nodes)) return;
    this.heroNodes.set(nodes);
  }

  onHeroEdgesChange(edges: Edge[]): void {
    const next = this.withAnimated(edges, this.animatedEdges());
    if (this.edgesMatch(this.heroEdges(), next)) return;
    this.heroEdges.set(next);
  }

  onSampleNodesChange(nodes: Node[]): void {
    if (this.nodesMatch(this.sampleCodeNodes(), nodes)) return;
    this.sampleCodeNodes.set(nodes);
  }

  onSampleEdgesChange(edges: Edge[]): void {
    if (this.edgesMatch(this.sampleCodeEdges(), edges)) return;
    this.sampleCodeEdges.set(edges);
  }

  toggleAnimated(): void {
    this.animatedEdges.update((v) => !v);
    const animated = this.animatedEdges();
    this.heroEdges.update((edges) => this.withAnimated(edges, animated));
  }

  cycleBg(): void {
    const current = this.bgVariant();
    if (current === 'dots') this.bgVariant.set('lines');
    else if (current === 'lines') this.bgVariant.set('cross');
    else this.bgVariant.set('dots');
  }
}
