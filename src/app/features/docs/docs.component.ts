import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

interface TocItem {
  id: string;
  label: string;
  level: number;
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="docs-layout container">
      <div class="mobile-docs-nav glass-panel">
        <div class="mobile-nav-head">
          <span class="badge badge-accent">Docs</span>
          <label class="mobile-label" for="docs-nav-select">Jump to section</label>
        </div>
        <div class="mobile-select-wrap">
          <select
            id="docs-nav-select"
            class="mobile-select"
            [value]="mobileNavPath()"
            (change)="onMobileNav($event)">
            <option value="/docs/intro">Introduction & Setup</option>
            <option value="/docs/concepts">Signals & State Model</option>
            <option value="/docs/api">API Reference</option>
            <option value="/docs/customization">Custom Nodes & Edges</option>
            <option value="/docs/cookbook">Cookbook</option>
            <option value="/docs/testing">Testing</option>
            <option value="/compodoc/">Compodoc API</option>
            <option value="/docs/inputs">Input Properties</option>
            <option value="/docs/outputs">Outputs & Events</option>
          </select>
          <svg class="mobile-select-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      <aside class="docs-sidebar" aria-label="Documentation">
        <div class="sidebar-search">
          <input
            type="search"
            placeholder="Filter documentation..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            class="search-input"
            aria-label="Filter documentation" />
        </div>

        <div class="sidebar-content">
          @if (shouldShow('getting started') || shouldShow('intro')) {
            <div class="nav-group">
              <h4 class="group-title">Getting Started</h4>
              <a routerLink="/docs/intro" routerLinkActive="active" class="nav-item">Introduction & Setup</a>
            </div>
          }

          @if (shouldShow('concepts') || shouldShow('api') || shouldShow('customization') || shouldShow('cookbook') || shouldShow('testing')) {
            <div class="nav-group">
              <h4 class="group-title">Core Architecture</h4>
              @if (shouldShow('concepts')) {
                <a routerLink="/docs/concepts" routerLinkActive="active" class="nav-item">Signals & State Model</a>
              }
              @if (shouldShow('api')) {
                <a routerLink="/docs/api" routerLinkActive="active" class="nav-item">API Reference</a>
              }
              @if (shouldShow('customization')) {
                <a routerLink="/docs/customization" routerLinkActive="active" class="nav-item">Custom Nodes & Edges</a>
              }
              @if (shouldShow('cookbook')) {
                <a routerLink="/docs/cookbook" routerLinkActive="active" class="nav-item">Cookbook</a>
              }
              @if (shouldShow('testing')) {
                <a routerLink="/docs/testing" routerLinkActive="active" class="nav-item">Testing</a>
              }
              @if (shouldShow('compodoc') || shouldShow('api')) {
                <a href="/compodoc/" target="_blank" rel="noopener" class="nav-item">Compodoc API ↗</a>
              }
            </div>
          }

          @if (shouldShow('inputs') || shouldShow('outputs')) {
            <div class="nav-group">
              <h4 class="group-title">Component Reference</h4>
              @if (shouldShow('inputs')) {
                <a routerLink="/docs/inputs" routerLinkActive="active" class="nav-item">Input Properties</a>
              }
              @if (shouldShow('outputs')) {
                <a routerLink="/docs/outputs" routerLinkActive="active" class="nav-item">Outputs & Events</a>
              }
            </div>
          }
        </div>
      </aside>

      <div class="docs-main" #mainContent>
        <router-outlet (activate)="onActivate($event)"></router-outlet>
      </div>

      @if (tocItems.length > 0) {
        <aside class="docs-toc" aria-label="On this page">
          <div class="toc-content glass-panel">
            <span class="toc-title">On this page</span>
            <ul class="toc-list">
              @for (item of tocItems; track item.id) {
                <li>
                  <a
                    href="#{{ item.id }}"
                    class="toc-link"
                    [class.active]="activeFragment === item.id"
                    [class.indent]="item.level === 3"
                    (click)="scrollTo(item.id, $event)">
                    {{ item.label }}
                  </a>
                </li>
              }
            </ul>
          </div>
        </aside>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .docs-layout {
      display: grid;
      grid-template-columns: 240px minmax(0, 1fr);
      gap: 48px;
      padding-top: 40px;
      padding-bottom: 80px;
      min-height: calc(100vh - 68px);
    }

    /* Sidebar */
    .docs-sidebar {
      position: sticky;
      top: 104px;
      height: calc(100vh - 120px);
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sidebar-search {
      width: 100%;
    }

    .search-input {
      width: 100%;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
      background: var(--color-bg-surface);
      color: var(--color-text-primary);
      font-size: 0.85rem;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--color-primary);
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .group-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin: 0 0 10px;
    }

    .nav-item {
      display: block;
      font-size: 0.88rem;
      color: var(--color-text-secondary);
      padding: 6px 0;
      text-decoration: none;
      border-left: 2px solid var(--color-border);
      padding-left: 14px;
      margin-left: 2px;
      transition: all 0.2s;
    }

    .nav-item:hover {
      color: var(--color-text-primary);
      border-left-color: var(--color-text-secondary);
    }

    .nav-item.active {
      color: var(--color-primary);
      font-weight: 600;
      border-left-color: var(--color-primary);
    }

    /* Main Docs */
    .docs-main {
      min-width: 0;
    }

    /* TOC Right */
    .docs-toc {
      position: sticky;
      top: 104px;
      height: calc(100vh - 120px);
      display: none;
    }

    @media (min-width: 1280px) {
      .docs-layout:has(.docs-toc) {
        grid-template-columns: 240px minmax(0, 1fr) 220px;
      }
      .docs-toc { display: block; }
    }

    .toc-content {
      padding: 16px;
      border-radius: var(--radius-md);
    }

    .toc-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted);
      margin-bottom: 12px;
      display: block;
    }

    .toc-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc-link {
      display: block;
      font-size: 0.82rem;
      color: var(--color-text-secondary);
      padding: 4px 0;
      text-decoration: none;
      transition: color 0.2s;
    }

    .toc-link.indent { padding-left: 12px; }
    .toc-link:hover { color: var(--color-text-primary); }
    .toc-link.active {
      color: var(--color-primary);
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 1100px) {
      .docs-layout { gap: 28px; }
    }

    @media (max-width: 1024px) {
      .docs-layout {
        grid-template-columns: 200px minmax(0, 1fr);
      }
      .docs-toc { display: none; }
    }

    .mobile-docs-nav {
      display: none;
      margin-bottom: 28px;
      flex-direction: column;
      gap: 12px;
      padding: 14px 14px 16px;
      border-radius: var(--radius-lg);
    }

    .mobile-nav-head {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .mobile-label {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-text-secondary);
      letter-spacing: 0;
      text-transform: none;
    }

    .mobile-select-wrap {
      position: relative;
      display: block;
    }

    .mobile-select {
      width: 100%;
      appearance: none;
      -webkit-appearance: none;
      padding: 12px 40px 12px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
      color: var(--color-text-primary);
      font-size: 0.95rem;
      font-weight: 600;
      font-family: var(--font-sans);
      line-height: 1.3;
      cursor: pointer;
    }

    .mobile-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .mobile-select-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      pointer-events: none;
    }

    @media (max-width: 768px) {
      .docs-layout {
        display: block;
        padding-top: 20px;
        padding-bottom: 56px;
      }
      .docs-sidebar { display: none; }
      .mobile-docs-nav { display: flex; }
    }
  `]
})
export class DocsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContent', { static: false }) mainContentRef!: ElementRef;

  tocItems: TocItem[] = [];
  activeFragment: string | null = null;
  searchQuery = signal('');
  currentPath = signal('/docs/intro');

  /** Map detail routes to their parent section for the mobile select. */
  readonly mobileNavPath = computed(() => {
    const path = this.currentPath().split('#')[0];
    if (path.startsWith('/docs/inputs')) return '/docs/inputs';
    if (path.startsWith('/docs/outputs')) return '/docs/outputs';
    return path || '/docs/intro';
  });

  private observer: IntersectionObserver | null = null;
  private routerSubscription!: Subscription;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const nav = event as NavigationEnd;
      this.currentPath.set(nav.urlAfterRedirects.split('?')[0]);
      setTimeout(() => this.generateToc(), 150);
    });
    this.currentPath.set(this.router.url.split('?')[0]);
  }

  onMobileNav(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (value.startsWith('/compodoc')) {
      window.open(value, '_blank', 'noopener');
      return;
    }
    void this.router.navigateByUrl(value);
  }

  ngAfterViewInit() {
    this.generateToc();
  }

  ngOnDestroy() {
    if (this.routerSubscription) this.routerSubscription.unsubscribe();
    if (this.observer) this.observer.disconnect();
  }

  onActivate(event: any) {
    setTimeout(() => this.generateToc(), 100);
  }

  shouldShow(term: string): boolean {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return true;
    return term.toLowerCase().includes(q);
  }

  generateToc() {
    if (!isPlatformBrowser(this.platformId) || !this.mainContentRef) return;

    setTimeout(() => {
      const mainEl = this.mainContentRef.nativeElement;
      const headers = Array.from(mainEl.querySelectorAll('h2, h3')) as HTMLElement[];

      this.tocItems = [];
      if (this.observer) this.observer.disconnect();

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeFragment = entry.target.id;
            this.cdRef.detectChanges();
          }
        });
      }, { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 });

      headers.forEach((header: HTMLElement, index: number) => {
        if (!header.id) {
          const text = header.textContent || `section-${index}`;
          header.id = text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }

        this.tocItems.push({
          id: header.id,
          label: header.textContent || '',
          level: parseInt(header.tagName.substring(1))
        });

        this.observer?.observe(header);
      });

      this.cdRef.detectChanges();
    }, 50);
  }

  scrollTo(id: string, event: Event) {
    event.preventDefault();
    this.activeFragment = id;
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
