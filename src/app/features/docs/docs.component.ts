import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="container flex" style="margin-top: var(--space-8); gap: var(--space-12);">
      <aside class="sidebar">
        <div class="group">
          <h4>Introduction</h4>
          <a routerLink="/docs/intro" routerLinkActive="active" class="link">Getting Started</a>
        </div>
        <div class="group">
          <h4>Core Concepts</h4>
          <a routerLink="/docs/concepts" routerLinkActive="active" class="link">Concepts</a>
          <a routerLink="/docs/api" routerLinkActive="active" class="link">API Reference</a>
          <a routerLink="/docs/inputs" routerLinkActive="active" class="link">Inputs</a>
          <a routerLink="/docs/outputs" routerLinkActive="active" class="link">Outputs</a>
          <a routerLink="/docs/customization" routerLinkActive="active" class="link">Customization</a>
        </div>
      </aside>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 240px;
      flex-shrink: 0;
      position: sticky;
      top: 100px;
      height: calc(100vh - 100px);
    }
    .group {
      margin-bottom: var(--space-8);
    }
    .group h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: var(--space-2);
      color: var(--color-text-primary);
    }
    .link {
      display: block;
      padding: 6px 12px;
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .link:hover {
      background: var(--color-bg-surface-hover);
      color: var(--color-text-primary);
    }
    .link.active {
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-accent);
      font-weight: 600;
    }
    .content {
      flex: 1;
      max-width: 800px;
    }
  `]
})
export class DocsComponent { }
