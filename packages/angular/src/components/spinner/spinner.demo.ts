// The Spinner demo: the same cases, ids and copy as
// packages/react/src/components/Spinner/Spinner.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsSpinner, type SpinnerSize, type SpinnerTone } from './spinner';

const sizes: SpinnerSize[] = ['xs', 'sm', 'md', 'lg'];
const tones: SpinnerTone[] = ['neutral', 'accent'];

const tasks = ['Loading files', 'Syncing boards', 'Checking links', 'Building preview', 'Uploading images', 'Saving changes'];
const tasksAr = ['تحميل الملفات', 'مزامنة اللوحات', 'فحص الروابط', 'تجهيز المعاينة', 'رفع الصور', 'حفظ التغييرات'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsSpinner, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: each size in neutral and accent">
      @for (tone of tones; track tone) {
        <div data-demo="row" [label]="tone">
          @for (size of sizes; track size) {
            <span dsSpinner [size]="size" [tone]="tone" [label]="'Loading, size ' + size"></span>
          }
        </div>
      }
      <div data-demo="row" [label]="'Next to visible text, decorative'">
        <span><span dsSpinner size="sm" decorative></span> Loading files</span>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            @for (size of sizes; track size) {
              <span dsSpinner [size]="size" [tone]="tone" label="جار التحميل"></span>
            }
          </div>
        }
        <div data-demo="row" [label]="'مع نص ظاهر'">
          <span><span dsSpinner size="sm" decorative></span> جار تحميل الملفات</span>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One spinner">
      <div data-demo="row">
        <span dsSpinner label="Loading files"></span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many spinners, one per busy row">
      @for (task of tasks; track task) {
        <div data-demo="row">
          <span dsSpinner size="sm" decorative></span>
          <span>{{ task }}</span>
        </div>
      }
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text next to a spinner">
      <div data-demo="row">
        <span dsSpinner size="sm" tone="accent" decorative></span>
        <span>{{ sample.en.long }}</span>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <span dsSpinner size="sm" tone="accent" decorative></span>
          <span>{{ sample.ar.long }}</span>
        </div>
        @for (task of tasksAr; track task) {
          <div data-demo="row">
            <span dsSpinner size="xs" decorative></span>
            <span>{{ task }}</span>
          </div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: a busy region names itself, the spinner is decorative">
      <div aria-busy="true" aria-label="Recent boards" role="region">
        <div data-demo="row">
          <span dsSpinner size="lg" tone="accent" decorative></span>
        </div>
      </div>
      <div data-demo="row">
        <span dsSpinner size="md" label="Loading recent boards"></span>
        <span dsTheme [lang]="'ar'">
          <span dsSpinner size="md" label="جار تحميل آخر اللوحات"></span>
        </span>
      </div>
    </section>
  `,
})
export default class SpinnerDemo {
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly tasks = tasks;
  protected readonly tasksAr = tasksAr;
  protected readonly sample = sample;
}
