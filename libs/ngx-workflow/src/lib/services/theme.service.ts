import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';

export type ColorMode = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly destroyRef = inject(DestroyRef);
    private colorModeSignal = signal<ColorMode>('light');
    readonly colorMode = this.colorModeSignal.asReadonly();

    /** Host elements that should receive scoped theme attributes (never document root). */
    private readonly hosts = new Set<HTMLElement>();

    // Computed: actual theme being used (resolves 'system' to 'light' or 'dark')
    readonly effectiveTheme = computed(() => {
        const mode = this.colorMode();
        if (mode === 'system') {
            return this.getSystemTheme();
        }
        return mode;
    });

    constructor() {
        // Listen for system theme changes and remove the listener on destroy
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const onChange = (e: MediaQueryListEvent) => {
                if (this.colorMode() === 'system') {
                    this.applyThemeToHosts(e.matches ? 'dark' : 'light');
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', onChange);
                this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', onChange));
            }
        }

        // Keep registered hosts in sync with the effective theme
        effect(() => {
            this.applyThemeToHosts(this.effectiveTheme());
        });
    }

    /**
     * Set the color mode.
     * @param mode - 'light', 'dark', or 'system'
     */
    setColorMode(mode: ColorMode): void {
        this.colorModeSignal.set(mode);
    }

    /**
     * Scope theme attributes to a diagram host. Does not mutate document.documentElement,
     * so embedding the library cannot override a host application's page theme.
     */
    registerHost(host: HTMLElement): void {
        this.hosts.add(host);
        this.applyThemeToElement(host, this.effectiveTheme());
    }

    unregisterHost(host: HTMLElement): void {
        this.hosts.delete(host);
        host.removeAttribute('data-theme');
        host.classList.remove('light-theme', 'dark-theme');
    }

    /**
     * Get the system's preferred color scheme.
     * @returns 'light' or 'dark'
     */
    private getSystemTheme(): 'light' | 'dark' {
        if (typeof window === 'undefined' || !window.matchMedia) {
            return 'light';
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
    }

    private applyThemeToHosts(theme: 'light' | 'dark'): void {
        this.hosts.forEach((host) => this.applyThemeToElement(host, theme));
    }

    private applyThemeToElement(el: HTMLElement, theme: 'light' | 'dark'): void {
        el.setAttribute('data-theme', theme);
        el.classList.remove('light-theme', 'dark-theme');
        el.classList.add(`${theme}-theme`);
    }
}
