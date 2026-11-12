// The SearchField demo: the same cases, ids and copy as
// packages/react/src/components/SearchField/SearchField.demo.tsx.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsField } from '../field/field';
import { DsIconButton } from '../icon-button/icon-button';
import { DsSearchField, type SearchFieldShape, type SearchFieldSize } from './search-field';

const sizes: SearchFieldSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SearchFieldShape[] = ['default', 'pill'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsField, DsIconButton, DsSearchField, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Sizes and shapes">
      @for (shape of shapes; track shape) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));">
          @for (size of sizes; track size) {
            <div
              dsSearchField
              [size]="size"
              [shape]="shape"
              [aria-label]="'Search boards, ' + size + ', ' + shape"
              placeholder="Search boards"
              [value]="size === 'xs' || size === 'lg' ? 'launch' : ''"
            ></div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(min(14rem, 100%), 1fr));">
        <div dsSearchField aria-label="Search members" placeholder="Search members" [end]="filterMembers"></div>
        <ng-template #filterMembers><button dsIconButton icon="filter" label="Filter members" size="xs" shape="pill"></button></ng-template>
        <div dsSearchField aria-label="Search files" value="brand" [end]="filterFiles"></div>
        <ng-template #filterFiles><button dsIconButton icon="filter" label="Filter files" size="xs" shape="pill"></button></ng-template>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="عربي">
          <div dsSearchField aria-label="البحث في اللوحات" placeholder="البحث في اللوحات" clearLabel="مسح البحث"></div>
          <div dsSearchField aria-label="البحث في الملفات" value="الهوية" clearLabel="مسح البحث"></div>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty, placeholder only">
      <div dsSearchField aria-label="Search boards" placeholder="Search boards"></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="With a query">
      <div dsSearchField aria-label="Search boards" value="spring launch"></div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Filtering a list">
      <div style="display: grid; gap: var(--ds-space-s); max-inline-size: var(--ds-dialog-width-sm);">
        <div dsSearchField aria-label="Search folders" placeholder="Search folders" [(value)]="query"></div>
        <p data-demo="label">{{ shown().length === 0 ? 'No folders match.' : shown().join(', ') }}</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Narrow container">
      <div style="max-inline-size: var(--ds-menu-width-min); display: grid; gap: var(--ds-space-s);">
        <div dsSearchField size="sm" aria-label="Search layers" value="Rectangle 12 copy 4"></div>
        <div dsSearchField size="sm" aria-label="Search assets" value="hero" [end]="filterAssets"></div>
        <ng-template #filterAssets><button dsIconButton icon="filter" label="Filter assets" size="xs" shape="pill"></button></ng-template>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long query">
      <div dsSearchField aria-label="Search boards" [value]="sample.en.long"></div>
      <div dsSearchField aria-label="Search words" [value]="sample.en.word"></div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="نص عربي طويل">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsField label="البحث في اللوحات" description="ابحث بالاسم أو بالوسم، والنتائج تطلع لك وأنت تكتب.">
          <div dsSearchField [value]="sample.ar.long" clearLabel="مسح البحث"></div>
        </div>
        <div dsSearchField aria-label="البحث" placeholder="ابحث في كل الملفات والمجلدات واللوحات المشتركة معك" clearLabel="مسح البحث"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Results on their way">
      <div dsSearchField aria-label="Search boards" value="launch" loading></div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Invalid with a message">
      <div dsField label="Search members" error="Type at least 2 letters of a name or an email.">
        <div dsSearchField value="s"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled">
      <div dsField label="Search members" disabled description="Search opens once the team is set up.">
        <div dsSearchField value="omar"></div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="readonly" heading="Read only">
      <div dsField label="Saved search" readOnly description="Shared by the team owner.">
        <div dsSearchField value="status:open owner:me"></div>
      </div>
    </section>
  `,
})
export default class SearchFieldDemo {
  protected readonly sample = sample;
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  /** A search that filters a list as the person types. */
  protected readonly query = signal('dr');
  protected readonly shown = computed(() => sample.en.items.filter((item) => item.toLowerCase().includes(this.query().toLowerCase())));
}
