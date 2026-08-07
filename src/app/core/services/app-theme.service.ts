import { Injectable, signal, computed, effect, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type AppColorMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'ngx-workflow-ui-theme';

/**
 * Demo-app theme facade. Kept separate from ngx-workflow ThemeService
 * so the marketing shell does not pull the library into the initial chunk.
 */
@Injectable({ providedIn: 'root' })
export class AppThemeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  private readonly colorModeSignal = signal<AppColorMode>(this.readInitialMode());
  readonly colorMode = this.colorModeSignal.asReadonly();

  readonly effectiveTheme = computed(() => {
    const mode = this.colorMode();
    if (mode === 'system') return this.getSystemTheme();
    return mode;
  });

  constructor() {
    if (isPlatformBrowser(this.platformId) && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => {
        if (this.colorMode() === 'system') {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      mediaQuery.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', onChange));
    }

    effect(() => {
      const theme = this.effectiveTheme();
      this.applyTheme(theme);
      this.persist(theme);
    });
  }

  setColorMode(mode: AppColorMode): void {
    this.colorModeSignal.set(mode);
  }

  toggle(): 'light' | 'dark' {
    const next = this.effectiveTheme() === 'dark' ? 'light' : 'dark';
    this.setColorMode(next);
    return next;
  }

  private readInitialMode(): AppColorMode {
    if (!isPlatformBrowser(this.platformId)) return 'dark';
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
      // ignore storage failures
    }
    return 'dark';
  }

  private persist(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      // Persist resolved theme so boot script and toggle stay in sync
      localStorage.setItem(THEME_STORAGE_KEY, this.colorMode() === 'system' ? 'system' : theme);
    } catch {
      // ignore storage failures
    }
  }

  private getSystemTheme(): 'light' | 'dark' {
    if (!isPlatformBrowser(this.platformId) || !window.matchMedia) return 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const root = this.document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('light-theme', 'dark-theme');
    root.classList.add(`${theme}-theme`);
    root.style.colorScheme = theme;
  }
}
