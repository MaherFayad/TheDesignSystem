'use client';
import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { Icon } from '@the-system/icons/react';
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
import { useTheme } from '../../theme/hooks';
import { useField, useFieldControl } from '../Field/Field';

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

export interface PhoneFieldProps
  extends Omit<
    ComponentProps<'input'>,
    'size' | 'type' | 'value' | 'defaultValue' | 'title' | 'ref' | 'className' | 'style' | 'children' | 'name'
  > {
  /** The number in E.164 form, +966501234567 (controlled). An empty string clears it. */
  value?: string;
  /** The first number in E.164 form (uncontrolled). */
  defaultValue?: string;
  /** Called with the E.164 number (empty while there are no digits) and its parts. */
  onValueChange?: (value: string, detail: PhoneValueDetail) => void;
  /** The selected country, an ISO code (controlled). */
  country?: string;
  /** The first country (uncontrolled). Default SA. */
  defaultCountry?: string;
  /** Called when the country changes, from the picker or from a pasted +number. */
  onCountryChange?: (country: string) => void;
  /** Limits the picker to these ISO codes. The Gulf still comes first. */
  countries?: string[];
  /** Language of the country names. Default: the lang of the nearest Theme. */
  locale?: string;
  /** Names of the picker and its groups. */
  labels?: PhoneFieldLabels;
  /** The form field name. A hidden input with this name posts the E.164 number. */
  name?: string;
  /** Height from size.control. Default md. */
  size?: PhoneFieldSize;
  /** default: radius.control from the style. pill: always fully round. */
  shape?: PhoneFieldShape;
  /** Marks the number invalid. Inside a Field it follows the Field. */
  invalid?: boolean;
  /** Class name of the root. */
  className?: string;
  /** Inline style of the root. */
  style?: ComponentProps<'div'>['style'];
  /** Any other prop for the root element. */
  rootProps?: Omit<ComponentProps<'div'>, 'title' | 'children'>;
  /** Goes to the native number input. */
  ref?: Ref<HTMLInputElement>;
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

/** The position in `text` just after the `count`th digit. */
function caretAfterDigits(text: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (/\d/.test(text[i] ?? '')) seen += 1;
    if (seen === count) return i + 1;
  }
  return text.length;
}

/**
 * A phone number with a country code picker, Gulf first.
 *
 * The country is a native `<select>` (the platform picker on phones, type
 * ahead on desktops), drawn as the dial code (`code` part) at the start of
 * the box: the select covers the code and is transparent. The number is a
 * native `<input type="tel" autocomplete="tel-national">` that shows the
 * national number in groups (50 123 4567) and always runs left to right.
 *
 * A pasted or autofilled +9665... or 009665... sets the country. Arabic
 * Indic digits are read. The value out is E.164 (+966501234567), from
 * `onValueChange` and from a hidden input named `name`.
 */
export function PhoneField({
  value: valueProp,
  defaultValue,
  onValueChange,
  country: countryProp,
  defaultCountry = 'SA',
  onCountryChange,
  countries,
  locale,
  labels,
  name,
  size = 'md',
  shape = 'default',
  invalid,
  disabled,
  readOnly,
  required,
  className,
  style,
  rootProps,
  id,
  ref,
  placeholder,
  'aria-describedby': describedBy,
  onChange,
  onKeyDown,
  ...rest
}: PhoneFieldProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const copy = lang.toLowerCase().startsWith('ar') ? COPY.ar : COPY.en;
  const field = useField();
  const uid = useId();
  const pickerId = `${uid}country`;
  const codeId = `${uid}code`;
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });

  const [own, setOwn] = useState(() => {
    const first = parsePhone(defaultValue ?? '', countryProp ?? defaultCountry);
    return { country: countryProp ?? first.country, national: first.national };
  });
  // A controlled value names its own country (+971...), unless the country is controlled too.
  const fromValue = valueProp !== undefined ? parsePhone(valueProp, countryProp ?? own.country) : undefined;
  const country = (countryProp ?? (fromValue?.international ? fromValue.country : own.country)).toUpperCase();
  const national = valueProp !== undefined ? controlledNational(valueProp, country) : own.national;
  const shown = formatNational(national, country);

  const options = useMemo(() => {
    const list = phoneCountryOptions(lang, countries);
    // A country set from outside the list still shows.
    if (!list.some((c) => c.iso === country)) {
      const extra = phoneCountryOptions(lang, [country]);
      return [...extra, ...list];
    }
    return list;
  }, [lang, countries, country]);
  const selected = options.find((c) => c.iso === country);

  // While "+9" or "+97" is typed no dial code matches yet: the raw text shows until one does.
  const [draft, setDraft] = useState<string | null>(null);
  // Bumped when an edit leaves the digits as they were, so the caret effect runs again.
  const [, setRefresh] = useState(0);
  const inner = useRef<HTMLInputElement | null>(null);
  const pendingDigits = useRef<number | null>(null);
  const lastKey = useRef<string | null>(null);
  const lastEmitted = useRef<string | undefined>(undefined);

  // A controlled value the parent set itself (a reset to "") ends a draft.
  useLayoutEffect(() => {
    if (valueProp !== undefined && valueProp !== lastEmitted.current) setDraft(null);
  }, [valueProp]);

  const setRef = useCallback(
    (node: HTMLInputElement | null): (() => void) | undefined => {
      inner.current = node;
      if (typeof ref === 'function') {
        const cleanup = ref(node);
        return () => {
          if (typeof cleanup === 'function') cleanup();
          else ref(null);
        };
      }
      if (ref) {
        ref.current = node;
        return () => {
          ref.current = null;
        };
      }
      return undefined;
    },
    [ref],
  );

  // The groups add spaces: put the caret back after the same number of digits.
  useLayoutEffect(() => {
    const input = inner.current;
    const count = pendingDigits.current;
    pendingDigits.current = null;
    if (!input || count === null || input.ownerDocument.activeElement !== input) return;
    const at = caretAfterDigits(input.value, count);
    input.setSelectionRange(at, at);
  });

  const emit = (nextCountry: string, nextNational: string) => {
    const countryChanged = nextCountry !== country;
    if (valueProp === undefined || countryProp === undefined) {
      setOwn({ country: countryProp ?? nextCountry, national: nextNational });
    }
    if (countryChanged) onCountryChange?.(nextCountry);
    if (nextNational !== national || countryChanged) {
      lastEmitted.current = toE164(nextNational, nextCountry);
      onValueChange?.(lastEmitted.current, {
        country: nextCountry,
        national: nextNational,
        valid: isValidNational(nextNational, nextCountry),
      });
    }
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) return;
    const input = event.currentTarget;
    const raw = toLatinDigits(input.value);
    const key = lastKey.current;
    lastKey.current = null;
    const parsed = parsePhone(raw, country);
    // "+", "+9", "0" and "00" match no number yet: the raw text shows, and the old number is gone.
    if (!parsed.international && (/^\s*(\+|00)/.test(raw) || /^\s*0+\s*$/.test(raw))) {
      setDraft(input.value);
      emit(country, '');
      return;
    }
    setDraft(null);
    // Backspace or Delete on a group space removes no digit: remove the digit next to it instead.
    const typed = raw.replace(/\D/g, '');
    if ((key === 'Backspace' || key === 'Delete') && typed === national && raw.length < shown.length) {
      const before = raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, '').length;
      const at = key === 'Backspace' ? before - 1 : before;
      if (at >= 0 && at < national.length) {
        pendingDigits.current = at;
        emit(country, national.slice(0, at) + national.slice(at + 1));
      } else {
        pendingDigits.current = before;
        setRefresh((n) => n + 1);
      }
      return;
    }
    if (parsed.international) {
      // A pasted or filled +966... : the caret goes to the end.
      pendingDigits.current = parsed.national.length;
    } else {
      // Digits before the caret, less a trunk 0 the parse dropped.
      const before = raw.slice(0, input.selectionStart ?? raw.length).replace(/\D/g, '');
      const typed = raw.replace(/\D/g, '');
      const dropped = typed.length - typed.replace(/^0+/, '').length;
      const trunk = parsed.national.length < typed.length ? Math.min(dropped, before.length) : 0;
      pendingDigits.current = Math.min(before.length - trunk, parsed.national.length);
    }
    emit(parsed.country, parsed.national);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    lastKey.current = event.key;
  };

  // The digits stay when the country changes; detail.valid says if the length fits the new country.
  const handleCountry = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    setDraft(null);
    emit(next, national);
  };

  const e164 = toE164(national, country);

  return (
    <div
      {...rootProps}
      className={className}
      style={style}
      data-ds="phone-field"
      data-size={size}
      data-shape={shape}
      data-invalid={control['aria-invalid'] ? '' : undefined}
      data-disabled={control.disabled ? '' : undefined}
      data-readonly={control.readOnly ? '' : undefined}
    >
      <span data-part="code">
        {/*
          With a picker, the picker reads the country. Read only, the number is described by the dial code.
          Disabled, the dimmed code is inactive text (WCAG 1.4.3 exception); aria-disabled tells axe so.
        */}
        <span id={codeId} aria-hidden={control.readOnly ? undefined : true} aria-disabled={control.disabled ? true : undefined}>
          <bdi dir="ltr">+{selected?.dial ?? ''}</bdi>
          {!control.readOnly && <Icon name="chevron-down" size="sm" />}
        </span>
        {!control.readOnly && (
          <select
            data-part="country"
            id={pickerId}
            aria-label={labels?.country ?? copy.country}
            aria-labelledby={field ? `${pickerId} ${field.labelId}` : undefined}
            value={country}
            disabled={control.disabled}
            onChange={handleCountry}
          >
            {[true, false].map((gulf) => {
              const group = options.filter((c) => c.gulf === gulf);
              if (group.length === 0) return null;
              return (
                <optgroup key={String(gulf)} label={gulf ? (labels?.gulf ?? copy.gulf) : (labels?.all ?? copy.all)}>
                  {group.map((c) => (
                    <option key={c.iso} value={c.iso}>
                      {`${c.name} ${LRI}+${c.dial}${PDI}`}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        )}
      </span>
      <input
        {...rest}
        {...control}
        ref={setRef}
        type="tel"
        dir="ltr"
        data-part="control"
        inputMode={rest.inputMode ?? 'tel'}
        autoComplete={rest.autoComplete ?? 'tel-national'}
        placeholder={placeholder ?? phoneExample(country)}
        aria-describedby={control.readOnly ? [control['aria-describedby'], codeId].filter(Boolean).join(' ') : control['aria-describedby']}
        value={draft ?? shown}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
      />
      {name !== undefined && <input type="hidden" name={name} form={rest.form} value={e164} disabled={control.disabled} />}
    </div>
  );
}
