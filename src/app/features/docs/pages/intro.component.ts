import { Component } from '@angular/core';

@Component({
    selector: 'app-doc-intro',
    standalone: true,
    template: `
    <div class="doc-content animate-fade-in">
      <h1>Introduction</h1>
      <p>
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
      <ul class="feature-list">
        <li><strong>Signals-First</strong>: Built for Angular 18/19+ with fine-grained reactivity.</li>
        <li><strong>Headless-ish</strong>: Total control over node rendering via standard Angular templates.</li>
        <li><strong>Performance</strong>: Uses OnPush change detection and transforms for smooth interactions.</li>
        <li><strong>Zero Dependencies</strong>: No D3, no external physics engines—just pure Angular.</li>
      </ul>

      <hr class="divider"/>

      <h1>Installation</h1>
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
    .doc-content { max-width: 800px; line-height: 1.6; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
    h2 { font-size: 1.75rem; font-weight: 700; margin-top: 48px; margin-bottom: 24px; }
    p { margin-bottom: 16px; color: var(--color-text-secondary); font-size: 1.1rem; }
    strong { color: var(--color-text-primary); }
    .feature-list { padding-left: 20px; margin-bottom: 32px; }
    .feature-list li { margin-bottom: 8px; color: var(--color-text-secondary); }
    .divider { margin: 48px 0; border: 0; border-top: 1px solid var(--color-border); }
    pre { background: var(--color-bg-surface); padding: 24px; border-radius: 12px; overflow-x: auto; margin-bottom: 24px; border: 1px solid var(--color-border); }
    code { font-family: var(--font-mono); font-size: 0.9rem; color: var(--color-text-primary); }
  `]
})
export class DocIntroComponent { }
