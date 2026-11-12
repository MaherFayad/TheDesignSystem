import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { ButtonGroup } from './index';
import type { ButtonGroupEmphasis, ButtonGroupShape, ButtonGroupSize } from './index';

const emphases: ButtonGroupEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonGroupSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonGroupShape[] = ['default', 'pill', 'square'];

/** Verb plus noun labels for a row of related actions. */
const actions = ['Copy link', 'Share board', 'Export kit', 'Rename page', 'Move folder', 'Archive thread', 'Download report', 'Open settings'];

/** The same actions as noun form labels in white Saudi dialect, no diacritics. */
const actionsAr = ['نسخ الرابط', 'مشاركة اللوحة', 'تصدير الحزمة', 'تغيير الاسم', 'نقل المجلد', 'أرشفة المحادثة', 'تنزيل التقرير', 'فتح الإعدادات'];

function ViewSwitch({ size }: { size?: ButtonGroupSize }) {
  return (
    <ButtonGroup attached size={size} emphasis="outline" aria-label="Board view">
      <IconButton icon="list" label="Show as list" />
      <IconButton icon="grid" label="Show as grid" />
      <IconButton icon="columns" label="Show as columns" />
    </ButtonGroup>
  );
}

export default function ButtonGroupDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: attached in each emphasis, sizes, shapes and orientation">
        {emphases.map((emphasis) => (
          <DemoRow key={emphasis} label={`Attached ${emphasis}`}>
            <ButtonGroup attached emphasis={emphasis} aria-label="Page actions">
              <Button>Save draft</Button>
              <Button>Preview page</Button>
              <Button>Share board</Button>
            </ButtonGroup>
            <ButtonGroup attached emphasis={emphasis} aria-label="Pages">
              <IconButton icon="chevron-back" label="Open previous page" />
              <IconButton icon="chevron-forward" label="Open next page" />
            </ButtonGroup>
          </DemoRow>
        ))}
        <DemoRow label="Accent child">
          <ButtonGroup attached emphasis="solid" aria-label="Publish actions">
            <Button tone="accent">Publish page</Button>
            <Button tone="accent">Schedule post</Button>
          </ButtonGroup>
          <ButtonGroup attached aria-label="Delete actions">
            <Button tone="danger">Delete file</Button>
            <Button tone="danger">Delete folder</Button>
          </ButtonGroup>
        </DemoRow>
        <DemoRow label="Spaced">
          <ButtonGroup aria-label="Form actions">
            <Button tone="accent" emphasis="solid">
              Save changes
            </Button>
            <Button>Preview page</Button>
            <Button emphasis="ghost">Discard edits</Button>
          </ButtonGroup>
        </DemoRow>
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <ButtonGroup attached size={size} emphasis="soft" aria-label="File actions">
              <Button start="plus">Add file</Button>
              <Button>Copy link</Button>
              <IconButton icon="more" label="Open more actions" />
            </ButtonGroup>
            <ViewSwitch size={size} />
            <ButtonGroup size={size} aria-label="Zoom">
              <IconButton icon="zoom-out" label="Zoom out" emphasis="soft" />
              <IconButton icon="zoom-in" label="Zoom in" emphasis="soft" />
            </ButtonGroup>
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <ButtonGroup attached shape={shape} aria-label="Page actions">
              <Button>Save draft</Button>
              <Button>Preview page</Button>
              <Button>Share board</Button>
            </ButtonGroup>
            <ButtonGroup shape={shape} emphasis="outline" aria-label="Board actions">
              <Button>Copy link</Button>
              <Button>Export kit</Button>
            </ButtonGroup>
          </DemoRow>
        ))}
        <DemoRow label="Vertical">
          <ButtonGroup attached orientation="vertical" aria-label="Arrange">
            <Button start="arrow-up">Bring forward</Button>
            <Button start="arrow-down">Send backward</Button>
            <Button start="refresh">Reset order</Button>
          </ButtonGroup>
          <ButtonGroup attached orientation="vertical" emphasis="outline" aria-label="Zoom">
            <IconButton icon="zoom-in" label="Zoom in" />
            <IconButton icon="zoom-out" label="Zoom out" />
          </ButtonGroup>
          <ButtonGroup orientation="vertical" aria-label="Export">
            <Button start="download">Download report</Button>
            <Button start="copy">Copy link</Button>
          </ButtonGroup>
        </DemoRow>
        <DemoRow label="Full width">
          <ButtonGroup attached fullWidth aria-label="Billing period">
            <Button>Pay monthly</Button>
            <Button>Pay yearly</Button>
          </ButtonGroup>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {emphases.map((emphasis) => (
            <DemoRow key={emphasis} label={emphasis}>
              <ButtonGroup attached emphasis={emphasis} aria-label="إجراءات الصفحة">
                <Button>حفظ المسودة</Button>
                <Button>معاينة الصفحة</Button>
                <Button>مشاركة اللوحة</Button>
              </ButtonGroup>
              <ButtonGroup attached emphasis={emphasis} aria-label="الصفحات">
                <IconButton icon="chevron-back" label="الصفحة السابقة" />
                <IconButton icon="chevron-forward" label="الصفحة التالية" />
              </ButtonGroup>
            </DemoRow>
          ))}
          <DemoRow label="Sizes">
            {sizes.map((size) => (
              <ButtonGroup key={size} attached size={size} aria-label="إجراءات الملف">
                <Button start="plus">إضافة ملف</Button>
                <Button>نسخ الرابط</Button>
              </ButtonGroup>
            ))}
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One group">
        <DemoRow>
          <ButtonGroup attached aria-label="Page actions">
            <Button>Save draft</Button>
            <Button>Preview page</Button>
          </ButtonGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Five actions, the most a group holds">
        <DemoRow>
          <ButtonGroup attached aria-label="Board actions">
            {actions.slice(0, 5).map((label) => (
              <Button key={label}>{label}</Button>
            ))}
          </ButtonGroup>
        </DemoRow>
        <DemoRow>
          <ButtonGroup aria-label="Board actions">
            {actions.slice(0, 5).map((label) => (
              <Button key={label} emphasis="outline">
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many actions: a spaced group wraps; past five, move the rest to a menu">
        <DemoRow>
          <ButtonGroup aria-label="Board actions">
            {actions.map((label) => (
              <Button key={label}>{label}</Button>
            ))}
          </ButtonGroup>
        </DemoRow>
        <DemoRow label="Squeezed, attached labels end in an ellipsis">
          <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
            <ButtonGroup attached aria-label="Board actions">
              {actions.slice(0, 3).map((label) => (
                <Button key={label}>{label}</Button>
              ))}
            </ButtonGroup>
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <ButtonGroup attached aria-label="Upload actions">
            <Button start="upload">Upload every file in this folder</Button>
            <Button>Replace the older versions on the board</Button>
          </ButtonGroup>
        </DemoRow>
        <DemoRow label="Vertical, wrap">
          <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
            <ButtonGroup attached fullWidth orientation="vertical" aria-label="Download actions">
              <Button wrap>Download the full report with every comment</Button>
              <Button wrap>Download only the summary page</Button>
            </ButtonGroup>
          </div>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ButtonGroup attached aria-label="إجراءات اللوحة">
            {actionsAr.slice(0, 5).map((label) => (
              <Button key={label}>{label}</Button>
            ))}
          </ButtonGroup>
        </DemoRow>
        <DemoRow>
          <ButtonGroup aria-label="إجراءات اللوحة">
            {actionsAr.slice(3).map((label) => (
              <Button key={label} size="sm">
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </DemoRow>
        <DemoRow>
          <ButtonGroup attached size="lg" emphasis="soft" aria-label="إجراءات الرفع">
            <Button start="upload">رفع كل ملفات المجلد واستبدال النسخ القديمة</Button>
            <IconButton icon="more" label="إجراءات أكثر" />
          </ButtonGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: one child at a time">
        <DemoRow>
          <ButtonGroup attached aria-label="Page actions">
            <Button loading loadingLabel="Saving draft">
              Save draft
            </Button>
            <Button>Preview page</Button>
            <Button>Share board</Button>
          </ButtonGroup>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled children stay in the tab order">
        <DemoRow>
          <ButtonGroup attached aria-label="Page actions">
            <Button>Save draft</Button>
            <Button disabled>Preview page</Button>
            <Button>Share board</Button>
          </ButtonGroup>
          <ButtonGroup attached emphasis="outline" aria-label="Pages">
            <IconButton icon="chevron-back" label="Open previous page" disabled />
            <IconButton icon="chevron-forward" label="Open next page" />
          </ButtonGroup>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
