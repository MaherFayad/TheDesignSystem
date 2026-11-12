'use client';
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type Ref,
} from 'react';
import { Icon } from '@the-system/icons/react';
import {
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
import { useFieldControl } from '../Field/Field';

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
  ...rest
}: PhoneFieldProps) {
  const theme = useTheme();
  const lang = locale ?? theme.lang;
  const copy = lang.toLowerCase().startsWith('ar') ? COPY.ar : COPY.en;
  const control = useFieldControl({ id, 'aria-describedby': describedBy, invalid, disabled, readOnly, required });

  const [own, setOwn] = useState(() => {
    const first = parsePhone(defaultValue ?? '', countryProp ?? defaultCountry);
    return { country: countryProp ?? first.country, national: first.national };
  });
  const country = (countryProp ?? own.country).toUpperCase();
  const national = valueProp !== undefined ? parsePhone(valueProp, country).national : own.national;
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
  const inner = useRef<HTMLInputElement | null>(null);
  const pendingDigits = useRef<number | null>(null);

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
      onValueChange?.(toE164(nextNational, nextCountry), {
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
    const parsed = parsePhone(raw, country);
    if (!parsed.international && /^\s*(\+|00)/.test(raw)) {
      setDraft(input.value);
      return;
    }
    setDraft(null);
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

  const handleCountry = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.currentTarget.value;
    setDraft(null);
    emit(next, nationalDigits(national, next));
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
        {/* aria-disabled: the dimmed code of a disabled field is inactive text (WCAG 1.4.3 exception). */}
        <span aria-hidden="true" aria-disabled={control.disabled ? true : undefined}>
          <bdi dir="ltr">+{selected?.dial ?? ''}</bdi>
          {!control.readOnly && <Icon name="chevron-down" size="sm" />}
        </span>
        {!control.readOnly && (
          <select
            data-part="country"
            aria-label={labels?.country ?? copy.country}
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
        value={draft ?? shown}
        onChange={handleInput}
      />
      {name !== undefined && <input type="hidden" name={name} value={e164} disabled={control.disabled} />}
    </div>
  );
}
