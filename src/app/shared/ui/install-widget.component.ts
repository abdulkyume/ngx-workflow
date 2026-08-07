import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

@Component({
  selector: 'app-install-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="install-widget" role="group" aria-label="Install command">
      <div class="pkg-tabs" role="tablist" aria-label="Package manager">
        @for (mgr of managers; track mgr) {
          <button
            type="button"
            role="tab"
            class="pkg-tab"
            [class.active]="pkgManager() === mgr"
            [attr.aria-selected]="pkgManager() === mgr"
            (click)="pkgManager.set(mgr)">
            {{ mgr }}
          </button>
        }
      </div>
      <div class="install-cmd">
        <code class="cmd-text">{{ command() }}</code>
        <button
          type="button"
          class="copy-btn"
          [class.copied]="copied()"
          (click)="copy()"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy install command'">
          @if (copied()) { Copied } @else { Copy }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .install-widget {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
      text-align: left;
    }
    .pkg-tabs {
      display: flex;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-elevated);
    }
    .pkg-tab {
      flex: 1;
      padding: 6px 10px;
      font-size: 0.75rem;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--color-text-muted);
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      transition: color var(--motion-fast) var(--ease-out),
        border-color var(--motion-fast) var(--ease-out);
    }
    .pkg-tab.active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }
    .install-cmd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 14px;
    }
    .cmd-text {
      font-family: var(--font-mono);
      font-size: 0.88rem;
      color: var(--color-text-primary);
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
    .copy-btn.copied {
      background: var(--color-success);
      color: #042f2e;
      border-color: var(--color-success);
    }
  `],
})
export class InstallWidgetComponent {
  private readonly destroyRef = inject(DestroyRef);
  readonly managers = ['npm', 'pnpm', 'yarn'] as const;
  readonly pkgManager = signal<'npm' | 'pnpm' | 'yarn'>('npm');
  readonly copied = signal(false);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  command(): string {
    switch (this.pkgManager()) {
      case 'pnpm': return 'pnpm add ngx-workflow';
      case 'yarn': return 'yarn add ngx-workflow';
      default: return 'npm install ngx-workflow';
    }
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.command());
    } catch {
      // ignore clipboard failures
    }
    this.copied.set(true);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 1800);
  }
}
