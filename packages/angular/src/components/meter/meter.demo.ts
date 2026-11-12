// The Meter demo: the same cases, ids and copy as
// packages/react/src/components/Meter/Meter.demo.tsx. React spreads the
// storage and score ranges; here each threshold is its own input.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsMeter, type MeterSize } from './meter';

const sizes: MeterSize[] = ['sm', 'md', 'lg'];

const gb = (v: number, _min: number, max: number) => `${v} GB of ${max} GB`;
const gbAr = (v: number, _min: number, max: number) => `${v} من ${max} جيجابايت`;
const outOf10 = (v: number) => `${v} of 10`;
const outOf10Ar = (v: number) => `${v} من 10`;
const scoreLevels = { low: 'Low', medium: 'Medium', high: 'High' };
const scoreLevelsAr = { low: 'منخفض', medium: 'متوسط', high: 'مرتفع' };
const storageLevels = { low: 'Plenty of room', medium: 'Filling up', high: 'Almost full' };
const storageLevelsAr = { low: 'المساحة كافية', medium: 'المساحة تقل', high: 'المساحة قربت تخلص' };
const fullLevels = { high: 'Full' };
const fullLevelsAr = { high: 'ممتلئة' };

const members = [
  ['Design team', 34],
  ['Marketing', 71],
  ['Research', 52],
  ['Engineering', 93],
  ['Support', 12],
] as const;

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsMeter, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: the tone follows the thresholds, the level is in words">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr))">
        @for (v of [32, 72, 94]; track v) {
          <div dsMeter [value]="v" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="storageLevels" label="Storage used"></div>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr))">
        @for (v of [9, 5, 2]; track v) {
          <div dsMeter [value]="v" [max]="10" [low]="4" [high]="7" [optimum]="10" [valueText]="outOf10" [levelLabels]="scoreLevels" label="Accessibility score"></div>
        }
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr))">
        @for (size of sizes; track size) {
          <div dsMeter [size]="size" [value]="46" [label]="'Size ' + size + ', no thresholds'"></div>
        }
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr))">
          @for (v of [32, 72, 94]; track v) {
            <div dsMeter [value]="v" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gbAr" [levelLabels]="storageLevelsAr" label="المساحة المستخدمة"></div>
          }
          <div dsMeter [value]="9" [max]="10" [low]="4" [high]="7" [optimum]="10" [valueText]="outOf10Ar" [levelLabels]="scoreLevelsAr" label="تقييم سهولة الوصول"></div>
          <div dsMeter [value]="46" label="نسبة الاستخدام"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: the value is at the minimum">
      <div dsMeter [value]="0" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="storageLevels" label="Storage used"></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One meter">
      <div dsMeter [value]="72" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="storageLevels" label="Storage used"></div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many meters, one per team">
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr))">
        @for (member of members; track member[0]) {
          <div dsMeter size="sm" [value]="member[1]" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="storageLevels" [label]="member[0]"></div>
        }
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text in the label">
      <div dsMeter [value]="58" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="storageLevels" [label]="sample.en.long"></div>
      <div dsMeter [value]="21" [label]="sample.en.word" size="sm"></div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsMeter [value]="58" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gbAr" [levelLabels]="storageLevelsAr" [label]="sample.ar.long"></div>
        <div dsMeter [value]="88" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gbAr" [levelLabels]="storageLevelsAr"
          label="المساحة المستخدمة في حساب الفريق لكل اللوحات والملفات" size="lg"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the value is in the worst region">
      <div dsMeter [value]="99" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gb" [levelLabels]="fullLevels" label="Storage used"></div>
      <p>Storage is full. Delete files or add storage to keep uploading.</p>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsMeter [value]="99" [max]="100" [low]="60" [high]="85" [optimum]="0" [valueText]="gbAr" [levelLabels]="fullLevelsAr" label="المساحة المستخدمة"></div>
        <p>المساحة ممتلئة. احذف بعض الملفات أو زود المساحة عشان تكمل الرفع.</p>
      </div>
    </section>
  `,
})
export default class MeterDemo {
  protected readonly sizes = sizes;
  protected readonly gb = gb;
  protected readonly gbAr = gbAr;
  protected readonly outOf10 = outOf10;
  protected readonly outOf10Ar = outOf10Ar;
  protected readonly scoreLevels = scoreLevels;
  protected readonly scoreLevelsAr = scoreLevelsAr;
  protected readonly storageLevels = storageLevels;
  protected readonly storageLevelsAr = storageLevelsAr;
  protected readonly fullLevels = fullLevels;
  protected readonly fullLevelsAr = fullLevelsAr;
  protected readonly members = members;
  protected readonly sample = sample;
}
