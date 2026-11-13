// Button: the one action control of the system. The host element is the
// root, `button[dsButton]` or `a[dsButton]`, and the template renders the
// parts in the React order: start, label, end, result, spinner, status,
// result status.
//
//   <button dsButton tone="accent" emphasis="solid" end="arrow-forward">Create board</button>
//   <a dsButton href="#pricing" emphasis="link">See pricing</a>
//
// The twin of packages/react/src/components/Button/Button.tsx. `asChild` has
// no Angular form: the attribute selector already makes a link the button.
import { ChangeDetectionStrategy, Component, booleanAttribute, input, linkedSignal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';
import { DsButtonBase, isIconName, type ButtonEmphasis, type ButtonSlotContent } from './button-base';

/** The two endings an action can show. */
export type ButtonResult = 'success' | 'error';

/** The strokes of each result glyph, in a 24 unit box. Each draws from its start with stroke-dashoffset (pathLength 1). */
const resultStrokes: Record<ButtonResult, readonly string[]> = {
  success: ['M5 12.5 9.5 17 19 7'],
  error: ['M7 7 17 17', 'M17 7 7 17'],
};

@Component({
  selector: 'button[dsButton], a[dsButton]',
  exportAs: 'dsButton',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'button',
    '[attr.data-full-width]': 'fullWidth() ? "" : null',
    '[attr.data-wrap]': 'wrap() ? "" : null',
    '[attr.data-result]': 'result() ?? null',
  },
  template: `
    @if (start(); as content) {
      <span data-part="start">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    <span data-part="label"><ng-content /></span>
    @if (end(); as content) {
      <span data-part="end">
        @if (isIconName(content)) {
          <svg dsIcon [name]="content" size="md"></svg>
        } @else {
          <ng-container [ngTemplateOutlet]="content" />
        }
      </span>
    }
    @if (glyph(); as g) {
      <span data-part="result" aria-hidden="true">
        @for (k of [g]; track k) {
          <svg viewBox="0 0 24 24" focusable="false">
            @for (d of resultStrokes[k]; track d) {
              <path [attr.d]="d" pathLength="1" />
            }
          </svg>
        }
      </span>
    }
    @if (loading()) {
      <span data-part="spinner" aria-hidden="true"></span>
      <span data-part="status" role="status">{{ loadingLabel() }}</span>
    }
    @if (resultLabel() !== undefined) {
      <span data-part="status" role="status">{{ result() !== undefined && !loading() ? resultLabel() : '' }}</span>
    }
    @if (spinnerLeaving()) {
      <span data-part="spinner" aria-hidden="true"></span>
    }
  `,
})
export class DsButton extends DsButtonBase {
  /** How loud the button is. Default soft, or the emphasis of the ButtonGroup. tone accent with emphasis solid is the primary action. */
  readonly emphasis = input<ButtonEmphasis | undefined>(undefined);
  protected readonly defaultEmphasis: ButtonEmphasis = 'soft';
  /** Leading content before the label: an icon name or a template. */
  readonly start = input<ButtonSlotContent | undefined>(undefined);
  /** Trailing content after the label: an icon name or a template. */
  readonly end = input<ButtonSlotContent | undefined>(undefined);
  /** Fills the width of its container. */
  readonly fullWidth = input(false, { transform: booleanAttribute });
  /** Lets a long label wrap onto more lines. */
  readonly wrap = input(false, { transform: booleanAttribute });

  /**
   * The ending of an action (interaction button-result): while set, the
   * label rolls out and a check (success) or a cross (error) draws in its
   * place, and an error shakes the button once. Sets data-result. Clear it
   * to go back, for example after delay.feedback (2s). The width holds.
   * Default none.
   */
  readonly result = input<ButtonResult | undefined>(undefined);
  /**
   * What a visually hidden status says while result is set: "Saved",
   * "Could not save". While it is passed, an empty polite status sits in the
   * button, so the words are read when they arrive. Without it nothing is
   * announced.
   */
  readonly resultLabel = input<string | undefined>(undefined);

  /**
   * The last result shown. Its glyph stays (aria-hidden, at opacity 0) after
   * the result clears, so the way back can play; nothing renders before the
   * first result. As the shown state in React's Button (result ?? shown).
   * Read on every render, so it sees each result.
   */
  protected readonly glyph = linkedSignal<ButtonResult | undefined, ButtonResult | undefined>({
    source: () => this.result(),
    computation: (result, previous) => result ?? previous?.value,
  });
  protected readonly resultStrokes = resultStrokes;
  protected readonly isIconName = isIconName;

  constructor() {
    super();
    consumeHostAttributes(['start', 'end', 'fullWidth', 'wrap', 'result', 'resultLabel']);
  }
}
