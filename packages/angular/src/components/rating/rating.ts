// Rating: pick or show a score from 1 to 5 (or 10) as stars. The twin of
// packages/react/src/components/Rating/Rating.tsx.
//
//   <span data-demo="label" id="rate">Rate this board</span>
//   <div dsRating aria-labelledby="rate" [(value)]="score"></div>
//   <div dsRating readOnly [value]="4.5" showValue>(128 reviews)</div>
//
// The host is the root. Interactive, it is the Radix radio group root (role
// radiogroup) with one star button (role radio) per score. Read only, it is
// plain markup: the stars sit in one element with role img and a label
// ("4.5 of 5 stars"), and the text after them stays outside it, so it is
// read. Half stars show only in this form.
//
// Behavior: hand built with the Radix DOM in behavior/roving-radio.ts, as
// React passes it to Radix: orientation horizontal (ArrowUp and ArrowDown do
// nothing, as in React today), no loop, arrows that move and select in the
// reading direction (CDK Directionality), Space selects, Enter does nothing.
// Home and End pick the lowest and the highest score, as React's own
// handler does. The key moves run on the CDK FocusKeyManager. Angular Aria
// has no radio group pattern to replace it with.
//
// Star names follow the Theme language: with no getItemLabel and
// getValueLabel, an Arabic dsTheme gives "3 من 5 نجوم" and "بدون تقييم".
//
// Names that differ from React: `onValueChange` is the `valueChange` output
// of `[(value)]`. `aria-label`, `aria-labelledby` and `aria-describedby` are
// inputs, because React moves them (to the stars in the read only form) and
// merges them with its own ids. The text after the stars, React's children,
// is the projected content; it is read once, after the first render.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
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
  viewChild,
  viewChildren,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import type { Size, Tone } from '@the-system/shared';
import { RovingRadioGroup, bubbleInputStyle, rovingItem, type RovingRadioItem } from '../../behavior/roving-radio';
import { consumeHostAttributes } from '../../internal/host';
import { DsNativeButton } from '../../internal/native-button';
import { DsThemeService } from '../../theme/theme';
import type { Lang } from '../../theme/types';

export type RatingSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type RatingTone = Extract<Tone, 'accent' | 'warning'>;
export type RatingMax = 5 | 10;

/** A count in the language: Western digits in Arabic too, as the Arabic copy rules ask. */
function count(n: number, lang: Lang): string {
  return lang === 'ar' ? new Intl.NumberFormat('ar-u-nu-latn', { maximumFractionDigits: 1 }).format(n) : String(n);
}

/** The name of one star: "3 of 5 stars", or "3 من 5 نجوم" in Arabic. */
export function ratingItemLabel(score: number, max: number, lang: Lang = 'en'): string {
  return lang === 'ar' ? `${count(score, lang)} من ${count(max, lang)} نجوم` : `${score} of ${max} stars`;
}

/** The name of a read only rating: "4.5 of 5 stars", or "Not rated" for 0. Arabic: "4.5 من 5 نجوم", "بدون تقييم". */
export function ratingValueLabel(value: number, max: number, lang: Lang = 'en'): string {
  if (value > 0) return ratingItemLabel(value, max, lang);
  return lang === 'ar' ? 'بدون تقييم' : 'Not rated';
}

/** How a star draws for a value: full, half or empty. Rounds to the nearest half. */
export function starFill(score: number, value: number): 'full' | 'half' | 'empty' {
  const rounded = Math.round(value * 2) / 2;
  if (rounded >= score) return 'full';
  if (rounded >= score - 0.5) return 'half';
  return 'empty';
}

const ICON = { full: 'star-filled', half: 'star-half', empty: 'star' } as const;
const ICON_SIZE = { sm: 'md', md: 'lg', lg: 'lg' } as const;

let nextId = 0;

/**
 * A star rating. Name the interactive form with aria-label or
 * aria-labelledby; the read only form names itself from the score.
 */
@Component({
  selector: 'div[dsRating]',
  exportAs: 'dsRating',
  imports: [DsIcon, DsNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsRating), multi: true }],
  host: {
    '[attr.role]': 'readOnly() ? null : "radiogroup"',
    '[attr.aria-required]': 'readOnly() ? null : required() ? "true" : "false"',
    '[attr.aria-orientation]': 'readOnly() ? null : "horizontal"',
    '[attr.data-orientation]': 'readOnly() ? null : "horizontal"',
    '[attr.dir]': 'readOnly() ? null : dir.valueSignal()',
    '[attr.aria-label]': 'readOnly() ? null : ariaLabel() ?? null',
    '[attr.aria-labelledby]': 'readOnly() ? null : ariaLabelledby() ?? null',
    '[attr.aria-describedby]': 'describedBy()',
    'data-ds': 'rating',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-readonly]': 'readOnly() ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
    '[style.outline]': 'readOnly() ? null : "none"',
    '(mousedown)': 'roving.onRootMousedown()',
    '(focusin)': 'readOnly() || roving.onRootFocusin($event)',
    '(focusout)': 'onFocusout()',
    '(keydown)': 'onRootKeydown($event)',
  },
  template: `@if (readOnly()) {<span
      [id]="starsId"
      role="img"
      [attr.aria-label]="ariaLabel() ? ariaLabel() + ': ' + valueLabel() : valueLabel()"
      [attr.aria-labelledby]="ariaLabelledby() ? ariaLabelledby() + ' ' + starsId : null"
      data-part="stars">@for (score of scores(); track score) {<span data-part="item" [attr.data-filled]="fill(score) !== 'empty' ? '' : null"><svg dsIcon [name]="icon[fill(score)]" [size]="iconSize()" data-part="icon"></svg></span>}</span>} @else {@for (score of scores(); track score; let i = $index) {<button dsNativeButton #star
      type="button"
      role="radio"
      [attr.aria-checked]="score === whole() ? 'true' : 'false'"
      [attr.data-state]="score === whole() ? 'checked' : 'unchecked'"
      [attr.data-disabled]="isDisabled() ? '' : null"
      [disabled]="isDisabled()"
      [attr.value]="score"
      [attr.tabindex]="tabIndex(i)"
      data-orientation="horizontal"
      data-radix-collection-item=""
      [attr.aria-label]="itemLabel(score)"
      data-part="item"
      [attr.data-filled]="score <= whole() ? '' : null"
      (mousedown)="roving.onItemMousedown(itemAt(i), $event)"
      (focus)="roving.onItemFocus(itemAt(i))"
      (keydown)="roving.onItemKeydown(itemAt(i), $event)"
      (click)="roving.onItemClick(itemAt(i))"><svg dsIcon [name]="score <= whole() ? 'star-filled' : 'star'" [size]="iconSize()" data-part="icon"></svg></button>@if (isFormControl()) {<input
      type="radio"
      aria-hidden="true"
      tabindex="-1"
      [attr.checked]="initialScore === score ? '' : null"
      [checked]="score === whole()"
      [required]="required()"
      [disabled]="isDisabled()"
      [attr.name]="name() ?? null"
      [attr.value]="score"
      [style]="bubbleStyle()" />}}}@if (hasText()) {<span #text [id]="valueId" data-part="value">@if (showNumber()) {<ng-container>{{ current() }}</ng-container>}@if (showNumber() && hasContent()) {<ng-container>{{ ' ' }}</ng-container>}<ng-content /></span>}`,
})
export class DsRating implements ControlValueAccessor {
  /** The score. Two way: `[(value)]`. 0 means not rated. Read only accepts halves (4.5). */
  readonly value = model<number | undefined>(undefined);
  /** The score at first render. Default 0. */
  readonly defaultValue = input(0);
  /** The number of stars. Default 5. */
  readonly max = input<RatingMax>(5);
  /** Shows the score as star icons with role img and a label. Not focusable. */
  readonly readOnly = input(false, { transform: booleanAttribute });
  /** Disables every star. Native disabled: the stars leave the tab order. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Sets aria-required on the group and required on the hidden inputs. */
  readonly required = input(false, { transform: booleanAttribute });
  /** The form field name of the hidden native inputs. */
  readonly name = input<string | undefined>(undefined);
  readonly size = input<RatingSize>('md');
  /** The color of the filled stars. warning: amber. accent: the primary color. Default warning. */
  readonly tone = input<RatingTone>('warning');
  /** Shows the score as text after the stars, for example 4.5. */
  readonly showValue = input(false, { transform: booleanAttribute });
  /** The name of one star. Default "3 of 5 stars", in the Theme language. */
  readonly getItemLabel = input<((score: number, max: number) => string) | undefined>(undefined);
  /** The name of a read only rating. Default "4.5 of 5 stars", in the Theme language. */
  readonly getValueLabel = input<((value: number, max: number) => string) | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  private readonly host = consumeHostAttributes([
    'dsRating', 'value', 'defaultValue', 'max', 'readOnly', 'disabled', 'required', 'name', 'size', 'tone', 'showValue',
    'getItemLabel', 'getValueLabel', 'aria-label', 'aria-labelledby', 'aria-describedby',
  ]);
  protected readonly dir = inject(Directionality);
  private readonly theme = inject(DsThemeService);
  private readonly stars = viewChildren<ElementRef<HTMLButtonElement>>('star');
  private readonly text = viewChild<ElementRef<HTMLSpanElement>>('text');

  protected readonly icon = ICON;
  protected readonly valueId = `ds-rating-${++nextId}-value`;
  protected readonly starsId = `ds-rating-${nextId}-stars`;

  /** The score: the model, else defaultValue, moved by picks and forms. */
  protected readonly current = linkedSignal<number>(() => this.value() ?? this.defaultValue());
  private readonly formDisabled = signal(false);
  /** Whether content is projected; read once after the first render. */
  protected readonly hasContent = signal(true);
  protected readonly isFormControl = signal(false);
  protected readonly bubbleStyle = signal<Record<string, string>>({});
  /** Radix renders the hidden radios with defaultChecked: the score when they first rendered. */
  protected initialScore = 0;

  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly scores = computed(() => Array.from({ length: this.max() }, (_, i) => i + 1));
  protected readonly whole = computed(() => Math.round(this.current()));
  protected readonly iconSize = computed(() => ICON_SIZE[this.size()]);
  protected readonly showNumber = computed(() => this.showValue() && this.current() > 0);
  protected readonly hasText = computed(() => this.showValue() || this.hasContent());
  protected readonly valueLabel = computed(() => {
    const own = this.getValueLabel();
    return own ? own(this.current(), this.max()) : ratingValueLabel(this.current(), this.max(), this.theme.value().lang);
  });
  protected readonly describedBy = computed(() => {
    if (this.readOnly()) return this.ariaDescribedby() ?? null;
    return [this.ariaDescribedby(), this.hasText() ? this.valueId : undefined].filter(Boolean).join(' ') || null;
  });

  /** The Radix value: the whole score as text, '' for none. */
  private readonly radixValue = computed(() => (this.whole() > 0 ? String(this.whole()) : ''));
  protected readonly roving = new RovingRadioGroup({
    host: this.host,
    value: this.radixValue,
    select: (next) => this.select(Number(next)),
    orientation: signal('horizontal'),
    loop: signal(false),
    dir: this.dir,
    active: computed(() => !this.readOnly()),
  });

  /** One roving item per star. */
  protected readonly items = computed<RovingRadioItem[]>(() => {
    const element = (i: number): HTMLButtonElement => {
      const star = this.stars()[i];
      if (!star) throw new Error(`No star at ${i}`);
      return star.nativeElement;
    };
    return this.scores().map((score, i) =>
      rovingItem({ value: () => String(score), element: () => element(i), disabled: () => this.isDisabled() }),
    );
  });

  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect((onCleanup) => {
      if (this.readOnly()) return;
      const removers = this.items().map((item) => this.roving.register(item));
      onCleanup(() => removers.forEach((remove) => remove()));
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const span = this.text()?.nativeElement;
      if (span) {
        const own = untracked(this.showNumber) ? `${untracked(this.current)} ` : '';
        const projected = span.children.length > 0 || (span.textContent ?? '').slice(own.length).trim() !== '';
        this.hasContent.set(projected);
      }
      const form = this.host.closest('form');
      if (!form || untracked(this.readOnly)) return;
      const first = this.stars()[0]?.nativeElement;
      this.initialScore = untracked(this.whole);
      if (first) this.bubbleStyle.set(bubbleInputStyle(first));
      this.isFormControl.set(true);
      const initial = untracked(this.current);
      const reset = () => this.current.set(initial);
      form.addEventListener('reset', reset);
      destroyRef.onDestroy(() => form.removeEventListener('reset', reset));
    });
  }

  protected fill(score: number): 'full' | 'half' | 'empty' {
    return starFill(score, this.current());
  }

  protected itemLabel(score: number): string {
    const own = this.getItemLabel();
    return own ? own(score, this.max()) : ratingItemLabel(score, this.max(), this.theme.value().lang);
  }

  /** The roving item of the star at this index. */
  protected itemAt(index: number): RovingRadioItem {
    const item = this.items()[index];
    if (!item) throw new Error(`No star at ${index}`);
    return item;
  }

  protected tabIndex(index: number): number {
    return this.roving.itemTabIndex(this.itemAt(index));
  }

  private select(next: number): void {
    const changed = !Object.is(next, untracked(this.current));
    this.current.set(next);
    if (!changed) return;
    this.value.set(next);
    this.onChange(next);
  }

  protected onRootKeydown(event: KeyboardEvent): void {
    // Radix moves focus to the first or last star on Home and End; the score follows it, as in React.
    if (this.readOnly() || this.isDisabled()) return;
    if (event.key === 'Home' || event.key === 'End') this.select(event.key === 'Home' ? 1 : this.max());
  }

  protected onFocusout(): void {
    if (this.readOnly()) return;
    this.roving.onRootFocusout();
    this.onTouched();
  }

  /** The star that takes focus on Tab: the checked one, else the first. */
  focus(): void {
    const stars = this.stars();
    (stars[this.whole() - 1] ?? stars[0])?.nativeElement.focus();
  }

  writeValue(value: number | null | undefined): void {
    this.current.set(value ?? 0);
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
  }
}
