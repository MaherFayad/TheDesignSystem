// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. The icon swaps from copy to check (or to warning after a failure), a
// visually hidden status says the result once, and after the hold time the
// button returns to idle.
//
//   <button dsCopyButton [value]="command" label="Copy command"></button>
//   <button dsCopyButton [value]="command" iconOnly target="command-text"></button>
//
// The twin of packages/react/src/components/CopyButton/CopyButton.tsx.
// `onCopied` and `onCopyFailed` are the `copied` and `copyFailed` outputs.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import type { IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsButtonBase, type ButtonEmphasis } from '../button/button-base';
import { copyToClipboard, readTimeToken, selectTextOf } from './copy';

export type CopyButtonState = 'idle' | 'copied' | 'failed';

/** The default words by language. Arabic: noun forms, no diacritics. */
export const copyButtonLabels = {
  en: { label: 'Copy', copied: 'Copied', failed: 'Could not copy' },
  ar: { label: 'نسخ', copied: 'تم النسخ', failed: 'تعذر النسخ' },
} as const;

/** How long the result shows. Hover intent timing, kept under reduced motion. Token gap: delay.peek-hide is the nearest. */
const HOLD_TOKEN = '--ds-delay-peek-hide';

const icons: Record<CopyButtonState, IconName> = { idle: 'copy', copied: 'check', failed: 'warning' };

@Component({
  selector: 'button[dsCopyButton]',
  exportAs: 'dsCopyButton',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'copy-button',
    '[attr.data-state]': 'state()',
    '[attr.aria-label]': 'iconOnly() ? name() : null',
    '(click)': 'copy($event)',
  },
  template: `
    <span data-part="icon"><svg dsIcon [name]="icon()" size="md"></svg></span>
    @if (!iconOnly()) {
      <span data-part="label">{{ name() }}</span>
    }
    <span data-part="status" role="status">{{ status() }}</span>
  `,
})
export class DsCopyButton extends DsButtonBase {
  /** The text to copy. */
  readonly value = input.required<string>();
  /** The name of the action: visible text, or the accessible name with iconOnly. Default "Copy" ("نسخ" under an Arabic dsTheme). */
  readonly label = input<string | undefined>(undefined);
  /** Shows only the icon; label becomes the accessible name. Default false. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** What the status says after a copy. Default "Copied" ("تم النسخ"). */
  readonly copiedLabel = input<string | undefined>(undefined);
  /** What the status says after a failure. Default "Could not copy" ("تعذر النسخ"). */
  readonly failedLabel = input<string | undefined>(undefined);
  /** The id of the element that shows the value. A failed copy selects its text. */
  readonly target = input<string | undefined>(undefined);
  /** Default ghost, or the emphasis of the ButtonGroup. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  /** Emits the value after it reached the clipboard. */
  readonly copied = output<string>();
  /** Emits the value after the copy failed. */
  readonly copyFailed = output<string>();

  protected readonly defaultEmphasis: ButtonEmphasis = 'ghost';
  readonly state = signal<CopyButtonState>('idle');
  private readonly theme = inject(DsThemeService);
  private readonly words = computed(() => (this.theme.value().lang.startsWith('ar') ? copyButtonLabels.ar : copyButtonLabels.en));
  protected readonly name = computed(() => this.label() ?? this.words().label);
  protected readonly icon = computed(() => icons[this.state()]);
  protected readonly status = computed(() => {
    const s = this.state();
    if (s === 'copied') return this.copiedLabel() ?? this.words().copied;
    if (s === 'failed') return this.failedLabel() ?? this.words().failed;
    return '';
  });
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  constructor() {
    super();
    consumeHostAttributes(['dsCopyButton', 'value', 'label', 'iconOnly', 'copiedLabel', 'failedLabel', 'target']);
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.timer);
    });
  }

  protected override isIconOnly(): boolean {
    return this.iconOnly();
  }

  /** Runs in the click: the clipboard needs the user activation. A caller's (click) may cancel it with preventDefault. */
  protected async copy(event: Event): Promise<void> {
    // Let a (click) of the caller on the same element run first, as React calls onClick first.
    await Promise.resolve();
    if (event.defaultPrevented) return;
    const value = this.value();
    const ok = await copyToClipboard(value);
    if (this.destroyed) return;
    if (ok) this.copied.emit(value);
    else {
      selectTextOf(this.target());
      this.copyFailed.emit(value);
    }
    this.state.set(ok ? 'copied' : 'failed');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), readTimeToken(this.host, HOLD_TOKEN));
  }
}
