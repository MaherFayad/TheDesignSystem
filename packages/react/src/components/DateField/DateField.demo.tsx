// DateField demo. Cases: variants (sizes sm, md and lg; Gregorian and Umm
// al-Qura), empty (the placeholders), one (a birth date in a Field with its
// ISO value under it), long-text (a long label and description), long-arabic
// (ar-SA in both calendars: day, month, year from Intl, Western digits),
// error (a date after the latest one), disabled, readonly. No many,
// too-many or loading: a date field holds one date and never waits. The
// copy and the locale follow the page language: with lang=ar every case
// reads Arabic (ar-SA).
import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field';
import { isArabic } from '../Popover/FloatingLayer';
import { DateField, type DateFieldSize } from './index';

const sizes: DateFieldSize[] = ['sm', 'md', 'lg'];
const note = { margin: 0, marginBlockStart: 'var(--ds-space-xs)', fontVariantNumeric: 'tabular-nums' } as const;

/** A date in a Field with the ISO value under it. */
function Birth({ locale, label, description, calendar = 'gregory' }: { locale: string; label: string; description?: string; calendar?: 'gregory' | 'islamic-umalqura' }) {
  const [value, setValue] = useState<string | null>('1994-03-21');
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)', justifyItems: 'start', minInlineSize: 0 }}>
      <Field label={label} description={description}>
        <DateField locale={locale} calendar={calendar} value={value} onChange={setValue} name="birth-date" />
      </Field>
      <p style={note} lang="en" dir="ltr">
        value: {value ?? 'none'}
      </p>
    </div>
  );
}

const words = {
  en: {
    locale: 'en-GB',
    size: (size: string) => `Date, size ${size}`,
    hijri: 'Date, Umm al-Qura',
    expiry: 'Expiry date',
    other: { label: 'Expiry date, United States order', locale: 'en-US', calendar: undefined },
    birth: 'Birth date',
    longLabel: 'Date of issue of the national identity card, as printed on the back',
    longHint: 'Type the day, the month and the year. The arrow keys step each part.',
    appointment: 'Appointment date',
    error: 'Pick a date on or before 31 December 2026.',
    disabled: 'Date, disabled',
    readOnly: 'Date, read only',
  },
  ar: {
    locale: 'ar-SA',
    size: (size: string) => `التاريخ، المقاس ${size}`,
    hijri: 'التاريخ بتقويم أم القرى',
    expiry: 'تاريخ الانتهاء',
    other: { label: 'تاريخ الانتهاء بالهجري', locale: 'ar-SA', calendar: 'islamic-umalqura' },
    birth: 'تاريخ الميلاد',
    longLabel: 'تاريخ إصدار بطاقة الهوية الوطنية، مثل ما هو مكتوب على ظهرها',
    longHint: 'اكتب اليوم والشهر والسنة. الأسهم تغير كل جزء.',
    appointment: 'تاريخ الموعد',
    error: 'اختر تاريخ في 31 ديسمبر 2026 أو قبله.',
    disabled: 'التاريخ، غير متاح',
    readOnly: 'التاريخ، للقراءة فقط',
  },
} as const;

export default function DateFieldDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg; Gregorian and Umm al-Qura">
        <DemoRow>
          {sizes.map((size) => (
            <DateField key={size} aria-label={w.size(size)} locale={w.locale} size={size} defaultValue="2026-11-17" />
          ))}
        </DemoRow>
        <DemoRow>
          <DateField aria-label={w.hijri} locale={w.locale} calendar="islamic-umalqura" defaultValue="2026-11-17" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Nothing typed: the placeholders of the locale">
        <DemoRow>
          <DateField aria-label={w.expiry} locale={w.locale} />
          <DateField aria-label={w.other.label} locale={w.other.locale} calendar={w.other.calendar} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="A birth date in a Field, the ISO value under it">
        <Birth locale={w.locale} label={w.birth} />
      </DemoCase>

      <DemoCase id="long-text" title="A long label and description">
        <Birth locale={w.locale} label={w.longLabel} description={w.longHint} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: Gregorian and Umm al-Qura, Western digits" lang="ar">
        <DemoRow>
          <Birth locale="ar-SA" label="تاريخ الميلاد" description="اليوم ثم الشهر ثم السنة" />
          <Birth locale="ar-SA" calendar="islamic-umalqura" label="تاريخ الميلاد بالهجري" description="التاريخ بتقويم أم القرى" />
        </DemoRow>
        <DateField aria-label="تاريخ انتهاء الهوية" locale="ar-SA" />
      </DemoCase>

      <DemoCase id="error" title="A date after the latest one">
        <Field label={w.appointment} error={w.error}>
          <DateField locale={w.locale} defaultValue="2027-01-14" maxValue="2026-12-31" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DateField aria-label={w.disabled} locale={w.locale} disabled defaultValue="2026-11-17" />
      </DemoCase>

      <DemoCase id="readonly" title="Read only: segments take focus, typing changes nothing">
        <DateField aria-label={w.readOnly} locale={w.locale} readOnly defaultValue="2026-11-17" />
      </DemoCase>
    </DemoPage>
  );
}
