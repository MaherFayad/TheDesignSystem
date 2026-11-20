// The SkipLink demo: the same cases, ids and copy as
// packages/react/src/components/SkipLink/SkipLink.demo.tsx. React's Page
// function is a component on the frame div itself; the skip links are
// projected, so they take the theme where they are written.
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { consumeHostAttributes } from '../../internal/host';
import { DsTheme } from '../../theme/theme';
import { DsLink } from '../link/link';
import { DsSkipLink } from './skip-link';

const navEn = ['Boards', 'Templates', 'Pricing', 'Docs'];
const navAr = ['اللوحات', 'القوالب', 'الأسعار', 'الدليل'];

/** A small page: the skip link sits first, a header of links follows, then the target. */
@Component({
  selector: 'div[dsDemoSkipPage]',
  imports: [DsLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    style:
      'position: relative; display: grid; gap: var(--ds-space-m); padding: calc(var(--ds-size-control-md) + 2 * var(--ds-space-s)) var(--ds-space-l) var(--ds-space-l); border: var(--ds-border-width-default) solid var(--ds-color-border-default); border-radius: var(--ds-radius-card)',
  },
  template: `
    <ng-content select="[dsSkipLink]" />
    <nav [attr.aria-label]="label()" style="display: flex; flex-wrap: wrap; gap: var(--ds-space-m)">
      @for (item of nav(); track item) {
        <a dsLink standalone [href]="'#' + target() + '-' + item">{{ item }}</a>
      }
    </nav>
    <div [id]="target()" style="padding: var(--ds-space-m); border-radius: var(--ds-radius-sm); background: var(--ds-color-bg-surface-2)">
      <ng-content />
    </div>
  `,
})
class DemoSkipPage {
  readonly target = input.required<string>();
  readonly nav = input.required<string[]>();
  readonly label = input.required<string>();

  constructor() {
    consumeHostAttributes(['dsDemoSkipPage', 'target', 'nav', 'label']);
  }
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DemoSkipPage, DsSkipLink, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: press Tab to show the link, Enter to jump">
      <div dsDemoSkipPage target="demo-main" [nav]="navEn" label="Site">
        <a dsSkipLink href="#demo-main"></a>
        <p>Main content. Focus lands here, on an element that was not focusable before.</p>
      </div>
      <h3 data-demo="title">Variants in Arabic</h3>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsDemoSkipPage target="demo-main-ar" [nav]="navAr" label="الموقع">
          <a dsSkipLink href="#demo-main-ar"></a>
          <p>المحتوى الرئيسي. التركيز ينتقل هنا.</p>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One link with custom text">
      <div dsDemoSkipPage target="main-sample" [nav]="navEnShort" label="Site">
        <a dsSkipLink href="#main-sample">Skip to the board list</a>
        <p>The default href is #main. This sample points at its own region and names it.</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: one link per region, in reading order">
      <div dsDemoSkipPage target="demo-many-main" [nav]="navEn" label="Site">
        <a dsSkipLink href="#demo-many-main">Skip to main content</a>
        <a dsSkipLink href="#demo-many-search">Skip to search</a>
        <a dsSkipLink href="#demo-many-footer">Skip to the footer</a>
        <p id="demo-many-search">Search the boards.</p>
        <p id="demo-many-footer">Footer links and the language switch.</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <div dsDemoSkipPage target="demo-long" [nav]="navEn" label="Site">
        <a dsSkipLink href="#demo-long">Skip past the navigation and the announcement bar to the main content of this page</a>
        <p>The link wraps inside the page width.</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsDemoSkipPage target="demo-long-ar" [nav]="navAr" label="الموقع">
          <a dsSkipLink href="#demo-long-ar">الانتقال مباشرة للمحتوى الرئيسي وتجاوز القائمة وشريط التنبيهات</a>
          <p>الرابط ينكسر لسطرين داخل عرض الصفحة.</p>
        </div>
      </div>
    </section>
  `,
})
export default class SkipLinkDemo {
  protected readonly navEn = navEn;
  protected readonly navAr = navAr;
  protected readonly navEnShort = navEn.slice(0, 2);
}
