import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Button } from './index';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from './index';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost', 'link'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

const toneLabel: Record<ButtonTone, string> = {
  neutral: 'Save draft',
  accent: 'Publish page',
  danger: 'Delete project',
  success: 'Approve change',
  warning: 'Reset layout',
  info: 'Open guide',
};

/** Verb plus noun labels, for the rows that need many buttons. */
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

/** The same actions as noun form labels in white Saudi dialect, no diacritics. */
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
          <Button tone="accent" emphasis="solid" iconEnd="arrow-forward">
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
            <Button size={size} emphasis="outline" iconStart="plus">
              Add file
            </Button>
            <Button size={size} emphasis="ghost" iconEnd="chevron-down">
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
          <Button iconStart="download">Download report</Button>
          <Button iconEnd="external" emphasis="outline">
            Open docs
          </Button>
          <Button iconStart="chevron-back" emphasis="ghost">
            Go back
          </Button>
          <Button iconEnd="chevron-forward" tone="accent" emphasis="solid">
            Go forward
          </Button>
          <Button iconStart="trash" tone="danger">
            Delete file
          </Button>
        </DemoRow>
        <DemoRow label="As a link">
          <Button asChild tone="accent" emphasis="solid" iconEnd="arrow-forward">
            <a href="#pricing">See pricing</a>
          </Button>
          <Button asChild emphasis="link">
            <a href="#docs">Read the guide</a>
          </Button>
        </DemoRow>
        <DemoRow label="Full width">
          <Button fullWidth tone="accent" emphasis="solid">
            Create account
          </Button>
        </DemoRow>
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
          <Button tone="accent" emphasis="solid" iconStart="upload">
            Upload every file in this folder and replace the older versions on the board
          </Button>
        </DemoRow>
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
          <Button iconEnd="arrow-forward">Download the full report with every comment and reference</Button>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          {actionsAr.slice(0, 4).map((label, i) => (
            <Button key={label} tone={i === 0 ? 'accent' : 'neutral'} emphasis={i === 0 ? 'solid' : 'soft'}>
              {label}
            </Button>
          ))}
        </DemoRow>
        <DemoRow>
          <Button tone="accent" emphasis="solid" size="lg" iconEnd="arrow-forward">
            حفظ التغييرات ومشاركة اللوحة مع كل أعضاء الفريق
          </Button>
          <Button size="lg" iconStart="chevron-back">
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

      <DemoCase id="loading" title="Loading">
        <DemoRow>
          <Button loading tone="accent" emphasis="solid">
            Save changes
          </Button>
          <Button loading>Export kit</Button>
          <Button loading emphasis="outline" iconStart="upload">
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
