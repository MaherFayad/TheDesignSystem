import type { CSSProperties, ReactNode } from 'react';
import { DemoCase, DemoPage } from '../../demo';
import { Theme } from '../../theme';
import { Link } from '../Link';
import { SkipLink } from './index';

/** A small page: the skip link sits first, a header of links follows, then the target. */
const frame: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gap: 'var(--ds-space-m)',
  padding: 'var(--ds-space-6xl) var(--ds-space-l) var(--ds-space-l)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  borderRadius: 'var(--ds-radius-card)',
};

const header: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 'var(--ds-space-m)' };

const main: CSSProperties = {
  padding: 'var(--ds-space-m)',
  borderRadius: 'var(--ds-radius-sm)',
  background: 'var(--ds-color-bg-surface-2)',
};

function Page({ id, nav, skip, children }: { id: string; nav: string[]; skip: ReactNode; children: ReactNode }) {
  return (
    <div style={frame}>
      {skip}
      <nav aria-label={`Site ${id}`} style={header}>
        {nav.map((label) => (
          <Link key={label} standalone href={`#${id}-${label}`}>
            {label}
          </Link>
        ))}
      </nav>
      <div id={id} style={main}>
        {children}
      </div>
    </div>
  );
}

const navEn = ['Boards', 'Templates', 'Pricing', 'Docs'];
const navAr = ['اللوحات', 'القوالب', 'الأسعار', 'الدليل'];

export default function SkipLinkDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: press Tab to show the link, Enter to jump">
        <Page id="demo-main" nav={navEn} skip={<SkipLink href="#demo-main" />}>
          <p>Main content. Focus lands here, on an element that was not focusable before.</p>
        </Page>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          <Page id="demo-main-ar" nav={navAr} skip={<SkipLink href="#demo-main-ar" />}>
            <p>المحتوى الرئيسي. التركيز ينتقل هنا.</p>
          </Page>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One link to the default target">
        <Page id="main-sample" nav={navEn.slice(0, 2)} skip={<SkipLink href="#main-sample">Skip to the board list</SkipLink>}>
          <p>The default href is #main. This sample points at its own region.</p>
        </Page>
      </DemoCase>

      <DemoCase id="many" title="Many: one link per region, in reading order">
        <Page
          id="demo-many-main"
          nav={navEn}
          skip={
            <>
              <SkipLink href="#demo-many-main">Skip to main content</SkipLink>
              <SkipLink href="#demo-many-search">Skip to search</SkipLink>
              <SkipLink href="#demo-many-footer">Skip to the footer</SkipLink>
            </>
          }
        >
          <p id="demo-many-search">Search the boards.</p>
          <p id="demo-many-footer">Footer links and the language switch.</p>
        </Page>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Page
          id="demo-long"
          nav={navEn}
          skip={<SkipLink href="#demo-long">Skip past the navigation and the announcement bar to the main content of this page</SkipLink>}
        >
          <p>The link wraps inside the page width.</p>
        </Page>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Page
          id="demo-long-ar"
          nav={navAr}
          skip={<SkipLink href="#demo-long-ar">الانتقال مباشرة للمحتوى الرئيسي وتجاوز القائمة وشريط التنبيهات</SkipLink>}
        >
          <p>الرابط ينكسر لسطرين داخل عرض الصفحة.</p>
        </Page>
      </DemoCase>
    </DemoPage>
  );
}
