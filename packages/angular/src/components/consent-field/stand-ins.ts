// Private stand ins for Checkbox and Switch, not exported.
//
// Angular batch A3 ports Checkbox and Switch on another branch, so they are
// not in this checkout. ConsentField renders one of them, and the Fieldset,
// Form and ConsentField demos show them in groups. These stand ins render
// the DOM of the React Checkbox and Switch (a root div, a Radix style button
// with role checkbox or switch, the indicator or the track and thumb, the
// label and the hidden form input Radix adds inside a form), so the shared
// Checkbox.css and Switch.css apply and the DOM diff is clean. They take only
// the inputs this batch needs. Swap them for dsCheckbox and dsSwitch when A3
// merges: the DOM stays the same.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { consumeHostAttributes } from '../../internal/host';

export type StandInSize = 'sm' | 'md' | 'lg';

let nextId = 0;

/** What both stand ins share: the button state, the label and the hidden input inside a form. */
@Directive()
abstract class StandInToggle {
  readonly size = input<StandInSize>('md');
  readonly label = input<string | undefined>(undefined);
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly name = input<string | undefined>(undefined);
  /** The value sent with the form while checked. Default "on", as Radix. */
  readonly value = input('on');
  readonly id = input<string | undefined>(undefined);
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  /** The root part name, as React's rootProps data-part. */
  readonly part = input<string | undefined>(undefined);
  /** The owner keeps the state: a click only emits, as a controlled Radix root. */
  readonly managed = input(false, { transform: booleanAttribute });
  /** Fires with the new state after a click, as onCheckedChange. */
  readonly checkedChangeByUser = output<boolean>();

  private readonly ownId = `ds-toggle-${++nextId}`;
  protected readonly controlId = computed(() => this.id() ?? this.ownId);
  protected readonly state = computed(() => (this.checked() ? 'checked' : 'unchecked'));
  protected readonly button = viewChild<ElementRef<HTMLButtonElement>>('button');
  /** Radix renders the hidden input only inside a form, sized like the button. */
  protected readonly inForm = signal(false);
  protected readonly bubbleStyle = signal('');
  protected readonly host: HTMLElement;
  private readonly bubble = viewChild<ElementRef<HTMLInputElement>>('bubble');

  constructor() {
    this.host = consumeHostAttributes([
      'size', 'label', 'checked', 'disabled', 'required', 'invalid', 'name', 'value', 'id',
      'aria-labelledby', 'aria-describedby', 'part', 'tone', 'managed',
    ]);
    let observer: ResizeObserver | undefined;
    afterNextRender(() => {
      this.inForm.set(this.host.closest('form') !== null);
      const button = this.button()?.nativeElement;
      if (!button) return;
      const measure = () =>
        this.bubbleStyle.set(
          `position: absolute; pointer-events: none; opacity: 0; margin: 0px; transform: translateX(-100%); width: ${button.offsetWidth}px; height: ${button.offsetHeight}px;`,
        );
      measure();
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(measure);
        observer.observe(button);
      }
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
    // Radix keeps the hidden input's checked property in step, with no
    // attribute, and dispatches a click on it after a change, so a form's
    // change handling sees the toggle.
    let seen: HTMLInputElement | undefined;
    effect(() => {
      const bubble = this.bubble()?.nativeElement;
      const checked = this.checked();
      if (!bubble) return;
      // The first sync is the starting state, not a change.
      const first = seen !== bubble;
      seen = bubble;
      if (bubble.checked === checked) return;
      bubble.checked = checked;
      if (!first) bubble.dispatchEvent(new Event('click', { bubbles: true }));
    });
  }

  protected toggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    if (!this.managed()) this.checked.set(next);
    this.checkedChangeByUser.emit(next);
  }

}

/** Marks the control button of a stand in (the Radix Checkbox or Switch root in React) and leaves no attribute behind. */
@Directive({ selector: 'button[dsStandInControl]' })
export class StandInControl {
  constructor() {
    consumeHostAttributes(['dsStandInControl']);
  }
}

const hostBindings = {
  '[attr.data-part]': 'part() ?? null',
  '[attr.data-size]': 'size()',
  '[attr.data-state]': 'state()',
  '[attr.data-invalid]': 'invalid() ? "" : null',
  '[attr.data-disabled]': 'disabled() ? "" : null',
};

const buttonAttributes = `
  type="button"
  [attr.aria-checked]="checked() ? 'true' : 'false'"
  [attr.aria-required]="required() ? 'true' : 'false'"
  [attr.aria-invalid]="invalid() ? 'true' : null"
  [attr.aria-labelledby]="ariaLabelledby() ?? null"
  [attr.aria-describedby]="ariaDescribedby() ?? null"
  [attr.data-state]="state()"
  [attr.data-disabled]="disabled() ? '' : null"
  [attr.disabled]="disabled() ? '' : null"
  [attr.value]="value()"
  [attr.id]="controlId()"
  data-part="control"
  (click)="toggle()"
`;

const tail = `
  @if (label() !== undefined) {
    <label [attr.for]="controlId()" data-part="label">{{ label() }}</label>
  }
  @if (inForm()) {
    <input #bubble type="checkbox" aria-hidden="true" tabindex="-1"
      [attr.name]="name() ?? null" [attr.value]="value()" [attr.required]="required() ? '' : null"
      [attr.disabled]="disabled() ? '' : null" [attr.style]="bubbleStyle()" />
  }
`;

/** Stand in for the A3 Checkbox: `<div dsStandInCheckbox label="Email"></div>`. */
@Component({
  selector: 'div[dsStandInCheckbox]',
  imports: [DsIcon, StandInControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-ds': 'checkbox', 'data-tone': 'neutral', ...hostBindings },
  template: `
    <button dsStandInControl #button role="checkbox" ${buttonAttributes}>
      <span data-part="indicator" [attr.data-state]="state()" [attr.data-disabled]="disabled() ? '' : null">
        @if (checked()) {
          <svg dsIcon name="check" [size]="size()"></svg>
        }
      </span>
    </button>
    ${tail}
  `,
})
export class StandInCheckbox extends StandInToggle {
  constructor() {
    super();
    consumeHostAttributes(['dsStandInCheckbox']);
  }
}

/** Stand in for the A3 Switch: `<div dsStandInSwitch label="Order updates"></div>`. */
@Component({
  selector: 'div[dsStandInSwitch]',
  imports: [StandInControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-ds': 'switch', 'data-tone': 'accent', ...hostBindings },
  template: `
    <button dsStandInControl #button role="switch" ${buttonAttributes}>
      <span data-part="track"><span data-part="thumb" [attr.data-state]="state()" [attr.data-disabled]="disabled() ? '' : null"></span></span>
    </button>
    ${tail}
  `,
})
export class StandInSwitch extends StandInToggle {
  constructor() {
    super();
    consumeHostAttributes(['dsStandInSwitch']);
  }
}
