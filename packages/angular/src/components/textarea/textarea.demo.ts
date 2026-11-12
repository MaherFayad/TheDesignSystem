// The Textarea demo: the same cases, ids and copy as
// packages/react/src/components/Textarea/Textarea.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsTextarea, type TextareaSize } from './textarea';

const longEn = Array.from({ length: 6 }, () => sample.en.long).join(' ');
const longAr = Array.from({ length: 4 }, () => sample.ar.long).join(' ');
const nearLimit = 'The board opens on the spring launch frame, with the hero and the three product cards in place.';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsField, DsTextarea, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes, count, fixed height">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          @for (size of sizes; track size) {
            <div dsField [label]="'Notes, size ' + size">
              <div dsTextarea [size]="size" [rows]="2" placeholder="For example, the hero needs a new photo"></div>
            </div>
          }
          <div dsField label="Board summary" description="Up to 200 characters.">
            <div dsTextarea [limit]="200" value="A first pass at the spring launch page."></div>
          </div>
          <div dsField label="Release notes" description="Drag the corner to make it taller.">
            <div dsTextarea [autoHeight]="false" [rows]="4"></div>
          </div>
        </div>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
            <div dsField label="ملاحظات" description="بحد أقصى 200 حرف.">
              <div dsTextarea [limit]="200" value="مسودة أولى لصفحة إطلاق الربيع."></div>
            </div>
            <div dsField label="ملخص اللوحة">
              <div dsTextarea size="sm" [rows]="2" placeholder="مثال: الصورة الرئيسية تحتاج تحديث"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, with a hint">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Message to the team" description="They see it on the board.">
          <div dsTextarea placeholder="For example, the review is moved to Thursday"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One line of text">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Board summary">
          <div dsTextarea value="Spring launch, first pass."></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Several paragraphs, grows to 8 lines">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Brief">
          <div dsTextarea [maxRows]="8" [value]="sample.en.long + '\\n\\n' + sample.en.long"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Past the cap: the text scrolls inside">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Brief" description="Shows 6 lines, then scrolls.">
          <div dsTextarea [maxRows]="6" [value]="longEn"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="One long word">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div style="max-inline-size: 20rem;">
          <div dsField label="Link to the file">
            <div dsTextarea [value]="sample.en.word + sample.en.word + sample.en.word"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="وصف اللوحة" description="بحد أقصى 1000 حرف.">
          <div dsTextarea [maxRows]="6" [limit]="1000" [value]="longAr"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Near and past the limit">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));">
          <div dsField label="Board summary" description="Up to 100 characters.">
            <div dsTextarea [limit]="100" [value]="nearLimit"></div>
          </div>
          <div dsField label="Board summary" error="Remove 9 characters, so the summary fits on the card.">
            <div dsTextarea [limit]="100" [value]="nearLimit + ' Add the last.'"></div>
          </div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Board summary" disabled description="Only owners can edit the summary.">
          <div dsTextarea value="Spring launch, first pass."></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsTheme [lang]="'en'" data-demo="content">
        <div dsField label="Original brief" readOnly>
          <div dsTextarea [value]="sample.en.long"></div>
        </div>
      </div>
    </section>
  `,
})
export default class TextareaDemo {
  protected readonly sample = sample;
  protected readonly sizes: TextareaSize[] = ['xs', 'sm', 'md', 'lg'];
  protected readonly longEn = longEn;
  protected readonly longAr = longAr;
  protected readonly nearLimit = nearLimit;
}
