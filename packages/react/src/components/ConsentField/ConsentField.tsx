'use client';
// ConsentField: one consent, its purpose, a link to the details and, when
// given, a record line (version or date).
//
// Sources: GoBanana `TakedownForm.tsx` and `DeleteAccount.tsx` could not be
// read in the lane 4A session; built on Checkbox and Switch in this repo and
// the consent rules below.
//
// Decisions:
// - Never ticked in advance: the props have no defaultChecked, and the
//   uncontrolled state always starts denied. A controlled `checked` is for
//   showing a choice the person already made, never a default.
// - One purpose per control. Several purposes are several ConsentFields.
// - The purpose is a native label bound to the control, so a click on the
//   text toggles it, and the control's name is the purpose itself.
// - Withdrawing is the same control and the same one action as giving.
// - checkbox in a form that is sent; switch in settings that save at once.
// - The error part is the system FieldError, given a Field context of its
//   own (the same pattern as Fieldset). Inside a Form, the Form's error for
//   `name` shows there.
// - onDecision hands back a record: name, granted, version and the time, so
//   the app can store who agreed to what and when.
// - requiredError is registered with the Form by name, so the Form puts the
//   same message in the field and in the summary.
// - Development warnings catch the misuses the types cannot: a stray
//   defaultChecked, a controlled consent that starts given with no record
//   line, a given consent locked by disabled, and no way to the details.
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useMotion } from '../../internal/motion';
import { landPop, playBeat, token } from '../Input/fieldMotion';
import type { Size } from '@the-system/shared';
import { useTheme } from '../../theme';
import { Checkbox } from '../Checkbox/Checkbox';
import { FieldContext, type FieldContextValue } from '../Field/context';
import { FieldError } from '../FieldError/FieldError';
import { useFormFieldError, useFormRequiredMessage } from '../Form/Form';
import { Link } from '../Link/Link';
import { Switch } from '../Switch/Switch';

export type ConsentFieldSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type ConsentFieldState = 'granted' | 'denied';
export type ConsentFieldControl = 'checkbox' | 'switch';

/** What the app stores when the person decides. */
export interface ConsentRecord {
  /** The form name of the consent, when given. */
  name: string | undefined;
  granted: boolean;
  /** The version of the purpose text the person saw, when given. */
  version: string | undefined;
  /** When the choice was made, as an ISO 8601 string. */
  at: string;
}

interface ConsentFieldBaseProps extends Omit<ComponentProps<'div'>, 'title' | 'onChange' | 'defaultChecked' | 'children'> {
  /**
   * What the person agrees to, in one sentence that names one purpose:
   * "Send me offers by email". It is the control's label. Required.
   */
  purpose: ReactNode;
  /**
   * Called with a record of each choice, for the app to store. In a form
   * that is sent, store the record of the last choice when the form is
   * sent, not every toggle before it.
   */
  onDecision?: (record: ConsentRecord) => void;
  /** checkbox in a form that is sent, switch in settings that save at once. Default checkbox. */
  control?: ConsentFieldControl;
  /** The form name. The value sent while granted is `value`. */
  name?: string;
  /** The value sent while granted. Default "granted". */
  value?: string;
  /** Where the details live: who gets the data, for how long, how to withdraw. Renders the details link. */
  detailsHref?: string;
  /** The text of the details link. Default "How we use your data", or Arabic under lang ar. */
  detailsLabel?: ReactNode;
  /** Opens the details in a new tab. Default false. */
  detailsExternal?: boolean;
  /** A record line under the purpose: the version of the text or the date of the choice. */
  meta?: ReactNode;
  /** The version of the purpose text, passed back in the record. */
  version?: string;
  /** The service cannot work without this consent. Shows the required mark and sets aria-required. */
  required?: boolean;
  disabled?: boolean;
  /** Marks the consent invalid. When it is not passed, it is invalid while it shows an error. `false` hides the error. */
  invalid?: boolean;
  /** An error shown now, for a required consent left denied. */
  error?: ReactNode;
  /**
   * Inside a Form, with `name`: what the error says when the Form finds this
   * required consent left off. The Form shows it in the field and in the
   * summary. Say why it is needed and the other way. Default the Form's
   * own message for a box left off.
   */
  requiredError?: string;
  /** Control and text size. Default md. */
  size?: ConsentFieldSize;
}

export type ConsentFieldProps = ConsentFieldBaseProps &
  (
    | {
        /** Controlled: the choice already on record. There is no defaultChecked: a consent never starts given. */
        checked: boolean;
        /** Called with the new choice. Required with checked, so a controlled consent can always be withdrawn. */
        onCheckedChange: (granted: boolean) => void;
      }
    | {
        checked?: undefined;
        /** Called with the new choice. */
        onCheckedChange?: (granted: boolean) => void;
      }
  );

const detailsByLang = { en: 'How we use your data', ar: 'طريقة استخدام بياناتك' } as const;

function hasContent(node: ReactNode): boolean {
  return node !== undefined && node !== null && node !== false && node !== '';
}

const noop = () => () => undefined;

/** One consent with its purpose, a link to the details and a record of the choice. Never ticked in advance. */
export function ConsentField({
  purpose,
  checked: checkedProp,
  onCheckedChange,
  onDecision,
  control = 'checkbox',
  name,
  value = 'granted',
  detailsHref,
  detailsLabel,
  detailsExternal = false,
  meta,
  version,
  required = false,
  disabled = false,
  invalid,
  error,
  requiredError,
  size = 'md',
  'aria-describedby': describedBy,
  ...props
}: ConsentFieldProps) {
  // A caller without types could still pass defaultChecked: it is dropped, never forwarded.
  const { defaultChecked: strayDefault, ...rest } = props as typeof props & { defaultChecked?: unknown };
  const { lang } = useTheme();
  const base = useId();
  const controlId = `${base}control`;
  const purposeId = `${base}purpose`;
  const metaId = `${base}meta`;
  const errorId = `${base}error`;
  const [own, setOwn] = useState(false);
  const granted = checkedProp ?? own;

  const formError = useFormFieldError(name);
  useFormRequiredMessage(name, requiredError);
  const shownError = formError ?? error;
  const showError = hasContent(shownError) && invalid !== false;
  const isInvalid = invalid ?? showError;
  const showMeta = hasContent(meta);

  // The first controlled value, for the warning about a consent that starts given.
  const startedGranted = useRef(checkedProp === true);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (strayDefault !== undefined) {
      console.warn('ConsentField: defaultChecked is ignored. A consent never starts given; pass checked only for a choice already on record.');
    }
    if (startedGranted.current && !showMeta) {
      console.warn(
        'ConsentField: checked starts true with no meta. Show the record of the choice in meta, such as the date and the text version, or start denied.',
      );
    } else if (startedGranted.current && typeof meta === 'string' && !/\d/.test(meta)) {
      // A record line names when the choice was made: a meta with no date is not a record.
      console.warn(
        'ConsentField: checked starts true and meta has no date. A given consent comes from a stored decision: show when it was given, or start denied.',
      );
    }
    // Warn once, on mount: these describe how the consent was set up.
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (disabled && granted) {
      console.warn('ConsentField: a given consent is disabled, so it cannot be withdrawn. Keep a given consent enabled.');
    }
  }, [disabled, granted]);
  useEffect(() => {
    // A disabled consent cannot be given yet: the link is asked for once it can.
    if (process.env.NODE_ENV === 'production' || detailsHref !== undefined || disabled) return;
    // A link in the description of the surrounding Fieldset counts as the way to the details.
    const fieldset = document.getElementById(purposeId)?.closest('fieldset');
    if (fieldset?.querySelector(':scope > [data-part="description"] a[href]')) return;
    console.warn('ConsentField: no detailsHref. Link the privacy notice from the consent, or from the description of the surrounding Fieldset.');
  }, [detailsHref, purposeId, disabled]);

  const decide = (next: boolean) => {
    if (next) granting.current = true;
    if (checkedProp === undefined) setOwn(next);
    onCheckedChange?.(next);
    onDecision?.({ name, granted: next, version, at: new Date().toISOString() });
  };

  // consent-check: when the person gives the consent, the mark lands past full size on the bouncy
  // spring, on top of the control's own draw (composite add), so the check draws with a pop.
  const motion = useMotion();
  const rootEl = useRef<HTMLDivElement | null>(null);
  const granting = useRef(false);
  useLayoutEffect(() => {
    if (!granting.current || !granted) return;
    granting.current = false;
    // The Checkbox mark: its drawn strokes since order 1.23 (the mark part), or an icon glyph.
    const mark = rootEl.current?.querySelector(':scope > [data-part="control"] [data-part="indicator"] :is([data-part="mark"], [data-ds="icon"])');
    playBeat(
      mark,
      {
        ...landPop(),
        keyframes: [{ transform: `scale(${token.morph})` }, { transform: 'scale(1)' }],
        composite: 'add',
      },
      'consent-check',
      motion.mode('consent-check'),
      null,
    );
  }, [granted, motion]);

  // An error that shows after the first paint slides in (order 1.22).
  const settled = useRef(false);
  useEffect(() => {
    settled.current = true;
  }, []);

  const errorContext = useMemo<FieldContextValue>(
    () => ({
      controlId,
      labelId: purposeId,
      descriptionId: metaId,
      errorId,
      invalid: isInvalid,
      invalidProp: invalid,
      disabled,
      readOnly: false,
      required,
      hasDescription: showMeta,
      hasError: showError,
      register: noop,
      setControlId: () => undefined,
      settled,
    }),
    [controlId, purposeId, metaId, errorId, isInvalid, invalid, disabled, required, showMeta, showError],
  );

  const ariaDescribedBy = [showMeta ? metaId : undefined, showError ? errorId : undefined, describedBy].filter(Boolean).join(' ') || undefined;
  const controlProps = {
    id: controlId,
    size,
    name,
    value,
    checked: granted,
    disabled,
    required,
    invalid: isInvalid,
    'aria-labelledby': purposeId,
    'aria-describedby': ariaDescribedBy,
    rootProps: { 'data-part': 'control' } as Omit<ComponentProps<'div'>, 'title' | 'children'>,
  };

  return (
    <div
      {...rest}
      ref={(node: HTMLDivElement | null) => {
        rootEl.current = node;
        const r = (rest as { ref?: unknown }).ref;
        if (typeof r === 'function') r(node);
        else if (r && typeof r === 'object') (r as { current: HTMLDivElement | null }).current = node;
      }}
      data-ds="consent-field"
      data-size={size}
      data-state={granted ? 'granted' : 'denied'}
      data-required={required ? '' : undefined}
      data-invalid={isInvalid ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
    >
      {control === 'switch' ? (
        <Switch {...controlProps} onCheckedChange={(next) => decide(next)} />
      ) : (
        <Checkbox {...controlProps} onCheckedChange={(next) => decide(next === true)} />
      )}
      <div data-part="text">
        <label id={purposeId} htmlFor={controlId} data-part="purpose">
          {purpose}
          {required && (
            <span data-part="required" aria-hidden="true">
              {' *'}
            </span>
          )}
        </label>
        {showMeta && (
          <p id={metaId} data-part="meta">
            {meta}
          </p>
        )}
        {detailsHref !== undefined && (
          <Link data-part="details" href={detailsHref} external={detailsExternal} size={size === 'sm' ? 'xs' : 'sm'} standalone>
            {detailsLabel ?? (lang === 'ar' ? detailsByLang.ar : detailsByLang.en)}
          </Link>
        )}
        {showError && (
          <FieldContext value={errorContext}>
            <FieldError size={size === 'sm' ? 'sm' : 'md'}>{shownError}</FieldError>
          </FieldContext>
        )}
      </div>
    </div>
  );
}
