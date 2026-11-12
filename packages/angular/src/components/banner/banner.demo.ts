// Banner demo: the same cases, ids and copy as
// packages/react/src/components/Banner/Banner.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsBanner, type BannerEmphasis, type BannerTone } from './banner';

const tones: BannerTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];
const emphases: BannerEmphasis[] = ['soft', 'solid'];

const copy: Record<BannerTone, string> = {
  neutral: 'Boards now open in the new editor.',
  accent: 'Your team plan includes 5 more seats this month.',
  info: 'Scheduled maintenance on Friday from 22:00 to 23:00 Riyadh time.',
  success: 'Your workspace moved to the new servers.',
  warning: 'Your trial ends in 3 days. Add a payment method to keep your boards.',
  danger: 'Sync is down for all workspaces. Your edits are kept on this device.',
};

const copyAr: Record<BannerTone, string> = {
  neutral: 'اللوحات الحين تنفتح في المحرر الجديد.',
  accent: 'باقة فريقك فيها 5 مقاعد زيادة هذا الشهر.',
  info: 'صيانة مجدولة يوم الجمعة من 22:00 إلى 23:00 بتوقيت الرياض.',
  success: 'مساحة العمل انتقلت للخوادم الجديدة.',
  warning: 'الفترة التجريبية تخلص بعد 3 أيام. أضف طريقة دفع عشان تحتفظ بلوحاتك.',
  danger: 'المزامنة متوقفة لكل مساحات العمل. تعديلاتك محفوظة في الجهاز.',
};

const rows = Array.from({ length: 30 }, (_, i) => `Board ${i + 1}`);

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsBanner, DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #status><button dsButton size="sm">Open status page</button></ng-template>
    <ng-template #payAr><button dsButton size="sm">إضافة طريقة دفع</button></ng-template>
    <ng-template #pay><button dsButton size="sm" emphasis="outline">Add payment method</button></ng-template>
    <ng-template #upload><button dsButton size="sm" emphasis="outline">Upload copies</button></ng-template>
    <ng-template #details><button dsButton size="sm" emphasis="outline">عرض التفاصيل</button></ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: six tones in soft and solid, and Arabic">
      @for (emphasis of emphases; track emphasis) {
        @for (tone of tones; track tone) {
          <section dsBanner [tone]="tone" [emphasis]="emphasis" [onDismiss]="noop">{{ copy[tone] }}</section>
        }
      }
      <section dsBanner tone="danger" emphasis="solid" [actions]="status" [onDismiss]="noop">{{ copy.danger }}</section>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <section dsBanner tone="info" [onDismiss]="noop">{{ copyAr.info }}</section>
        <section dsBanner tone="warning" emphasis="solid" [actions]="payAr" [onDismiss]="noop">{{ copyAr.warning }}</section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One banner: dismiss moves focus to the main content">
      @if (open()) {
        <section dsBanner tone="warning" returnFocus="#banner-demo-boards" [onDismiss]="dismiss" [actions]="pay">{{ copy.warning }}</section>
      } @else {
        <div data-demo="row">
          <button dsButton size="sm" emphasis="ghost" (click)="open.set(true)">Show banner again</button>
        </div>
      }
      <!-- The gallery already has a main element, so the demo names its own target with returnFocus. -->
      <p id="banner-demo-boards">Your boards. Focus lands here when the banner is dismissed.</p>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: two banners stacked, the most urgent first">
      <div>
        <section dsBanner tone="danger" emphasis="solid" label="Service status">{{ copy.danger }}</section>
        <section dsBanner tone="info" label="Maintenance" [onDismiss]="noop">{{ copy.info }}</section>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: a sticky banner over a long list">
      <div data-demo="scroll" tabindex="0" role="region" aria-label="Boards list" style="max-block-size: 16rem; overflow-y: auto;">
        <section dsBanner tone="info" sticky>{{ copy.info }}</section>
        <ul>
          @for (row of rows; track row) {
            <li>{{ row }}</li>
          }
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: the text wraps and the actions move below it">
      <section dsBanner tone="warning" [actions]="upload" [onDismiss]="noop"><ng-container>{{ sample.en.long }}</ng-container>&ngsp;<ng-container>{{ sample.en.word }}</ng-container></section>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <section dsBanner tone="info" [actions]="details" [onDismiss]="noop">{{ sample.ar.long }}</section>
      </div>
    </section>
  `,
})
export default class BannerDemo {
  protected readonly tones = tones;
  protected readonly emphases = emphases;
  protected readonly copy = copy;
  protected readonly copyAr = copyAr;
  protected readonly rows = rows;
  protected readonly sample = sample;
  protected readonly open = signal(true);
  protected readonly noop = () => undefined;
  protected readonly dismiss = () => this.open.set(false);
}
