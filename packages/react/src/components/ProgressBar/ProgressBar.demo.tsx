import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { ProgressBar } from './index';
import type { ProgressBarSize, ProgressBarTone } from './index';

const sizes: ProgressBarSize[] = ['sm', 'md', 'lg'];
const tones: ProgressBarTone[] = ['accent', 'success', 'warning', 'danger'];

const toneLabel: Record<ProgressBarTone, string> = {
  accent: 'Uploading files',
  success: 'Backup finished',
  warning: 'Storage almost full',
  danger: 'Upload stopped',
};

const toneLabelAr: Record<ProgressBarTone, string> = {
  accent: 'رفع الملفات',
  success: 'اكتمال النسخة الاحتياطية',
  warning: 'المساحة قربت تخلص',
  danger: 'توقف الرفع',
};

const toneValue: Record<ProgressBarTone, number> = {
  accent: 46,
  success: 100,
  warning: 88,
  danger: 62,
};

const uploads = [
  ['board-cover.png', 100],
  ['moodboard-v2.fig', 72],
  ['brand-guide.pdf', 35],
  ['interview-notes.md', 8],
  ['launch-video.mp4', 0],
] as const;

const filesOf = (v: number, max: number) => `${v} of ${max} files`;

export default function ProgressBarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone, each size, and the indeterminate form">
        <DemoGrid min="16rem">
          {tones.map((tone) => (
            <ProgressBar key={tone} tone={tone} value={toneValue[tone]} label={toneLabel[tone]} />
          ))}
        </DemoGrid>
        <DemoGrid min="16rem">
          {sizes.map((size) => (
            <ProgressBar key={size} size={size} value={46} label={`Size ${size}`} />
          ))}
        </DemoGrid>
        <DemoGrid min="16rem">
          <ProgressBar label="Preparing export" />
          <ProgressBar value={3} max={10} valueText={filesOf} label="Copying files" />
          <ProgressBar value={60} aria-label="Import progress" showValue={false} />
        </DemoGrid>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="16rem">
            {tones.map((tone) => (
              <ProgressBar key={tone} tone={tone} value={toneValue[tone]} label={toneLabelAr[tone]} />
            ))}
            <ProgressBar label="تجهيز الملف للتصدير" />
            <ProgressBar value={3} max={10} valueText={(v, max) => `${v} من ${max} ملفات`} label="نسخ الملفات" />
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: nothing done yet">
        <ProgressBar value={0} label="Waiting to upload" />
      </DemoCase>

      <DemoCase id="one" title="One bar, complete">
        <ProgressBar value={100} tone="success" label="Backup finished" />
      </DemoCase>

      <DemoCase id="many" title="Many bars, one per upload">
        <DemoGrid min="18rem">
          {uploads.map(([name, value]) => (
            <ProgressBar key={name} size="sm" value={value} label={name} tone={value === 100 ? 'success' : 'accent'} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text in the label">
        <ProgressBar value={58} label={sample.en.long} />
        <ProgressBar value={21} label={sample.en.word} size="sm" />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <ProgressBar value={58} label={sample.ar.long} />
        <ProgressBar value={21} label="رفع ملف النسخة الاحتياطية الكاملة لكل لوحات الفريق" size="lg" />
      </DemoCase>

      <DemoCase id="loading" title="Loading: no known end">
        <ProgressBar label="Preparing export" />
        <ProgressBar label="Syncing boards" size="sm" />
        <Theme lang="ar" data-demo="content">
          <ProgressBar label="مزامنة اللوحات" />
        </Theme>
      </DemoCase>

      <DemoCase id="error" title="Error: the task stopped">
        <ProgressBar
          value={62}
          tone="danger"
          label="Upload stopped at 62%. Check the connection and upload the file again."
        />
        <Theme lang="ar" data-demo="content">
          <ProgressBar value={62} tone="danger" label="توقف الرفع عند 62%. تأكد من الاتصال وارفع الملف مرة ثانية." />
        </Theme>
      </DemoCase>
    </DemoPage>
  );
}
