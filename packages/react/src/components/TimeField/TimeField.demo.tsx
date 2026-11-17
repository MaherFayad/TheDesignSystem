// TimeField demo. Cases: variants (sizes sm, md and lg; the 12 hour cycle of
// en-US and the 24 hour cycle of en-GB), empty (the placeholders), one (a
// pickup time in a Field with its HH:mm value under it), long-text (a long
// label and description), long-arabic (ar-SA: 12 hours, the day period words
// from Intl, the hour at the right, Western digits), error (a time after the
// latest one), disabled, readonly. No many, too-many or loading.
import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Field } from '../Field';
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

export default function TimeFieldDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg; 12 and 24 hours">
        <DemoRow>
          {sizes.map((size) => (
            <TimeField key={size} aria-label={`Time, size ${size}`} locale="en-US" size={size} defaultValue="09:41" />
          ))}
        </DemoRow>
        <DemoRow>
          <TimeField aria-label="Time, 24 hours" locale="en-GB" defaultValue="21:05" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Nothing typed: the placeholders">
        <DemoRow>
          <TimeField aria-label="Start time" locale="en-US" />
          <TimeField aria-label="Start time, 24 hours" locale="en-GB" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="A pickup time in a Field, the HH:mm value under it">
        <Pickup locale="en-US" label="Pickup time" />
      </DemoCase>

      <DemoCase id="long-text" title="A long label and description">
        <Pickup
          locale="en-GB"
          label="Time the driver should wait outside the main entrance of the building"
          description="Type the hour and the minute in 24 hours."
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: 12 hours, the day period from Intl, Western digits" lang="ar">
        <DemoRow>
          <Pickup locale="ar-SA" label="وقت الاستلام" description="الساعة ثم الدقائق ثم الفترة" />
          <Pickup locale="ar-SA" hourCycle={24} label="وقت الاستلام بنظام 24 ساعة" />
        </DemoRow>
        <TimeField aria-label="وقت البدء" locale="ar-SA" />
      </DemoCase>

      <DemoCase id="error" title="A time after closing">
        <Field label="Table time" error="Pick a time on or before 23:00.">
          <TimeField locale="en-GB" defaultValue="23:30" maxValue="23:00" />
        </Field>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <TimeField aria-label="Time, disabled" locale="en-US" disabled defaultValue="09:41" />
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <TimeField aria-label="Time, read only" locale="en-US" readOnly defaultValue="09:41" />
      </DemoCase>
    </DemoPage>
  );
}
