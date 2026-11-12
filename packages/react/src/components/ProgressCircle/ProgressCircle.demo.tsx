import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme';
import { ProgressCircle } from './index';
import type { ProgressCircleSize, ProgressCircleTone } from './index';

const sizes: ProgressCircleSize[] = ['xs', 'sm', 'md', 'lg'];
const tones: ProgressCircleTone[] = ['accent', 'success', 'warning', 'danger'];

const toneLabel: Record<ProgressCircleTone, string> = {
  accent: 'Uploading files',
  success: 'Backup finished',
  warning: 'Upload slowing down',
  danger: 'Upload stopped',
};

const toneLabelAr: Record<ProgressCircleTone, string> = {
  accent: 'رفع الملفات',
  success: 'اكتمال النسخة الاحتياطية',
  warning: 'بطء الرفع',
  danger: 'توقف الرفع',
};

const toneValue: Record<ProgressCircleTone, number> = {
  accent: 46,
  success: 100,
  warning: 88,
  danger: 62,
};

const files = [
  ['board-cover.png', 100],
  ['moodboard-v2.fig', 72],
  ['brand-guide.pdf', 35],
  ['interview-notes.md', 8],
  ['launch-video.mp4', 0],
] as const;

export default function ProgressCircleDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone, each size, and the indeterminate form">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {sizes.map((size) => (
              <ProgressCircle key={size} size={size} tone={tone} value={toneValue[tone]} label={toneLabel[tone]} />
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Indeterminate">
          {sizes.map((size) => (
            <ProgressCircle key={size} size={size} label="Preparing export" />
          ))}
        </DemoRow>
        <DemoRow label="Value on small sizes">
          <ProgressCircle size="sm" value={46} label="Uploading files" showValue />
          <ProgressCircle size="lg" value={7} max={12} label="Copying files" valueText={(v, m) => `${v}/${m}`} />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {tones.map((tone) => (
            <DemoRow key={tone} label={toneLabelAr[tone]}>
              {sizes.map((size) => (
                <ProgressCircle key={size} size={size} tone={tone} value={toneValue[tone]} label={toneLabelAr[tone]} />
              ))}
            </DemoRow>
          ))}
          <DemoRow label="بدون نهاية معروفة">
            <ProgressCircle label="تجهيز الملف للتصدير" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: nothing done yet">
        <DemoRow>
          <ProgressCircle value={0} label="Waiting to upload" />
          <span>Waiting to upload</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One ring, complete">
        <DemoRow>
          <ProgressCircle value={100} tone="success" size="lg" label="Backup finished" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many rings, one per file">
        {files.map(([name, value]) => (
          <DemoRow key={name}>
            <ProgressCircle
              size="sm"
              value={value}
              label={`Uploading ${name}`}
              tone={value === 100 ? 'success' : 'accent'}
            />
            <span>{name}</span>
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="long-text" title="Long text next to a ring">
        <DemoRow>
          <ProgressCircle value={58} label="Syncing your account" />
          <span>{sample.en.long}</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ProgressCircle value={58} label="مزامنة الحساب" />
          <span>{sample.ar.long}</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: no known end">
        <DemoRow>
          <ProgressCircle size="sm" label="Syncing boards" />
          <span>Syncing boards</span>
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow>
            <ProgressCircle size="sm" label="مزامنة اللوحات" />
            <span>مزامنة اللوحات</span>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="error" title="Error: the task stopped">
        <DemoRow>
          <ProgressCircle value={62} tone="danger" label="Upload stopped" />
          <span>Upload stopped at 62%. Check the connection and upload the file again.</span>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
