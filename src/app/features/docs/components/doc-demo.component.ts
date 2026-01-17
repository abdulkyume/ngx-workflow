import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-doc-demo',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="demo-wrapper">
      <div class="demo-header">
        <div class="tabs">
          <button 
            [class.active]="activeTab() === 'preview'"
            (click)="activeTab.set('preview')"
            class="tab-btn">
            Preview
          </button>
          <button 
            [class.active]="activeTab() === 'code'"
            (click)="activeTab.set('code')"
            class="tab-btn">
            Code
          </button>
        </div>
      </div>

      <div class="demo-content" [class.code-mode]="activeTab() === 'code'">
        @if (activeTab() === 'preview') {
          <div class="preview-container">
            <ng-content></ng-content>
          </div>
        } @else {
          <div class="code-container">
            <pre><code>{{ code }}</code></pre>
          </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .demo-wrapper {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin: 2rem 0;
      background: var(--color-bg-base);
    }
    
    .demo-header {
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      padding: 0 1rem;
    }
    
    .tabs {
      display: flex;
      gap: 1rem;
    }
    
    .tab-btn {
      padding: 0.75rem 0.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tab-btn:hover {
      color: var(--color-text-primary);
    }
    
    .tab-btn.active {
      color: var(--color-accent);
      border-bottom-color: var(--color-accent);
    }
    
    .preview-container {
      padding: 2rem;
      background: var(--color-bg-base);
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Ensure graphs have isolation context */
      isolation: isolate;
    }

    .code-container {
      background: #0f172a;
      overflow-x: auto;
    }
    
    .code-container pre {
      margin: 0;
      padding: 1.5rem;
      color: #f8fafc;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      line-height: 1.6;
    }
  `]
})
export class DocDemoComponent {
    @Input() code = '';
    activeTab = signal<'preview' | 'code'>('preview');
}
