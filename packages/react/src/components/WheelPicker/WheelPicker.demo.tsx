// WheelPicker demo. Cases: variants (a 12 hour time in English, a 24 hour
// time with a 5 minute step, one short column), one (one column of four
// values), many (a 24 hour time with every minute), too-many (one column of
// 300 values that does not loop), long-text (rows longer than the column),
// long-arabic (an ar-SA time with Latin digits and the Intl day period
// words, hours at the right, and a column of Arabic words), disabled (a
// disabled wheel, and a column with rows that cannot be chosen). No empty,
// loading, error or readonly: a wheel always has rows and a value. The
// copy and the locale follow the page language: with lang=ar every case
// reads Arabic (ar-SA, and 24 hours where the English case shows en-GB).
import { useMemo, useState, type CSSProperties } from 'react';
import { wheelTimeColumns, wheelTimeFromValues, type WheelColumn, type WheelValue } from '@the-system/shared';
import { DemoCase, DemoPage } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { isArabic } from '../Popover/FloatingLayer';
import { WheelPicker } from './index';

const frame: CSSProperties = {
  display: 'grid',
  gap: 'var(--ds-space-xs)',
  inlineSize: '100%',
  maxInlineSize: '20rem',
  paddingBlock: 'var(--ds-space-s)',
  borderRadius: 'var(--ds-radius-card)',
  backgroundColor: 'var(--ds-color-bg-surface)',
};

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-l)', alignItems: 'start' };

const readout: CSSProperties = { margin: 0, paddingInline: 'var(--ds-space-s)', color: 'var(--ds-color-text-muted)', fontSize: 'var(--ds-font-size-m)' };

const pad = (n: number) => String(n).padStart(2, '0');

interface TimeProps {
  locale: string;
  hourCycle?: 12 | 24;
  minuteStep?: number;
  start: { hour: number; minute: number };
  label: string;
  /** The words before the chosen time in the readout. */
  chosen: string;
}

/** A time wheel with a line under it that says the time it is set to. */
function TimeWheel({ locale, hourCycle, minuteStep, start, label, chosen }: TimeProps) {
  const base = useMemo(() => wheelTimeColumns({ locale, hourCycle, minuteStep, value: start }), [locale, hourCycle, minuteStep, start]);
  const cycle = base.some((c) => c.id === 'dayPeriod') ? 12 : 24;
  const [values, setValues] = useState<Record<string, WheelValue>>(() => Object.fromEntries(base.map((c) => [c.id, c.value!])));
  const columns = base.map((c) => ({ ...c, value: values[c.id] }));
  const time = wheelTimeFromValues(values, cycle);
  const text =
    cycle === 12
      ? `${((time.hour + 11) % 12) + 1}:${pad(time.minute)} ${base.find((c) => c.id === 'dayPeriod')!.options[time.hour >= 12 ? 1 : 0]!.label}`
      : `${pad(time.hour)}:${pad(time.minute)}`;
  return (
    <div style={frame}>
      <WheelPicker columns={columns} label={label} onChange={(id, value) => setValues((v) => ({ ...v, [id]: value }))} />
      <p style={readout}>
        {chosen} <bdi>{text}</bdi>
      </p>
    </div>
  );
}

interface ListProps {
  column: WheelColumn;
  label: string;
  loop?: boolean;
  disabled?: boolean;
  chosen: string;
}

/** One column with a line under it that says the chosen row. */
function ListWheel({ column, label, loop, disabled, chosen }: ListProps) {
  const [value, setValue] = useState<WheelValue | undefined>(column.defaultValue ?? column.options[0]?.value);
  const shown = column.options.find((o) => o.value === value);
  return (
    <div style={frame}>
      <WheelPicker columns={[{ ...column, value }]} label={label} loop={loop} disabled={disabled} onChange={(_, v) => setValue(v)} />
      <p style={readout}>
        {chosen} <bdi>{shown?.label ?? String(value)}</bdi>
      </p>
    </div>
  );
}

const snoozeAr: WheelColumn = {
  id: 'snooze',
  label: 'مدة الغفوة',
  options: [5, 10, 15, 20, 30].map((m) => ({ value: m, label: m <= 10 ? `${m} دقائق` : `${m} دقيقة` })),
  defaultValue: 10,
};

const seatsAr: WheelColumn = { id: 'seats', label: 'المقاعد', options: [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })), defaultValue: 2 };

const distanceAr: WheelColumn = {
  id: 'distance',
  label: 'المسافة بالكيلومتر',
  options: Array.from({ length: 300 }, (_, i) => ({ value: i + 1, label: `${i + 1} كم` })),
  defaultValue: 42,
};

const snooze: WheelColumn = {
  id: 'snooze',
  label: 'Snooze length',
  options: [5, 10, 15, 20, 30].map((m) => ({ value: m, label: `${m} min` })),
  defaultValue: 10,
};

const seats: WheelColumn = {
  id: 'seats',
  label: 'Seats',
  options: [1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })),
  defaultValue: 2,
};

const distance: WheelColumn = {
  id: 'distance',
  label: 'Distance in kilometres',
  options: Array.from({ length: 300 }, (_, i) => ({ value: i + 1, label: `${i + 1} km` })),
  defaultValue: 42,
};

const repeatEn: WheelColumn = {
  id: 'repeat',
  label: 'Repeat',
  options: [
    { value: 'never', label: 'Never' },
    { value: 'day', label: 'Every day' },
    { value: 'weekday', label: 'Every weekday, Sunday to Thursday' },
    { value: 'other', label: 'Every other week on the same day' },
    { value: 'month', label: 'On the last working day of every month' },
  ],
  defaultValue: 'weekday',
};

const repeatAr: WheelColumn = {
  id: 'repeat',
  label: 'التكرار',
  options: [
    { value: 'never', label: 'بدون تكرار' },
    { value: 'day', label: 'كل يوم' },
    { value: 'weekday', label: 'كل أيام الدوام من الأحد إلى الخميس' },
    { value: 'other', label: 'كل أسبوعين في نفس اليوم' },
    { value: 'month', label: 'آخر يوم دوام في كل شهر' },
  ],
  defaultValue: 'weekday',
};

const slots: WheelColumn = {
  id: 'slot',
  label: 'Table time',
  options: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'].map((t, i) => ({ value: t, label: t, disabled: i === 2 || i === 3 || i === 5 })),
  defaultValue: '18:30',
};

const slotsAr: WheelColumn = { ...slots, label: 'وقت الطاولة' };

const words = {
  en: {
    locale: 'en-US',
    locale24: 'en-GB',
    cycle24: undefined,
    snooze,
    seats,
    distance,
    repeat: repeatEn,
    slots,
    alarm: 'Alarm time',
    alarmAt: 'Alarm at',
    reminder: 'Reminder time',
    reminderAt: 'Reminder at',
    snoozeLabel: 'Snooze',
    snoozeFor: 'Snooze for',
    seatsLabel: 'Seats',
    seatsChosen: 'Seats:',
    departure: 'Departure time',
    departs: 'Departs at',
    distanceLabel: 'Distance',
    distanceChosen: 'Distance:',
    repeatLabel: 'Repeat',
    repeats: 'Repeats:',
    snoozeOff: 'Snooze, not available',
    table: 'Table time',
    tableAt: 'Table at',
  },
  ar: {
    locale: 'ar-SA',
    locale24: 'ar-SA',
    cycle24: 24,
    snooze: snoozeAr,
    seats: seatsAr,
    distance: distanceAr,
    repeat: repeatAr,
    slots: slotsAr,
    alarm: 'وقت المنبه',
    alarmAt: 'المنبه الساعة',
    reminder: 'وقت التذكير',
    reminderAt: 'التذكير الساعة',
    snoozeLabel: 'الغفوة',
    snoozeFor: 'الغفوة لمدة',
    seatsLabel: 'المقاعد',
    seatsChosen: 'المقاعد:',
    departure: 'وقت المغادرة',
    departs: 'المغادرة الساعة',
    distanceLabel: 'المسافة',
    distanceChosen: 'المسافة:',
    repeatLabel: 'التكرار',
    repeats: 'التكرار:',
    snoozeOff: 'الغفوة، غير متاحة',
    table: 'وقت الطاولة',
    tableAt: 'الطاولة الساعة',
  },
} as const;

export default function WheelPickerDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="A 12 hour time, a 24 hour time in 5 minute steps, one short column">
        <div style={row}>
          <TimeWheel locale={w.locale} start={{ hour: 9, minute: 41 }} label={w.alarm} chosen={w.alarmAt} />
          <TimeWheel locale={w.locale24} hourCycle={w.cycle24} minuteStep={5} start={{ hour: 18, minute: 30 }} label={w.reminder} chosen={w.reminderAt} />
          <ListWheel column={w.snooze} label={w.snoozeLabel} chosen={w.snoozeFor} />
        </div>
      </DemoCase>

      <DemoCase id="one" title="One column of four values">
        <ListWheel column={w.seats} label={w.seatsLabel} chosen={w.seatsChosen} />
      </DemoCase>

      <DemoCase id="many" title="A 24 hour time with every minute: both columns loop">
        <TimeWheel locale={w.locale24} hourCycle={w.cycle24} start={{ hour: 23, minute: 58 }} label={w.departure} chosen={w.departs} />
      </DemoCase>

      <DemoCase id="too-many" title="300 values that do not loop">
        <ListWheel column={w.distance} label={w.distanceLabel} chosen={w.distanceChosen} />
      </DemoCase>

      <DemoCase id="long-text" title="Rows longer than the column end with an ellipsis">
        <ListWheel column={w.repeat} label={w.repeatLabel} chosen={w.repeats} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic, ar-SA: Latin digits, the Intl day period, hours at the right" lang="ar">
        <div style={row}>
          <TimeWheel locale="ar-SA" start={{ hour: 21, minute: 41 }} label="وقت المنبه" chosen="المنبه الساعة" />
          <ListWheel column={repeatAr} label="التكرار" chosen="التكرار:" />
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="A disabled wheel, and a column with times that are taken">
        <div style={row}>
          <ListWheel column={w.snooze} label={w.snoozeOff} disabled chosen={w.snoozeFor} />
          <ListWheel column={w.slots} label={w.table} chosen={w.tableAt} />
        </div>
      </DemoCase>
    </DemoPage>
  );
}
