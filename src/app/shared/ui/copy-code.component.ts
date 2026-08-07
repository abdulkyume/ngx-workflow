import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-copy-code',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="copy-code">
      <code>{{ code() }}</code>
      <button
        type="button"
        class="copy-btn"
        [class.copied]="copied()"
        (click)="copy()"
        [attr.aria-label]="copied() ? 'Copied' : 'Copy ' + code()">
        @if (copied()) { Copied } @else { Copy }
      </button>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; max-width: 100%; vertical-align: middle; }

    .copy-code {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      max-width: 100%;
      min-height: 32px;
      padding: 2px 2px 2px 8px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }

    code {
      font-family: var(--font-mono);
      font-size: 0.84em;
      color: var(--color-primary);
      background: none;
      border: none;
      padding: 0;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }

    .copy-btn {
      flex-shrink: 0;
      background: var(--color-bg-surface-hover);
      border: 1px solid transparent;
      color: var(--color-text-secondary);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--motion-fast) var(--ease-out),
        color var(--motion-fast) var(--ease-out);
    }

    .copy-btn:hover {
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .copy-btn.copied {
      background: var(--color-success);
      color: #042f2e;
    }
  `],
})
export class CopyCodeComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly code = input.required<string>();
  readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
    } catch {
      // ignore
    }
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1600);
  }
}
