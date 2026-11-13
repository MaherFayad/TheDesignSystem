// RadioCard: a radio choice drawn as a card with a title, text, an optional
// icon and optional end content (plans, shipping options). The twin of
// packages/react/src/components/RadioCard/RadioCard.tsx.
//
//   <p data-demo="label" id="plan-heading">Plan</p>
//   <div dsRadioCard aria-labelledby="plan-heading" [(value)]="plan">
//     <button dsRadioCardItem value="free" title="Free" description="Up to 3 boards." end="$0"></button>
//     <button dsRadioCardItem value="team" title="Team" icon="user" end="$12"></button>
//   </div>
//
// The group host is the root, the element with role radiogroup, as the
// Radix root is in React. Each item host is the card itself, a button with
// role radio (the Radix item), so the whole card is the target. Its name is
// the title and its description is the text and the end content.
//
// Behavior: hand built with the Radix DOM in behavior/roving-radio.ts, as
// RadioGroup: one tab stop, arrows that move and select in the reading
// direction (CDK Directionality), all four arrows, Space selects, Enter does
// nothing. The key moves run on the CDK FocusKeyManager. Angular Aria has no
// radio group pattern to replace it with. Inside a form, Radix renders a
// hidden native radio right after each card; the host is the card, so this
// item inserts that input after its host itself.
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. title and description take text; icon takes an icon name
// or a TemplateRef; end takes text or a TemplateRef. The host is the card
// button, so native attributes on it (aria-label, class) stay where React
// spreads them. `aria-labelledby` and `aria-describedby` of an item are
// inputs, because React merges them with its own ids.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  InjectionToken,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { isIconName, type IconName } from '@the-system/icons';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { RovingRadioGroup, bubbleInputStyle, rovingItem, type RovingRadioItem } from '../../behavior/roving-radio';
import { BubbleEvent } from '../../internal/bubble-event';
import { consumeHostAttributes } from '../../internal/host';

export type RadioCardSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RadioCardTone = Extract<Tone, 'neutral' | 'accent'>;
export type RadioCardOrientation = 'vertical' | 'horizontal';

interface RadioCardContext {
  readonly roving: RovingRadioGroup;
  readonly value: Signal<string>;
  readonly disabled: Signal<boolean>;
  readonly required: Signal<boolean>;
  readonly name: Signal<string | undefined>;
  readonly size: Signal<RadioCardSize>;
}

const DS_RADIO_CARD = new InjectionToken<RadioCardContext>('DS_RADIO_CARD');

let nextId = 0;

/**
 * A group of radio cards. Name the group with aria-labelledby (a heading
 * above it) or aria-label. One card is checked at a time.
 */
@Component({
  selector: 'div[dsRadioCard]',
  exportAs: 'dsRadioCard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsRadioCard), multi: true },
    { provide: DS_RADIO_CARD, useFactory: () => inject(DsRadioCard).context },
  ],
  host: {
    role: 'radiogroup',
    'data-ds': 'radio-card',
    '[attr.aria-required]': 'required() ? "true" : "false"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-orientation]': 'orientation()',
    '[attr.dir]': 'dir.valueSignal()',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-invalid]': 'invalid() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[style.outline]': '"none"',
    '(mousedown)': 'roving.onRootMousedown()',
    '(focusin)': 'roving.onRootFocusin($event)',
    '(focusout)': 'onFocusout()',
  },
  template: `<ng-content />`,
})
export class DsRadioCard implements ControlValueAccessor {
  /** The checked value. Two way: `[(value)]`. Left out, the group starts at defaultValue. */
  readonly value = model<string | undefined>(undefined);
  /** The checked value at first render. */
  readonly defaultValue = input<string | undefined>(undefined);
  /** Disables every card. Native disabled: the cards leave the tab order. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Sets aria-required on the group and required on the hidden inputs. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Marks the group invalid: aria-invalid and the danger border. Pair it with a message aria-describedby points at. */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** The form field name of the hidden native inputs. */
  readonly name = input<string | undefined>(undefined);
  /** vertical: one card per line. horizontal: cards side by side in a grid that wraps. Default vertical. */
  readonly orientation = input<RadioCardOrientation>('vertical');
  /** Padding, title and icon size. Default md. */
  readonly size = input<RadioCardSize>('md');
  readonly tone = input<RadioCardTone>('neutral');
  /** Arrow keys wrap from the last card to the first. Default true. */
  readonly loop = input(true, { transform: booleanAttribute });

  private readonly host = consumeHostAttributes([
    'dsRadioCard', 'value', 'defaultValue', 'disabled', 'required', 'invalid', 'name', 'orientation', 'size', 'tone', 'loop',
  ]);
  protected readonly dir = inject(Directionality);

  private readonly current = linkedSignal<string>(() => this.value() ?? this.defaultValue() ?? '');
  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  protected readonly roving = new RovingRadioGroup({
    host: this.host,
    value: this.current,
    select: (next) => this.select(next),
    orientation: signal(undefined),
    loop: this.loop,
    dir: this.dir,
  });

  readonly context: RadioCardContext = {
    roving: this.roving,
    value: this.current,
    disabled: this.isDisabled,
    required: this.required,
    name: this.name,
    size: this.size,
  };

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const form = this.host.closest('form');
      if (!form) return;
      const initial = untracked(this.current);
      const reset = () => this.current.set(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  private select(next: string): void {
    this.current.set(next);
    this.value.set(next);
    this.onChange(next);
  }

  protected onFocusout(): void {
    this.roving.onRootFocusout();
    this.onTouched();
  }

  writeValue(value: string | null | undefined): void {
    this.current.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}

/** Content for the end part: text or a template. */
export type RadioCardEnd = string | TemplateRef<unknown>;
/** The icon: a system icon name or a template. Other text renders as text, as in React. */
export type RadioCardIcon = IconName | (string & {}) | TemplateRef<unknown>;

/**
 * One card: the indicator, an optional icon, the title and description, and
 * optional end content. The host is the card, the button with role radio.
 */
@Component({
  selector: 'button[dsRadioCardItem]',
  exportAs: 'dsRadioCardItem',
  imports: [DsIcon, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    role: 'radio',
    'data-part': 'item',
    'data-radix-collection-item': '',
    '[attr.aria-checked]': 'checked() ? "true" : "false"',
    '[attr.data-state]': 'state()',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[disabled]': 'isDisabled()',
    '[attr.value]': 'value()',
    '[attr.tabindex]': 'tabIndex()',
    '[attr.aria-labelledby]': 'ariaLabelledby() ?? titleId',
    '[attr.aria-describedby]': 'describedBy()',
    '(mousedown)': 'group.roving.onItemMousedown(item, $event)',
    '(focus)': 'group.roving.onItemFocus(item)',
    '(keydown)': 'group.roving.onItemKeydown(item, $event)',
    '(click)': 'group.roving.onItemClick(item)',
  },
  template: `<span data-part="indicator" [attr.data-state]="state()" [attr.data-disabled]="isDisabled() ? '' : null"><span aria-hidden="true"></span></span>@if (icon(); as i) {<span data-part="icon" aria-hidden="true">@if (isTemplate(i)) {<ng-container [ngTemplateOutlet]="i" />} @else if (isIcon(i)) {<svg dsIcon [name]="i" [size]="iconSize()"></svg>} @else {{{ i }}}</span>}<span [id]="titleId" data-part="title">{{ title() }}</span>@if (description() !== undefined) {<span [id]="descriptionId" data-part="description">{{ description() }}</span>}@if (end(); as e) {<span [id]="endId" data-part="end">@if (isTemplate(e)) {<ng-container [ngTemplateOutlet]="e" />} @else {{{ e }}}</span>}`,
})
export class DsRadioCardItem {
  /** The value this card sets. */
  readonly value = input.required<string>();
  /** The visible name of the option. It is the accessible name. */
  readonly title = input.required<string>();
  /** A line or two of help under the title. Joins aria-describedby. */
  readonly description = input<string | undefined>(undefined);
  /** A system icon name or a template before the text. Decoration: aria-hidden. */
  readonly icon = input<RadioCardIcon | undefined>(undefined);
  /** Content at the inline end, such as a price or a delivery date. Read after the description. */
  readonly end = input<RadioCardEnd | undefined>(undefined);
  /** Disables this card only. */
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  protected readonly group = inject(DS_RADIO_CARD);
  private readonly host = consumeHostAttributes([
    'dsRadioCardItem', 'value', 'title', 'description', 'icon', 'end', 'disabled', 'aria-labelledby', 'aria-describedby',
  ]);

  private readonly base = `ds-radio-card-item-${++nextId}`;
  protected readonly titleId = `${this.base}-title`;
  protected readonly descriptionId = `${this.base}-description`;
  protected readonly endId = `${this.base}-end`;

  readonly checked = computed(() => this.group.value() === this.value());
  protected readonly state = computed(() => (this.checked() ? 'checked' : 'unchecked'));
  readonly isDisabled = computed(() => this.disabled() || this.group.disabled());
  protected readonly iconSize = computed(() => (this.group.size() === 'sm' ? 'md' : 'lg'));
  protected readonly describedBy = computed(
    () =>
      [
        this.description() !== undefined ? this.descriptionId : undefined,
        this.end() !== undefined ? this.endId : undefined,
        this.ariaDescribedby(),
      ]
        .filter(Boolean)
        .join(' ') || null,
  );

  protected readonly item: RovingRadioItem = rovingItem({
    value: () => this.value(),
    element: () => this.host,
    disabled: () => this.isDisabled(),
  });
  protected readonly tabIndex = computed(() => this.group.roving.itemTabIndex(this.item));

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(this.group.roving.register(this.item));
    // Inside a form, the hidden native radio Radix renders after the card.
    const bubble = signal<HTMLInputElement | null>(null);
    const bubbleClick = new BubbleEvent<boolean>('click');
    afterNextRender(() => {
      if (!this.host.closest('form')) return;
      const input = this.host.ownerDocument.createElement('input');
      input.type = 'radio';
      input.setAttribute('aria-hidden', 'true');
      if (untracked(this.checked)) input.setAttribute('checked', '');
      input.tabIndex = -1;
      for (const [k, v] of Object.entries(bubbleInputStyle(this.host))) input.style.setProperty(k, v);
      this.host.after(input);
      bubble.set(input);
      destroyRef.onDestroy(() => input.remove());
    });
    effect(() => {
      const input = bubble();
      if (!input) return;
      input.required = this.group.required();
      input.disabled = this.isDisabled();
      const name = this.group.name();
      if (name === undefined) input.removeAttribute('name');
      else input.name = name;
      input.value = this.value();
      input.checked = this.checked();
      bubbleClick.update(input, input.checked);
    });
  }

  protected isTemplate(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }

  protected isIcon(value: unknown): value is IconName {
    return typeof value === 'string' && isIconName(value);
  }

  focus(): void {
    this.host.focus();
  }
}
