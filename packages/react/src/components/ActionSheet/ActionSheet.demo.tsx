import { useState, type MouseEvent, type ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
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

const en = {
  title: 'Spring launch',
  description: 'The board is shared with 4 people.',
  more: 'More options for Spring launch',
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

const ar = {
  title: 'إطلاق الربيع',
  description: 'اللوحة مشاركة مع 4 أشخاص.',
  more: 'خيارات إضافية لإطلاق الربيع',
  three: [{ label: 'حذف اللوحة', tone: 'danger' }, { label: 'نسخ اللوحة' }, { label: 'نقل للمجلد' }] as Item[],
  long: [
    { label: 'نسخ اللوحة مع كل الإطارات والتعليقات والملفات المرفقة', tone: 'neutral' },
    { label: 'نقل اللوحة لمجلد ثاني ومشاركتها مع نفس الفريق' },
    { label: 'حذف اللوحة وكل ملفاتها نهائيا', tone: 'danger' },
  ] as Item[],
};

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
function LoadingSheet() {
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
        <Button data-demo-trigger="loading">Export the board</Button>
      </ActionSheetTrigger>
      <ActionSheetContent title={en.title}>
        <ActionSheetAction onClick={run} loading={busy} loadingLabel="Exporting">
          Export as PDF
        </ActionSheetAction>
        <ActionSheetAction disabled={busy}>Export as image</ActionSheetAction>
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
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <TopTrailing>
          <Sheet trigger="variants" title={en.title} description={en.description} items={en.three} />
        </TopTrailing>
        <DemoRow label="placement">
          <Sheet trigger="anchored" text="Anchored" placement="anchored" title={en.title} items={en.three} />
          <Sheet trigger="center" text="Center" placement="center" title={en.title} items={en.three} />
          <Sheet trigger="bottom" text="Bottom" placement="bottom" title={en.title} items={en.three} />
          <Sheet trigger="no-danger" text="No danger action" items={en.three.slice(1)} label="Actions for Spring launch" />
        </DemoRow>
      </DemoCase>
      <DemoCase id="one" title="One action">
        <Sheet trigger="one" items={[{ label: 'Copy link' }]} label="Actions for Spring launch" />
      </DemoCase>
      <DemoCase id="many" title="Many actions">
        <Sheet trigger="many" title={en.title} items={en.many} />
      </DemoCase>
      <DemoCase id="long-text" title="Long text">
        <Sheet
          trigger="long-text"
          title="Spring launch, the board for the whole marketing team and every partner agency"
          description="The board is shared with 4 people. Anything you move or delete changes for each of them right away."
          items={[
            { label: 'Duplicate the board with every frame, comment and attached file' },
            { label: 'Move the board to another folder and keep the same sharing' },
            { label: 'Delete the board and every file in it for good', tone: 'danger' },
          ]}
        />
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
        <LoadingSheet />
      </DemoCase>
      <DemoCase id="disabled" title="Disabled action">
        <Sheet
          trigger="disabled"
          title={en.title}
          items={[{ label: 'Duplicate board' }, { label: 'Move to folder', disabled: true }, { label: 'Delete board', tone: 'danger' }]}
        />
      </DemoCase>
    </DemoPage>
  );
}
