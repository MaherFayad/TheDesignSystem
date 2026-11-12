// The Slider demo: the same cases, ids and copy as
// packages/react/src/components/Slider/Slider.demo.tsx.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsSlider } from './slider';
import type { SliderMark, SliderSize } from './slider-base';

const tooMany = Array.from({ length: 11 }, (_, i) => i * 10);

@Component({
  selector: 'ds-slider-demo',
  imports: [DEMO, DsTheme, DsField, DsSlider],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, marks and orientation">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsSlider [size]="size" [label]="'Volume, ' + size" unit="%" [defaultValue]="60"></div>
          }
          <div dsSlider label="Corner radius" unit="px" [min]="0" [max]="24" [step]="4" [defaultValue]="8" [marks]="[0, 8, 16, 24]"></div>
          <div dsSlider label="Zoom" unit="%" [min]="25" [max]="200" [step]="25" [defaultValue]="100" [marks]="zoomMarks"></div>
          <div dsSlider label="Level" orientation="vertical" [defaultValue]="30"></div>
          <div dsTheme lang="ar">
            <div dsSlider label="مستوى الصوت" unit="%" [defaultValue]="60" [marks]="volumeMarks"></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="At the minimum, no visible label">
        <div dsSlider aria-label="Blur" unit="px" [max]="40" [defaultValue]="0"></div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="Controlled, saved when the drag ends">
        <div style="display: grid; gap: var(--ds-space-2xs);">
          <div dsSlider label="Opacity" unit="%" [(value)]="opacity" (valueCommit)="saved.set($event)"></div>
          <p data-demo="label">Saved at <ng-container>{{ saved() }}</ng-container>%</p>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A settings panel">
        <div style="display: grid; gap: var(--ds-space-l); max-inline-size: var(--ds-dialog-width-sm);">
          <div dsSlider label="Brightness" unit="%" [defaultValue]="70" size="sm"></div>
          <div dsSlider label="Contrast" unit="%" [defaultValue]="50" size="sm"></div>
          <div dsSlider label="Saturation" unit="%" [defaultValue]="45" size="sm"></div>
          <div dsSlider label="Line height" [min]="1" [max]="2" [step]="0.05" [defaultValue]="1.5" size="sm"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Many marks">
        <div dsSlider label="Progress" unit="%" [step]="10" [defaultValue]="70" [marks]="tooManyMarks"></div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long label and value">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsSlider
            label="The most a single person on the team can spend each month before an owner has to approve it"
            unit="SAR"
            [min]="0"
            [max]="1000000"
            [step]="1000"
            [defaultValue]="250000"></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm);">
            <div dsSlider label="الحد الأعلى للصرف الشهري لكل عضو في الفريق قبل موافقة المالك" unit="ريال" [min]="0" [max]="50000" [step]="500" [defaultValue]="12500"></div>
            <p data-demo="label">{{ sample.ar.short }}</p>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
        <div dsField error="Pick 5 or more, so the export stays readable.">
          <div dsSlider label="Export scale" unit="%" [min]="1" [max]="100" [defaultValue]="2"></div>
        </div>
        <div dsField label="Thumbnail scale" error="Pick 10 or more, so the thumbnails stay readable.">
          <div dsSlider unit="%" [min]="1" [max]="100" [defaultValue]="4" showValue></div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div dsSlider label="Volume" unit="%" [defaultValue]="40" disabled></div>
        <div dsTheme lang="ar">
          <div dsSlider label="مستوى الصوت" unit="%" [defaultValue]="40" disabled></div>
        </div>
      </section>
    </div>
  `,
})
export default class SliderDemo {
  protected readonly sizes: SliderSize[] = ['sm', 'md', 'lg'];
  protected readonly sample = sample;
  protected readonly zoomMarks: SliderMark[] = [
    { value: 25, label: '25%' },
    { value: 100, label: '100%' },
    { value: 200, label: '200%' },
  ];
  protected readonly volumeMarks: SliderMark[] = [
    { value: 0, label: '0' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ];
  protected readonly tooManyMarks: SliderMark[] = tooMany.map((value) => ({ value, label: String(value) }));
  protected readonly opacity = signal<number | undefined>(40);
  protected readonly saved = signal(40);
}
