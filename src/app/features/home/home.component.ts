import { Component, signal, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgxWorkflowModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-background"></div>
      
      <div class="container hero-container animate-fade-in">
        <div class="hero-header">
          <h1 class="hero-title">
            The Flowchart Library for<br>
            <span class="text-accent-gradient">Modern Angular Apps</span>.
          </h1>
          <p class="hero-subtitle">
            A high-performance, customizable node-based engine meant for professional workflows.
            Built with Signals.
          </p>
          
          <div class="hero-actions">
            <a routerLink="/docs" class="btn btn-primary">Get Started</a>
            <div class="install-cmd" (click)="copyInstall()">
              <span class="cmd-prefix">$</span>
              npm install ngx-workflow
              @if (copied()) {
                <span class="copied-badge">Copied!</span>
              }
            </div>
          </div>
        </div>
        
        <!-- Interactive Graph Demo -->
        <div class="hero-visual animate-slide-up">
          <div class="editor-window glass-panel">
            <div class="editor-bar">
              <div class="traffic-lights">
                <span class="light red"></span>
                <span class="light yellow"></span>
                <span class="light green"></span>
              </div>
              <div class="file-name">workflow-demo.flow</div>
            </div>
            
            <div class="editor-content">
               <ngx-workflow-diagram
                [nodes]="heroNodes()"
                [edges]="heroEdges()"
                [showBackground]="true"
                backgroundVariant="dots"
                [showZoomControls]="true"
                [showMinimap]="false"
              ></ngx-workflow-diagram>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Bento Grid Features -->
    <section class="features-section">
      <div class="container">
        <div class="bento-grid">
          
          <!-- Card 1: Performance (Span 2) -->
          <div class="bento-card col-span-2 glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">
                <span class="icon">⚡</span>
              </div>
              <h3>Unmatched Performance</h3>
              <p>Rendering 1000+ nodes at 60FPS. Built on OnPush strategies and Angular Signals, keeping the view layer incredibly thin.</p>
            </div>
            <div class="card-visual visual-perf">
               <div class="perf-chart"></div>
            </div>
          </div>

          <!-- Card 2: Customization -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">
                <span class="icon">🎨</span>
              </div>
              <h3>Fully Customizable</h3>
              <p>Bring your own templates. Nodes, edges, and handles support full Angular component projection.</p>
            </div>
          </div>

          <!-- Card 3: DX -->
          <div class="bento-card glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">
                <span class="icon">🛠️</span>
              </div>
              <h3>Top-Tier DX</h3>
              <p>Type-safe interfaces, predictable state management, and no massive configuration objects.</p>
            </div>
          </div>

          <!-- Card 4: Plugins (Span 2) -->
          <div class="bento-card col-span-2 glass-panel">
            <div class="card-content">
              <div class="icon-wrapper">
                <span class="icon">🔌</span>
              </div>
              <h3>Extensible Plugin System</h3>
              <p>Need a minimap? Background controls? Auto-layout? Just drop them in. Everything is composable.</p>
            </div>
            <div class="card-visual visual-plugins">
               <!-- Abstract Visual -->
               <div class="plugin-block p1"></div>
               <div class="plugin-block p2"></div>
               <div class="plugin-block p3"></div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="cta-section">
      <div class="container text-center">
        <h2>Ready to build?</h2>
        <div class="cta-btns">
           <a routerLink="/docs" class="btn btn-primary">Read the Docs</a>
           <a href="https://github.com/abdulkyume/ngx-workflow" class="btn btn-secondary">Star on GitHub</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; overflow-x: hidden; }

    /* Hero */
    .hero-section {
      padding: 80px 0 40px;
      position: relative;
      overflow: hidden;
    }
    .hero-background {
      position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle at 50% 50%, rgba(37,99,235,0.08) 0%, transparent 40%);
      z-index: -1;
      animation: spin 60s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .hero-container {
      display: flex; flex-direction: column; align-items: center; gap: 64px;
    }
    .hero-header { text-align: center; max-width: 800px; display: flex; flex-direction: column; align-items: center; }
    
    .hero-title {
      font-size: 3.5rem; line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 24px;
    }
    .hero-subtitle {
      font-size: 1.25rem; color: var(--color-text-secondary); max-width: 500px; margin-bottom: 40px;
    }

    .hero-actions {
      display: flex; gap: 16px; align-items: center; flex-wrap: wrap; justify-content: center;
    }
    
    .btn {
      padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem;
      cursor: pointer; transition: all 0.2s; border: 1px solid transparent;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .btn-primary {
      background: var(--color-primary); color: var(--color-primary-foreground);
    }
    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    
    .btn-secondary {
      background: var(--color-bg-surface); color: var(--color-text-primary);
      border-color: var(--color-border);
    }
    .btn-secondary:hover { background: var(--color-bg-surface-hover); }

    .install-cmd {
      padding: 12px 20px; background: var(--color-bg-surface); border: 1px solid var(--color-border);
      border-radius: 8px; font-family: var(--font-mono); font-size: 0.9rem;
      color: var(--color-text-secondary); cursor: pointer; position: relative;
      transition: border-color 0.2s;
    }
    .install-cmd:hover { border-color: var(--color-accent); color: var(--color-text-primary); }
    .cmd-prefix { color: var(--color-text-tertiary); margin-right: 8px; user-select: none; }
    
    .copied-badge {
      position: absolute; top: -30px; right: 0; background: var(--color-active);
      color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;
      background: #10b981; animation: fadeIn 0.2s;
    }

    /* Editor Window */
    .editor-window {
      width: 1200px; height: 800px;
      border-radius: 12px; display: flex; flex-direction: column;
      box-shadow: var(--shadow-xl); overflow: hidden;
      border: 1px solid var(--color-border);
    }
    .editor-bar {
      height: 48px; border-bottom: 1px solid var(--color-border);
      display: flex; align-items: center; justify-content: center; position: relative;
      background: rgba(255,255,255,0.05);
    }
    .traffic-lights {
      position: absolute; left: 16px; display: flex; gap: 8px;
    }
    .light { width: 12px; height: 12px; border-radius: 50%; opacity: 0.8; }
    .red { background: #ef4444; } .yellow { background: #f59e0b; } .green { background: #22c55e; }
    
    .file-name {
      font-size: 0.85rem; color: var(--color-text-secondary); font-family: var(--font-mono);
      display: flex; align-items: center; gap: 6px;
    }
    .editor-content { flex: 1; position: relative; background: var(--color-bg-base); }

    /* Bento Grid */
    .features-section { padding: 100px 0; }
    .bento-card {
      border-radius: 16px; padding: 32px;
      display: flex; flex-direction: column; justify-content: space-between;
      overflow: hidden; position: relative;
      transition: transform 0.2s, border-color 0.2s;
    }
    .bento-card:hover {
      transform: translateY(-2px);
      border-color: var(--color-accent);
    }
    
    .card-content { z-index: 2; }
    .icon-wrapper {
      width: 48px; height: 48px; border-radius: 10px; background: var(--color-bg-surface);
      display: flex; align-items: center; justify-content: center; margin-bottom: 24px;
      border: 1px solid var(--color-border);
    }
    .icon { font-size: 24px; }
    
    h3 { font-size: 1.5rem; margin-bottom: 12px; letter-spacing: -0.02em; }
    p { color: var(--color-text-secondary); font-size: 1rem; line-height: 1.6; }

    .visual-perf {
      height: 150px; background: linear-gradient(to top, var(--color-accent-glow), transparent);
      margin: 24px -32px -32px; border-top: 1px solid var(--color-border);
      position: relative;
    }
    
    .visual-plugins {
      height: 150px; margin: 24px -32px -32px; position: relative;
      display: flex; align-items: flex-end; justify-content: center; gap: 16px;
      padding-bottom: 24px;
    }
    .plugin-block {
      width: 60px; height: 60px; border-radius: 12px; background: var(--color-bg-surface);
      border: 1px solid var(--color-border); box-shadow: var(--shadow-md);
    }
    .p1 { transform: rotate(-6deg) translateY(10px); }
    .p2 { z-index: 2; background: white; }
    .p3 { transform: rotate(6deg) translateY(10px); }

    /* CTA */
    .cta-section { padding: 120px 0; }
    .cta-btns { display: flex; justify-content: center; gap: 16px; margin-top: 32px; }

    @media (max-width: 768px) {
      .hero-title { font-size: 2.5rem; }
    }
  `]
})
export class HomeComponent {
  heroNodes = signal<Node[]>([
    { id: '1', position: { x: 50, y: 150 }, label: 'Source', type: 'default', ports: 1 },
    { id: '2', position: { x: 300, y: 50 }, label: 'Process A', type: 'default', ports: 2 },
    { id: '3', position: { x: 300, y: 250 }, label: 'Process B', type: 'default', ports: 2 },
    { id: '4', position: { x: 600, y: 150 }, label: 'Destination', type: 'default', ports: 1 }
  ]);

  heroEdges = signal<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e1-3', source: '1', target: '3', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e2-4', source: '2', target: '4', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e3-4', source: '3', target: '4', sourceHandle: 'right', targetHandle: 'left', animated: true }
  ]);

  copied = signal(false);

  copyInstall() {
    navigator.clipboard.writeText('npm install ngx-workflow');
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
