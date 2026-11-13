// CopyButton: copies a value to the clipboard and confirms it. On the Button
// base. A visually hidden status says the result once, and after the hold
// time (delay.feedback) the button returns to idle.
//
//   <button dsCopyButton [value]="command" label="Copy command"></button>
//   <button dsCopyButton [value]="command" iconOnly target="command-text"></button>
//
// The twin of packages/react/src/components/CopyButton/CopyButton.tsx.
// `onCopied` and `onCopyFailed` are the `copied` and `copyFailed` outputs.
//
// The confirmation (interaction copy-swap) is CSS in CopyButton.css, driven
// by data-state. Every glyph and every word is in the DOM from the first
// paint, so nothing mounts or waits:
//
//   - The icon part holds the copy, check and warning glyphs stacked in one
//     grid cell.
//   - The label part holds the three words stacked in one grid cell, so the
//     width never moves. The others are aria-hidden, and the button's
//     aria-label is the idle word, so the accessible name never changes.
//   - The icon only form shows a small aria-hidden bubble with the result
//     word (interaction copy-bubble).
//   - The status (role status, polite) gets the result word once per copy:
//     each copy renders a new text node, so a second copy is heard again,
//     and going back to idle empties it.
//
// A second copy while the result shows restarts the hold time, renders the
// check and the bubble again (so their animations replay) and never leaves a
// stuck state.
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
import { listenAfterCallers } from '../../internal/late-listener';
import { DsThemeService } from '../../theme/theme';
import { DsButtonBase, type ButtonEmphasis } from '../button/button-base';
import { copyToClipboard, readTimeToken, selectTextOf } from './copy';

export type CopyButtonState = 'idle' | 'copied' | 'failed';

/** The default words by language. Arabic: noun forms, no diacritics. */
export const copyButtonLabels = {
  en: { label: 'Copy', copied: 'Copied', failed: 'Could not copy' },
  ar: { label: 'نسخ', copied: 'تم النسخ', failed: 'تعذر النسخ' },
} as const;

/**
 * How long the result shows before the button returns to idle
 * (delay.feedback, 2s). Timing, not motion, so it is kept under reduced
 * motion.
 */
const HOLD_TOKEN = '--ds-delay-feedback';

/** The glyph of each state, in the order they stack. */
const icons: Record<CopyButtonState, IconName> = { idle: 'copy', copied: 'check', failed: 'warning' };
const STATES: readonly CopyButtonState[] = ['idle', 'copied', 'failed'];

@Component({
  selector: 'button[dsCopyButton]',
  exportAs: 'dsCopyButton',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'copy-button',
    '[attr.data-state]': 'state()',
    '[attr.aria-label]': 'words().idle',
  },
  template: `
    <span data-part="icon">
      @for (g of glyphs(); track g.key) {
        <span [attr.data-copy-glyph]="g.state"><svg dsIcon [name]="g.icon" size="md"></svg></span>
      }
    </span>
    @if (!iconOnly()) {
      <span data-part="label">
        @for (s of states; track s) {
          <span
            [attr.data-copy-label]="s"
            [attr.data-roll]="rolls(s) ? '' : null"
            [attr.aria-hidden]="s === 'idle' ? null : 'true'"
            >{{ words()[s] }}</span
          >
        }
      </span>
    } @else {
      @for (c of [count()]; track c) {
        <span data-part="bubble" aria-hidden="true">{{ words()[last()] }}</span>
      }
    }
    <span data-part="status" role="status">
      @if (status()) {
        @for (c of [count()]; track c) {
          <span>{{ status() }}</span>
        }
      }
    </span>
  `,
})
export class DsCopyButton extends DsButtonBase {
  /** The text to copy. */
  readonly value = input.required<string>();
  /** The name of the action: visible text, or the accessible name with iconOnly. Default "Copy" ("نسخ" under an Arabic dsTheme). */
  readonly label = input<string | undefined>(undefined);
  /** Shows only the icon; label becomes the accessible name. Default false. */
  readonly iconOnly = input(false, { transform: booleanAttribute });
  /** What the label rolls to and the status says after a copy. Default "Copied" ("تم النسخ"). */
  readonly copiedLabel = input<string | undefined>(undefined);
  /** What the label rolls to and the status says after a failure. Default "Could not copy" ("تعذر النسخ"). */
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
  protected readonly states = STATES;
  readonly state = signal<CopyButtonState>('idle');
  /**
   * Counts the results. It keys the check, the bubble and the status text,
   * so a second copy renders them again; 0 means nothing has happened yet,
   * so the idle word does not roll in on the first paint.
   */
  protected readonly count = signal(0);
  /** The last result, so the bubble keeps its word while it fades out. */
  protected readonly last = signal<Exclude<CopyButtonState, 'idle'>>('copied');
  private readonly theme = inject(DsThemeService);
  private readonly defaults = computed(() => (this.theme.value().lang.startsWith('ar') ? copyButtonLabels.ar : copyButtonLabels.en));
  protected readonly words = computed<Record<CopyButtonState, string>>(() => ({
    idle: this.label() ?? this.defaults().label,
    copied: this.copiedLabel() ?? this.defaults().copied,
    failed: this.failedLabel() ?? this.defaults().failed,
  }));
  /** The glyphs in stack order. The check and the warning are keyed by the count, as React's key. */
  protected readonly glyphs = computed(() => {
    const n = this.count();
    return STATES.map((s) => ({ state: s, icon: icons[s], key: s === 'idle' ? s : `${s}-${n}` }));
  });
  protected readonly status = computed(() => {
    const s = this.state();
    return s === 'idle' ? '' : this.words()[s];
  });
  private timer: ReturnType<typeof setTimeout> | undefined;
  private destroyed = false;

  constructor() {
    super();
    consumeHostAttributes(['dsCopyButton', 'value', 'label', 'iconOnly', 'copiedLabel', 'failedLabel', 'target']);
    listenAfterCallers(this.host, 'click', (event) => void this.copy(event));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.timer);
    });
  }

  /** The word that shows now rolls in, except the idle word on the first paint. */
  protected rolls(s: CopyButtonState): boolean {
    return s === this.state() && (s !== 'idle' || this.count() > 0);
  }

  protected override isIconOnly(): boolean {
    return this.iconOnly();
  }

  /**
   * Runs in the click, after the caller's (click), as React calls onClick
   * first: a caller may cancel it with preventDefault. The clipboard write
   * starts synchronously, inside the user activation.
   */
  protected async copy(event: Event): Promise<void> {
    if (event.defaultPrevented) return;
    const value = this.value();
    const ok = await copyToClipboard(value);
    if (this.destroyed) return;
    if (ok) this.copied.emit(value);
    else {
      selectTextOf(this.target());
      this.copyFailed.emit(value);
    }
    const next = ok ? 'copied' : 'failed';
    this.state.set(next);
    this.last.set(next);
    this.count.update((n) => n + 1);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.state.set('idle'), readTimeToken(this.host, HOLD_TOKEN));
  }
}
