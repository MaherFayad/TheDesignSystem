// The native Button demo: the same cases and copy as the React demo
// (packages/react/src/components/Button/Button.demo.tsx). Not shown here: the
// "As a link" row (no asChild on native).
import { ThemeProvider } from '../../theme/ThemeProvider';
import { DemoCase, DemoPage, DemoRow } from '../../demo/Demo';
import { Button } from './Button';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from './Button.styles';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

/** The tone labels as noun forms in white Saudi dialect, no diacritics. */
const toneLabelAr: Record<ButtonTone, string> = {
  neutral: 'حفظ المسودة',
  accent: 'نشر الصفحة',
  danger: 'حذف المشروع',
  success: 'اعتماد التعديل',
  warning: 'إعادة الترتيب',
  info: 'فتح الدليل',
};

const toneLabel: Record<ButtonTone, string> = {
  neutral: 'Save draft',
  accent: 'Publish page',
  danger: 'Delete project',
  success: 'Approve change',
  warning: 'Reset layout',
  info: 'Open guide',
};

const actions = [
  'Save changes',
  'Add file',
  'Share board',
  'Invite people',
  'Export kit',
  'Rename page',
  'Move folder',
  'Copy link',
  'Archive thread',
  'Download report',
  'Open settings',
  'Delete project',
];

const actionsAr = [
  'حفظ التغييرات',
  'إضافة ملف',
  'مشاركة اللوحة',
  'دعوة الفريق',
  'تصدير الحزمة',
  'تغيير الاسم',
  'نقل المجلد',
  'نسخ الرابط',
  'أرشفة المحادثة',
  'تنزيل التقرير',
  'فتح الإعدادات',
  'حذف المشروع',
];

export default function ButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in solid, soft, outline, ghost and link">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {emphases.map((emphasis) => (
              <Button key={emphasis} tone={tone} emphasis={emphasis}>
                {toneLabel[tone]}
              </Button>
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Primary action">
          <Button tone="accent" emphasis="solid" end="arrow-forward">
            Create board
          </Button>
          <Button>Cancel edit</Button>
          <Button emphasis="ghost">Skip step</Button>
        </DemoRow>
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Button size={size} tone="accent" emphasis="solid">
              Publish page
            </Button>
            <Button size={size}>Save draft</Button>
            <Button size={size} emphasis="outline" start="plus">
              Add file
            </Button>
            <Button size={size} emphasis="ghost" end="chevron-down">
              Sort items
            </Button>
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <Button shape={shape} tone="accent" emphasis="solid">
              Publish page
            </Button>
            <Button shape={shape}>Save draft</Button>
            <Button shape={shape} emphasis="outline">
              Share board
            </Button>
          </DemoRow>
        ))}
        <DemoRow label="With icons">
          <Button start="download">Download report</Button>
          <Button end="external" emphasis="outline">
            Open docs
          </Button>
          <Button start="chevron-back" emphasis="ghost">
            Open previous page
          </Button>
          <Button end="chevron-forward" tone="accent" emphasis="solid">
            Open next page
          </Button>
          <Button start="trash" tone="danger">
            Delete file
          </Button>
        </DemoRow>
        <DemoRow label="Full width">
          <Button fullWidth tone="accent" emphasis="solid">
            Create account
          </Button>
        </DemoRow>
        <ThemeProvider lang="ar">
          <DemoPage>
            {tones.map((tone) => (
              <DemoRow key={tone} label={tone}>
                {emphases.map((emphasis) => (
                  <Button key={emphasis} tone={tone} emphasis={emphasis}>
                    {toneLabelAr[tone]}
                  </Button>
                ))}
              </DemoRow>
            ))}
            <DemoRow label="Sizes">
              {sizes.map((size) => (
                <Button key={size} size={size} tone="accent" emphasis="solid" start="plus">
                  إضافة ملف
                </Button>
              ))}
            </DemoRow>
          </DemoPage>
        </ThemeProvider>
      </DemoCase>

      <DemoCase id="one" title="One button">
        <DemoRow>
          <Button tone="accent" emphasis="solid">
            Save changes
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many buttons">
        <DemoRow>
          <Button tone="accent" emphasis="solid">
            Save changes
          </Button>
          <Button>Preview page</Button>
          <Button emphasis="outline">Share board</Button>
          <Button emphasis="ghost">Discard edits</Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many buttons, the row wraps">
        <DemoRow>
          {actions.map((label, i) => (
            <Button key={label} tone={i === 0 ? 'accent' : 'neutral'} emphasis={i === 0 ? 'solid' : 'soft'}>
              {label}
            </Button>
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <Button tone="accent" emphasis="solid" start="upload">
            Upload every file in this folder and replace the older versions on the board
          </Button>
        </DemoRow>
        <DemoRow label="Squeezed, ends in an ellipsis" narrow>
          <Button end="arrow-forward">Download the full report with every comment and reference</Button>
        </DemoRow>
        <DemoRow label="wrap" narrow>
          <Button wrap end="arrow-forward">
            Download the full report with every comment and reference
          </Button>
        </DemoRow>
      </DemoCase>

      <ThemeProvider lang="ar">
        <DemoCase id="long-arabic" title="نص عربي طويل">
          <DemoRow>
            {actionsAr.slice(0, 4).map((label, i) => (
              <Button key={label} tone={i === 0 ? 'accent' : 'neutral'} emphasis={i === 0 ? 'solid' : 'soft'}>
                {label}
              </Button>
            ))}
          </DemoRow>
          <DemoRow>
            <Button tone="accent" emphasis="solid" size="lg" end="arrow-forward">
              حفظ التغييرات ومشاركة اللوحة مع كل أعضاء الفريق
            </Button>
            <Button size="lg" start="chevron-back">
              رجوع
            </Button>
          </DemoRow>
          <DemoRow>
            {actionsAr.map((label) => (
              <Button key={label} size="sm">
                {label}
              </Button>
            ))}
          </DemoRow>
        </DemoCase>
      </ThemeProvider>

      <DemoCase id="loading" title="Loading">
        <DemoRow>
          <ThemeProvider lang="ar">
            <Button loading loadingLabel="جار الحفظ" tone="accent" emphasis="solid">
              حفظ التغييرات
            </Button>
          </ThemeProvider>
          <Button loading tone="accent" emphasis="solid">
            Save changes
          </Button>
          <Button loading>Export kit</Button>
          <Button loading emphasis="outline" start="upload">
            Upload file
          </Button>
          <Button loading tone="danger" emphasis="solid">
            Delete project
          </Button>
          <Button loading size="lg" tone="accent" emphasis="solid">
            Create board
          </Button>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <Button disabled tone="accent" emphasis="solid">
            Publish page
          </Button>
          <Button disabled>Save draft</Button>
          <Button disabled emphasis="outline">
            Share board
          </Button>
          <Button disabled emphasis="ghost">
            Skip step
          </Button>
          <Button disabled tone="danger">
            Delete project
          </Button>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
