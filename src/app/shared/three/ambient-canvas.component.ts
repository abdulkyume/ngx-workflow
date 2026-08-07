import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  PLATFORM_ID,
  ViewChild,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type { AmbientSceneHandle } from './ambient-scene';

@Component({
  selector: 'app-ambient-canvas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ambient-fallback" aria-hidden="true"></div>
    <div #host class="ambient-host" aria-hidden="true"></div>
  `,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .ambient-host {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .ambient-fallback {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(1.5px 1.5px at 12% 18%, color-mix(in srgb, var(--color-primary) 70%, transparent), transparent),
        radial-gradient(1.5px 1.5px at 28% 72%, color-mix(in srgb, var(--color-accent) 55%, transparent), transparent),
        radial-gradient(1.2px 1.2px at 44% 32%, color-mix(in srgb, var(--color-primary) 60%, transparent), transparent),
        radial-gradient(1.8px 1.8px at 62% 58%, color-mix(in srgb, var(--color-accent) 50%, transparent), transparent),
        radial-gradient(1.2px 1.2px at 78% 22%, color-mix(in srgb, var(--color-primary) 65%, transparent), transparent),
        radial-gradient(1.4px 1.4px at 88% 76%, color-mix(in srgb, var(--color-accent) 45%, transparent), transparent),
        radial-gradient(40% 35% at 70% 20%, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent),
        radial-gradient(35% 30% at 20% 60%, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent);
      opacity: 0.9;
    }
  `],
})
export class AmbientCanvasComponent implements AfterViewInit {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  readonly enabled = input(true);

  private readonly destroyRef = inject(DestroyRef);
  private handle: AmbientSceneHandle | null = null;
  private pointerHandler: ((e: PointerEvent) => void) | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    afterNextRender(() => void this.mount());
  }

  ngAfterViewInit(): void {
    // mount deferred to afterNextRender for SSR safety
  }

  private async mount(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.enabled()) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const shouldSimplify = reducedMotion || coarse;

    try {
      const { createAmbientScene } = await import('./ambient-scene');
      this.handle = createAmbientScene({
        host: this.hostRef.nativeElement,
        reducedMotion: shouldSimplify,
        particleCount: shouldSimplify ? 140 : 320,
      });

      if (!this.handle) return;

      if (!shouldSimplify) {
        this.pointerHandler = (e: PointerEvent) => {
          const w = window.innerWidth || 1;
          const h = window.innerHeight || 1;
          this.handle?.setPointer((e.clientX / w) * 2 - 1, (e.clientY / h) * 2 - 1);
        };
        window.addEventListener('pointermove', this.pointerHandler, { passive: true });
      }

      this.destroyRef.onDestroy(() => {
        if (this.pointerHandler) {
          window.removeEventListener('pointermove', this.pointerHandler);
          this.pointerHandler = null;
        }
        this.handle?.dispose();
        this.handle = null;
      });
    } catch {
      // WebGL unavailable — CSS fallback remains visible
    }
  }
}
