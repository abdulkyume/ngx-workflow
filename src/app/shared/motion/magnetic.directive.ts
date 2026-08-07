import {
  Directive,
  ElementRef,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Subtle magnetic hover using GSAP (dynamic import).
 * No-ops under reduced motion / coarse pointers / failed load.
 */
@Directive({
  selector: '[appMagnetic]',
  standalone: true,
})
export class MagneticDirective {
  readonly strength = input(12);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    afterNextRender(() => void this.setup());
  }

  private async setup(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const node = this.el.nativeElement;
    let gsap: typeof import('gsap').gsap | null = null;

    try {
      const mod = await import('gsap');
      gsap = mod.gsap;
    } catch {
      return;
    }

    const strength = this.strength();
    const onMove = (e: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      gsap?.to(node, {
        x: (x / rect.width) * strength,
        y: (y / rect.height) * strength,
        duration: 0.35,
        ease: 'power3.out',
      });
    };

    const onLeave = () => {
      gsap?.to(node, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.45)' });
    };

    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);

    this.destroyRef.onDestroy(() => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
      gsap?.killTweensOf(node);
      gsap?.set(node, { clearProps: 'transform' });
    });
  }
}
