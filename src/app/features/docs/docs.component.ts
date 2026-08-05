import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { isPlatformBrowser, CommonModule, ViewportScroller } from '@angular/common';
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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule],
  template: `
    <div class="docs-layout container">
      <!-- Left Sidebar Navigation -->
      <aside class="docs-sidebar">
        <div class="sidebar-search">
          <input 
            type="text" 
            placeholder="Filter documentation..." 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            class="search-input"/>
        </div>

        <div class="sidebar-content">
          @if (shouldShow('getting started') || shouldShow('intro')) {
            <div class="nav-group">
              <h4 class="group-title">Getting Started</h4>
              <a routerLink="/docs/intro" routerLinkActive="active" class="nav-item">Introduction & Setup</a>
            </div>
          }

          @if (shouldShow('concepts') || shouldShow('api') || shouldShow('customization')) {
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

      <!-- Main Docs Content Area -->
      <main class="docs-main" #mainContent>
        <router-outlet (activate)="onActivate($event)"></router-outlet>
      </main>
      
      <!-- Right Sidebar (On This Page TOC) -->
      <aside class="docs-toc" *ngIf="tocItems.length > 0">
        <div class="toc-content glass-panel">
          <span class="toc-title">On this page</span>
          <ul class="toc-list">
            <li *ngFor="let item of tocItems">
              <a 
                href="javascript:void(0)" 
                class="toc-link"
                [class.active]="activeFragment === item.id"
                [class.indent]="item.level === 3"
                (click)="scrollTo(item.id, $event)">
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .docs-layout {
      display: grid;
      grid-template-columns: 240px 1fr 220px;
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
    @media (max-width: 1024px) {
      .docs-layout {
        grid-template-columns: 200px 1fr;
      }
      .docs-toc { display: none; }
    }

    @media (max-width: 768px) {
      .docs-layout { display: block; }
      .docs-sidebar { display: none; }
    }
  `]
})
export class DocsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContent', { static: false }) mainContentRef!: ElementRef;

  tocItems: TocItem[] = [];
  activeFragment: string | null = null;
  searchQuery = signal('');

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
    ).subscribe(() => {
      setTimeout(() => this.generateToc(), 150);
    });
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
