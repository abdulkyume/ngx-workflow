import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

@Component({
  selector: 'app-code-block',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <div class="code-toolbar">
        @if (label()) {
          <span class="code-label">{{ label() }}</span>
        } @else {
          <span class="code-label"></span>
        }
        <button
          type="button"
          class="copy-btn"
          [class.copied]="copied()"
          (click)="copy()"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy code'">
          @if (copied()) { Copied } @else { Copy }
        </button>
      </div>
      <pre><code>{{ code() }}</code></pre>
    </div>
  `,
  styles: [`
    :host { display: block; margin: 1.5em 0; max-width: 100%; }

    .code-block {
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .code-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-surface);
    }

    .code-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .copy-btn {
      background: var(--color-bg-surface-hover);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background var(--motion-fast) var(--ease-out),
        color var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out);
    }

    .copy-btn:hover {
      color: var(--color-text-primary);
      border-color: var(--color-border-hover);
    }

    .copy-btn.copied {
      background: var(--color-success);
      color: #042f2e;
      border-color: var(--color-success);
    }

    pre {
      margin: 0;
      padding: 1.1em 1.25em;
      overflow-x: auto;
      background: transparent;
      border: none;
      border-radius: 0;
      font-family: var(--font-mono);
      font-size: 0.9em;
      line-height: 1.6;
      color: var(--color-text-primary);
    }

    code {
      font-family: inherit;
      background: none;
      border: none;
      padding: 0;
      color: inherit;
    }

    @media (max-width: 560px) {
      .code-toolbar { padding: 8px 10px; }
      pre {
        padding: 0.9em 1em;
        font-size: 0.82em;
      }
    }
  `],
})
export class CodeBlockComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly code = input.required<string>();
  readonly label = input<string>('');

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
      // ignore clipboard failures
    }
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
