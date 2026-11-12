// The ProgressBar demo: the same cases, ids and copy as
// packages/react/src/components/ProgressBar/ProgressBar.demo.tsx. React's
// DemoGrid is written out as its element, `div data-demo="grid"`.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsProgressBar, type ProgressBarSize, type ProgressBarTone } from './progress-bar';

const sizes: ProgressBarSize[] = ['sm', 'md', 'lg'];
const tones: ProgressBarTone[] = ['accent', 'success', 'warning', 'danger'];

const toneLabel: Record<ProgressBarTone, string> = {
  accent: 'Uploading files',
  success: 'Backup finished',
  warning: 'Upload slowing down',
  danger: 'Upload stopped',
};

const toneLabelAr: Record<ProgressBarTone, string> = {
  accent: 'رفع الملفات',
  success: 'اكتمال النسخة الاحتياطية',
  warning: 'بطء الرفع',
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
const filesOfAr = (v: number, max: number) => `${v} من ${max} ملفات`;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsProgressBar, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: each tone, each size, and the indeterminate form">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr))">
        @for (tone of tones; track tone) {
          <div dsProgressBar [tone]="tone" [value]="toneValue[tone]" [label]="toneLabel[tone]"></div>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr))">
        @for (size of sizes; track size) {
          <div dsProgressBar [size]="size" [value]="46" [label]="'Size ' + size"></div>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr))">
        <div dsProgressBar label="Preparing export"></div>
        <div dsProgressBar [value]="3" [max]="10" [valueText]="filesOf" label="Copying files"></div>
        <div dsProgressBar [value]="60" aria-label="Import progress" [showValue]="false"></div>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(16rem, 100%), 1fr))">
          @for (tone of tones; track tone) {
            <div dsProgressBar [tone]="tone" [value]="toneValue[tone]" [label]="toneLabelAr[tone]"></div>
          }
          <div dsProgressBar label="تجهيز الملف للتصدير"></div>
          <div dsProgressBar [value]="3" [max]="10" [valueText]="filesOfAr" label="نسخ الملفات"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: nothing done yet">
      <div dsProgressBar [value]="0" label="Waiting to upload"></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One bar, complete">
      <div dsProgressBar [value]="100" tone="success" label="Backup finished"></div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many bars, one per upload">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr))">
        @for (upload of uploads; track upload[0]) {
          <div dsProgressBar size="sm" [value]="upload[1]" [label]="upload[0]" [tone]="upload[1] === 100 ? 'success' : 'accent'"></div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text in the label">
      <div dsProgressBar [value]="58" [label]="sample.en.long"></div>
      <div dsProgressBar [value]="21" [label]="sample.en.word" size="sm"></div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsProgressBar [value]="58" [label]="sample.ar.long"></div>
        <div dsProgressBar [value]="21" label="رفع ملف النسخة الاحتياطية الكاملة لكل لوحات الفريق" size="lg"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: no known end">
      <div dsProgressBar label="Preparing export"></div>
      <div dsProgressBar label="Syncing boards" size="sm"></div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsProgressBar label="مزامنة اللوحات"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the task stopped">
      <div dsProgressBar [value]="62" tone="danger" label="Upload stopped at 62%. Check the connection and upload the file again."></div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsProgressBar [value]="62" tone="danger" label="توقف الرفع عند 62%. تأكد من الاتصال وارفع الملف مرة ثانية."></div>
      </div>
    </section>
  `,
})
export default class ProgressBarDemo {
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly toneLabel = toneLabel;
  protected readonly toneLabelAr = toneLabelAr;
  protected readonly toneValue = toneValue;
  protected readonly uploads = uploads;
  protected readonly filesOf = filesOf;
  protected readonly filesOfAr = filesOfAr;
  protected readonly sample = sample;
}
