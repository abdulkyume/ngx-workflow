import { Component } from '@angular/core';

@Component({
  selector: 'app-doc-intro',
  standalone: true,
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Introduction</h1>
        <div class="meta">
            <span class="badge">Guide</span>
            <span class="updated">Last updated: Jan 17, 2026</span>
        </div>
      </div>

      <p class="lead">
        <strong>ngx-workflow</strong> is a lightweight, highly customizable Angular library for building 
        node-based editors, interactive diagrams, and flowcharts.
      </p>

      <p>
        Unlike other libraries that impose heavy configuration objects or strict UI patterns, 
        ngx-workflow acts as a <strong>thin, high-performance view layer</strong> over your data. 
        You provide the state (Nodes and Edges), and the library handles the rendering, dragging, 
        and zooming interactions at 60fps.
      </p>

      <h2>Key Features</h2>
      <ul>
        <li><strong>Signals-First</strong>: Built for Angular 18/19+ with fine-grained reactivity.</li>
        <li><strong>Headless-ish</strong>: Total control over node rendering via standard Angular templates.</li>
        <li><strong>Performance</strong>: Used OnPush change detection and transforms for smooth interactions.</li>
        <li><strong>Zero Dependencies</strong>: No D3, no external physics engines—just pure Angular.</li>
      </ul>

      <hr />

      <h2>Installation</h2>
      <p>Install the package via npm:</p>
      <pre><code>npm install ngx-workflow</code></pre>

      <h2>Setup</h2>
      <p><strong>1. Import the Module</strong>: Add <code>NgxWorkflowModule</code> to your component's imports.</p>
      <pre><code>import {{ '{' }} Component {{ '}' }} from '@angular/core';
import {{ '{' }} NgxWorkflowModule {{ '}' }} from 'ngx-workflow';

@Component({{ '{' }}
  selector: 'app-root',
  standalone: true,
  imports: [NgxWorkflowModule],
  template: \`...\`
{{ '}' }})
export class AppComponent {{ '{' }}{{ '}' }}</code></pre>

      <p><strong>2. Add Styles</strong>: Import the core styles in your global <code>styles.css</code>.</p>
      <pre><code>/* styles.css */
@import 'ngx-workflow/styles/core.css';
@import 'ngx-workflow/styles/theme-default.css';</code></pre>

      <p><strong>3. Use the Component</strong>:</p>
      <pre><code>&lt;ngx-workflow-diagram 
  [nodes]="nodes" 
  [edges]="edges"&gt;
&lt;/ngx-workflow-diagram&gt;</code></pre>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 2rem; }
    .meta { display: flex; gap: 12px; align-items: center; margin-top: -1.5rem; } /* pulling up closer to title */
    .badge { 
      background: var(--color-accent); color: white; font-size: 0.7rem; 
      font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase;
    }
    .updated { font-size: 0.85rem; color: var(--color-text-secondary); }
    .lead { font-size: 1.2rem; color: var(--color-text-primary); }
  `]
})
export class DocIntroComponent { }
