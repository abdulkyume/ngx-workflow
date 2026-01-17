import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="docs-layout container">
      <aside class="docs-sidebar">
        <div class="sidebar-content">
          <div class="nav-group">
            <h4 class="group-title">Introduction</h4>
            <a routerLink="/docs/intro" routerLinkActive="active" class="nav-item">Getting Started</a>
          </div>
          
          <div class="nav-group">
            <h4 class="group-title">Core Concepts</h4>
            <a routerLink="/docs/concepts" routerLinkActive="active" class="nav-item">Concepts</a>
            <a routerLink="/docs/api" routerLinkActive="active" class="nav-item">API Reference</a>
            <a routerLink="/docs/customization" routerLinkActive="active" class="nav-item">Customization</a>
          </div>

          <div class="nav-group">
            <h4 class="group-title">Reference</h4>
            <a routerLink="/docs/inputs" routerLinkActive="active" class="nav-item">Inputs</a>
            <a routerLink="/docs/outputs" routerLinkActive="active" class="nav-item">Outputs</a>
          </div>
        </div>
      </aside>

      <main class="docs-main">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Right Sidebar (TOC Placeholder) -->
      <aside class="docs-toc">
        <div class="toc-content">
           <span class="toc-title">On this page</span>
           <ul class="toc-list">
             <li><a href="javascript:void(0)" class="toc-link">Overview</a></li>
             <li><a href="javascript:void(0)" class="toc-link">Installation</a></li>
             <li><a href="javascript:void(0)" class="toc-link">Usage</a></li>
           </ul>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .docs-layout {
      display: grid;
      grid-template-columns: 240px 1fr 200px;
      gap: 48px;
      padding-top: 40px;
      padding-bottom: 80px;
      min-height: calc(100vh - 64px);
    }
    
    /* Sidebar */
    .docs-sidebar {
      position: sticky; top: 104px; height: calc(100vh - 104px);
      overflow-y: auto; padding-right: 20px;
    }
    .sidebar-content { display: flex; flex-direction: column; gap: 32px; }
    
    .group-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--color-text-primary);
      margin-bottom: 12px;
    }
    
    .nav-item {
      display: block; font-size: 0.9rem; color: var(--color-text-secondary);
      padding: 6px 0; text-decoration: none; border-left: 1px solid var(--color-border);
      padding-left: 16px; margin-left: 2px; transition: all 0.2s;
    }
    .nav-item:hover { color: var(--color-text-primary); border-left-color: var(--color-text-secondary); }
    .nav-item.active {
      color: var(--color-accent); font-weight: 500; border-left-color: var(--color-accent);
    }

    /* Main Content */
    .docs-main { min-width: 0; }
    
    /* TOC */
    .docs-toc {
      position: sticky; top: 104px; height: calc(100vh - 104px);
      display: none;
    }
    @media (min-width: 1280px) {
      .docs-toc { display: block; }
    }
    
    .toc-title {
      font-size: 0.75rem; font-weight: 600; color: var(--color-text-primary);
      margin-bottom: 12px; display: block;
    }
    .toc-list { list-style: none; padding: 0; margin: 0; }
    .toc-link {
      display: block; font-size: 0.85rem; color: var(--color-text-secondary);
      padding: 4px 0; text-decoration: none; transition: color 0.2s;
    }
    .toc-link:hover { color: var(--color-text-primary); }

    /* Responsive */
    @media (max-width: 768px) {
      .docs-layout { display: block; }
      .docs-sidebar { display: none; /* Mobile nav handles this usually */ }
      .docs-toc { display: none; }
    }
  `]
})
export class DocsComponent { }
