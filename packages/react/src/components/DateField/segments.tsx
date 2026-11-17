'use client';
// The segment row shared by DateField and TimeField (order M9.17, proposed).
// React Aria's DateInput and DateSegment run the behavior: one spinbutton
// per editable part, typing, the arrow keys, Backspace, the placeholders and
// the names of each part. We render our own elements through React Aria's
// `render` prop, drop its class names and its "true" valued data
// attributes, and stamp our own parts and states (anatomy.md).
//
//   div [data-part=input] role=group              React Aria's DateInput
//     span [data-part=segment][data-type=day] role=spinbutton [data-placeholder]?
//     span [data-part=literal] aria-hidden         a separator from Intl: / . - : and spaces
//     ...
//
// The segment order, the separators and the day period words all come from
// Intl through React Aria, for the locale the caller passes in. The locale
// always carries -u-nu-latn (dateLocale from @the-system/shared), so every
// segment, placeholder and value text keeps Western digits. Digits typed on
// an Arabic keyboard are read too: React Aria's number parser takes them.
import type { ComponentProps, ReactElement } from 'react';
import { DateInput as AriaDateInput, DateSegment as AriaDateSegment } from 'react-aria-components';

export type Props = Record<string, unknown>;

/** React Aria's own attributes we never pass on: class names, slots and boolean data states. */
export function ownProps(props: Props): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className' || key === 'slot' || key === 'data-rac') continue;
    if (key.startsWith('data-') && (typeof value === 'boolean' || value === 'true')) continue;
    out[key] = value;
  }
  return out;
}

/** True for an Arabic locale tag: ar, ar-SA, ar-SA-u-nu-latn. */
export const isArabicLocale = (tag: string) => /^ar(?:-|$)/i.test(tag);

/** A boolean state attribute: present and empty when true, absent when false. */
export const flag = (on: boolean | undefined) => (on ? '' : undefined);

/** A dash between spaces, as React Aria writes "11, November" in a month's value text. */
const SPACED_DASH = /\s\p{Pd}\s/gu;

/**
 * React Aria names a segment "<part>, <field name>" with a Latin comma in
 * every language, and reads a month as "<number> <dash> <name>". In Arabic
 * the comma becomes the Arabic comma; in every language the dash becomes a
 * comma (the system writes no dashes).
 */
export function segmentWords(props: Props, arabic: boolean): Props {
  const comma = arabic ? '\u060c ' : ', ';
  const label = props['aria-label'];
  const text = props['aria-valuetext'];
  return {
    ...props,
    'aria-label': typeof label === 'string' && arabic ? label.replace(/, /g, comma) : label,
    'aria-valuetext': typeof text === 'string' ? text.replace(SPACED_DASH, comma) : text,
  };
}

/** The row of segments. Lives inside a React Aria DateField or TimeField. */
export function SegmentRow({ arabic }: { arabic: boolean }): ReactElement {
  // React Aria's DateInput types leave out `render`, but the Group it renders reads it.
  const inputProps = {
    className: '',
    render: (domProps: ComponentProps<'div'>) => <div {...(ownProps(domProps as Props) as ComponentProps<'div'>)} data-part="input" />,
  } as unknown as { className: string };
  return (
    <AriaDateInput {...inputProps}>
      {(segment) => (
        <AriaDateSegment
          segment={segment}
          render={(domProps, s) => {
            const literal = s.type === 'literal';
            return (
              <span
                {...(segmentWords(ownProps(domProps as Props), arabic) as ComponentProps<'span'>)}
                data-part={literal ? 'literal' : 'segment'}
                data-type={literal ? undefined : s.type}
                data-placeholder={flag(!literal && s.isPlaceholder)}
              />
            );
          }}
        />
      )}
    </AriaDateInput>
  );
}
