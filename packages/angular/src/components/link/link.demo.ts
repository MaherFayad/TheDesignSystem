// The Link demo: the same cases, ids and copy as
// packages/react/src/components/Link/Link.demo.tsx. React's asChild row is
// the plain a[dsLink] here: a router link is the same element. The
// `<ng-container>{{ ' ' }}</ng-container>` spaces split the text into the
// same text nodes as React's {' '}, so the browser shapes the Arabic
// sentences the same way and the pixels match.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsLink, type LinkSize, type LinkTone } from './link';

const tones: LinkTone[] = ['neutral', 'accent'];
const sizes: LinkSize[] = ['xs', 'sm', 'md', 'lg'];

const places = [
  'Read the pricing guide',
  'Open the changelog',
  'See every keyboard shortcut',
  'Read the privacy policy',
  'Open the status page',
  'Contact support',
  'Read the terms of use',
  'See the roadmap',
  'Open the help center',
  'Read the release notes',
  'See the accessibility statement',
  'Download the brand kit',
];

const placesAr = [
  'دليل الأسعار',
  'سجل التحديثات',
  'اختصارات لوحة المفاتيح',
  'سياسة الخصوصية',
  'حالة الخدمة',
  'التواصل مع الدعم',
  'شروط الاستخدام',
  'خطة التطوير',
  'مركز المساعدة',
  'ملاحظات الإصدار',
  'بيان سهولة الوصول',
  'تنزيل هوية العلامة',
];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsLink, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <section data-demo="case" data-demo-case="variants" heading="Variants: tone, size, standalone and external">
        @for (tone of tones; track tone) {
          <div data-demo="row" [label]="tone">
            <p>Your board is saved. <a dsLink [tone]="tone" href="#sharing">Read the sharing guide</a> to invite your team, or<ng-container>{{ ' ' }}</ng-container><a dsLink [tone]="tone" href="https://example.com/docs" external>open the full docs</a>.</p>
          </div>
        }
        @for (size of sizes; track size) {
          <div data-demo="row" [label]="'Size ' + size">
            @for (tone of tones; track tone) {
              <a dsLink [tone]="tone" [size]="size" standalone [href]="'#' + size + '-' + tone">Read the pricing guide</a>
            }
            <a dsLink [size]="size" standalone external href="https://example.com/changelog">Open the changelog</a>
          </div>
        }
        <div data-demo="row" [label]="'Inherits the text size'">
          <p style="font-size: var(--ds-font-size-xl)">Large text keeps its size: <a dsLink href="#inherit">see the type scale</a>.</p>
        </div>
        <div data-demo="row" [label]="'As a router link'">
          <a dsLink standalone tone="accent" href="#router">Open the project list</a>
        </div>
        <h3 data-demo="title">Variants in Arabic</h3>
        <div dsTheme [lang]="'ar'" data-demo="content">
          @for (tone of tones; track tone) {
            <div data-demo="row" [label]="tone">
              <p>لوحتك محفوظة. شوف<ng-container>{{ ' ' }}</ng-container><a dsLink [tone]="tone" href="#sharing-ar">دليل المشاركة</a><ng-container>{{ ' ' }}</ng-container>عشان تضيف فريقك، أو افتح<ng-container>{{ ' ' }}</ng-container><a dsLink [tone]="tone" href="https://example.com/docs" external>الدليل الكامل</a>.</p>
            </div>
          }
          <div data-demo="row" [label]="'Sizes'">
            @for (size of sizes; track size) {
              <a dsLink [size]="size" standalone [href]="'#ar-' + size">دليل الأسعار</a>
            }
            <a dsLink standalone external href="https://example.com/changelog">سجل التحديثات</a>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One link in a sentence">
        <div data-demo="row">
          <p>Storage is almost full. <a dsLink href="#storage">Review large files</a> to free some space.</p>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many links">
        <div data-demo="row">
          <p>Start with the <a dsLink href="#start">getting started guide</a>, then read about<ng-container>{{ ' ' }}</ng-container><a dsLink href="#boards">boards</a>, <a dsLink href="#references">references</a> and<ng-container>{{ ' ' }}</ng-container><a dsLink href="#export">export kits</a>. Questions go to<ng-container>{{ ' ' }}</ng-container><a dsLink href="https://example.com/support" external>the support forum</a>.</p>
        </div>
        <div data-demo="row">
          @for (label of places.slice(0, 4); track label; let i = $index) {
            <a dsLink standalone [href]="'#place-' + (i + 1)">{{ label }}</a>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many links, the row wraps">
        <div data-demo="row">
          @for (label of places; track label; let i = $index) {
            <a dsLink standalone size="sm" [href]="'#place-' + (i + 1)">{{ label }}</a>
          }
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <p style="max-inline-size: var(--ds-menu-width-min)">Before you publish, <a dsLink href="#checklist">read the full publishing checklist with every step for teams and guests</a><ng-container>{{ ' ' }}</ng-container>and fix what it flags.</p>
        </div>
        <div data-demo="row" [label]="'Standalone, wraps'">
          <div style="max-inline-size: var(--ds-menu-width-min)">
            <a dsLink standalone external href="https://example.com/guide">Read the guide to sharing boards with people outside your organization</a>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <p>قبل ما تنشر الصفحة، اقرأ<ng-container>{{ ' ' }}</ng-container><a dsLink href="#checklist-ar">قائمة التحقق الكاملة قبل النشر مع كل الخطوات للفريق والضيوف</a> وصلح اللي تنبهك عليه. وإذا عندك سؤال،<ng-container>{{ ' ' }}</ng-container><a dsLink href="https://example.com/support" external>منتدى الدعم</a><ng-container>{{ ' ' }}</ng-container>موجود.</p>
        </div>
        <div data-demo="row">
          @for (label of placesAr; track label; let i = $index) {
            <a dsLink standalone size="sm" [href]="'#ar-place-' + (i + 1)">{{ label }}</a>
          }
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <a dsLink disabled standalone href="#export">Download the export kit</a>
          <a dsLink disabled standalone tone="accent" href="#invoice">Open the invoice</a>
          <a dsLink disabled standalone external href="https://example.com/report">Open the shared report</a>
        </div>
        <div data-demo="row">
          <p>The report is still building. <a dsLink disabled href="#report">Download the report</a> when it is ready.</p>
        </div>
      </section>
  `,
})
export default class LinkDemo {
  protected readonly tones = tones;
  protected readonly sizes = sizes;
  protected readonly places = places;
  protected readonly placesAr = placesAr;
}
