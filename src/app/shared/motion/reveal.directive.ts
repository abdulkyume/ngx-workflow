import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  PLATFORM_ID,
  DestroyRef,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Adds .reveal / .is-visible classes when the host enters the viewport.
 * Respects prefers-reduced-motion by revealing immediately.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit {
  readonly appReveal = input<string | ''>('');
  readonly revealDelay = input(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const node = this.el.nativeElement;
    node.classList.add('reveal');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-visible');
      return;
    }

    if (this.revealDelay() > 0) {
      node.style.transitionDelay = `${this.revealDelay()}ms`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add('is-visible');
            observer.unobserve(node);
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
