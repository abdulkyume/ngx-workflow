import { Component, ElementRef, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { isPlatformBrowser, CommonModule, ViewportScroller } from '@angular/common';
import { filter, Subscription } from 'rxjs';

interface TocItem {
  id: string;
  label: string;
  level: number; // 2 for h2, 3 for h3
}

@Component({
  selector: 'app-docs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
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

      <main class="docs-main" #mainContent>
        <router-outlet (activate)="onActivate($event)"></router-outlet>
      </main>
      
      <!-- Right Sidebar (TOC) -->
      <aside class="docs-toc" *ngIf="tocItems.length > 0">
        <div class="toc-content">
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
    .toc-list { list-style: none; padding: 0; margin: 0; position: relative; }
    .toc-link {
      display: block; font-size: 0.85rem; color: var(--color-text-secondary);
      padding: 4px 0; text-decoration: none; transition: color 0.2s;
    }
    .toc-link.indent { padding-left: 12px; }
    .toc-link:hover { color: var(--color-text-primary); }
    .toc-link.active { color: var(--color-accent); font-weight: 500; border-left: 2px solid var(--color-accent); padding-left: 10px; margin-left: -12px;}

    /* Responsive */
    @media (max-width: 768px) {
      .docs-layout { display: block; }
      .docs-sidebar { display: none; /* Mobile nav handles this usually */ }
      .docs-toc { display: none; }
    }
  `]
})
export class DocsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mainContent', { static: false }) mainContentRef!: ElementRef;

  tocItems: TocItem[] = [];
  activeFragment: string | null = null;
  private observer: IntersectionObserver | null = null;
  private routerSubscription!: Subscription;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdRef: ChangeDetectorRef,
    private viewportScroller: ViewportScroller
  ) { }

  ngOnInit() {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Small delay to let router component render
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
    // Component active, generate TOC after render
    setTimeout(() => this.generateToc(), 100);
  }

  generateToc() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Safety check if element ref is available
    if (!this.mainContentRef) return;

    // Use a small timeout to ensure DOM is updated from *ngIf etc
    setTimeout(() => {
      const mainEl = this.mainContentRef.nativeElement;
      // Select all h2 and h3
      const headers = Array.from(mainEl.querySelectorAll('h2, h3')) as HTMLElement[];

      this.tocItems = [];

      // Disconnect old observer
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.activeFragment = entry.target.id;
            this.cdRef.detectChanges();
          }
        });
      }, { rootMargin: '-100px 0px -60% 0px', threshold: 0.1 });

      headers.forEach((header: HTMLElement, index: number) => {
        // Ensure ID
        if (!header.id) {
          const text = header.textContent || `section-${index}`;
          // more robust slugify
          header.id = text.toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
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
      // Offset for sticky header if needed (approx 100px)
      const y = element.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
}
