import type { IconName } from '@the-system/icons';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import type { ButtonEmphasis, ButtonShape, ButtonSize, ButtonTone } from '../Button';
import { IconButton } from './index';

const tones: ButtonTone[] = ['neutral', 'accent', 'danger', 'success', 'warning', 'info'];
const emphases: ButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: ButtonShape[] = ['default', 'pill', 'square'];

const toneAction: Record<ButtonTone, [IconName, string]> = {
  neutral: ['settings', 'Open settings'],
  accent: ['plus', 'Add page'],
  danger: ['trash', 'Delete file'],
  success: ['check', 'Approve change'],
  warning: ['warning', 'Show warnings'],
  info: ['info', 'Show details'],
};

/** A toolbar worth of actions: icon, English label, Arabic label (noun form, no diacritics). */
const toolbar: [IconName, string, string][] = [
  ['plus', 'Add page', 'إضافة صفحة'],
  ['copy', 'Copy link', 'نسخ الرابط'],
  ['edit', 'Rename page', 'تغيير الاسم'],
  ['download', 'Download file', 'تنزيل الملف'],
  ['upload', 'Upload file', 'رفع ملف'],
  ['search', 'Search board', 'البحث في اللوحة'],
  ['filter', 'Filter items', 'تصفية العناصر'],
  ['sort', 'Sort items', 'ترتيب العناصر'],
  ['star', 'Star board', 'تمييز اللوحة'],
  ['link', 'Share link', 'مشاركة الرابط'],
  ['bell', 'Open alerts', 'فتح التنبيهات'],
  ['settings', 'Open settings', 'فتح الإعدادات'],
  ['more', 'Show more actions', 'إجراءات إضافية'],
  ['trash', 'Delete page', 'حذف الصفحة'],
  ['close', 'Close panel', 'إغلاق اللوحة'],
  ['chevron-back', 'Go back', 'رجوع'],
  ['chevron-forward', 'Go forward', 'التالي'],
  ['help', 'Open help', 'فتح المساعدة'],
];

export default function IconButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in solid, soft, outline and ghost">
        {tones.map((tone) => {
          const [icon, label] = toneAction[tone];
          return (
            <DemoRow key={tone} label={tone}>
              {emphases.map((emphasis) => (
                <IconButton key={emphasis} icon={icon} label={label} tone={tone} emphasis={emphasis} />
              ))}
            </DemoRow>
          );
        })}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <IconButton size={size} icon="plus" label="Add page" tone="accent" emphasis="solid" />
            <IconButton size={size} icon="settings" label="Open settings" emphasis="soft" />
            <IconButton size={size} icon="more" label="Show more actions" emphasis="outline" />
            <IconButton size={size} icon="close" label="Close panel" />
          </DemoRow>
        ))}
        {shapes.map((shape) => (
          <DemoRow key={shape} label={`Shape ${shape}`}>
            <IconButton shape={shape} icon="plus" label="Add page" tone="accent" emphasis="solid" />
            <IconButton shape={shape} icon="edit" label="Rename page" emphasis="soft" />
            <IconButton shape={shape} icon="copy" label="Copy link" emphasis="outline" />
          </DemoRow>
        ))}
        <DemoRow label="As a link">
          <IconButton asChild icon="external" label="Open docs" emphasis="outline">
            <a href="#docs" />
          </IconButton>
        </DemoRow>
        <DemoRow label="Mirrors in Arabic">
          <IconButton icon="chevron-back" label="Go back" emphasis="soft" />
          <IconButton icon="chevron-forward" label="Go forward" emphasis="soft" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One icon button">
        <DemoRow>
          <IconButton icon="close" label="Close panel" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="A toolbar">
        <DemoRow>
          {toolbar.slice(0, 6).map(([icon, label]) => (
            <IconButton key={label} icon={icon} label={label} />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many icon buttons, the row wraps">
        <DemoRow>
          {[...toolbar, ...toolbar].map(([icon, label], i) => (
            <IconButton key={`${label}-${i}`} icon={icon} label={label} emphasis="soft" />
          ))}
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long label, read by screen readers only">
        <DemoRow>
          <IconButton
            icon="download"
            label="Download every file on this board as one archive with the comments and references"
            emphasis="soft"
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic toolbar and a long Arabic label" lang="ar">
        <DemoRow>
          {toolbar.map(([icon, , labelAr]) => (
            <IconButton key={labelAr} icon={icon} label={labelAr} emphasis="soft" />
          ))}
        </DemoRow>
        <DemoRow>
          <IconButton icon="download" label="تنزيل كل ملفات اللوحة في ملف واحد مع التعليقات والمراجع" size="lg" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading">
        <DemoRow>
          <IconButton loading icon="upload" label="Upload file" tone="accent" emphasis="solid" />
          <IconButton loading icon="download" label="Download file" emphasis="soft" />
          <IconButton loading icon="trash" label="Delete file" tone="danger" emphasis="soft" />
          <IconButton loading icon="send" label="Send message" size="lg" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <IconButton disabled icon="plus" label="Add page" tone="accent" emphasis="solid" />
          <IconButton disabled icon="settings" label="Open settings" emphasis="soft" />
          <IconButton disabled icon="trash" label="Delete file" tone="danger" emphasis="ghost" />
          <IconButton disabled icon="close" label="Close panel" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
