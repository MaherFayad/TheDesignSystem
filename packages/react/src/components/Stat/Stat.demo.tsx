// Stat demo. Cases: variants, empty, one, many, too-many, long-text,
// long-arabic, loading. No error, disabled or readonly: a KPI has no input,
// and a failed load is the page's message, not a state of the number.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Stat, type StatSize } from './index';

const sizes: StatSize[] = ['sm', 'md', 'lg'];

const sar: Intl.NumberFormatOptions = { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 };

const kpis = [
  { label: 'Active users', value: 12480, delta: 0.124, hint: 'Since last month', icon: 'user' as const },
  { label: 'Revenue', value: 482300, format: sar, delta: 0.031, hint: 'Since last month' },
  { label: 'Failed payments', value: 37, delta: -0.18, tone: 'success' as const, hint: 'Fewer is better' },
  { label: 'Average reply time', value: 14, format: { style: 'unit', unit: 'minute' } as Intl.NumberFormatOptions, delta: 0, hint: 'Same as last week', icon: 'clock' as const },
];

const kpisAr = [
  { label: 'المستخدمين النشطين', value: 12480, delta: 0.124, hint: 'مقارنة بالشهر الماضي', icon: 'user' as const },
  { label: 'الإيرادات', value: 482300, format: sar, delta: -0.042, hint: 'مقارنة بالشهر الماضي' },
];

const many = [
  'Signups', 'Orders', 'Refunds', 'Visits', 'Bounce rate', 'Sessions',
  'New boards', 'Shared links', 'Comments', 'Exports', 'Invites sent', 'Seats used',
];

/** A stat whose value changes on a button, to show the number roll. */
function Rolling() {
  const [value, setValue] = useState(1240);
  return (
    <DemoRow>
      <Stat label="Live visitors" value={value} delta={(value - 1240) / 1240} hint="Since you opened the page" />
      <Button size="sm" onClick={() => setValue((v) => v + 37)}>
        Add visitors
      </Button>
    </DemoRow>
  );
}

export default function StatDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: three sizes, up, down and flat, a tone for when down is good, and Arabic">
        {sizes.map((size) => (
          <DemoGrid key={size} min={size === 'lg' ? '16rem' : '12rem'}>
            {kpis.map((k) => (
              <Stat key={k.label} size={size} {...k} />
            ))}
          </DemoGrid>
        ))}
        <Rolling />
        <Theme lang="ar">
          <DemoGrid min="12rem">
            {kpisAr.map((k) => (
              <Stat key={k.label} {...k} />
            ))}
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: no data yet">
        <DemoGrid min="12rem">
          <Stat label="Conversion rate" value="No data" hint="Shows after the first 100 visits" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One stat with a hint and no change">
        <DemoGrid min="12rem">
          <Stat label="Boards" value={42} hint="Across 3 teams" icon="grid" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="many" title="Many: a row of four">
        <DemoGrid min="12rem">
          {kpis.map((k) => (
            <Stat key={k.label} {...k} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve small stats">
        <DemoGrid min="9rem">
          {many.map((label, i) => (
            <Stat key={label} size="sm" label={label} value={(i + 3) * 1371} delta={((i % 5) - 2) / 40} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text and large numbers">
        <DemoGrid min="12rem">
          <Stat
            label="Monthly recurring revenue from annual plans billed in other currencies"
            value={1234567890}
            format={sar}
            delta={0.2468}
            hint="Converted at the rate of the first day of the month, before tax and refunds"
          />
          <Stat
            label="Storage used"
            value={18.4}
            format={{ style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }}
            delta={1.5}
            hint="Of 50 GB on this plan"
          />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoGrid min="12rem">
          <Stat
            label="الإيرادات الشهرية المتكررة من الاشتراكات السنوية بعملات ثانية"
            value={1234567890}
            format={sar}
            delta={-0.0275}
            hint="محسوبة بسعر الصرف في أول يوم من الشهر، قبل الضريبة والمبالغ المستردة"
          />
          <Stat label="متوسط وقت الرد" value={14} format={{ style: 'unit', unit: 'minute', unitDisplay: 'long' }} delta={0} hint="نفس الأسبوع الماضي" icon="clock" />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <DemoGrid min="12rem">
          <Stat label="Active users" loading hint="Since last month" />
          <Stat label="Revenue" loading delta={0.1} />
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
