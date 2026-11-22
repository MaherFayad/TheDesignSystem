import { useState, type MouseEvent, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { isArabic } from '../Popover/FloatingLayer';
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetCancel,
  ActionSheetContent,
  ActionSheetTrigger,
  type ActionSheetActionTone,
  type ActionSheetPlacementChoice,
} from './index';

interface Item {
  label: string;
  tone?: ActionSheetActionTone;
  disabled?: boolean;
}

// The copy follows the page language: with lang=ar every case reads Arabic.
const en = {
  title: 'Spring launch',
  description: 'The board is shared with 4 people.',
  more: 'More options for Spring launch',
  label: 'Actions for Spring launch',
  anchored: 'Anchored',
  center: 'Center',
  bottom: 'Bottom',
  noDanger: 'No danger action',
  one: [{ label: 'Copy link' }] as Item[],
  longTitle: 'Spring launch, the board for the whole marketing team and every partner agency',
  longDescription: 'The board is shared with 4 people. Anything you move or delete changes for each of them right away.',
  long: [
    { label: 'Duplicate the board with every frame, comment and attached file' },
    { label: 'Move the board to another folder and keep the same sharing' },
    { label: 'Delete the board and every file in it for good', tone: 'danger' },
  ] as Item[],
  export: 'Export the board',
  exporting: 'Exporting',
  pdf: 'Export as PDF',
  image: 'Export as image',
  disabled: [{ label: 'Duplicate board' }, { label: 'Move to folder', disabled: true }, { label: 'Delete board', tone: 'danger' }] as Item[],
  three: [{ label: 'Delete board', tone: 'danger' }, { label: 'Duplicate board' }, { label: 'Move to folder' }] as Item[],
  many: [
    { label: 'Duplicate board' },
    { label: 'Move to folder' },
    { label: 'Copy link' },
    { label: 'Rename board' },
    { label: 'Add to favorites' },
    { label: 'Delete board', tone: 'danger' },
  ] as Item[],
};

const ar: typeof en = {
  title: 'إطلاق الربيع',
  description: 'اللوحة مشاركة مع 4 أشخاص.',
  more: 'خيارات إضافية لإطلاق الربيع',
  label: 'إجراءات إطلاق الربيع',
  anchored: 'مثبتة بالزر',
  center: 'في الوسط',
  bottom: 'في الأسفل',
  noDanger: 'بدون إجراء خطر',
  three: [{ label: 'حذف اللوحة', tone: 'danger' }, { label: 'نسخ اللوحة' }, { label: 'نقل للمجلد' }] as Item[],
  many: [
    { label: 'نسخ اللوحة' },
    { label: 'نقل للمجلد' },
    { label: 'نسخ الرابط' },
    { label: 'إعادة تسمية اللوحة' },
    { label: 'إضافة للمفضلة' },
    { label: 'حذف اللوحة', tone: 'danger' },
  ] as Item[],
  one: [{ label: 'نسخ الرابط' }] as Item[],
  longTitle: 'إطلاق الربيع، لوحة فريق التسويق كامل وكل الوكالات الشريكة',
  longDescription: 'اللوحة مشاركة مع 4 أشخاص. أي شي تنقله أو تحذفه يتغير عندهم كلهم على طول.',
  long: [
    { label: 'نسخ اللوحة مع كل الإطارات والتعليقات والملفات المرفقة', tone: 'neutral' },
    { label: 'نقل اللوحة لمجلد ثاني ومشاركتها مع نفس الفريق' },
    { label: 'حذف اللوحة وكل ملفاتها نهائيا', tone: 'danger' },
  ] as Item[],
  export: 'تصدير اللوحة',
  exporting: 'التصدير جار',
  pdf: 'تصدير بصيغة PDF',
  image: 'تصدير كصورة',
  disabled: [{ label: 'نسخ اللوحة' }, { label: 'نقل للمجلد', disabled: true }, { label: 'حذف اللوحة', tone: 'danger' }] as Item[],
};

const copy = { en, ar };

interface SheetProps {
  trigger: string;
  items: Item[];
  title?: string;
  description?: string;
  label?: string;
  more?: string;
  placement?: ActionSheetPlacementChoice;
  /** A text Button as the trigger, in place of the more icon button. */
  text?: string;
}

/** One sheet with its trigger: a more button by default. */
function Sheet({ trigger, items, title, description, label, more = en.more, placement, text }: SheetProps) {
  return (
    <ActionSheet placement={placement}>
      <ActionSheetTrigger>
        {text ? (
          <Button data-demo-trigger={trigger}>{text}</Button>
        ) : (
          <IconButton data-demo-trigger={trigger} icon="more" label={more} />
        )}
      </ActionSheetTrigger>
      <ActionSheetContent title={title} description={description} label={label}>
        {items.map((item) => (
          <ActionSheetAction key={item.label} tone={item.tone} disabled={item.disabled}>
            {item.label}
          </ActionSheetAction>
        ))}
      </ActionSheetContent>
    </ActionSheet>
  );
}

/** The action runs: the sheet stays open, Escape and a press outside do nothing, the item shows loading. */
function LoadingSheet({ c }: { c: typeof en }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = (event: MouseEvent) => {
    event.preventDefault();
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <ActionSheet open={open} onOpenChange={setOpen} dismissible={!busy}>
      <ActionSheetTrigger>
        <Button data-demo-trigger="loading">{c.export}</Button>
      </ActionSheetTrigger>
      <ActionSheetContent title={c.title}>
        <ActionSheetAction onClick={run} loading={busy} loadingLabel={c.exporting}>
          {c.pdf}
        </ActionSheetAction>
        <ActionSheetAction disabled={busy}>{c.image}</ActionSheetAction>
        <ActionSheetCancel disabled={busy} />
      </ActionSheetContent>
    </ActionSheet>
  );
}

/** A trailing more button at the top, as on a phone's navigation bar. */
function TopTrailing({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{children}</div>;
}

export default function ActionSheetDemo() {
  const c = copy[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <TopTrailing>
          <Sheet trigger="variants" more={c.more} title={c.title} description={c.description} items={c.three} />
        </TopTrailing>
        <DemoRow label="placement">
          <Sheet trigger="anchored" text={c.anchored} placement="anchored" title={c.title} items={c.three} />
          <Sheet trigger="center" text={c.center} placement="center" title={c.title} items={c.three} />
          <Sheet trigger="bottom" text={c.bottom} placement="bottom" title={c.title} items={c.three} />
          <Sheet trigger="no-danger" text={c.noDanger} items={c.three.slice(1)} label={c.label} />
        </DemoRow>
      </DemoCase>
      <DemoCase id="one" title="One action">
        <Sheet trigger="one" more={c.more} items={c.one} label={c.label} />
      </DemoCase>
      <DemoCase id="many" title="Many actions">
        <Sheet trigger="many" more={c.more} title={c.title} items={c.many} />
      </DemoCase>
      <DemoCase id="long-text" title="Long text">
        <Sheet trigger="long-text" more={c.more} title={c.longTitle} description={c.longDescription} items={c.long} />
      </DemoCase>
      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <TopTrailing>
          <Sheet trigger="long-arabic" more={ar.more} title={ar.title} description={ar.description} items={ar.long} />
        </TopTrailing>
        <DemoRow>
          <Sheet trigger="arabic" more={ar.more} title={ar.title} items={ar.three} />
        </DemoRow>
      </DemoCase>
      <DemoCase id="loading" title="Loading">
        <LoadingSheet c={c} />
      </DemoCase>
      <DemoCase id="disabled" title="Disabled action">
        <Sheet trigger="disabled" more={c.more} title={c.title} items={c.disabled} />
      </DemoCase>
    </DemoPage>
  );
}
