import { Component } from '@angular/core';

@Component({
    selector: 'app-doc-customization',
    standalone: true,
    template: `
    <div class="doc-content animate-fade-in">
      <h1>Customization</h1>
      <p>
        ngx-workflow is built to be unopinionated. You should be able to make it look like 
        <strong>your</strong> app, not a generic tool.
      </p>

      <h2>CSS Variables</h2>
      <p>
        We expose a comprehensive set of CSS variables for theming. You can override these 
        globally or within a specific container.
      </p>
      
      <pre><code>:root {{ '{' }}
  /* Canvas Background */
  --ngx-workflow-bg: #ffffff;
  
  /* Node Styling */
  --ngx-workflow-node-bg: #ffffff;
  --ngx-workflow-node-border: #e2e8f0;
  --ngx-workflow-node-color: #1a202c;
  --ngx-workflow-node-radius: 4px;
  --ngx-workflow-node-shadow: 0 1px 3px rgba(0,0,0,0.1);

  /* Selection State */
  --ngx-workflow-selection: #3b82f6;

  /* Handle (Port) Styling */
  --ngx-workflow-handle-bg: #ffffff;
  --ngx-workflow-handle-border: #718096;
  --ngx-workflow-handle-size: 10px;

  /* Edge (Line) Styling */
  --ngx-workflow-edge-stroke: #b0b8c4;
  --ngx-workflow-edge-width: 2px;
{{ '}' }}</code></pre>

      <h3>Dark Mode Example</h3>
      <pre><code>.dark-theme {{ '{' }}
  --ngx-workflow-bg: #1a202c;
  --ngx-workflow-node-bg: #2d3748;
  --ngx-workflow-node-border: #4a5568;
  --ngx-workflow-node-color: #f7fafc;
  --ngx-workflow-edge-stroke: #4a5568;
{{ '}' }}</code></pre>

      <h2>Custom Node Templates</h2>
      <p>
        For strict control over your nodes, you can provide a custom template path or 
        component content (Feature in Preview).
      </p>
    </div>
  `,
    styles: [`
    .doc-content { max-width: 800px; line-height: 1.6; }
    h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em; }
    h2 { font-size: 1.75rem; font-weight: 700; margin-top: 48px; margin-bottom: 24px; }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 32px; margin-bottom: 16px; }
    p { margin-bottom: 16px; color: var(--color-text-secondary); font-size: 1.1rem; }
    strong { color: var(--color-text-primary); }
    pre { background: var(--color-bg-surface); padding: 24px; border-radius: 12px; overflow-x: auto; margin-bottom: 24px; border: 1px solid var(--color-border); }
    code { font-family: var(--font-mono); font-size: 0.9rem; color: var(--color-text-primary); }
  `]
})
export class DocCustomizationComponent { }
