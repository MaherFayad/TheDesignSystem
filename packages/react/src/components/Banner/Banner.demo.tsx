// Banner demo. One section per content case. The variants case shows every
// tone in soft and solid, and an Arabic row. The one case dismisses a
// banner: focus moves to the content after it (returnFocus). The too-many case shows a
// sticky banner over a long list in its own scroll box, where the banner
// reserves scroll padding for its height.
import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Banner, type BannerEmphasis, type BannerTone } from './index';

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

/** A banner that leaves on dismiss and a button to bring it back. Focus goes to the main element below. */
function Dismissible() {
  const [open, setOpen] = useState(true);
  return (
    <>
      {open ? (
        <Banner tone="warning" returnFocus="#banner-demo-boards" onDismiss={() => setOpen(false)} actions={<Button size="sm" emphasis="outline">Add payment method</Button>}>
          {copy.warning}
        </Banner>
      ) : (
        <DemoRow>
          <Button size="sm" emphasis="ghost" onClick={() => setOpen(true)}>
            Show banner again
          </Button>
        </DemoRow>
      )}
      {/* The gallery already has a main element, so the demo names its own target with returnFocus. */}
      <p id="banner-demo-boards">Your boards. Focus lands here when the banner is dismissed.</p>
    </>
  );
}

export default function BannerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: six tones in soft and solid, and Arabic">
        {emphases.map((emphasis) =>
          tones.map((tone) => (
            <Banner key={`${emphasis}-${tone}`} tone={tone} emphasis={emphasis} onDismiss={() => undefined}>
              {copy[tone]}
            </Banner>
          )),
        )}
        <Banner tone="danger" emphasis="solid" actions={<Button size="sm">Open status page</Button>} onDismiss={() => undefined}>
          {copy.danger}
        </Banner>
        <Theme lang="ar" data-demo="content">
          <Banner tone="info" onDismiss={() => undefined}>
            {copyAr.info}
          </Banner>
          <Banner tone="warning" emphasis="solid" actions={<Button size="sm">إضافة طريقة دفع</Button>} onDismiss={() => undefined}>
            {copyAr.warning}
          </Banner>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One banner: dismiss moves focus to the main content">
        <Dismissible />
      </DemoCase>

      <DemoCase id="many" title="Many: two banners stacked, the most urgent first">
        <div>
          <Banner tone="danger" emphasis="solid" label="Service status">
            {copy.danger}
          </Banner>
          <Banner tone="info" label="Maintenance" onDismiss={() => undefined}>
            {copy.info}
          </Banner>
        </div>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: a sticky banner over a long list">
        <div data-demo="scroll" tabIndex={0} role="region" aria-label="Boards list" style={{ maxBlockSize: '16rem', overflowY: 'auto' }}>
          <Banner tone="info" sticky>
            {copy.info}
          </Banner>
          <ul>
            {rows.map((row) => (
              <li key={row}>{row}</li>
            ))}
          </ul>
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the text wraps and the actions move below it">
        <Banner tone="warning" actions={<Button size="sm" emphasis="outline">Upload copies</Button>} onDismiss={() => undefined}>
          {sample.en.long} {sample.en.word}
        </Banner>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Banner tone="info" actions={<Button size="sm" emphasis="outline">عرض التفاصيل</Button>} onDismiss={() => undefined}>
          {sample.ar.long}
        </Banner>
      </DemoCase>
    </DemoPage>
  );
}
