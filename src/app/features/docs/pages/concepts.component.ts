import { Component } from '@angular/core';
import { DocDemoComponent } from '../components/doc-demo.component';

@Component({
  selector: 'app-doc-concepts',
  standalone: true,
  imports: [DocDemoComponent],
  template: `
    <div class="doc-content prose animate-fade-in">
      <div class="page-header">
        <h1>Core Concepts</h1>
        <p class="lead">
           Understanding how ngx-workflow thinks about data is key to building complex editors.
        </p>
      </div>

      <h2>The Data Model</h2>
      <p>
        The library is <strong>unidirectional</strong>. You provide the <code>nodes</code> and <code>edges</code> signals, 
        and the library renders them. When a user drags a node, the library updates its internal state 
        and emits events, but <strong>you</strong> own the source of truth.
      </p>

      <h3>Nodes</h3>
      <p>A Node is the fundamental building block.</p>
      
      <app-doc-demo [code]="nodeCode">
        <!-- Visual representation of a Node structure -->
        <div class="concept-visual node-visual">
           <div class="mock-node bg-white border shadow-sm p-4 rounded">
             <div class="text-sm font-bold mb-2">My Node (id: '1')</div>
             <div class="text-xs text-gray-500 font-mono">
               x: 100, y: 50<br>
               data: {{ '{' }} ... {{ '}' }}
             </div>
             <!-- Mock Handles -->
             <div class="handle top"></div>
             <div class="handle right"></div>
             <div class="handle bottom"></div>
             <div class="handle left"></div>
           </div>
        </div>
      </app-doc-demo>

      <h3>Ports & Bitmasks</h3>
      <p>
        Instead of defining an array of handles, we use a <strong>Bitmask</strong> to define 
        which sides of a node can have connections. This is extremely performant for large graphs.
      </p>

      <div class="table-wrapper">
        <table>
          <thead><tr><th>Side</th><th>Value</th><th>Binary</th></tr></thead>
          <tbody>
            <tr><td>Right</td><td><code>1</code></td><td><code>0001</code></td></tr>
            <tr><td>Left</td><td><code>2</code></td><td><code>0010</code></td></tr>
            <tr><td>Top</td><td><code>4</code></td><td><code>0100</code></td></tr>
            <tr><td>Bottom</td><td><code>8</code></td><td><code>1000</code></td></tr>
          </tbody>
        </table>
      </div>

      <div class="info-box">
        <strong>Tip:</strong> You can combine these! <code>3</code> (1+2) means Left & Right. 
        <code>15</code> means All Sides.
      </div>
      
      <h2>Edges</h2>
      <p>Edges connect two nodes via their IDs and (optional) handle IDs.</p>
      <app-doc-demo [code]="edgeCode">
         <div class="concept-visual edge-visual">
            <svg width="200" height="100" style="overflow: visible">
              <path d="M 20 50 C 100 50, 100 50, 180 50" fill="none" stroke="#2563eb" stroke-width="2" marker-end="url(#arrow)"/>
              <circle cx="20" cy="50" r="4" fill="#2563eb"/>
              <circle cx="180" cy="50" r="4" fill="#2563eb"/>
              <text x="100" y="40" text-anchor="middle" font-size="10" fill="#64748b">Edge (id: 'e1-2')</text>
            </svg>
         </div>
      </app-doc-demo>
    </div>
  `,
  styles: [`
    .concept-visual {
      display: flex; align-items: center; justify-content: center;
      width: 100%; height: 100%; min-height: 200px;
      background-size: 20px 20px;
      background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    }
    
    .mock-node {
      width: 140px; background: white; border: 1px solid var(--color-border);
      border-radius: 8px; padding: 12px; position: relative;
      box-shadow: var(--shadow-sm);
    }
    .handle {
      width: 8px; height: 8px; background: var(--color-text-primary); border-radius: 50%;
      position: absolute;
    }
    .top { top: -4px; left: 50%; transform: translateX(-50%); }
    .bottom { bottom: -4px; left: 50%; transform: translateX(-50%); }
    .left { left: -4px; top: 50%; transform: translateY(-50%); }
    .right { right: -4px; top: 50%; transform: translateY(-50%); }
    
    .info-box {
      background: var(--color-bg-surface); border-left: 4px solid var(--color-accent);
      padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0;
      color: var(--color-text-secondary);
    }
    
    /* Tables are handled by global .prose, but wrapper helps scrolling */
    .table-wrapper { overflow-x: auto; margin: 1.5rem 0; border: 1px solid var(--color-border); border-radius: 8px; }
    table { width: 100%; text-align: left; border-collapse: collapse; }
    th, td { padding: 12px; border-bottom: 1px solid var(--color-border); }
    th { background: var(--color-bg-surface); font-weight: 600; color: var(--color-text-primary); }
  `]
})
export class DocConceptsComponent {
  nodeCode = `interface Node {
  id: string;
  position: { x: number; y: number };
  data: any;
  ports: number; // 1 | 2 | 4 | 8
}`;

  edgeCode = `interface Edge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}`;
}
