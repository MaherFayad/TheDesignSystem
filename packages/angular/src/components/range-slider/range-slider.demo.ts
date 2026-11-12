// The RangeSlider demo: the same cases, ids and copy as
// packages/react/src/components/RangeSlider/RangeSlider.demo.tsx.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import type { SliderMark, SliderSize } from '../slider/slider-base';
import { DsRangeSlider, type RangeSliderValue } from './range-slider';

const priceLabels: [string, string] = ['Minimum price', 'Maximum price'];
const priceLabelsAr: [string, string] = ['أقل سعر', 'أعلى سعر'];

@Component({
  selector: 'ds-range-slider-demo',
  imports: [DEMO, DsTheme, DsField, DsRangeSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, marks and orientation">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsRangeSlider [size]="size" [label]="'Price, ' + size" unit="SAR" [max]="1000" [step]="50" [defaultValue]="[200, 700]" [thumbLabels]="priceLabels"></div>
          }
          <div dsRangeSlider label="Hours" [min]="0" [max]="24" [defaultValue]="[9, 17]" [marks]="hourMarks" [thumbLabels]="['Start hour', 'End hour']"></div>
          <div dsRangeSlider label="Range" orientation="vertical" [defaultValue]="[20, 60]" [thumbLabels]="['Lowest level', 'Highest level']"></div>
          <div dsTheme lang="ar">
            <div dsRangeSlider label="السعر" unit="ريال" [max]="1000" [step]="50" [defaultValue]="[200, 700]" [thumbLabels]="priceLabelsAr"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="The full range, no visible label">
        <div dsRangeSlider [thumbLabels]="['Minimum size', 'Maximum size']" unit="px" [max]="64"></div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="Controlled, saved when the drag ends">
        <div style="display: grid; gap: var(--ds-space-2xs);">
          <div dsRangeSlider label="Price" unit="SAR" [min]="0" [max]="1000" [step]="50" [thumbLabels]="priceLabels" [(value)]="price" (valueCommit)="saved.set($event)"></div>
          <p data-demo="label">Saved range: <ng-container>{{ savedText() }}</ng-container> SAR</p>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A filter panel">
        <div style="display: grid; gap: var(--ds-space-l); max-inline-size: var(--ds-dialog-width-sm);">
          <div dsRangeSlider label="Price" unit="SAR" [max]="1000" [step]="50" [defaultValue]="[100, 600]" size="sm" [thumbLabels]="priceLabels"></div>
          <div dsRangeSlider label="Rating" [min]="1" [max]="5" [defaultValue]="[3, 5]" size="sm" [thumbLabels]="['Lowest rating', 'Highest rating']"></div>
          <div dsRangeSlider label="Distance" unit="km" [max]="50" [defaultValue]="[0, 10]" size="sm" [thumbLabels]="['Nearest distance', 'Farthest distance']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Thumbs side by side">
        <div dsRangeSlider
          label="Year"
          [min]="2000"
          [max]="2026"
          [defaultValue]="[2019, 2020]"
          [formatOptions]="{ useGrouping: false }"
          [marks]="yearMarks"
          [thumbLabels]="['First year', 'Last year']"></div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long label and values">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsRangeSlider
            label="The budget each team can spend this quarter before finance has to approve the plan"
            unit="SAR"
            [max]="2000000"
            [step]="10000"
            [defaultValue]="[250000, 1500000]"
            [thumbLabels]="['Minimum budget', 'Maximum budget']"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm);">
            <div dsRangeSlider
              label="ميزانية الفريق لهذا الربع قبل موافقة الإدارة المالية"
              unit="ريال"
              [max]="2000000"
              [step]="10000"
              [defaultValue]="[250000, 1500000]"
              [thumbLabels]="['أقل ميزانية', 'أعلى ميزانية']"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div dsField error="Leave at least 100 SAR between the two prices.">
          <div dsRangeSlider label="Price" unit="SAR" [max]="1000" [step]="50" [minStepsBetweenThumbs]="2" [defaultValue]="[450, 500]" [thumbLabels]="priceLabels"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsRangeSlider label="Price" unit="SAR" [max]="1000" [defaultValue]="[200, 600]" disabled [thumbLabels]="priceLabels"></div>
        <div dsTheme lang="ar">
          <div dsRangeSlider label="السعر" unit="ريال" [max]="1000" [defaultValue]="[200, 600]" disabled [thumbLabels]="priceLabelsAr"></div>
        </div>
      </section>
    </div>
  `,
})
export default class RangeSliderDemo {
  protected readonly sizes: SliderSize[] = ['sm', 'md', 'lg'];
  protected readonly priceLabels = priceLabels;
  protected readonly priceLabelsAr = priceLabelsAr;
  protected readonly hourMarks: SliderMark[] = [
    { value: 0, label: '0' },
    { value: 12, label: '12' },
    { value: 24, label: '24' },
  ];
  protected readonly yearMarks: SliderMark[] = [2000, 2005, 2010, 2015, 2020, 2025].map((value) => ({ value, label: String(value) }));
  protected readonly price = signal<RangeSliderValue | undefined>([200, 800]);
  protected readonly saved = signal<RangeSliderValue>([200, 800]);
  protected readonly savedText = computed(() => this.saved().map((v) => v.toLocaleString('en')).join(' to '));
}
