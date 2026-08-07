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
  template: `<div #host class="ambient-host" aria-hidden="true"></div>`,
  styles: [`
    :host {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .ambient-host {
      width: 100%;
      height: 100%;
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
    afterNextRender(() => this.mount());
  }

  ngAfterViewInit(): void {
    // mount deferred to afterNextRender for SSR safety
  }

  private async mount(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !this.enabled()) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const lowMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const shouldSimplify = reducedMotion || coarse || (typeof lowMem === 'number' && lowMem <= 4);

    try {
      const { createAmbientScene } = await import('./ambient-scene');
      this.handle = createAmbientScene({
        host: this.hostRef.nativeElement,
        reducedMotion: shouldSimplify,
        particleCount: shouldSimplify ? 70 : 220,
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
      // WebGL unavailable — silently degrade
    }
  }
}
