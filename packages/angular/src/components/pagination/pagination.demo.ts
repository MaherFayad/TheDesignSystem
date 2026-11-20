// The Pagination demo: the same cases, ids and copy as
// packages/react/src/components/Pagination/Pagination.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsPagination, type PaginationShape, type PaginationSize } from './pagination';

const sizes: PaginationSize[] = ['sm', 'md', 'lg'];
const shapes: PaginationShape[] = ['default', 'pill', 'square'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsPagination, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: size and shape">
      @for (size of sizes; track size) {
        <div data-demo="row" [label]="'Size ' + size">
          <nav dsPagination [size]="size" [defaultPage]="5" [pageCount]="16"></nav>
        </div>
      }
      @for (shape of shapes; track shape) {
        <div data-demo="row" [label]="'Shape ' + shape">
          <nav dsPagination [shape]="shape" [defaultPage]="2" [pageCount]="16" [showEnds]="false"></nav>
        </div>
      }
      <div data-demo="row" label="With a summary">
        <nav dsPagination [defaultPage]="2" [itemCount]="312" [pageSize]="20"></nav>
      </div>
      <div data-demo="row" label="As links">
        <nav dsPagination [defaultPage]="3" [pageCount]="8" [getHref]="resultsHref"></nav>
      </div>
      <div data-demo="row" label="Dots: one per page, the current one wider">
        <nav dsPagination variant="dots" [defaultPage]="1" [pageCount]="2"></nav>
        <nav dsPagination variant="dots" [defaultPage]="2" [pageCount]="4"></nav>
        <nav dsPagination variant="dots" [defaultPage]="3" [pageCount]="7"></nav>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row" label="Size md">
          <nav dsPagination [defaultPage]="5" [pageCount]="16"></nav>
        </div>
        <div data-demo="row" label="With a summary">
          <nav dsPagination [defaultPage]="2" [itemCount]="312" [pageSize]="20"></nav>
        </div>
        <div data-demo="row" label="نقاط">
          <nav dsPagination variant="dots" [defaultPage]="2" [pageCount]="5"></nav>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: no items, one page">
      <nav dsPagination [itemCount]="0"></nav>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One page">
      <nav dsPagination [itemCount]="12" [pageSize]="20"></nav>
      <div data-demo="row" label="Dots, one page">
        <nav dsPagination variant="dots" [pageCount]="1"></nav>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many pages, every page shows">
      <nav dsPagination [defaultPage]="3" [pageCount]="7"></nav>
      <div data-demo="row" label="Dots, seven pages">
        <nav dsPagination variant="dots" [defaultPage]="4" [pageCount]="7"></nav>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many pages, ellipses on both sides">
      <div data-demo="row" label="Middle">
        <nav dsPagination [defaultPage]="250" [itemCount]="12480" [pageSize]="25"></nav>
      </div>
      <div data-demo="row" label="Wider window">
        <nav dsPagination [defaultPage]="250" [pageCount]="500" [siblings]="2" [boundaries]="2"></nav>
      </div>
      <div data-demo="row" label="Dots past the width: smaller dots, a press on either half goes back or forward">
        <div style="inline-size: 100%">
          <nav dsPagination variant="dots" [defaultPage]="12" [pageCount]="40"></nav>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: a summary that names the items wraps on a phone">
      <nav dsPagination [defaultPage]="3" [itemCount]="1284" [pageSize]="50" [formatSummary]="boardsSummary"></nav>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <nav dsPagination [defaultPage]="1240" [itemCount]="124810" [pageSize]="100"></nav>
        <div data-demo="row" label="نقاط صفحات التعريف">
          <nav dsPagination variant="dots" [defaultPage]="3" [pageCount]="9" label="صفحات التعريف بالتطبيق"></nav>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Disabled while the list loads">
      <nav dsPagination [defaultPage]="4" [pageCount]="16" disabled></nav>
      <div data-demo="row" label="Dots">
        <nav dsPagination variant="dots" [defaultPage]="2" [pageCount]="5" disabled></nav>
      </div>
    </section>
  `,
})
export default class PaginationDemo {
  protected readonly sizes = sizes;
  protected readonly shapes = shapes;
  protected readonly resultsHref = (page: number) => `#results-page-${page}`;
  protected readonly boardsSummary = (s: number, e: number, t: number) =>
    `Showing boards ${s} to ${e} of ${t} in the Brand refresh workspace`;
}
