'use client';
// Calendar: an inline month grid to pick one date (order M9.15, proposed).
// Behavior from React Aria `Calendar` (react-aria-components): the grid
// keyboard, focus, the month and selection announcements, min and max,
// unavailable days and the hidden headings React Aria adds for readers.
//
// Every element is ours: React Aria's `render` prop hands us its DOM props
// and we render the system elements. React Aria stamps boolean state
// attributes as "true" and adds its own class names; we drop those and
// stamp our own, present and empty when true (anatomy.md).
//
// Values are ISO Gregorian dates ("2026-11-17") in and out, whatever
// calendar is drawn: `calendar` is a display choice, so a value picked in
// Umm al-Qura comes back as the same ISO date. Date math and every label
// come from packages/shared/src/date.ts. The locale React Aria reads carries
// `-u-ca-<calendar>-nu-latn`, so the title, the day numbers, the names of
// the day cells and the announcements keep Western digits in Arabic.
//
// DOM, top to bottom:
//   div [data-ds=calendar] role=application   React Aria's root
//     h2 (visually hidden, React Aria)         the calendar name and month
//     div [data-part=header]
//       h2 [data-part=title] aria-hidden       the month drawn; the hidden h2 is read instead
//       button [data-ds=icon-button][data-part=previous]
//       button [data-ds=icon-button][data-part=next]
//     table [data-part=grid] role=grid
//       thead aria-hidden > tr > th [data-part=weekday]
//       tbody > tr > td [data-part=cell] role=gridcell > div [data-part=day] role=button
//
// React Aria's visually hidden native next button at the end of the root is
// dropped: the header's next button does its job.
//
// The cell part is stamped on React Aria's td through its ref: React Aria
// renders the td itself and takes no props for it.
//
// Motion: when the month changes the grid fades in (pattern fade, the
// interaction calendar-month). Under reduced motion the duration token is
// 0ms, so the new month shows at once.
import {
  Children,
  cloneElement,
  isValidElement,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as AriaButton,
  Calendar as AriaCalendar,
  CalendarCell as AriaCalendarCell,
  CalendarGrid as AriaCalendarGrid,
  CalendarGridBody as AriaCalendarGridBody,
  CalendarGridHeader as AriaCalendarGridHeader,
  CalendarHeaderCell as AriaCalendarHeaderCell,
  CalendarStateContext,
  I18nProvider,
} from 'react-aria-components';
import type { CalendarDate, DateValue } from '@internationalized/date';
import {
  calendarWords,
  createDateCalendar,
  dateLocale,
  fromIsoDate,
  isIsoDate,
  monthTitle,
  toIsoDate,
  type CalendarSystem,
  type Size,
  type WeekDay,
} from '@the-system/shared';
import { useMotion } from '../../internal/motion';
import { useTheme } from '../../theme/hooks';
import { IconButton, type IconButtonProps } from '../IconButton/IconButton';

export type CalendarSize = Extract<Size, 'sm' | 'md' | 'lg'>;
export type { CalendarSystem, WeekDay };

export interface CalendarProps
  extends Omit<ComponentProps<'div'>, 'onChange' | 'defaultValue' | 'ref' | 'children' | 'title'> {
  /** The picked date, controlled: an ISO Gregorian date such as "2026-11-17", or null for none. */
  value?: string | null;
  /** The first picked date, uncontrolled. */
  defaultValue?: string | null;
  /** Called with the picked ISO Gregorian date, and the same date in the drawn calendar. */
  onChange?: (value: string, date: CalendarDate) => void;
  /** The earliest date that can be picked, ISO. Days before it are disabled. */
  minValue?: string;
  /** The latest date that can be picked, ISO. Days after it are disabled. */
  maxValue?: string;
  /** Marks days that stay focusable but cannot be picked (booked, closed). Gets the ISO date and the drawn date. */
  isDateUnavailable?: (value: string, date: CalendarDate) => boolean;
  /** The calendar drawn: gregory (default) or islamic-umalqura. Values stay ISO Gregorian either way. */
  calendar?: CalendarSystem;
  /** The first column of the week. Default: from the locale's region (Sunday for ar-SA and en-SA). */
  firstDayOfWeek?: WeekDay;
  /** The locale of names and the week, such as ar-SA. Default the language of the nearest Theme. Digits stay Western. */
  locale?: string;
  /** The day cell size: sm, md (default) or lg. */
  size?: CalendarSize;
  /** The month shown first when nothing is picked, ISO. Default today. */
  defaultFocusedValue?: string;
  /** No day can be focused or picked. */
  disabled?: boolean;
  /** Days can be focused but not picked. */
  readOnly?: boolean;
  /** The name of the previous month button. Default "Previous month", "الشهر السابق". */
  previousLabel?: string;
  /** The name of the next month button. Default "Next month", "الشهر التالي". */
  nextLabel?: string;
  ref?: Ref<HTMLDivElement>;
}

type Props = Record<string, unknown>;

/** React Aria's own attributes we never pass on: class names, slots and boolean data states. */
function ownProps(props: Props): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className' || key === 'slot' || key === 'data-rac') continue;
    if (key.startsWith('data-') && (typeof value === 'boolean' || value === 'true')) continue;
    out[key] = value;
  }
  return out;
}

const flag = (on: boolean | undefined) => (on ? '' : undefined);

/** React Aria's visually hidden wrapper around a native button: an element whose only child is a button element. */
function isHiddenButton(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const inner = (node.props as { children?: ReactNode }).children;
  return isValidElement(inner) && inner.type === 'button';
}

/**
 * Drops React Aria's hidden native button from the root's children. React
 * Aria wraps its children in one context provider, so this looks one level
 * into each child.
 */
function dropHiddenButton(children: ReactNode): ReactNode {
  return Children.toArray(children)
    .filter((child) => !isHiddenButton(child))
    .map((child) => {
      if (!isValidElement(child)) return child;
      const inner = (child.props as { children?: ReactNode }).children;
      if (!Array.isArray(inner) || !inner.some(isHiddenButton)) return child;
      return cloneElement(child, undefined, ...inner.filter((node) => !isHiddenButton(node)));
    });
}

/**
 * React Aria names the calendar "<aria-label>, <month>" with a Latin comma,
 * on the root and in its hidden heading, in every language. In Arabic the
 * joiner is the Arabic comma: "تاريخ الحجز، نوفمبر 2026" (order P2 F4).
 */
function arabicJoin(text: unknown, label: string | undefined): unknown {
  if (typeof text !== 'string' || !label || !text.startsWith(`${label}, `)) return text;
  return `${label}\u060c ${text.slice(label.length + 2)}`;
}

/** The same fix in the hidden heading, the first child React Aria renders (a hidden div around an h2). */
function arabicHeading(node: ReactNode, label: string | undefined, depth = 0): ReactNode {
  if (typeof node === 'string') return arabicJoin(node, label) as string;
  if (!isValidElement(node) || depth > 2) return node;
  const inner = (node.props as { children?: ReactNode }).children;
  if (inner === undefined) return node;
  return cloneElement(node, undefined, ...Children.toArray(inner).map((c) => arabicHeading(c, label, depth + 1)));
}

/** Stamps the cell part on React Aria's td. */
function stampCell(td: HTMLTableCellElement | null) {
  td?.setAttribute('data-part', 'cell');
}

const parse = (iso: string | null | undefined): DateValue | null | undefined => {
  if (iso === undefined) return undefined;
  if (iso === null || !isIsoDate(iso)) return null;
  return fromIsoDate(iso);
};

function Title({ locale, calendar }: { locale: string | undefined; calendar: CalendarSystem }) {
  const state = use(CalendarStateContext);
  const start = state?.visibleRange.start;
  return (
    <h2 data-part="title" aria-hidden="true">
      {start ? monthTitle(start, locale, calendar) : null}
    </h2>
  );
}

function Step({ slot, label, size }: { slot: 'previous' | 'next'; label: string; size: IconButtonProps['size'] }) {
  return (
    <AriaButton
      slot={slot}
      aria-label={label}
      render={(domProps, renderProps) => {
        // The system keeps a disabled button focusable with aria-disabled.
        const { disabled: _disabled, type: _type, ...rest } = ownProps(domProps as Props);
        return (
          <IconButton
            {...(rest as Omit<IconButtonProps, 'icon' | 'label'>)}
            data-part={slot}
            icon={slot === 'previous' ? 'chevron-back' : 'chevron-forward'}
            label={label}
            size={size}
            emphasis="ghost"
            disabled={renderProps.isDisabled}
          />
        );
      }}
    />
  );
}

function Day({ date }: { date: CalendarDate }) {
  return (
    <AriaCalendarCell
      date={date}
      ref={stampCell}
      render={(domProps, s) => (
        <div
          {...(ownProps(domProps as Props) as ComponentProps<'div'>)}
          data-part="day"
          data-selected={flag(s.isSelected)}
          data-today={flag(s.isToday)}
          data-disabled={flag(s.isDisabled)}
          data-unavailable={flag(s.isUnavailable)}
          data-outside-month={flag(s.isOutsideMonth)}
        />
      )}
    />
  );
}

const cleanTable = (props: ComponentProps<'table'>): ReactElement => <table {...(ownProps(props as Props) as ComponentProps<'table'>)} />;
const cleanHead = (props: ComponentProps<'thead'>): ReactElement => <thead {...(ownProps(props as Props) as ComponentProps<'thead'>)} />;
const cleanBody = (props: ComponentProps<'tbody'>): ReactElement => <tbody {...(ownProps(props as Props) as ComponentProps<'tbody'>)} />;
const cleanTh = (props: ComponentProps<'th'>): ReactElement => <th {...(ownProps(props as Props) as ComponentProps<'th'>)} />;

/** The month grid; it fades in when the month changes. */
function Grid({ size }: { size: CalendarSize }) {
  const state = use(CalendarStateContext);
  const month = state?.visibleRange.start.toString();
  const grid = useRef<HTMLTableElement>(null);
  const first = useRef(month);
  const motion = useMotion();
  useLayoutEffect(() => {
    if (first.current === month) return;
    first.current = month;
    motion.play(grid.current, 'fade', 'calendar-month');
  }, [month, motion]);
  return (
    <AriaCalendarGrid ref={grid} data-part="grid" weekdayStyle={size === 'sm' ? 'narrow' : 'short'} render={cleanTable}>
      <AriaCalendarGridHeader render={cleanHead}>
        {(day) => (
          <AriaCalendarHeaderCell data-part="weekday" render={cleanTh}>
            {day}
          </AriaCalendarHeaderCell>
        )}
      </AriaCalendarGridHeader>
      <AriaCalendarGridBody render={cleanBody}>{(date) => <Day date={date} />}</AriaCalendarGridBody>
    </AriaCalendarGrid>
  );
}

export function Calendar({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  isDateUnavailable,
  calendar = 'gregory',
  firstDayOfWeek,
  locale,
  size = 'md',
  defaultFocusedValue,
  disabled = false,
  readOnly = false,
  previousLabel,
  nextLabel,
  ref,
  className,
  style,
  ...rest
}: CalendarProps) {
  const theme = useTheme();
  const base = locale ?? theme.lang;
  const tag = dateLocale(base, calendar);
  const words = calendarWords(base);
  const arabic = /^ar(-|$)/i.test(base);
  const stepSize: IconButtonProps['size'] = size === 'lg' ? 'md' : 'sm';

  const unavailable = useCallback(
    (date: DateValue) => (isDateUnavailable ? isDateUnavailable(toIsoDate(date), date as CalendarDate) : false),
    [isDateUnavailable],
  );
  const handleChange = useCallback(
    (date: DateValue | null) => {
      if (!date || !onChange) return;
      const iso = toIsoDate(date);
      onChange(iso, fromIsoDate(iso, calendar));
    },
    [onChange, calendar],
  );
  const dates = useMemo(
    () => ({
      value: parse(value),
      defaultValue: parse(defaultValue),
      minValue: parse(minValue) ?? undefined,
      maxValue: parse(maxValue) ?? undefined,
      defaultFocusedValue: parse(defaultFocusedValue) ?? undefined,
    }),
    [value, defaultValue, minValue, maxValue, defaultFocusedValue],
  );

  return (
    <I18nProvider locale={tag}>
      <AriaCalendar
        ref={ref}
        value={dates.value}
        defaultValue={dates.defaultValue}
        minValue={dates.minValue}
        maxValue={dates.maxValue}
        defaultFocusedValue={dates.defaultFocusedValue}
        onChange={handleChange}
        isDateUnavailable={isDateUnavailable ? unavailable : undefined}
        firstDayOfWeek={firstDayOfWeek}
        createCalendar={createDateCalendar}
        isDisabled={disabled}
        isReadOnly={readOnly}
        aria-label={rest['aria-label']}
        aria-labelledby={rest['aria-labelledby']}
        render={(domProps) => {
          const label = arabic ? rest['aria-label'] : undefined;
          const kids = Children.toArray(dropHiddenButton(domProps.children));
          if (label && kids.length > 0) kids[0] = arabicHeading(kids[0], label) as (typeof kids)[number];
          return (
            <div
              {...(rest as ComponentProps<'div'>)}
              {...(ownProps(domProps as Props) as ComponentProps<'div'>)}
              aria-label={arabicJoin(domProps['aria-label'], label) as string | undefined}
              // React Aria ends the root with a visually hidden native next
              // button for a reader's virtual cursor. Our own next button is
              // in the header, so it is dropped: no bare button, no 1px target.
              children={kids}
              className={className}
              style={style}
              data-ds="calendar"
              data-size={size}
              data-disabled={flag(disabled)}
              data-readonly={flag(readOnly)}
            />
          );
        }}
      >
        <div data-part="header">
          <Title locale={base} calendar={calendar} />
          <Step slot="previous" label={previousLabel ?? words.previous} size={stepSize} />
          <Step slot="next" label={nextLabel ?? words.next} size={stepSize} />
        </div>
        <Grid size={size} />
      </AriaCalendar>
    </I18nProvider>
  );
}
