import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsSize } from './index';

const sizes: BreadcrumbsSize[] = ['sm', 'md'];

const path = (labels: string[]): BreadcrumbItem[] =>
  labels.map((label, i) => ({ label, href: i < labels.length - 1 ? `#crumb-${i}` : undefined }));

const en = path(['Home', 'Projects', 'Brand refresh', 'Boards', 'Homepage hero']);
const ar = path(['الرئيسية', 'المشاريع', 'تحديث الهوية', 'اللوحات', 'واجهة الصفحة الرئيسية']);

const deep = path([
  'Home',
  'Workspaces',
  'Marketing',
  'Projects',
  'Brand refresh',
  'Boards',
  'Campaigns',
  'Spring launch',
  'Assets',
  'Homepage hero',
]);

const deepAr = path([
  'الرئيسية',
  'مساحات العمل',
  'التسويق',
  'المشاريع',
  'تحديث الهوية',
  'اللوحات',
  'الحملات',
  'إطلاق الربيع',
  'الملفات',
  'واجهة الصفحة الرئيسية',
]);

export default function BreadcrumbsDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: size">
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Breadcrumbs size={size} items={en} />
          </DemoRow>
        ))}
        <DemoRow label="Router links">
          <Breadcrumbs
            items={[
              { label: 'Home', link: <a href="#router-home">Home</a> },
              { label: 'Settings', link: <a href="#router-settings">Settings</a> },
              { label: 'Billing' },
            ]}
          />
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {sizes.map((size) => (
            <DemoRow key={size} label={`Size ${size}`}>
              <Breadcrumbs size={size} items={ar} />
            </DemoRow>
          ))}
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One step: the current page only">
        <Breadcrumbs items={[{ label: 'Home' }]} />
      </DemoCase>

      <DemoCase id="many" title="Many steps">
        <Breadcrumbs items={en} />
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the middle steps collapse into a menu">
        <DemoRow label="maxItems 4">
          <Breadcrumbs items={deep} maxItems={4} />
        </DemoRow>
        <DemoRow label="Every step, wraps">
          <Breadcrumbs items={deep} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: each step truncates, the full name shows on hover and focus">
        <Breadcrumbs
          items={path([
            'Home',
            'Quarterly planning for the brand and marketing teams across every region',
            'Research notes from the customer interviews held in the spring',
            'Summary of the findings and the next steps for the design team',
          ])}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Breadcrumbs
            items={path([
              'الرئيسية',
              'خطة الربع القادم لفريق الهوية والتسويق في كل المناطق',
              'ملاحظات البحث من مقابلات العملاء في الربيع',
              'ملخص النتائج والخطوات الجاية لفريق التصميم',
            ])}
          />
        </DemoRow>
        <DemoRow>
          <Breadcrumbs items={deepAr} maxItems={4} />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
