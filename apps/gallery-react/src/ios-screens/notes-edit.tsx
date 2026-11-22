// M10.7 notes-edit: one note with the edit menu over a selection, a colour
// sheet for the pen, a rename alert with a field, and a bottom toolbar of
// glass groups (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of native iOS notes screens on Mobbin (links
// in `meta.references`): a pushed screen with a back button and a capsule of
// bar buttons, the note's title large at the top, its text, a sketch, and
// floating capsules of tools at the bottom; a selection gets the edit menu
// capsule over it; the pen's colour opens a sheet with the colour views; a
// rename asks in an alert with one field. Our own note, words and sketch; no
// third party text, artwork or marks.
//
// Every control and surface is a system component of @the-system/react:
// - top bar: Navbar, pushed screen form, with the bar group (an attached
//   ButtonGroup) holding Share and a More menu (DropdownMenu) that has
//   Rename, Pin and Delete;
// - the note text: the app's own text (paragraphs held in state), read only
//   in the DOM, the owner of a SelectionMenu with editActions (Cut, Copy,
//   Paste on the Clipboard API: Cut and Paste change the app's text);
// - rename: AlertDialog with AlertDialogBody (one Field with a plain Input)
//   and a primary default action that needs a value;
// - the pen: a ToolbarButton that shows the pen's colour as a ColorSwatch
//   and opens a Sheet holding a ColorPicker inline (grid, spectrum, sliders,
//   opacity, saved colours);
// - bottom: two Toolbars, each its own glass capsule (the groups), with a
//   banner (Toaster, toast()) after pin and delete.
//
// The sketch takes the pen's colour: it is the one thing the pen draws here.
import { useRef, useState, type CSSProperties } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  Button,
  ButtonGroup,
  ColorPicker,
  ColorSwatch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  IconButton,
  Input,
  Navbar,
  SelectionMenu,
  Sheet,
  SheetBody,
  SheetContent,
  Toaster,
  Toolbar,
  ToolbarButton,
  editActions,
  toast,
} from '@the-system/react';
import { colorName, colorSwatchGrid } from '@the-system/shared';
import { ScreenShell, dateText, notes, t } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './notes-edit.css';

export const meta: ScreenMeta = {
  id: 'notes-edit',
  order: 'M10.7',
  title: 'A note with a selection menu, a colour sheet for the pen, rename by an alert with a field',
  families: ['edit menu capsule', 'colour picker in a sheet', 'alert with text fields', 'bottom toolbar with glass groups'],
  references: [
    { label: 'The edit menu on a note', href: 'https://mobbin.com/screens/a4cfb735-8a30-4567-88a5-5b5fd2398fc0' },
    { label: 'A colour sheet for the pen', href: 'https://mobbin.com/screens/29cb7507-470f-4fde-9fa2-c64d978de254' },
    { label: 'An alert with a field', href: 'https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ content */

const NOTE = notes.find((n) => n.id === 'trip') ?? notes[0]!;

/** A second paragraph of our own, so the note runs past one block. */
const trail = {
  en: 'The juniper trail starts behind the cabin and climbs for about 4 km. Take water, and start back before 4 PM so we are down before dark.',
  ar: 'درب العرعر يبدأ ورا الكوخ ويطلع تقريبا 4 كم. ناخذ موية ونرجع قبل الساعة 4:00 م عشان ننزل قبل الظلام.',
};

/** The pen's first colour: a blue of the system's own palette (row 4, the second hue), 3 to 1 or more on the light and the dark sketch. */
const PEN_START = colorSwatchGrid()[4]?.[1] ?? colorSwatchGrid()[0]![11]!;

const words = {
  en: {
    nav: 'Note',
    back: 'Notes',
    barActions: 'Note actions',
    share: 'Share note',
    more: 'More note actions',
    rename: 'Rename note',
    pin: 'Pin note',
    unpin: 'Unpin note',
    del: 'Delete note',
    edited: (d: string) => `Edited ${d}`,
    text: 'Note text',
    sketch: 'Sketch of the juniper trail',
    menu: 'Edit actions',
    tools: 'Note tools',
    checklist: 'Add a checklist',
    table: 'Add a table',
    attach: 'Attach a file',
    pen: 'Pen colour',
    penName: (c: string) => `Pen colour, ${c}`,
    create: 'Create',
    newNote: 'New note',
    renameTitle: 'Rename note',
    renameBody: 'The name shows at the top of the note and in your list of notes.',
    renameLegend: 'Note name',
    saveName: 'Save name',
    name: 'Name',
    cancel: 'Cancel',
    pinned: 'Note pinned',
    unpinned: 'Note unpinned',
    deleted: 'Note moved to Recently deleted',
    created: 'New note started',
  },
  ar: {
    nav: 'الملاحظة',
    back: 'الملاحظات',
    barActions: 'خيارات الملاحظة',
    share: 'مشاركة الملاحظة',
    more: 'خيارات إضافية',
    rename: 'إعادة تسمية',
    pin: 'تثبيت الملاحظة',
    unpin: 'إلغاء التثبيت',
    del: 'حذف الملاحظة',
    edited: (d: string) => `آخر تعديل ${d}`,
    text: 'نص الملاحظة',
    sketch: 'رسمة درب العرعر',
    menu: 'خيارات التحرير',
    tools: 'أدوات الملاحظة',
    checklist: 'إضافة قائمة مهام',
    table: 'إضافة جدول',
    attach: 'إرفاق ملف',
    pen: 'لون القلم',
    penName: (c: string) => `لون القلم، ${c}`,
    create: 'إنشاء',
    newNote: 'ملاحظة جديدة',
    renameTitle: 'إعادة تسمية الملاحظة',
    renameBody: 'الاسم يطلع فوق الملاحظة وفي قائمة الملاحظات.',
    renameLegend: 'اسم الملاحظة',
    saveName: 'حفظ الاسم',
    name: 'الاسم',
    cancel: 'إلغاء',
    pinned: 'الملاحظة مثبتة',
    unpinned: 'الملاحظة غير مثبتة',
    deleted: 'الملاحظة في «المحذوفة مؤخرا»',
    created: 'ملاحظة جديدة جاهزة',
  },
} as const;

/* ------------------------------------------------------------ the app's own text */

/** Where a DOM point falls in the paragraphs: the paragraph's index and the offset in its text. */
function pointIn(root: HTMLElement, node: Node, offset: number): { para: number; at: number } | null {
  const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as HTMLElement))?.closest<HTMLElement>('[data-para]');
  if (!el || !root.contains(el)) return null;
  const para = Number(el.dataset.para);
  if (node.nodeType === Node.TEXT_NODE) return { para, at: offset };
  // An element point: before or after its child nodes.
  return { para, at: offset === 0 ? 0 : (el.textContent ?? '').length };
}

/** Replaces the selected run of the paragraphs with `text`. Null when the selection is not in the note. */
function replaceSelection(root: HTMLElement, paras: readonly string[], text: string): string[] | null {
  const sel = root.ownerDocument.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const a = pointIn(root, range.startContainer, range.startOffset);
  const b = pointIn(root, range.endContainer, range.endOffset);
  if (!a || !b) return null;
  const head = (paras[a.para] ?? '').slice(0, a.at);
  const tail = (paras[b.para] ?? '').slice(b.at);
  sel.removeAllRanges();
  return [...paras.slice(0, a.para), head + text + tail, ...paras.slice(b.para + 1)];
}

/* ------------------------------------------------------------ the sketch */

/** A sketch of the trail: the hills in the page's own colours, the path in the pen's ink. */
function Sketch({ label, ink }: { label: string; ink: string }) {
  return (
    <figure data-gallery="notes-sketch" style={{ '--notes-ink': ink } as CSSProperties}>
      <svg viewBox="0 0 320 140" role="img" aria-label={label} focusable="false">
        <path data-gallery="notes-hill" d="M0 140 L70 62 L118 104 L182 30 L250 96 L290 70 L320 96 L320 140 Z" />
        <path data-gallery="notes-ink" d="M24 128 C60 120 70 100 98 106 S140 118 150 92 S176 60 196 70 S226 98 248 84 S278 70 300 74" />
        <circle data-gallery="notes-ink-dot" cx="24" cy="128" r="5" />
        <circle data-gallery="notes-ink-dot" cx="300" cy="74" r="5" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

/* ------------------------------------------------------------ the screen */

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const [title, setTitle] = useState(() => t(NOTE.title, lang));
  const [paras, setParas] = useState<string[]>(() => [t(NOTE.body, lang), trail[lang]]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [draft, setDraft] = useState(title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pen, setPen] = useState(PEN_START);
  const [pinned, setPinned] = useState(false);
  const textRef = useRef<HTMLElement | null>(null);

  const banner = (message: string, start: 'star' | 'star-filled' | 'trash' | 'edit') =>
    toast({ title: message, start, meta: new Date(), lang, closable: false });

  const edit = (text: string) => {
    const root = textRef.current;
    if (!root) return;
    setParas((now) => replaceSelection(root, now, text) ?? now);
    setMenuOpen(false);
  };

  const items = editActions({ lang, onCut: () => edit(''), onPaste: (text) => edit(text) });

  const openRename = () => {
    setDraft(title);
    setRenameOpen(true);
  };

  const header = (
    <Navbar
      label={w.nav}
      items={[]}
      back={{ label: w.back, href: '#notes' }}
      heading={title}
      end={
        <ButtonGroup attached aria-label={w.barActions}>
          <IconButton icon="share" label={w.share} />
          <DropdownMenu>
            <DropdownMenuTrigger>
              <IconButton icon="more" label={w.more} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem start="edit" onSelect={openRename}>
                {w.rename}
              </DropdownMenuItem>
              <DropdownMenuItem
                start={pinned ? 'star-filled' : 'star'}
                onSelect={() => {
                  setPinned(!pinned);
                  banner(pinned ? w.unpinned : w.pinned, pinned ? 'star' : 'star-filled');
                }}
              >
                {pinned ? w.unpin : w.pin}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem start="trash" tone="danger" onSelect={() => banner(w.deleted, 'trash')}>
                {w.del}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      }
    />
  );

  const footer = (
    <div data-gallery="notes-footer">
      <Toolbar aria-label={w.tools} size="lg" overflow="menu">
        <ToolbarButton icon="list" label={w.checklist} />
        <ToolbarButton icon="grid" label={w.table} />
        <ToolbarButton icon="attach" label={w.attach} />
        <ToolbarButton
          icon={<ColorSwatch color={pen} locale={lang} shape="pill" size="sm" aria-hidden="true" />}
          label={w.penName(colorName(pen, lang))}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          data-gallery="notes-pen"
        />
      </Toolbar>
      <Toolbar aria-label={w.create} size="lg">
        <ToolbarButton icon="edit" label={w.newNote} onClick={() => banner(w.created, 'edit')} />
      </Toolbar>
    </div>
  );

  return (
    <ScreenShell header={header} footer={footer}>
      <div data-gallery="notes-page">
        <p data-gallery="notes-edited">{w.edited(dateText(NOTE.edited, lang, 'day-month'))}</p>
        <article ref={textRef} tabIndex={0} aria-label={w.text} data-gallery="notes-text">
          {paras.map((p, i) => (
            <p key={i} data-para={i}>
              {p}
            </p>
          ))}
        </article>
        <Sketch label={w.sketch} ink={pen} />
      </div>

      <SelectionMenu owner={textRef} open={menuOpen} onOpenChange={setMenuOpen} items={items} label={w.menu} />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen} size="md">
        <SheetContent title={w.pen}>
          <SheetBody>
            <ColorPicker variant="inline" label={w.pen} value={pen} onChange={setPen} defaultSavedColors={[PEN_START]} />
          </SheetBody>
        </SheetContent>
      </Sheet>

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent icon={false} title={w.renameTitle} description={w.renameBody}>
          <AlertDialogBody legend={w.renameLegend}>
            <Field label={w.name}>
              <Input variant="plain" clearable value={draft} onChange={(event) => setDraft(event.target.value)} />
            </Field>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button wrap>{w.cancel}</Button>
            </AlertDialogCancel>
            <AlertDialogAction primary requiresValue onClick={() => setTitle(draft.trim() || title)}>
              <Button wrap>{w.saveName}</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="auto" />
    </ScreenShell>
  );
}

