// PhoneField: a phone number with a country code picker, Gulf first. The
// twin of packages/react/src/components/PhoneField/PhoneField.tsx.
//
//   <div dsField label="Mobile number"><div dsPhoneField name="mobile" [(value)]="phone"></div></div>
//
// The country is a native select (the platform picker on phones, type ahead
// on desktops), drawn as the dial code (code part) at the start of the box:
// the select covers the code and is transparent. The number is a native
// input type tel with autocomplete tel-national that shows the national
// number in groups (50 123 4567) and always runs left to right. A pasted or
// autofilled +9665... or 009665... sets the country. Arabic Indic digits are
// read. The value out is E.164 (+966501234567), from the value model and
// from a hidden input named name.
//
// React's value, defaultValue and onValueChange are the value model
// (`[(value)]`) plus the valueDetail output; country, defaultCountry and
// onCountryChange are the country model (`[(country)]`, default SA). It
// implements ControlValueAccessor with the E.164 value.
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  booleanAttribute,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DsIcon } from '@the-system/icons/angular';
import {
  findPhoneCountry,
  formatNational,
  isValidNational,
  nationalDigits,
  parsePhone,
  phoneCountryOptions,
  phoneExample,
  toE164,
  toLatinDigits,
  type Shape,
  type Size,
} from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';
import { DsFieldContext, fieldControl } from '../field/field-context';

export type PhoneFieldSize = Size;
export type PhoneFieldShape = Extract<Shape, 'default' | 'pill'>;

export interface PhoneValueDetail {
  /** ISO code of the selected country: SA. */
  country: string;
  /** National digits, without the trunk 0: 501234567. */
  national: string;
  /** True when the national digits have a valid length for the country. */
  valid: boolean;
}

export interface PhoneFieldLabels {
  /** Accessible name of the country picker. Default "Country code", or "رمز الدولة" in Arabic. */
  country?: string;
  /** Group label of the six Gulf countries. Default "Gulf", or "دول الخليج". */
  gulf?: string;
  /** Group label of every other country. Default "All countries", or "كل الدول". */
  all?: string;
}

const COPY = {
  en: { country: 'Country code', gulf: 'Gulf', all: 'All countries' },
  ar: { country: 'رمز الدولة', gulf: 'دول الخليج', all: 'كل الدول' },
} as const;

// Isolates keep "+966" in one left to right piece inside an Arabic option.
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);

/** The national digits of a controlled E.164 value, never cut, so what shows is what was passed. */
function controlledNational(value: string, country: string): string {
  const dial = findPhoneCountry(country)?.dial;
  const latin = toLatinDigits(value).trim();
  if (dial && latin.startsWith(`+${dial}`)) return nationalDigits(latin.slice(dial.length + 1), country, { cut: false });
  return parsePhone(latin, country).national;
}

/** The position in text just after the count-th digit. */
function caretAfterDigits(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (/\d/.test(text[i] ?? '')) seen += 1;
    if (seen === count) return i + 1;
  }
  return text.length;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return value === undefined || value === null ? undefined : booleanAttribute(value);
}

let nextId = 0;

const ATTRIBUTES = [
  'dsPhoneField',
  'value',
  'country',
  'countries',
  'locale',
  'labels',
  'name',
  'size',
  'shape',
  'invalid',
  'disabled',
  'readOnly',
  'required',
  'id',
  'placeholder',
  'autoComplete',
  'inputMode',
  'form',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'aria-busy',
];

@Component({
  selector: 'div[dsPhoneField]',
  exportAs: 'dsPhoneField',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsPhoneField), multi: true }],
  host: {
    'data-ds': 'phone-field',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-invalid]': 'state().invalid ? "" : null',
    '[attr.data-disabled]': 'state().disabled ? "" : null',
    '[attr.data-readonly]': 'state().readOnly ? "" : null',
  },
  template: `
    <span data-part="code">
      <!--
        With a picker, the picker reads the country. Read only, the number is described by the dial code.
        Disabled, the dimmed code is inactive text (WCAG 1.4.3 exception); aria-disabled tells axe so.
      -->
      <span [id]="codeId" [attr.aria-hidden]="state().readOnly ? null : 'true'" [attr.aria-disabled]="state().disabled ? 'true' : null">
        <bdi dir="ltr">+<ng-container>{{ selected()?.dial ?? "" }}</ng-container></bdi>
        @if (!state().readOnly) {
          <svg dsIcon name="chevron-down" size="sm"></svg>
        }
      </span>
      @if (!state().readOnly) {
        <select
          data-part="country"
          [id]="pickerId"
          [attr.aria-label]="labels()?.country ?? copy().country"
          [attr.aria-labelledby]="field ? pickerId + ' ' + field.labelId : null"
          [disabled]="state().disabled"
          (change)="onCountry($event)"
        >
          @for (group of groups(); track group.gulf) {
            <optgroup [attr.label]="group.label">
              @for (c of group.options; track c.iso) {
                <option [value]="c.iso" [selected]="c.iso === resolvedCountry()">{{ c.name + ' ' + LRI + '+' + c.dial + PDI }}</option>
              }
            </optgroup>
          }
        </select>
      }
    </span>
    <input
      #native
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-labelledby]="ariaLabelledby() ?? null"
      [attr.aria-busy]="ariaBusy() ?? null"
      [attr.form]="form() ?? null"
      [attr.id]="state().id ?? null"
      [attr.aria-invalid]="state().invalid ? 'true' : null"
      [attr.aria-required]="state().required ? 'true' : null"
      [disabled]="state().disabled"
      [readOnly]="state().readOnly"
      type="tel"
      dir="ltr"
      data-part="control"
      [attr.inputmode]="inputMode() ?? 'tel'"
      [attr.autocomplete]="autoComplete() ?? 'tel-national'"
      [attr.placeholder]="placeholder() ?? example() ?? null"
      [attr.aria-describedby]="describedBy() ?? null"
      [value]="shownText()"
      [attr.value]="shownText()"
      (input)="onInput($event)"
      (keydown)="lastKey = $event.key"
      (blur)="onTouched()"
    />
    @if (name() !== undefined) {
      <input type="hidden" [attr.name]="name()" [attr.form]="form() ?? null" [value]="e164()" [attr.value]="e164()" [disabled]="state().disabled" />
    }
  `,
})
export class DsPhoneField implements ControlValueAccessor {
  /** The number in E.164 form, +966501234567. Two way: `[(value)]`. An empty string clears it. */
  readonly value = model<string | undefined>(undefined);
  /** The selected country, an ISO code. Two way: `[(country)]`. Default SA. */
  readonly country = model<string>('SA');
  /** Limits the picker to these ISO codes. The Gulf still comes first. */
  readonly countries = input<string[] | undefined>(undefined);
  /** Language of the country names. Default: the lang of the nearest dsTheme. */
  readonly locale = input<string | undefined>(undefined);
  /** Names of the picker and its groups. */
  readonly labels = input<PhoneFieldLabels | undefined>(undefined);
  /** The form field name. A hidden input with this name posts the E.164 number. */
  readonly name = input<string | undefined>(undefined);
  /** Height from size.control. Default md. */
  readonly size = input<PhoneFieldSize>('md');
  /** default: radius.control from the style. pill: always fully round. */
  readonly shape = input<PhoneFieldShape>('default');
  readonly invalid = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly disabled = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly readOnly = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly required = input<boolean | undefined, unknown>(undefined, { transform: optionalBoolean });
  readonly id = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly autoComplete = input<string | undefined>(undefined);
  readonly inputMode = input<string | undefined>(undefined);
  readonly form = input<string | undefined>(undefined);
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });
  readonly ariaBusy = input<string | undefined>(undefined, { alias: 'aria-busy' });

  /** With every value change: the E.164 number (empty while there are no digits) and its parts. */
  readonly valueDetail = output<PhoneValueDetail>();

  protected readonly field = inject(DsFieldContext, { optional: true });
  private readonly theme = inject(DsThemeService);
  private readonly _consumed = consumeHostAttributes(ATTRIBUTES);
  private readonly nativeRef = viewChild.required<ElementRef<HTMLInputElement>>('native');
  private readonly formDisabled = signal(false);
  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  private readonly uid = `ds-phone-field-${++nextId}-`;
  protected readonly pickerId = `${this.uid}country`;
  protected readonly codeId = `${this.uid}code`;
  protected readonly LRI = LRI;
  protected readonly PDI = PDI;
  /** While "+9" or "+97" is typed no dial code matches yet: the raw text shows until one does. */
  private readonly draft = signal<string | null>(null);
  protected lastKey: string | null = null;

  private readonly lang = computed(() => this.locale() ?? this.theme.value().lang);
  protected readonly copy = computed(() => (this.lang().toLowerCase().startsWith('ar') ? COPY.ar : COPY.en));
  /** A value names its own country (+971...): that country wins over the country model. */
  private readonly fromValue = computed(() => {
    const v = this.value();
    return v === undefined ? undefined : parsePhone(v, this.country());
  });
  protected readonly resolvedCountry = computed(() => {
    const parsed = this.fromValue();
    return (parsed?.international ? parsed.country : this.country()).toUpperCase();
  });
  private readonly national = computed(() => {
    const v = this.value();
    return v === undefined ? '' : controlledNational(v, this.resolvedCountry());
  });
  private readonly shown = computed(() => formatNational(this.national(), this.resolvedCountry()));
  protected readonly shownText = computed(() => this.draft() ?? this.shown());
  protected readonly e164 = computed(() => toE164(this.national(), this.resolvedCountry()));
  protected readonly example = computed(() => phoneExample(this.resolvedCountry()));
  private readonly options = computed(() => {
    const country = this.resolvedCountry();
    const list = phoneCountryOptions(this.lang(), this.countries());
    // A country set from outside the list still shows.
    if (!list.some((c) => c.iso === country)) return [...phoneCountryOptions(this.lang(), [country]), ...list];
    return list;
  });
  protected readonly selected = computed(() => this.options().find((c) => c.iso === this.resolvedCountry()));
  protected readonly groups = computed(() =>
    [true, false]
      .map((gulf) => ({
        gulf,
        label: gulf ? (this.labels()?.gulf ?? this.copy().gulf) : (this.labels()?.all ?? this.copy().all),
        options: this.options().filter((c) => c.gulf === gulf),
      }))
      .filter((g) => g.options.length > 0),
  );
  protected readonly state = fieldControl(this.field, () => ({
    id: this.id(),
    describedBy: this.ariaDescribedby(),
    invalid: this.invalid(),
    disabled: this.disabled() ?? (this.formDisabled() || undefined),
    readOnly: this.readOnly(),
    required: this.required(),
  }));
  protected readonly describedBy = computed(() => {
    const s = this.state();
    return s.readOnly ? [s.describedBy, this.codeId].filter(Boolean).join(' ') : s.describedBy;
  });

  constructor() {
    if (this.field) {
      const field = this.field;
      effect(() => {
        const id = this.id();
        untracked(() => field.setControlId(id));
      });
      inject(DestroyRef).onDestroy(() => {
        if (untracked(this.id) !== undefined) field.setControlId(undefined);
      });
    }
  }

  /** The native number input. */
  get nativeInput(): HTMLInputElement {
    return this.nativeRef().nativeElement;
  }

  focus(options?: FocusOptions): void {
    this.nativeInput.focus(options);
  }

  private emit(nextCountry: string, nextNational: string): void {
    const country = this.resolvedCountry();
    const countryChanged = nextCountry !== country;
    if (countryChanged) this.country.set(nextCountry);
    if (nextNational !== this.national() || countryChanged || this.value() === undefined) {
      const e164 = toE164(nextNational, nextCountry);
      this.value.set(e164);
      this.onChange(e164);
      this.valueDetail.emit({ country: nextCountry, national: nextNational, valid: isValidNational(nextNational, nextCountry) });
    }
  }

  /** Writes the text now and puts the caret after the same number of digits, as the groups add spaces. */
  private show(text: string, digits: number | null): void {
    const el = this.nativeInput;
    if (el.value !== text) el.value = text;
    if (digits === null || el.ownerDocument.activeElement !== el) return;
    const at = caretAfterDigits(text, digits);
    el.setSelectionRange(at, at);
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const raw = toLatinDigits(el.value);
    const key = this.lastKey;
    this.lastKey = null;
    const country = this.resolvedCountry();
    const national = this.national();
    const shown = this.shown();
    const parsed = parsePhone(raw, country);
    // "+", "+9", "0" and "00" match no number yet: the raw text shows, and the old number is gone.
    if (!parsed.international && (/^\s*(\+|00)/.test(raw) || /^\s*0+\s*$/.test(raw))) {
      this.draft.set(el.value);
      this.emit(country, '');
      return;
    }
    this.draft.set(null);
    // Backspace or Delete on a group space removes no digit: remove the digit next to it instead.
    const typed = raw.replace(/\D/g, '');
    if ((key === 'Backspace' || key === 'Delete') && typed === national && raw.length < shown.length) {
      const before = raw.slice(0, el.selectionStart ?? raw.length).replace(/\D/g, '').length;
      const at = key === 'Backspace' ? before - 1 : before;
      if (at >= 0 && at < national.length) {
        this.emit(country, national.slice(0, at) + national.slice(at + 1));
        this.show(this.shownText(), at);
      } else {
        this.show(this.shownText(), before);
      }
      return;
    }
    let digits: number;
    if (parsed.international) {
      // A pasted or filled +966... : the caret goes to the end.
      digits = parsed.national.length;
    } else {
      // Digits before the caret, less a trunk 0 the parse dropped.
      const before = raw.slice(0, el.selectionStart ?? raw.length).replace(/\D/g, '');
      const dropped = typed.length - typed.replace(/^0+/, '').length;
      const trunk = parsed.national.length < typed.length ? Math.min(dropped, before.length) : 0;
      digits = Math.min(before.length - trunk, parsed.national.length);
    }
    this.emit(parsed.country, parsed.national);
    this.show(this.shownText(), digits);
  }

  /** The digits stay when the country changes; valueDetail.valid says if the length fits the new country. */
  protected onCountry(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.draft.set(null);
    this.emit(next, this.national());
  }

  writeValue(value: unknown): void {
    this.draft.set(null);
    this.value.set(value === null || value === undefined ? undefined : String(value));
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
