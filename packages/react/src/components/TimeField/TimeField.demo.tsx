// TimeField demo. Cases: variants (sizes sm, md and lg; the 12 hour cycle of
// en-US and the 24 hour cycle of en-GB), empty (the placeholders), one (a
// pickup time in a Field with its HH:mm value under it), long-text (a long
// label and description), long-arabic (ar-SA: 12 hours, the day period words
// from Intl, the hour at the right, Western digits), error (a time after the
// latest one), disabled, readonly. No many, too-many or loading. The copy
// and the locale follow the page language: with lang=ar every case reads
// Arabic (ar-SA, 12 hours, and 24 hours where the English case shows en-GB).
import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Field } from '../Field';
import { isArabic } from '../Popover/FloatingLayer';
import { TimeField, type TimeFieldSize } from './index';

const sizes: TimeFieldSize[] = ['sm', 'md', 'lg'];
const note = { margin: 0, marginBlockStart: 'var(--ds-space-xs)', fontVariantNumeric: 'tabular-nums' } as const;

/** A time in a Field with the HH:mm value under it. */
function Pickup({ locale, label, description, hourCycle }: { locale: string; label: string; description?: string; hourCycle?: 12 | 24 }) {
  const [value, setValue] = useState<string | null>('21:05');
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-2xs)', justifyItems: 'start', minInlineSize: 0 }}>
      <Field label={label} description={description}>
        <TimeField locale={locale} hourCycle={hourCycle} value={value} onChange={setValue} name="pickup-time" />
      </Field>
      <p style={note} lang="en" dir="ltr">
        value: {value ?? 'none'}
      </p>
    </div>
  );
}

const words = {
  en: {
    /** 12 hours. */
    locale: 'en-US',
    /** 24 hours: en-GB has it by default, so no hour cycle is passed. */
    locale24: 'en-GB',
    cycle24: undefined,
    size: (size: string) => `Time, size ${size}`,
    time24: 'Time, 24 hours',
    start: 'Start time',
    start24: 'Start time, 24 hours',
    pickup: 'Pickup time',
    longLabel: 'Time the driver should wait outside the main entrance of the building',
    longHint: 'Type the hour and the minute in 24 hours.',
    table: 'Table time',
    error: 'Pick a time on or before 23:00.',
    disabled: 'Time, disabled',
    readOnly: 'Time, read only',
  },
  ar: {
    locale: 'ar-SA',
    locale24: 'ar-SA',
    cycle24: 24,
    size: (size: string) => `الوقت، المقاس ${size}`,
    time24: 'الوقت بنظام 24 ساعة',
    start: 'وقت البدء',
    start24: 'وقت البدء بنظام 24 ساعة',
    pickup: 'وقت الاستلام',
    longLabel: 'الوقت اللي ينتظر فيه السواق قدام المدخل الرئيسي للمبنى',
    longHint: 'اكتب الساعة والدقائق بنظام 24 ساعة.',
    table: 'وقت الطاولة',
    error: 'اختر وقت الساعة 23:00 أو قبلها.',
    disabled: 'الوقت، غير متاح',
    readOnly: 'الوقت، للقراءة فقط',
  },
} as const;

export default function TimeFieldDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg; 12 and 24 hours">
        <DemoRow>
          {sizes.map((size) => (
            <TimeField key={size} aria-label={w.size(size)} locale={w.locale} size={size} defaultValue="09:41" />
          ))}
        </DemoRow>
        <DemoRow>
          <TimeField aria-label={w.time24} locale={w.locale24} hourCycle={w.cycle24} defaultValue="21:05" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Nothing typed: the placeholders">
        <DemoRow>
          <TimeField aria-label={w.start} locale={w.locale} />
          <TimeField aria-label={w.start24} locale={w.locale24} hourCycle={w.cycle24} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="A pickup time in a Field, the HH:mm value under it">
        <Pickup locale={w.locale} label={w.pickup} />
      </DemoCase>

      <DemoCase id="long-text" title="A long label and description">
        <Pickup locale={w.locale24} hourCycle={w.cycle24} label={w.longLabel} description={w.longHint} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: 12 hours, the day period from Intl, Western digits" lang="ar">
        <DemoRow>
          <Pickup locale="ar-SA" label="وقت الاستلام" description="الساعة ثم الدقائق ثم الفترة" />
          <Pickup locale="ar-SA" hourCycle={24} label="وقت الاستلام بنظام 24 ساعة" />
        </DemoRow>
        <TimeField aria-label="وقت البدء" locale="ar-SA" />
      </DemoCase>

      <DemoCase id="error" title="A time after closing">
        <Field label={w.table} error={w.error}>
          <TimeField locale={w.locale24} hourCycle={w.cycle24} defaultValue="23:30" maxValue="23:00" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <TimeField aria-label={w.disabled} locale={w.locale} disabled defaultValue="09:41" />
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <TimeField aria-label={w.readOnly} locale={w.locale} readOnly defaultValue="09:41" />
      </DemoCase>
    </DemoPage>
  );
}
