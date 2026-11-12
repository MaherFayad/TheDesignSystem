import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Link } from './index';
import type { LinkSize, LinkTone } from './index';

const tones: LinkTone[] = ['neutral', 'accent'];
const sizes: LinkSize[] = ['xs', 'sm', 'md', 'lg'];

/** Standalone link text names the place it opens. */
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

/** The same places as noun forms in white Saudi dialect, no diacritics. */
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

const slug = (i: number) => `#place-${i + 1}`;

export default function LinkDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: tone, size, standalone and external">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            <p>
              Your board is saved. <Link tone={tone} href="#sharing">Read the sharing guide</Link> to invite your
              team, or{' '}
              <Link tone={tone} href="https://example.com/docs" external>
                open the full docs
              </Link>
              .
            </p>
          </DemoRow>
        ))}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            {tones.map((tone) => (
              <Link key={tone} tone={tone} size={size} standalone href={`#${size}-${tone}`}>
                Read the pricing guide
              </Link>
            ))}
            <Link size={size} standalone external href="https://example.com/changelog">
              Open the changelog
            </Link>
          </DemoRow>
        ))}
        <DemoRow label="Inherits the text size">
          <p style={{ fontSize: 'var(--ds-font-size-xl)' }}>
            Large text keeps its size: <Link href="#inherit">see the type scale</Link>.
          </p>
        </DemoRow>
        <DemoRow label="As a router link">
          <Link asChild standalone tone="accent">
            <a href="#router">Open the project list</a>
          </Link>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {tones.map((tone) => (
            <DemoRow key={tone} label={tone}>
              <p>
                لوحتك محفوظة. شوف{' '}
                <Link tone={tone} href="#sharing-ar">
                  دليل المشاركة
                </Link>{' '}
                عشان تضيف فريقك، أو افتح{' '}
                <Link tone={tone} href="https://example.com/docs" external>
                  الدليل الكامل
                </Link>
                .
              </p>
            </DemoRow>
          ))}
          <DemoRow label="Sizes">
            {sizes.map((size) => (
              <Link key={size} size={size} standalone href={`#ar-${size}`}>
                دليل الأسعار
              </Link>
            ))}
            <Link standalone external href="https://example.com/changelog">
              سجل التحديثات
            </Link>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One link in a sentence">
        <DemoRow>
          <p>
            Storage is almost full. <Link href="#storage">Review large files</Link> to free some space.
          </p>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many links">
        <DemoRow>
          <p>
            Start with the <Link href="#start">getting started guide</Link>, then read about{' '}
            <Link href="#boards">boards</Link>, <Link href="#references">references</Link> and{' '}
            <Link href="#export">export kits</Link>. Questions go to{' '}
            <Link href="https://example.com/support" external>
              the support forum
            </Link>
            .
          </p>
        </DemoRow>
        <DemoRow>
          {places.slice(0, 4).map((label, i) => (
            <Link key={label} standalone href={slug(i)}>
              {label}
            </Link>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many links, the row wraps">
        <DemoRow>
          {places.map((label, i) => (
            <Link key={label} standalone size="sm" href={slug(i)}>
              {label}
            </Link>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <p style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
            Before you publish, <Link href="#checklist">read the full publishing checklist with every step for teams and guests</Link>{' '}
            and fix what it flags.
          </p>
        </DemoRow>
        <DemoRow label="Standalone, wraps">
          <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
            <Link standalone external href="https://example.com/guide">
              Read the guide to sharing boards with people outside your organization
            </Link>
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <p>
            قبل ما تنشر الصفحة، اقرأ{' '}
            <Link href="#checklist-ar">قائمة التحقق الكاملة قبل النشر مع كل الخطوات للفريق والضيوف</Link> وصلح
            اللي تنبهك عليه. وإذا عندك سؤال،{' '}
            <Link href="https://example.com/support" external>
              منتدى الدعم
            </Link>{' '}
            موجود.
          </p>
        </DemoRow>
        <DemoRow>
          {placesAr.map((label, i) => (
            <Link key={label} standalone size="sm" href={`#ar-place-${i + 1}`}>
              {label}
            </Link>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <Link disabled standalone href="#export">
            Download the export kit
          </Link>
          <Link disabled standalone tone="accent" href="#invoice">
            Open the invoice
          </Link>
          <Link disabled standalone external href="https://example.com/report">
            Open the shared report
          </Link>
        </DemoRow>
        <DemoRow>
          <p>
            The report is still building. <Link disabled href="#report">Download the report</Link> when it is ready.
          </p>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
