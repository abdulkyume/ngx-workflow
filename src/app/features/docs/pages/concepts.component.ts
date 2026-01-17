import { Component } from '@angular/core';

@Component({
    selector: 'app-doc-concepts',
    standalone: true,
    template: `
    <div class="doc-content animate-fade-in">
      <h1>Core Concepts</h1>
      <p>
        Understanding the data model is key to using ngx-workflow effectively. 
        The library is "data-driven"—if you update the data, the view updates automatically.
      </p>

      <h2>1. Nodes</h2>
      <p>A <strong>Node</strong> represents a single block in your diagram.</p>
      <pre><code>interface Node {{ '{' }}
  id: string;           // Unique identifier
  position: {{ '{' }}       // X/Y coordinates relative to canvas
    x: number; 
    y: number 
  {{ '}' }};
  label?: string;       // Default text label
  type?: string;        // 'default' or custom type key
  data?: any;           // Custom data payload for your templates
  ports?: number;       // Port configuration (Bitmask)
{{ '}' }}</code></pre>

      <h3>Port Configuration</h3>
      <p>Ports determine where edges can connect. We use a <strong>Bitmask</strong> system for efficiency:</p>

      <div class="table-container">
        <table>
          <thead><tr><th>Position</th><th>Value</th><th>Binary</th></tr></thead>
          <tbody>
            <tr><td><strong>Right</strong></td><td><code>1</code></td><td><code>0001</code></td></tr>
            <tr><td><strong>Left</strong></td><td><code>2</code></td><td><code>0010</code></td></tr>
            <tr><td><strong>Top</strong></td><td><code>4</code></td><td><code>0100</code></td></tr>
            <tr><td><strong>Bottom</strong></td><td><code>8</code></td><td><code>1000</code></td></tr>
          </tbody>
        </table>
      </div>

      <p><strong>Examples:</strong></p>
      <ul class="feature-list">
        <li>Right Only: <code>ports: 1</code></li>
        <li>Left & Right: <code>ports: 3</code> (1 + 2)</li>
        <li>All Sides: <code>ports: 15</code> (1 + 2 + 4 + 8)</li>
      </ul>

      <h2>2. Edges</h2>
      <p>An <strong>Edge</strong> connects two nodes.</p>
      <pre><code>interface Edge {{ '{' }}
  id: string;
  source: string;       // ID of source node
  target: string;       // ID of target node
  sourceHandle?: string;// 'left', 'right', 'top', 'bottom'
  targetHandle?: string;// 'left', 'right', 'top', 'bottom'
  animated?: boolean;   // Show flowing animation
  style?: any;          // SVG styles (stroke, width, etc.)
{{ '}' }}</code></pre>
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
    .feature-list { padding-left: 20px; }
    .feature-list li { margin-bottom: 8px; color: var(--color-text-secondary); }
    
    .table-container { 
      border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; margin-bottom: 24px;
    }
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { background: var(--color-bg-surface); font-weight: 600; padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
    td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary); }
    tr:last-child td { border-bottom: none; }
  `]
})
export class DocConceptsComponent { }
