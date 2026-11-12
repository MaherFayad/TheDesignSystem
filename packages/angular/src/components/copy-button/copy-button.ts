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
//
// The result morph (interaction copy-swap, primitive buttonMorph): when the
// icon changes, the old icon stays for one morph in an unnamed aria-hidden
// span after the new one, inside the icon part. The span rests at opacity 0
// (Button.css) and goes when its exit settles. The clipboard write, the
// state and the status are never held back by it. With no Web Animations
// API, or a style that turns the morph off, no span is added.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import type { IconName } from '@the-system/icons';
import { buttonMorph, settled, type MorphParts, type MorphState } from '@the-system/motion';
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

/** How long the result shows (delay.feedback, 2s). Timing, not motion, so it is kept under reduced motion. */
const HOLD_TOKEN = '--ds-delay-feedback';

const icons: Record<CopyButtonState, IconName> = { idle: 'copy', copied: 'check', failed: 'warning' };

/** The icon that leaves during a morph, and the states the morph goes between. */
interface Leaving {
  id: number;
  icon: IconName;
  from: CopyButtonState;
  to: CopyButtonState;
}

/** The morph state of each copy state. */
const morphStates: Record<CopyButtonState, MorphState> = { idle: 'idle', copied: 'success', failed: 'error' };
/** The morph part that shows in each copy state. */
const morphSlots: Record<CopyButtonState, 'label' | 'success' | 'error'> = { idle: 'label', copied: 'success', failed: 'error' };

@Component({
  selector: 'button[dsCopyButton]',
  exportAs: 'dsCopyButton',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'copy-button',
    '[attr.data-state]': 'state()',
    '[attr.aria-label]': 'iconOnly() ? name() : null',
  },
  template: `
    <span data-part="icon">
      <svg dsIcon [name]="icon()" size="md"></svg>
      @for (l of leavingList(); track l.id) {
        <span aria-hidden="true"><svg dsIcon [name]="l.icon" size="md"></svg></span>
      }
    </span>
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
  /** The old icon of the running morph, or none. */
  private readonly leaving = signal<Leaving | null>(null);
  /** The leaving icon as a list, so each swap renders a new span, as React's key. */
  protected readonly leavingList = computed(() => {
    const l = this.leaving();
    return l ? [l] : [];
  });
  private swaps = 0;
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
    // Plays the morph on the rendered icons: the new icon is the first child
    // of the icon part, the leaving copy the last.
    afterRenderEffect({
      write: () => {
        const leaving = this.leaving();
        const part = this.host.querySelector(':scope > [data-part="icon"]');
        if (!leaving || !part) return;
        const incoming = part.firstElementChild;
        const outgoing = part.lastElementChild;
        const parts: MorphParts = { root: this.host };
        if (outgoing && outgoing !== incoming) parts[morphSlots[leaving.from]] = outgoing;
        if (incoming) parts[morphSlots[leaving.to]] = incoming;
        const mode = untracked(() => this.motion.mode('copy-swap'));
        const played = buttonMorph(parts, morphStates[leaving.from], morphStates[leaving.to], { mode });
        const exit = played.find((a) => (a.effect as KeyframeEffect | null)?.target === outgoing) ?? null;
        void settled(exit).then(() => {
          if (!this.destroyed) this.leaving.update((l) => (l?.id === leaving.id ? null : l));
        });
      },
    });
  }

  /** Sets the state at once and, when the icon changes and motion can play, keeps the old icon for the swap. */
  private change(next: CopyButtonState): void {
    const prev = this.state();
    if (icons[prev] !== icons[next] && typeof this.host.animate === 'function' && this.motion.mode('copy-swap') !== 'none') {
      this.swaps += 1;
      this.leaving.set({ id: this.swaps, icon: icons[prev], from: prev, to: next });
    }
    this.state.set(next);
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
    this.change(ok ? 'copied' : 'failed');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.change('idle'), readTimeToken(this.host, HOLD_TOKEN));
  }
}
