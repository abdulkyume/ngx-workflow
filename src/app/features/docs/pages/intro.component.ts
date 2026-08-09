import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InstallWidgetComponent } from '../../../shared/ui/install-widget.component';
import { CodeBlockComponent } from '../../../shared/ui/code-block.component';

@Component({
  selector: 'app-doc-intro',
  standalone: true,
  imports: [RouterLink, InstallWidgetComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="prose">
      <span class="badge badge-accent">Getting Started</span>
      <h1>Introduction to ngx-workflow</h1>
      
      <p class="lead text-muted">
        <strong>ngx-workflow</strong> is a high-performance, developer-first flowchart and graph diagram library built for <strong>Angular 17.1–22 and Signals</strong>.
      </p>

      <div class="callout callout-info">
        <div class="callout-title">💡 Why ngx-workflow?</div>
        <div>Unlike generic JavaScript canvas libraries wrapped in Angular, <code>ngx-workflow</code> is 100% Signal-native. It leverages Angular OnPush change detection and HTML template projection for maximum performance and customization.</div>
      </div>

      <h2 id="installation">Installation</h2>
      <p>Install the library via your preferred Node package manager:</p>

      <app-install-widget variant="stacked" />

      <h2 id="quick-start">Quick Start Guide</h2>
      <p>Follow these 3 steps to render your first interactive flowchart canvas:</p>

      <h3>1. Import NgxWorkflowModule</h3>
      <p>In your Angular Standalone Component or NgModule, import <code>NgxWorkflowModule</code>:</p>

      <app-code-block label="TypeScript" [code]="tsSnippet" />

      <h3>2. Render Diagram Component</h3>
      <p>In your component HTML template, add the <code>&lt;ngx-workflow-diagram&gt;</code> element:</p>

      <app-code-block label="HTML" [code]="htmlSnippet" />

      <h2 id="key-features">Core Feature Matrix</h2>
      <ul>
        <li><strong>Pure Signals Reactivity:</strong> All viewport transformations, selection states, and node coordinate changes run inside reactive Signal pipelines.</li>
        <li><strong>Automatic ELK Layout:</strong> Built-in integration with <code>ELK.js</code> for instant hierarchical graph layout calculation.</li>
        <li><strong>Rich Overlays:</strong> Minimap navigation, Zoom toolbar, Undo/Redo stack manager, Node search panel, Properties sidebar (RGBA colors, edge animation &amp; markers), and Context menus.</li>
        <li><strong>Connection Routing:</strong> Direction-aware Bezier curves (respect handle sides), orthogonal step / smoothstep, straight lines, smart A* routing, plus flow/dot edge animation.</li>
        <li><strong>100% Type Safe:</strong> Strict TypeScript interfaces for <code>Node</code>, <code>Edge</code>, <code>Connection</code>, and <code>Viewport</code>.</li>
      </ul>

      <div class="next-steps flex gap-4 margin-top-8">
        <a routerLink="/docs/concepts" class="btn btn-primary">Next: Core Concepts →</a>
        <a routerLink="/examples" class="btn btn-secondary">Explore Examples</a>
      </div>
    </article>
  `
})
export class DocIntroComponent {
  readonly tsSnippet = `import { Component, signal } from '@angular/core';
import { NgxWorkflowModule, Node, Edge } from 'ngx-workflow';

@Component({
  selector: 'app-workflow-demo',
  standalone: true,
  imports: [NgxWorkflowModule],
  templateUrl: './workflow-demo.component.html'
})
export class WorkflowDemoComponent {
  // Define Reactive State using Signals
  nodes = signal<Node[]>([
    { id: '1', label: 'Start Trigger', position: { x: 100, y: 100 }, ports: 2 },
    { id: '2', label: 'Process Step', position: { x: 380, y: 100 }, ports: 4 },
    { id: '3', label: 'End Output', position: { x: 660, y: 100 }, ports: 1 }
  ]);

  edges = signal<Edge[]>([
    { id: 'e1-2', source: '1', target: '2', sourceHandle: 'right', targetHandle: 'left', animated: true },
    { id: 'e2-3', source: '2', target: '3', sourceHandle: 'right', targetHandle: 'left' }
  ]);
}`;

  readonly htmlSnippet = `<ngx-workflow-diagram
  [nodes]="nodes()"
  [edges]="edges()"
  [showBackground]="true"
  backgroundVariant="dots"
  [showZoomControls]="true"
  [showMinimap]="true"
  [showLayoutControls]="true"
></ngx-workflow-diagram>`;
}
