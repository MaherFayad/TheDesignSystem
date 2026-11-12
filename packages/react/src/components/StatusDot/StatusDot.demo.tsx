// StatusDot demo. Every dot has its state in words next to it, or as a
// hidden label in the dense table row.
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { StatusDot, type StatusDotTone } from './index';

const tones: { tone: StatusDotTone; en: string; ar: string }[] = [
  { tone: 'neutral', en: 'Offline', ar: 'غير متصل' },
  { tone: 'accent', en: 'Selected', ar: 'محدد' },
  { tone: 'info', en: 'Queued', ar: 'في الانتظار' },
  { tone: 'success', en: 'Online', ar: 'متصل' },
  { tone: 'warning', en: 'Slow connection', ar: 'اتصال بطيء' },
  { tone: 'danger', en: 'Sync failed', ar: 'فشل المزامنة' },
];

const services = ['API', 'Web app', 'Workers', 'Search', 'Storage', 'Email', 'Billing', 'Auth', 'Webhooks', 'Exports', 'Imports', 'Analytics'];

export default function StatusDotDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: every tone in two sizes, a live pulse, and Arabic">
        <DemoRow label="md">
          {tones.map((t) => (
            <StatusDot key={t.tone} tone={t.tone} label={t.en} />
          ))}
        </DemoRow>
        <DemoRow label="sm">
          {tones.map((t) => (
            <StatusDot key={t.tone} tone={t.tone} size="sm" label={t.en} />
          ))}
        </DemoRow>
        <DemoRow label="pulse">
          <StatusDot tone="info" pulse label="Syncing" />
          <StatusDot tone="danger" pulse label="Recording" />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoRow>
            {tones.map((t) => (
              <StatusDot key={t.tone} tone={t.tone} label={t.ar} />
            ))}
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One: a status next to a name">
        <DemoRow>
          <span>Sara Alqahtani</span>
          <StatusDot tone="success" size="sm" label="Online" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many: grouped by state, the heading names it, so each dot hides its label">
        <DemoRow label="Online now">
          {['Sara', 'Omar', 'Lina', 'Fahad'].map((n) => (
            <span key={n}>
              {n} <StatusDot tone="success" size="sm" label="Online" hideLabel />
            </span>
          ))}
        </DemoRow>
        <DemoRow label="Away">
          {['Noura', 'Khalid'].map((n) => (
            <span key={n}>
              {n} <StatusDot tone="warning" size="sm" label="Away" hideLabel />
            </span>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve services wrap onto more lines">
        <DemoRow>
          {services.map((s, i) => (
            <StatusDot key={s} tone={i % 5 === 4 ? 'danger' : 'success'} label={`${s} ${i % 5 === 4 ? 'down' : 'up'}`} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps next to the dot" lang="en">
        <div style={{ maxInlineSize: '16rem' }}>
          <StatusDot tone="warning" label="Sync paused because the device is on a metered connection. It starts again on Wi-Fi." />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ maxInlineSize: '16rem' }}>
          <StatusDot tone="warning" label="المزامنة موقوفة لأن الجهاز على اتصال محدود، وبترجع تشتغل أول ما يتصل بشبكة Wi-Fi" />
        </div>
      </DemoCase>

      <DemoCase id="loading" title="Loading: a live state pulses three times, then stays still">
        <DemoRow>
          <StatusDot tone="info" pulse label="Syncing 12 files" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error">
        <DemoRow>
          <StatusDot tone="danger" label="Payment failed" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
