// The ProgressCircle demo: the same cases, ids and copy as
// packages/react/src/components/ProgressCircle/ProgressCircle.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsProgressCircle, type ProgressCircleSize, type ProgressCircleTone } from './progress-circle';

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

const slash = (v: number, m: number) => `${v}/${m}`;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsProgressCircle, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: each tone, each size, and the indeterminate form">
      @for (tone of tones; track tone) {
        <div data-demo="row" [label]="tone">
          @for (size of sizes; track size) {
            <div dsProgressCircle [size]="size" [tone]="tone" [value]="toneValue[tone]" [label]="toneLabel[tone]"></div>
          }
        </div>
      }
      <div data-demo="row" [label]="'Indeterminate'">
        @for (size of sizes; track size) {
          <div dsProgressCircle [size]="size" label="Preparing export"></div>
        }
      </div>
      <div data-demo="row" [label]="'Short value text'">
        <div dsProgressCircle size="lg" [value]="7" [max]="12" label="Copying files" [valueText]="slash"></div>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="toneLabelAr[tone]">
            @for (size of sizes; track size) {
              <div dsProgressCircle [size]="size" [tone]="tone" [value]="toneValue[tone]" [label]="toneLabelAr[tone]"></div>
            }
          </div>
        }
        <div data-demo="row" [label]="'بدون نهاية معروفة'">
          <div dsProgressCircle label="تجهيز الملف للتصدير"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: nothing done yet">
      <div data-demo="row">
        <div dsProgressCircle [value]="0" label="Waiting to upload"></div>
        <span>Waiting to upload</span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One ring, complete">
      <div data-demo="row">
        <div dsProgressCircle [value]="100" tone="success" size="lg" label="Backup finished"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many rings, one per file">
      @for (file of files; track file[0]) {
        <div data-demo="row">
          <div dsProgressCircle size="sm" [value]="file[1]" [label]="'Uploading ' + file[0]" [tone]="file[1] === 100 ? 'success' : 'accent'"></div>
          <span>{{ file[0] }}</span>
        </div>
      }
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text next to a ring">
      <div data-demo="row">
        <div dsProgressCircle [value]="58" label="Syncing your account"></div>
        <span>{{ sample.en.long }}</span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <div dsProgressCircle [value]="58" label="مزامنة الحساب"></div>
          <span>{{ sample.ar.long }}</span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: no known end">
      <div data-demo="row">
        <div dsProgressCircle size="sm" label="Syncing boards"></div>
        <span>Syncing boards</span>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <div dsProgressCircle size="sm" label="مزامنة اللوحات"></div>
          <span>مزامنة اللوحات</span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the task stopped">
      <div data-demo="row">
        <div dsProgressCircle [value]="62" tone="danger" label="Upload stopped"></div>
        <span>Upload stopped at 62%. Check the connection and upload the file again.</span>
      </div>
    </section>
  `,
})
export default class ProgressCircleDemo {
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly toneLabel = toneLabel;
  protected readonly toneLabelAr = toneLabelAr;
  protected readonly toneValue = toneValue;
  protected readonly files = files;
  protected readonly slash = slash;
  protected readonly sample = sample;
}
