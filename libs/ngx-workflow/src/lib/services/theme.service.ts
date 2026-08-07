import { Injectable, signal, computed, effect, DestroyRef, inject } from '@angular/core';

export type ColorMode = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly destroyRef = inject(DestroyRef);
    private colorModeSignal = signal<ColorMode>('light');
    readonly colorMode = this.colorModeSignal.asReadonly();

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
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', onChange);
                this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', onChange));
            }
        }

        // Apply initial theme
        effect(() => {
            const theme = this.effectiveTheme();
            this.applyTheme(theme);
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

    /**
     * Apply the theme to the document.
     * @param theme - 'light' or 'dark'
     */
    private applyTheme(theme: 'light' | 'dark'): void {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;

        // Set data attribute for CSS targeting
        root.setAttribute('data-theme', theme);

        // Also set class for easier CSS targeting
        root.classList.remove('light-theme', 'dark-theme');
        root.classList.add(`${theme}-theme`);
    }
}
