// The Rating demo: the same cases, ids and copy as
// packages/react/src/components/Rating/Rating.demo.tsx. React's Labeled
// helper (a grid with a visible label that names the rating) is written out.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsRating, type RatingSize, type RatingTone } from './rating';

/** Arabic star names, Western digits. The same words are the default in an Arabic theme. */
const arItemLabel = (score: number, max: number) => `${score} من ${max} نجوم`;
const arValueLabel = (value: number, max: number) => (value > 0 ? `${value} من ${max} نجوم` : 'بدون تقييم');

@Component({
  selector: 'ds-rating-demo',
  imports: [DEMO, DsTheme, DsRating],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div data-demo="page">
      <section data-demo="case" data-demo-case="variants" heading="Sizes, tones, ten stars and Arabic">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          @for (tone of tones; track tone) {
            @for (size of sizes; track size) {
              <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
                <span data-demo="label" [id]="'rt-' + tone + '-' + size">{{ 'Rate this board, ' + size + ', ' + tone }}</span>
                <div dsRating [aria-labelledby]="'rt-' + tone + '-' + size" [size]="size" [tone]="tone" [defaultValue]="3"></div>
              </div>
            }
          }
        </div>
        <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
          <span data-demo="label" id="rt-recommend">How likely are you to recommend us?</span>
          <div dsRating aria-labelledby="rt-recommend" [max]="10" [defaultValue]="8" size="sm" showValue></div>
        </div>
        <div data-demo="row" label="Read only">
          <div dsRating readOnly [value]="4.5" showValue></div>
          <div dsRating readOnly [value]="3" tone="accent" size="sm"></div>
        </div>
        <div dsTheme lang="ar">
          <div data-demo="row">
            <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
              <span data-demo="label" id="rt-ar">تقييم اللوحة</span>
              <div dsRating aria-labelledby="rt-ar" [defaultValue]="4" [getItemLabel]="arItemLabel"></div>
            </div>
            <div dsRating readOnly [value]="3.5" [getValueLabel]="arValueLabel" showValue></div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="empty" heading="Not rated yet">
        <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
          <span data-demo="label" id="rt-empty">Rate this template</span>
          <div dsRating aria-labelledby="rt-empty"></div>
        </div>
        <div dsRating readOnly [value]="0">No ratings yet</div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One rating with a count">
        <div dsRating readOnly [value]="4.5" showValue>(128 reviews)</div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="A list of ratings">
        <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
          <span data-demo="label" id="rt-session">Rate the session</span>
          <div dsRating aria-labelledby="rt-session" [defaultValue]="3"></div>
        </div>
        <div style="display: grid; gap: var(--ds-space-xs);">
          @for (value of list; track value) {
            <div dsRating readOnly [value]="value" size="sm" showValue></div>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text after the stars, in a narrow box">
        <div style="max-inline-size: var(--ds-dialog-width-sm);">
          <div dsRating readOnly [value]="4" showValue>{{ sample.en.long }}</div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
        <div dsTheme lang="ar" data-demo="content">
          <div style="max-inline-size: var(--ds-dialog-width-sm); display: grid; gap: var(--ds-space-s);">
            <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
              <span data-demo="label" id="rt-long-ar">تقييم تجربتك مع اللوحة</span>
              <div dsRating aria-labelledby="rt-long-ar" [defaultValue]="2" [getItemLabel]="arItemLabel"></div>
            </div>
            <div dsRating readOnly [value]="4.5" [getValueLabel]="arValueLabel" showValue>{{ sample.ar.long }}</div>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div style="display: grid; align-content: start; gap: var(--ds-space-2xs); justify-items: start;">
          <span data-demo="label" id="rt-disabled">Rate this board</span>
          <div dsRating aria-labelledby="rt-disabled" disabled [defaultValue]="2">You can rate it after you open it.</div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="readonly" heading="Read only">
        <div data-demo="row">
          <div dsRating readOnly [value]="3.5"></div>
          <div dsRating readOnly [value]="7" [max]="10" showValue size="lg" tone="accent"></div>
        </div>
      </section>
    </div>
  `,
})
export default class RatingDemo {
  protected readonly sizes: RatingSize[] = ['sm', 'md', 'lg'];
  protected readonly tones: RatingTone[] = ['warning', 'accent'];
  protected readonly list = [5, 4.5, 4, 3, 2.5, 1];
  protected readonly sample = sample;
  protected readonly arItemLabel = arItemLabel;
  protected readonly arValueLabel = arValueLabel;
}
