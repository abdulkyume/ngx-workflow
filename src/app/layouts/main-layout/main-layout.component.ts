import {
  Component,
  signal,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SeoService } from '../../core/services/seo.service';
import { AppThemeService } from '../../core/services/app-theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Skip to content</a>

    <div class="layout">
      <header class="navbar glass-panel">
        <div class="container navbar-container">
          <a routerLink="/" class="logo" aria-label="ngx-workflow home">
            <div class="logo-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="2"></rect>
                <rect x="14" y="3" width="7" height="7" rx="2"></rect>
                <rect x="14" y="14" width="7" height="7" rx="2"></rect>
                <rect x="3" y="14" width="7" height="7" rx="2"></rect>
                <path d="M10 6.5h4"></path>
                <path d="M6.5 10v4"></path>
                <path d="M17.5 10v4"></path>
              </svg>
            </div>
            <span class="logo-text">ngx-workflow</span>
          </a>

          <button
            type="button"
            class="menu-toggle"
            (click)="toggleMenu()"
            [attr.aria-expanded]="isOpen()"
            aria-controls="site-nav"
            aria-label="Toggle navigation">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              @if (isOpen()) {
                <path d="M18 6L6 18M6 6l12 12"/>
              } @else {
                <path d="M3 12h18M3 6h18M3 18h18"/>
              }
            </svg>
          </button>

          <nav id="site-nav" class="nav-links" [class.open]="isOpen()" aria-label="Primary">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" (click)="closeMenu()">Home</a>
            <a routerLink="/docs" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Docs</a>
            <a routerLink="/examples" routerLinkActive="active" class="nav-link" (click)="closeMenu()">Examples</a>
            <a routerLink="/sandbox" routerLinkActive="active" class="nav-link" (click)="closeMenu()">
              <span class="sandbox-badge">Studio</span>
              Sandbox
            </a>

            <div class="divider" aria-hidden="true"></div>

            <button
              type="button"
              class="theme-toggle-btn"
              (click)="toggleTheme()"
              [attr.aria-pressed]="isDark()"
              [attr.aria-label]="isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
              @if (isDark()) {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              }
            </button>

            <a
              href="https://github.com/abdulkyume/ngx-workflow"
              target="_blank"
              rel="noopener"
              class="btn btn-secondary btn-sm github-btn"
              (click)="closeMenu()">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span>GitHub</span>
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" class="content" tabindex="-1">
        <router-outlet />
      </main>

      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div class="logo">
                <div class="logo-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <rect x="3" y="3" width="7" height="7" rx="2"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="2"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="2"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="2"></rect>
                  </svg>
                </div>
                <span class="logo-text">ngx-workflow</span>
              </div>
              <p class="brand-desc">
                High-performance Angular workflow engine built with Signals for modern node editors.
              </p>
              <p class="copyright">© {{ currentYear }} ngx-workflow. MIT License.</p>
            </div>

            <div class="footer-col">
              <h4>Documentation</h4>
              <a routerLink="/docs/intro">Getting Started</a>
              <a routerLink="/docs/concepts">Core Concepts</a>
              <a routerLink="/docs/api">API Reference</a>
              <a routerLink="/docs/customization">Customization</a>
            </div>

            <div class="footer-col">
              <h4>Playground</h4>
              <a routerLink="/examples">Interactive Examples</a>
              <a routerLink="/sandbox">Canvas Studio</a>
              <a href="https://github.com/abdulkyume/ngx-workflow/issues" target="_blank" rel="noopener">Report an Issue</a>
            </div>

            <div class="footer-col">
              <h4>Community</h4>
              <a href="https://github.com/abdulkyume/ngx-workflow" target="_blank" rel="noopener">GitHub</a>
              <a href="https://npmjs.com/package/ngx-workflow" target="_blank" rel="noopener">npm</a>
            </div>
          </div>
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
      height: 68px;
      position: sticky;
      top: 0;
      z-index: 100;
      border-radius: 0;
      border: none;
      border-bottom: 1px solid var(--color-border);
    }

    .navbar-container {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: var(--color-text-primary);
      font-weight: 700;
      font-size: 1.05rem;
      font-family: var(--font-display);
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: var(--color-accent-gradient);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-foreground);
      box-shadow: var(--shadow-glow);
    }

    .logo-text { letter-spacing: -0.03em; }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-link {
      position: relative;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--color-text-secondary);
      text-decoration: none;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      transition: color var(--motion-fast) var(--ease-out),
        background var(--motion-fast) var(--ease-out);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      left: 12px;
      right: 12px;
      bottom: 4px;
      height: 2px;
      border-radius: 2px;
      background: var(--color-primary);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform var(--motion-base) var(--ease-out);
    }

    .nav-link:hover { color: var(--color-text-primary); }
    .nav-link.active { color: var(--color-primary); font-weight: 650; }
    .nav-link.active::after { transform: scaleX(1); }

    .sandbox-badge {
      font-size: 0.62rem;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(52, 211, 153, 0.14);
      color: var(--color-success);
      font-weight: 700;
      text-transform: uppercase;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: var(--color-border);
      margin: 0 6px;
    }

    .theme-toggle-btn {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color var(--motion-fast) var(--ease-out),
        color var(--motion-fast) var(--ease-out),
        transform var(--motion-fast) var(--ease-out);
    }

    .theme-toggle-btn:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
      transform: translateY(-1px);
    }

    .github-btn { display: inline-flex; align-items: center; gap: 6px; }

    .menu-toggle {
      display: none;
      background: transparent;
      border: none;
      color: var(--color-text-primary);
      cursor: pointer;
      padding: 8px;
    }

    .content { flex: 1; outline: none; }

    .footer {
      padding: 64px 0 32px;
      border-top: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      margin-top: 48px;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr repeat(3, 1fr);
      gap: 48px;
    }

    .footer-brand {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .brand-desc {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      max-width: 360px;
      line-height: 1.6;
      margin: 0;
    }

    .copyright {
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin: 0;
    }

    .footer-col {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .footer-col h4 {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-text-primary);
      margin: 0 0 4px;
      font-family: var(--font-display);
    }

    .footer-col a {
      font-size: 0.9rem;
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: color var(--motion-fast) var(--ease-out);
    }

    .footer-col a:hover { color: var(--color-primary); }

    @media (max-width: 900px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
    }

    @media (max-width: 768px) {
      .menu-toggle { display: block; }

      .nav-links {
        position: fixed;
        top: 68px;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-bg-base);
        flex-direction: column;
        align-items: stretch;
        padding: 24px;
        gap: 8px;
        transform: translate3d(0, -12px, 0);
        opacity: 0;
        pointer-events: none;
        transition: transform var(--motion-base) var(--ease-out),
          opacity var(--motion-base) var(--ease-out);
        border-top: 1px solid var(--color-border);
        overflow: auto;
      }

      .nav-links.open {
        transform: translate3d(0, 0, 0);
        opacity: 1;
        pointer-events: auto;
      }

      .nav-link::after { display: none; }
      .divider { display: none; }
      .footer-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class MainLayoutComponent implements OnInit {
  private readonly themeService = inject(AppThemeService);
  private readonly seo = inject(SeoService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  isOpen = signal(false);
  isDark = signal(true);
  currentYear = new Date().getFullYear();

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.applyRouteSeo(e.urlAfterRedirects));
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('ngx-workflow-theme');
      this.setTheme(savedTheme === 'light' ? 'light' : 'dark');
    }
  }

  toggleTheme(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  private setTheme(theme: 'dark' | 'light'): void {
    this.isDark.set(theme === 'dark');
    this.themeService.setColorMode(theme);
    if (isPlatformBrowser(this.platformId)) {
      this.document.documentElement.setAttribute('data-theme', theme);
      this.document.documentElement.classList.remove('light-theme', 'dark-theme');
      this.document.documentElement.classList.add(`${theme}-theme`);
      localStorage.setItem('ngx-workflow-theme', theme);
    }
  }

  toggleMenu(): void {
    this.isOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.isOpen.set(false);
  }

  private applyRouteSeo(url: string): void {
    if (url === '/' || url === '') return; // Home sets its own

    if (url.startsWith('/docs')) {
      this.seo.apply({
        title: 'Documentation',
        description: 'Guides, API reference, and customization docs for ngx-workflow.',
        path: url,
      });
    } else if (url.startsWith('/examples')) {
      this.seo.apply({
        title: 'Examples',
        description: 'Interactive ngx-workflow scenarios: pipelines, ELK layout, routing, and density.',
        path: url,
      });
    } else if (url.startsWith('/sandbox')) {
      this.seo.apply({
        title: 'Sandbox Studio',
        description: 'Live playground to explore ngx-workflow inputs, outputs, and canvas behavior.',
        path: url,
      });
    }
  }
}
