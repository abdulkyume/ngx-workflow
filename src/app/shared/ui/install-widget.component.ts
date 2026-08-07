import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, signal } from '@angular/core';

type PkgManager = 'npm' | 'pnpm' | 'yarn';

interface InstallRow {
  id: PkgManager;
  label: string;
  command: string;
}

@Component({
  selector: 'app-install-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'stacked') {
      <div class="install-stack" role="list" aria-label="Install commands">
        @for (row of rows; track row.id) {
          <div class="install-row" role="listitem">
            <div class="row-meta">
              <span class="row-label">{{ row.label }}</span>
              <code class="cmd-text">{{ row.command }}</code>
            </div>
            <button
              type="button"
              class="copy-btn"
              [class.copied]="copiedId() === row.id"
              (click)="copy(row)"
              [attr.aria-label]="copiedId() === row.id ? 'Copied ' + row.label : 'Copy ' + row.label + ' command'">
              @if (copiedId() === row.id) { Copied } @else { Copy }
            </button>
          </div>
        }
      </div>
    } @else {
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
            [class.copied]="copiedId() === pkgManager()"
            (click)="copyCurrent()"
            [attr.aria-label]="copiedId() === pkgManager() ? 'Copied' : 'Copy install command'">
            @if (copiedId() === pkgManager()) { Copied } @else { Copy }
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: min(100%, 420px);
    }

    .install-widget {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
      min-width: 0;
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
      padding: 8px 10px;
      font-size: 0.78rem;
      font-weight: 600;
      font-family: var(--font-sans);
      color: var(--color-text-secondary);
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
      min-width: 0;
    }

    .install-cmd .cmd-text {
      min-width: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .install-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 1.25em 0;
    }

    .install-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 12px 14px;
      background: var(--color-bg-elevated);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }

    .row-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .row-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--color-text-muted);
    }

    .cmd-text {
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--color-text-primary);
      word-break: break-all;
    }

    .copy-btn {
      flex-shrink: 0;
      background: var(--color-bg-surface-hover);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      padding: 6px 12px;
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

    @media (max-width: 560px) {
      .install-row {
        flex-direction: column;
        align-items: stretch;
      }
      .copy-btn { align-self: flex-end; }

      .install-cmd {
        flex-wrap: wrap;
      }

      .install-cmd .cmd-text {
        white-space: normal;
        word-break: break-all;
      }
    }
  `],
})
export class InstallWidgetComponent {
  private readonly destroyRef = inject(DestroyRef);

  /** `tabs` for hero; `stacked` for docs with a copy button per manager. */
  readonly variant = input<'tabs' | 'stacked'>('tabs');

  readonly managers = ['npm', 'pnpm', 'yarn'] as const;
  readonly rows: InstallRow[] = [
    { id: 'npm', label: 'npm', command: 'npm install ngx-workflow' },
    { id: 'pnpm', label: 'pnpm', command: 'pnpm add ngx-workflow' },
    { id: 'yarn', label: 'yarn', command: 'yarn add ngx-workflow' },
  ];

  readonly pkgManager = signal<PkgManager>('npm');
  readonly copiedId = signal<PkgManager | null>(null);
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  command(): string {
    return this.rows.find((r) => r.id === this.pkgManager())?.command ?? this.rows[0].command;
  }

  copyCurrent(): void {
    void this.copy({ id: this.pkgManager(), label: this.pkgManager(), command: this.command() });
  }

  async copy(row: InstallRow): Promise<void> {
    try {
      await navigator.clipboard.writeText(row.command);
    } catch {
      // ignore clipboard failures
    }
    this.copiedId.set(row.id);
    if (this.copyTimer) clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copiedId.set(null), 1800);
  }
}
