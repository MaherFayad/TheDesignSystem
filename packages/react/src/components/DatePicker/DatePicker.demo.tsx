// DatePicker demo. Cases: variants (compact and inline, date only and date
// with time, sizes sm and lg), empty (no value: the Add date and Add time chips), one (an
// event start with bounds and booked days, the ISO value under it),
// long-text (a long label, and the calendar a person picks), long-arabic
// (ar-SA in Gregorian and Umm al-Qura, compact and inline, the time chip at
// the left of the date chip, Western digits), error, disabled, readonly.
// No many, too-many or loading: a picker holds one value and never waits.
// The copy and the locale follow the page language: with lang=ar every case
// reads Arabic (ar-SA).
import { useState, type CSSProperties, type ReactNode } from 'react';
import type { CalendarSystem } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field';
import { isArabic } from '../Popover/FloatingLayer';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { DatePicker } from './index';

/** A grouped row: the surface a phone settings list draws. */
const row: CSSProperties = {
  boxSizing: 'border-box',
  inlineSize: '100%',
  maxInlineSize: '24rem',
  paddingBlock: 'var(--ds-space-xs)',
  paddingInline: 'var(--ds-space-m)',
  borderRadius: 'var(--ds-radius-card)',
  backgroundColor: 'var(--ds-color-bg-surface)',
};
const note: CSSProperties = { margin: 0, marginBlockStart: 'var(--ds-space-xs)', fontVariantNumeric: 'tabular-nums' };
/** Fridays in November 2026 are booked. */
const booked = (iso: string) => ['2026-11-13', '2026-11-20', '2026-11-27'].includes(iso);

function Row({ children }: { children: ReactNode }) {
  return <div style={row}>{children}</div>;
}

/** A controlled picker with its value under it. */
function WithValue({
  start,
  children,
}: {
  start: string | null;
  children: (value: string | null, set: (v: string | null) => void) => ReactNode;
}) {
  const [value, setValue] = useState<string | null>(start);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)', minInlineSize: 0, maxInlineSize: '100%' }}>
      {children(value, setValue)}
      <p style={note} lang="en" dir="ltr">
        value: {value ?? 'none'}
      </p>
    </div>
  );
}

/** The consumer picks the calendar; the value stays the same ISO date. */
function CalendarChoice({ locale }: { locale: 'en-SA' | 'ar-SA' }) {
  const [calendar, setCalendar] = useState<CalendarSystem>('islamic-umalqura');
  const ar = locale === 'ar-SA';
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', justifyItems: 'start', minInlineSize: 0 }}>
      <SegmentedControl aria-label={ar ? 'نوع التقويم' : 'Calendar'} value={calendar} onValueChange={(v) => setCalendar(v as CalendarSystem)}>
        <SegmentedControlItem value="islamic-umalqura">{ar ? 'هجري' : 'Hijri'}</SegmentedControlItem>
        <SegmentedControlItem value="gregory">{ar ? 'ميلادي' : 'Gregorian'}</SegmentedControlItem>
      </SegmentedControl>
      <WithValue start="2026-11-17T09:41">
        {(value, set) => (
          <Row>
            <DatePicker
              label={ar ? 'موعد الرحلة' : 'Departure'}
              locale={locale}
              calendar={calendar}
              granularity="minute"
              value={value}
              onChange={set}
            />
          </Row>
        )}
      </WithValue>
    </div>
  );
}

const words = {
  en: {
    locale: 'en-SA',
    date: 'Date',
    starts: 'Starts',
    sm: 'Size sm',
    lg: 'Size lg',
    delivery: 'Delivery date',
    pickup: 'Pickup',
    reminder: 'Reminder',
    event: 'Event start',
    long: 'Date the furniture should reach the new apartment',
    back: 'Return date',
    error: 'Pick a return date after the departure date.',
  },
  ar: {
    locale: 'ar-SA',
    date: 'التاريخ',
    starts: 'البداية',
    sm: 'المقاس sm',
    lg: 'المقاس lg',
    delivery: 'تاريخ التوصيل',
    pickup: 'الاستلام',
    reminder: 'التذكير',
    event: 'بداية الفعالية',
    long: 'التاريخ اللي لازم يوصل فيه الأثاث للشقة الجديدة',
    back: 'تاريخ العودة',
    error: 'اختر تاريخ عودة بعد تاريخ الرحلة.',
  },
} as const;

export default function DatePickerDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Compact and inline; a date, and a date with a time">
        <DemoRow>
          <Row>
            <DatePicker label={w.date} locale={w.locale} defaultValue="2026-06-18" />
          </Row>
          <Row>
            <DatePicker label={w.starts} locale={w.locale} granularity="minute" defaultValue="2026-06-18T09:41" />
          </Row>
        </DemoRow>
        <DemoRow>
          <Row>
            <DatePicker label={w.sm} size="sm" locale={w.locale} granularity="minute" defaultValue="2026-06-18T09:41" />
          </Row>
          <Row>
            <DatePicker label={w.lg} size="lg" locale={w.locale} granularity="minute" defaultValue="2026-06-18T09:41" />
          </Row>
        </DemoRow>
        <DemoRow>
          <DatePicker variant="inline" aria-label={w.delivery} locale={w.locale} defaultValue="2026-06-18" />
          <DatePicker variant="inline" aria-label={w.pickup} locale={w.locale} granularity="minute" defaultValue="2026-06-18T09:41" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="No value yet: Add date and Add time">
        <Row>
          <DatePicker label={w.reminder} locale={w.locale} granularity="minute" />
        </Row>
      </DemoCase>

      <DemoCase id="one" title="An event start: from 5 November, Fridays booked, the ISO value under it">
        <WithValue start="2026-11-17T18:30">
          {(value, set) => (
            <Row>
              <DatePicker
                label={w.event}
                locale={w.locale}
                granularity="minute"
                minuteStep={5}
                minValue="2026-11-05"
                maxValue="2027-01-31"
                isDateUnavailable={booked}
                value={value}
                onChange={set}
                name="event-start"
              />
            </Row>
          )}
        </WithValue>
      </DemoCase>

      <DemoCase id="long-text" title="A long label, and the calendar a person picks">
        <Row>
          <DatePicker label={w.long} locale={w.locale} defaultValue="2026-11-17" />
        </Row>
        <CalendarChoice locale={w.locale} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: Gregorian and Umm al-Qura, the time chip at the left" lang="ar">
        <DemoRow>
          <Row>
            <DatePicker label="موعد الحجز" locale="ar-SA" granularity="minute" defaultValue="2026-11-17T21:05" />
          </Row>
          <Row>
            <DatePicker label="موعد الحجز بالهجري" locale="ar-SA" calendar="islamic-umalqura" granularity="minute" defaultValue="2026-11-17T21:05" />
          </Row>
        </DemoRow>
        <DemoRow>
          <DatePicker variant="inline" aria-label="تاريخ التوصيل" locale="ar-SA" calendar="islamic-umalqura" granularity="minute" defaultValue="2026-11-17T21:05" />
        </DemoRow>
        <CalendarChoice locale="ar-SA" />
      </DemoCase>

      <DemoCase id="error" title="Invalid, with the Field error">
        <Field label={w.back} error={w.error}>
          <DatePicker locale={w.locale} defaultValue="2026-11-10" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Row>
          <DatePicker label={w.starts} locale={w.locale} granularity="minute" disabled defaultValue="2026-06-18T09:41" />
        </Row>
      </DemoCase>

      <DemoCase id="readonly" title="Read only: the chips show the value and open nothing">
        <Row>
          <DatePicker label={w.starts} locale={w.locale} granularity="minute" readOnly defaultValue="2026-06-18T09:41" />
        </Row>
      </DemoCase>
    </DemoPage>
  );
}
