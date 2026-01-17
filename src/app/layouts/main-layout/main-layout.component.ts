import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="layout">
      <header class="navbar">
        <div class="container navbar-container">
          <a routerLink="/" class="logo">
            ngx-workflow
          </a>
          
          <button class="menu-toggle" (click)="toggleMenu()" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              @if (isOpen()) {
                <path d="M18 6L6 18M6 6l12 12"/>
              } @else {
                <path d="M3 12h18M3 6h18M3 18h18"/>
              }
            </svg>
          </button>

          <nav class="nav-links" [class.open]="isOpen()">
            <a routerLink="/docs" class="nav-link" (click)="closeMenu()">Docs</a>
            <a routerLink="/examples" class="nav-link" (click)="closeMenu()">Examples</a>
            <a href="https://github.com/abdulkyume/ngx-workflow" target="_blank" class="nav-link" (click)="closeMenu()">GitHub</a>
          </nav>
        </div>
      </header>
      
      <main class="content">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <div class="container">
          <p>© 2025 ngx-workflow. MIT License.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .navbar {
      height: 64px;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      background: var(--color-bg-base);
      z-index: 100;
    }
    .navbar-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-weight: 700;
      font-size: 1.25rem;
      text-decoration: none;
      color: var(--color-text-primary);
      z-index: 102;
    }
    .menu-toggle {
      display: none;
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--color-text-primary);
      z-index: 102;
    }
    .nav-links {
      display: flex;
      gap: var(--space-4);
    }
    .nav-link {
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    .nav-link:hover {
      color: var(--color-text-primary);
    }

    @media (max-width: 768px) {
      .menu-toggle {
        display: block;
      }
      .nav-links {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-bg-base);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-8);
        transform: translateY(-100%);
        transition: transform 0.3s ease-in-out;
        z-index: 101;
      }
      .nav-links.open {
        transform: translateY(0);
      }
      .nav-link {
        font-size: 1.25rem;
      }
    }

    .content {
      flex: 1;
    }
    .footer {
      padding: var(--space-8) 0;
      border-top: 1px solid var(--color-border);
      text-align: center;
      color: var(--color-text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class MainLayoutComponent {
  isOpen = signal(false);

  toggleMenu() {
    this.isOpen.update(v => !v);
  }

  closeMenu() {
    this.isOpen.set(false);
  }
}
