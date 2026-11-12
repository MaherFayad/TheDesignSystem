// StatusDot demo: the same cases, ids and copy as
// packages/react/src/components/StatusDot/StatusDot.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsStatusDot, type StatusDotTone } from './status-dot';

const tones: { tone: StatusDotTone; en: string; ar: string }[] = [
  { tone: 'neutral', en: 'Offline', ar: 'غير متصل' },
  { tone: 'accent', en: 'Selected', ar: 'محدد' },
  { tone: 'info', en: 'Queued', ar: 'في الانتظار' },
  { tone: 'success', en: 'Online', ar: 'متصل' },
  { tone: 'warning', en: 'Slow connection', ar: 'اتصال بطيء' },
  { tone: 'danger', en: 'Sync failed', ar: 'فشل المزامنة' },
];

const services = ['API', 'Web app', 'Workers', 'Search', 'Storage', 'Email', 'Billing', 'Auth', 'Webhooks', 'Exports', 'Imports', 'Analytics'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsStatusDot, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: every tone in two sizes, a live pulse, and Arabic">
      <div data-demo="row" [label]="'md'">
        @for (t of tones; track t.tone) {
          <span dsStatusDot [tone]="t.tone" [label]="t.en"></span>
        }
      </div>
      <div data-demo="row" [label]="'sm'">
        @for (t of tones; track t.tone) {
          <span dsStatusDot [tone]="t.tone" size="sm" [label]="t.en"></span>
        }
      </div>
      <div data-demo="row" [label]="'pulse'">
        <span dsStatusDot tone="info" pulse label="Syncing"></span>
        <span dsStatusDot tone="danger" pulse label="Recording"></span>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          @for (t of tones; track t.tone) {
            <span dsStatusDot [tone]="t.tone" [label]="t.ar"></span>
          }
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One: a status next to a name">
      <div data-demo="row">
        <span>Sara Alqahtani</span>
        <span dsStatusDot tone="success" size="sm" label="Online"></span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: grouped by state, the heading names it, so each dot hides its label">
      <div data-demo="row" [label]="'Online now'">
        @for (n of online; track n) {
          <span>{{ n }} <span dsStatusDot tone="success" size="sm" label="Online" hideLabel></span></span>
        }
      </div>
      <div data-demo="row" [label]="'Away'">
        @for (n of away; track n) {
          <span>{{ n }} <span dsStatusDot tone="warning" size="sm" label="Away" hideLabel></span></span>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: twelve services wrap onto more lines">
      <div data-demo="row">
        @for (s of services; track s; let i = $index) {
          <span dsStatusDot [tone]="i % 5 === 4 ? 'danger' : 'success'" [label]="s + (i % 5 === 4 ? ' down' : ' up')"></span>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text wraps next to the dot">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: 16rem;">
          <span dsStatusDot tone="warning" label="Sync paused because the device is on a metered connection. It starts again on Wi-Fi."></span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div style="max-inline-size: 16rem;">
          <span dsStatusDot tone="warning" label="المزامنة موقوفة لأن الجهاز على اتصال محدود، وبترجع تشتغل أول ما يتصل بشبكة Wi-Fi"></span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: a live state pulses three times, then stays still">
      <div data-demo="row">
        <span dsStatusDot tone="info" pulse label="Syncing 12 files"></span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error">
      <div data-demo="row">
        <span dsStatusDot tone="danger" label="Payment failed"></span>
      </div>
    </section>
  `,
})
export default class StatusDotDemo {
  protected readonly tones = tones;
  protected readonly services = services;
  protected readonly online = ['Sara', 'Omar', 'Lina', 'Fahad'];
  protected readonly away = ['Noura', 'Khalid'];
}
