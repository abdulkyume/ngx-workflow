import { Component, signal, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero Section -->
    <section class="hero-section">
      <div class="container grid-split">
        <div class="hero-content animate-slide-up">
          <div class="badge-pill">
            <span class="badge-dot"></span>
            v1.0.0 Now Public
          </div>
          <h1 class="hero-title">
            The Flowchart Library<br>
            for <span class="text-gradient">Pro Angular Apps</span>.
          </h1>
          <p class="hero-subtitle">
            Build node-based editors, workflow automation tools, and interactive diagrams 
            with a library designed for <b>performance</b> and <b>customizability</b>.
          </p>
          <div class="hero-actions">
            <a routerLink="/docs" class="btn-primary-lg">
              Get Started
            </a>
            <a routerLink="/examples" class="btn-secondary-lg">
              View Demo
            </a>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <b>MIT</b> License
            </div>
            <div class="stat">
              <b>Angular</b> 19+
            </div>
          </div>
        </div>

        <div class="hero-visual animate-fade-in">
          <div class="graph-window glass-panel">
            <div class="window-bar">
              <div class="dots">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <div class="address-bar">ngx-workflow demo</div>
            </div>
            <div class="graph-wrapper">
               <ngx-workflow-diagram
                [nodes]="heroNodes()"
                [edges]="heroEdges()"
                [showBackground]="true"
                backgroundVariant="dots"
                [showZoomControls]="false"
                [showMinimap]="false"
              ></ngx-workflow-diagram>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 2. Trusted / Social Proof (Mock) -->
    <section class="trusted-section">
      <div class="container text-center">
        <p class="trusted-label">TRUSTED BY DEVELOPERS AT</p>
        <div class="logos-grid">
           <!-- Text placeholders for logos to avoid image 404s -->
           <span class="logo-text">ACME Corp</span>
           <span class="logo-text">GlobalFlow</span>
           <span class="logo-text">NextGen</span>
           <span class="logo-text">Stark Industries</span>
           <span class="logo-text">Wayne Ent</span>
        </div>
      </div>
    </section>

    <!-- 3. Feature: Performance -->
    <section class="feature-strip">
      <div class="container grid-split">
        <div class="feature-text">
          <div class="feature-icon">⚡</div>
          <h2>Uncompromising Performance</h2>
          <p>
            Rendering complexity shouldn't slow you down. Built with <b>Angular Signals</b> 
            and <b>OnPush</b> change detection, ngx-workflow acts as a thin view layer 
            over your graph data model.
          </p>
          <ul class="check-list">
            <li>Refreshes only changed nodes</li>
            <li>Handles 1000+ nodes seamlessly</li>
            <li>Decoupled logic and rendering</li>
          </ul>
        </div>
        <div class="feature-visual glass-panel fps-visual">
           <div class="fps-meter">
             <span class="fps-val">60</span>
             <span class="fps-unit">FPS</span>
           </div>
           <div class="fps-graph"></div>
        </div>
      </div>
    </section>

    <!-- 4. Feature: Customization -->
    <section class="feature-strip alt-bg">
      <div class="container grid-split reverse">
        <div class="feature-text">
          <div class="feature-icon">🎨</div>
          <h2>Your UI, Your Rules</h2>
          <p>
            We don't impose a Design System. Every node, handle, and edge is fully customizable 
            via standard Angular templates.
          </p>
          <p>
            Style the base graph using comprehensive <b>CSS Variables</b> to match your 
            dark mode or brand colors instantly.
          </p>
        </div>
        <div class="feature-visual glass-panel theme-visual">
           <div class="theme-card dark">Dark Mode</div>
           <div class="theme-card light">Light Mode</div>
           <div class="theme-card custom">Brand</div>
        </div>
      </div>
    </section>

    <!-- 5. Feature: Controls -->
    <section class="feature-strip">
      <div class="container grid-split">
        <div class="feature-text">
          <div class="feature-icon">🎮</div>
          <h2>Interactive Controls</h2>
          <p>
            Give your users the power to navigate complex maps. Zoom, pan, and fit-view 
            are built-in and configurable.
          </p>
          <ul class="check-list">
            <li>Minimap with viewport tracking</li>
            <li>Background patterns (Dots, Lines, Cross)</li>
            <li>Keyboard shortcuts</li>
          </ul>
        </div>
        <div class="feature-visual glass-panel controls-visual">
           <!-- Simulating UI controls -->
           <div class="mock-minimap"></div>
           <div class="mock-zoom">
             <button>+</button>
             <button>-</button>
           </div>
        </div>
      </div>
    </section>
    
    <!-- 6. Developer Experience -->
    <section class="feature-strip alt-bg">
      <div class="container grid-split reverse">
        <div class="feature-text">
          <div class="feature-icon">💻</div>
          <h2>Developer Experience First</h2>
          <p>
             No massive configuration objects. Just pass your data and let the library handle the rest.
             Type-safe interfaces ensure you catch errors at compile time.
          </p>
        </div>
        <div class="feature-visual code-visual">
          <pre><code><span class="k">import</span> {{ '{' }} NgxWorkflowModule {{ '}' }} <span class="k">from</span> <span class="s">'ngx-workflow'</span>;

@Component({{ '{' }}
  imports: [ NgxWorkflowModule ],
  template: \`
    &lt;ngx-workflow-diagram
       [nodes]="nodes()"
       [edges]="edges()"
       [viewOnly]="false"
    /&gt;
  \`
{{ '}' }})
<span class="k">export class</span> App {{ '{' }} ... {{ '}' }}</code></pre>
        </div>
      </div>
    </section>

    <!-- 7. Use Cases -->
    <section class="use-cases-section">
      <div class="container text-center">
        <h2>What can you build?</h2>
        <div class="use-cases-grid">
           <div class="use-case-card glass-panel">
             <h3>Workflow Automation</h3>
             <p>Visual builders for CI/CD pipelines, email marketing sequences, or business logic.</p>
           </div>
           <div class="use-case-card glass-panel">
             <h3>Data Processing</h3>
             <p>ETL pipelines, audio/video processing graphs, and node-based shaders.</p>
           </div>
           <div class="use-case-card glass-panel">
             <h3>Knowledge Graphs</h3>
             <p>Mind maps, organizational charts, and dependency visualization.</p>
           </div>
        </div>
      </div>
    </section>

    <!-- 8. Footer/CTA -->
    <section class="cta-section">
       <div class="container cta-container">
          <h2>Start building today.</h2>
          <p>Open source and MIT licensed.</p>
          <div class="cta-actions">
            <a routerLink="/docs" class="btn-primary-lg inverse">Documentation</a>
            <a href="https://github.com/abdulkyume/ngx-workflow" target="_blank" class="btn-secondary-lg inverse">GitHub</a>
          </div>
       </div>
    </section>
    
    <!-- TEMPLATES -->
    <ng-template #customNodeTemplate let-node>
      <div class="custom-node" [class.accent]="node.data?.accent">
        <div class="node-header">
           <span class="icon">{{ node.data?.icon || '📦' }}</span>
           <span class="label">{{ node.label }}</span>
        </div>
        <div class="node-body">
           {{ node.data?.description || 'Node Content' }}
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: block;
      overflow-x: hidden;
    }
    
    /* Variables specific to landing */
    .text-gradient {
      background: linear-gradient(to right, #2563eb, #9333ea);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    /* 1. Hero */
    .hero-section {
      padding: 140px 0 100px;
      position: relative;
      background: radial-gradient(circle at 50% 0%, #f3f4f6 0%, transparent 50%);
    }
    .grid-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }
    .hero-content { z-index: 2; }
    
    .badge-pill {
      display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px;
      background: white; border: 1px solid var(--color-border); border-radius: 20px;
      font-size: 0.8rem; font-weight: 600; margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .badge-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }

    .hero-title {
      font-size: 4rem; font-weight: 800; line-height: 1.1; margin-bottom: 24px;
      letter-spacing: -0.03em;
    }
    .hero-subtitle {
      font-size: 1.25rem; color: var(--color-text-secondary); margin-bottom: 40px;
      line-height: 1.6; max-width: 500px;
    }
    
    .hero-actions { display: flex; gap: 16px; margin-bottom: 40px; }
    .hero-stats { display: flex; gap: 32px; font-size: 0.9rem; color: var(--color-text-secondary); }

    /* Buttons */
    .btn-primary-lg {
      padding: 14px 28px; background: var(--color-primary); color: var(--color-primary-foreground);
      border-radius: 8px; font-weight: 600; text-decoration: none;
      transition: transform 0.2s;
    }
    .btn-secondary-lg {
      padding: 14px 28px; background: var(--color-bg-surface); color: var(--color-text-primary);
      border: 1px solid var(--color-border); border-radius: 8px; font-weight: 600;
      text-decoration: none; transition: background 0.2s;
    }
    .btn-primary-lg:hover, .btn-secondary-lg:hover { transform: translateY(-2px); }
    
    /* Hero Visual */
    .graph-window {
      height: 500px; border-radius: 12px; overflow: hidden;
      border: 1px solid var(--color-border); background: white;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
      display: flex; flex-direction: column;
    }
    .window-bar {
      height: 40px; background: #f9fafb; border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center; padding: 0 16px; gap: 16px;
    }
    .dots { display: flex; gap: 6px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .red { background: #ef4444; } .yellow { background: #f59e0b; } .green { background: #22c55e; }
    .address-bar {
      flex: 1; height: 24px; background: white; border-radius: 4px; border: 1px solid var(--color-border);
      font-size: 0.75rem; color: #9ca3af; display: flex; align-items: center; padding: 0 8px;
    }
    .graph-wrapper { flex: 1; position: relative; }

    /* 2. Trusted Section */
    .trusted-section { padding: 40px 0; border-bottom: 1px solid var(--color-border); }
    .trusted-label { font-size: 0.75rem; font-weight: 600; color: #9ca3af; letter-spacing: 0.1em; margin-bottom: 24px; }
    .logos-grid { display: flex; justify-content: center; gap: 48px; opacity: 0.6; grayscale: 100%; font-weight: 700; color: #6b7280; font-size: 1.2rem; }
    
    /* Feature Strips */
    .feature-strip { padding: 100px 0; }
    .alt-bg { background: var(--color-bg-surface); }
    .reverse { direction: rtl; } /* Quick hack for alternating layouts, resetting direction in children */
    .reverse > * { direction: ltr; }
    
    .feature-icon { font-size: 3rem; margin-bottom: 24px; }
    h2 { font-size: 2.5rem; font-weight: 700; margin-bottom: 24px; letter-spacing: -0.02em; }
    p { font-size: 1.125rem; color: var(--color-text-secondary); line-height: 1.7; margin-bottom: 24px; }
    
    .check-list { list-style: none; padding: 0; }
    .check-list li {
      padding-left: 28px; position: relative; margin-bottom: 12px; font-weight: 500;
    }
    .check-list li::before {
      content: '✓'; position: absolute; left: 0; color: #2563eb; font-weight: 800;
    }

    .feature-visual {
      height: 400px; border-radius: 16px; display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden;
    }
    
    /* Specific Visuals */
    .fps-visual { background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #059669; flex-direction: column;}
    .fps-meter { font-size: 6rem; font-weight: 900; line-height: 0.8; }
    .fps-unit { font-size: 1.5rem; font-weight: 600; display: block; text-align: right; }
    
    .theme-visual { background: linear-gradient(135deg, #f0f9ff, #e0f2fe); gap: 16px; }
    .theme-card { padding: 16px 24px; background: white; border-radius: 8px; font-weight: 600; box-shadow: var(--shadow-md); }
    .theme-card.dark { background: #1f2937; color: white; }
    .theme-card.custom { background: #4f46e5; color: white; }
    
    .code-visual { background: #0f172a; padding: 40px; align-items: flex-start; justify-content: flex-start; }
    .code-visual pre { margin: 0; color: #f8fafc; font-family: var(--font-mono); font-size: 0.9rem; }
    .k { color: #c084fc; } .s { color: #86efac; }
    
    /* Use Cases */
    .use-cases-section { padding: 100px 0; background: white; }
    .use-cases-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 64px; }
    .use-case-card { padding: 40px; text-align: left; border-radius: 12px; transition: transform 0.2s; }
    .use-case-card:hover { transform: translateY(-5px); border-color: var(--color-accent); }
    .use-case-card h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; }
    
    /* CTA */
    .cta-section { padding: 120px 0; background: black; color: white; }
    .cta-container { display: flex; flex-direction: column; align-items: center; }
    .cta-actions { margin-top: 32px; display: flex; gap: 16px; }
    .inverse { border-color: #333; }
    .btn-primary-lg.inverse { background: white; color: black; }
    .btn-secondary-lg.inverse { background: transparent; color: white; border-color: #555; }
    
    /* Custom Node Template Styles */
    .custom-node {
      background: white; border: 1px solid #e5e7eb; border-radius: 8px;
      width: 180px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .custom-node.accent { border-top: 4px solid #3b82f6; }
    .node-header {
      padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #f3f4f6;
      font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
    }
    .node-body { padding: 12px; font-size: 0.8rem; color: #6b7280; }

    @media(max-width: 1024px) {
      .grid-split { grid-template-columns: 1fr; }
      .reverse { direction: ltr; }
      .hero-title { font-size: 3rem; }
      .use-cases-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements AfterViewInit {
  heroNodes = signal<Node[]>([
    { id: '1', position: { x: 50, y: 50 }, label: 'Trigger', type: 'default', ports: 1, data: { icon: '⚡', description: 'HTTP Request', accent: true } },
    { id: '2', position: { x: 300, y: 150 }, label: 'Filter', type: 'default', ports: 3, data: { icon: '🔍', description: 'Filter data > 100' } },
    { id: '3', position: { x: 550, y: 50 }, label: 'Database', type: 'default', ports: 2, data: { icon: '💾', description: 'Save Record', accent: true } },
    { id: '4', position: { x: 550, y: 250 }, label: 'Notification', type: 'default', ports: 2, data: { icon: '🔔', description: 'Send Slack Alert' } }
  ]);

  heroEdges = signal<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 } },
    { id: 'e2-3', source: '2', target: '3', sourceHandle: 'right', targetHandle: 'left', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } },
    { id: 'e2-4', source: '2', target: '4', sourceHandle: 'right', targetHandle: 'left', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }
  ]);

  ngAfterViewInit() {
    // Initial animations or logic
  }
}

