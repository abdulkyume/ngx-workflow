import { Injectable, signal, computed, effect } from '@angular/core';

export type ColorMode = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
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
        // Listen for system theme changes
        if (typeof window !== 'undefined' && window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Modern browsers
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', (e) => {
                    // Trigger recomputation if in system mode
                    if (this.colorMode() === 'system') {
                        this.applyTheme(e.matches ? 'dark' : 'light');
                    }
                });
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
        console.log('[ThemeService] Setting color mode to:', mode);
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

        console.log('[ThemeService] Applying theme:', theme);
        console.log('[ThemeService] Setting data-theme attribute to:', theme);

        // Set data attribute for CSS targeting
        root.setAttribute('data-theme', theme);

        // Also set class for easier CSS targeting
        root.classList.remove('light-theme', 'dark-theme');
        root.classList.add(`${theme}-theme`);

        console.log('[ThemeService] Current classes:', root.className);
        console.log('[ThemeService] Current data-theme:', root.getAttribute('data-theme'));
    }
}
