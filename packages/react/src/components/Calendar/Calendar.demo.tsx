// Calendar demo. Cases: variants (sizes, and the two calendars), empty
// (nothing picked, the month of today), one (a pick with min and max and
// booked days, the ISO value under it), long-text (the calendar a person
// picks, with the ISO value that stays the same), long-arabic (Gregorian
// and Umm al-Qura in Arabic, the week from Sunday, the arrows mirrored),
// disabled, readonly. No many, too-many, loading or error: a month grid
// always holds one month, it has no loading state, and a day that cannot
// be picked is unavailable, not an error.
import { useState } from 'react';
import { fromIsoDate, monthTitle, type CalendarSystem } from '@the-system/shared';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { SegmentedControl, SegmentedControlItem } from '../SegmentedControl';
import { Calendar, type CalendarSize } from './index';

const sizes: CalendarSize[] = ['sm', 'md', 'lg'];
/** Fridays in November 2026 are booked in the booking cases. */
const booked = (iso: string) => ['2026-11-13', '2026-11-20', '2026-11-27'].includes(iso);
const note = { margin: 0, marginBlockStart: 'var(--ds-space-xs)', fontVariantNumeric: 'tabular-nums' } as const;

/** A pick with bounds and booked days, the ISO value drawn under it. */
function Booking({ locale, calendar, label }: { locale: string; calendar: CalendarSystem; label: string }) {
  const [value, setValue] = useState<string | null>('2026-11-17');
  return (
    <div>
      <Calendar
        aria-label={label}
        locale={locale}
        calendar={calendar}
        value={value}
        onChange={setValue}
        minValue="2026-11-05"
        maxValue="2027-01-31"
        isDateUnavailable={booked}
      />
      <p style={note} lang="en" dir="ltr">
        value: {value ?? 'none'}
      </p>
    </div>
  );
}

/** The consumer picks the calendar; the value stays the same ISO Gregorian date. */
function CalendarChoice({ locale }: { locale: 'en-SA' | 'ar-SA' }) {
  const [calendar, setCalendar] = useState<CalendarSystem>('islamic-umalqura');
  const [value, setValue] = useState<string | null>('2026-11-17');
  const ar = locale === 'ar-SA';
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', justifyItems: 'start' }}>
      <SegmentedControl aria-label={ar ? 'نوع التقويم' : 'Calendar'} value={calendar} onValueChange={(v) => setCalendar(v as CalendarSystem)}>
        <SegmentedControlItem value="islamic-umalqura">{ar ? 'هجري أم القرى' : 'Hijri, Umm al-Qura'}</SegmentedControlItem>
        <SegmentedControlItem value="gregory">{ar ? 'ميلادي' : 'Gregorian'}</SegmentedControlItem>
      </SegmentedControl>
      <Calendar aria-label={ar ? 'تاريخ الموعد' : 'Appointment date'} locale={locale} calendar={calendar} value={value} onChange={setValue} />
      <p style={note}>
        {value ? `${monthTitle(value, locale, calendar)}, ${fromIsoDate(value, calendar).day}` : ''}
      </p>
      <p style={note} lang="en" dir="ltr">
        ISO: {value ?? 'none'}
      </p>
    </div>
  );
}

export default function CalendarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg; Gregorian and Umm al-Qura">
        <DemoRow>
          {sizes.map((size) => (
            <Calendar key={size} aria-label={`Date, size ${size}`} locale="en-SA" size={size} defaultValue="2026-11-17" />
          ))}
        </DemoRow>
        <DemoRow>
          <Calendar aria-label="Date, Umm al-Qura" locale="en-SA" calendar="islamic-umalqura" defaultValue="2026-11-17" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Nothing picked: the month of today, today marked">
        <Calendar aria-label="Delivery date" locale="en-SA" />
      </DemoCase>

      <DemoCase id="one" title="A booking: from 5 November, Fridays booked, the ISO value under it">
        <Booking locale="en-SA" calendar="gregory" label="Booking date" />
      </DemoCase>

      <DemoCase id="long-text" title="The calendar a person picks; the value stays the same ISO date">
        <CalendarChoice locale="en-SA" />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: Gregorian and Umm al-Qura, the week from Sunday" lang="ar">
        <DemoRow>
          <Booking locale="ar-SA" calendar="gregory" label="تاريخ الحجز" />
          <Booking locale="ar-SA" calendar="islamic-umalqura" label="تاريخ الحجز بالهجري" />
        </DemoRow>
        <CalendarChoice locale="ar-SA" />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Calendar aria-label="Date, disabled" locale="en-SA" disabled defaultValue="2026-11-17" />
      </DemoCase>

      <DemoCase id="readonly" title="Read only: days take focus, a press picks nothing">
        <Calendar aria-label="Date, read only" locale="en-SA" readOnly defaultValue="2026-11-17" />
      </DemoCase>
    </DemoPage>
  );
}
