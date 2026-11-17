// SelectionMenu demo. Cases: variants (a block of read only text: select
// words with the pointer, or focus it and press Shift+F10, or press "Select
// a phrase"; and a selectable chip with its own actions), one (one action
// over a chip), many (ten actions that page behind the forward control),
// long-text (long labels on a narrow row), long-arabic (the text block in
// Arabic: the row runs right to left and the forward control sits at the
// left), disabled (an action that is shown but not run). No empty, loading,
// error or readonly: a menu with no actions does not open, and the actions
// hold no value.
//
// Copy runs on the Clipboard API where the page may use it; the other
// actions say what ran in the status line. The text is made up.
import { useRef, useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { SelectionMenu, editActions, type SelectionMenuItem } from './index';

const words = {
  en: {
    text: 'The site visit is on Thursday at nine. Bring the lighting plan and the floor drawings, and meet the team at the north gate of the new building.',
    phrase: 'lighting plan',
    select: 'Select a phrase',
    region: 'Site visit note',
    lookUp: 'Look up',
    highlight: 'Highlight',
    note: 'Add note',
    copied: (t: string) => `Copied: ${t}`,
    ran: (what: string) => `${what}: done`,
  },
  ar: {
    text: 'زيارة الموقع يوم الخميس الساعة 9 الصبح. جيب مخطط الإضاءة ورسومات الأدوار، والفريق بيستناك عند البوابة الشمالية للمبنى الجديد.',
    phrase: 'مخطط الإضاءة',
    select: 'تحديد عبارة',
    region: 'ملاحظة زيارة الموقع',
    lookUp: 'بحث',
    highlight: 'تمييز',
    note: 'إضافة ملاحظة',
    copied: (t: string) => `تم النسخ: ${t}`,
    ran: (what: string) => `${what}: تم`,
  },
} as const;

/** Selects the first run of `phrase` inside `root` and returns true when found. */
function selectPhrase(root: HTMLElement, phrase: string): boolean {
  const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const at = (n.textContent ?? '').indexOf(phrase);
    if (at < 0) continue;
    const range = root.ownerDocument.createRange();
    range.setStart(n, at);
    range.setEnd(n, at + phrase.length);
    const sel = root.ownerDocument.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    return true;
  }
  return false;
}

interface TextMenuProps {
  lang?: 'en' | 'ar';
  /** Extra actions after the built in ones. */
  extra?: (say: (what: string) => void) => SelectionMenuItem[];
  /** Keep only these actions, without the built in ones. */
  only?: (say: (what: string) => void) => SelectionMenuItem[];
  region?: string;
}

/** A block of read only text whose selection gets the menu. */
function TextMenu({ lang = 'en', extra, only, region }: TextMenuProps) {
  const w = words[lang];
  const ownerRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const say = (what: string) => setStatus(w.ran(what));
  const items: SelectionMenuItem[] = only
    ? only(say)
    : [
        ...editActions({ lang, onCopied: (t) => setStatus(w.copied(t)) }),
        { id: 'look-up', label: w.lookUp, onSelect: () => say(w.lookUp) },
        { id: 'highlight', label: w.highlight, onSelect: () => say(w.highlight) },
        { id: 'note', label: w.note, onSelect: () => say(w.note) },
        ...(extra ? extra(say) : []),
      ];
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', maxInlineSize: '30rem' }}>
      <article
        ref={ownerRef}
        tabIndex={0}
        aria-label={region ?? w.region}
        data-demo-target=""
        style={{ margin: 0, padding: 'var(--ds-space-m)', borderRadius: 'var(--ds-radius-card)', background: 'var(--ds-color-bg-surface-2)' }}
      >
        <p style={{ margin: 0 }}>{w.text}</p>
      </article>
      <DemoRow>
        <Button
          size="sm"
          data-demo-trigger=""
          onClick={() => {
            if (ownerRef.current && selectPhrase(ownerRef.current, w.phrase)) setOpen(true);
          }}
        >
          {w.select}
        </Button>
      </DemoRow>
      <p role="status" style={{ margin: 0, minBlockSize: '1.5em', color: 'var(--ds-color-text-muted)' }}>
        {status}
      </p>
      <SelectionMenu owner={ownerRef} open={open} onOpenChange={setOpen} items={items} />
    </div>
  );
}

interface ChipMenuProps {
  label: string;
  items: (say: (what: string) => void) => SelectionMenuItem[];
}

/** A chip that, when selected, shows its actions over it. */
function ChipMenu({ label, items }: ChipMenuProps) {
  const chipRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-s)', justifyItems: 'start' }}>
      <Chip ref={chipRef} selected={open} data-demo-trigger="" onClick={() => setOpen(true)}>
        {label}
      </Chip>
      <p role="status" style={{ margin: 0, minBlockSize: '1.5em', color: 'var(--ds-color-text-muted)' }}>
        {status}
      </p>
      <SelectionMenu
        open={open}
        onOpenChange={setOpen}
        owner={chipRef}
        anchor={() => chipRef.current?.getBoundingClientRect() ?? null}
        items={items((what) => setStatus(`${what}: ${label}`))}
      />
    </div>
  );
}

const many = (say: (what: string) => void): SelectionMenuItem[] =>
  ['Copy', 'Look up', 'Translate', 'Highlight', 'Add note', 'Share', 'Search', 'Read aloud', 'Define', 'Spell out'].map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, '-'),
    label,
    onSelect: () => say(label),
  }));

export default function SelectionMenuDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: a selection in read only text, and a selected chip">
        <DemoGrid min="20rem">
          <TextMenu />
          <ChipMenu
            label="Brand board"
            items={(say) => [
              { id: 'rename', label: 'Rename', onSelect: () => say('Rename') },
              { id: 'duplicate', label: 'Duplicate', onSelect: () => say('Duplicate') },
              { id: 'delete', label: 'Delete', tone: 'danger', onSelect: () => say('Delete') },
            ]}
          />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One action">
        <ChipMenu label="Invoice 2041" items={(say) => [{ id: 'copy-number', label: 'Copy number', onSelect: () => say('Copy number') }]} />
      </DemoCase>

      <DemoCase id="many" title="Many: ten actions page behind the forward control">
        <TextMenu only={many} region="Site visit note, many actions" />
      </DemoCase>

      <DemoCase id="long-text" title="Long labels">
        <TextMenu
          region="Site visit note, long labels"
          only={(say) => [
            { id: 'meeting', label: 'Add to the meeting notes', onSelect: () => say('Add to the meeting notes') },
            { id: 'task', label: 'Turn into a task for the team', onSelect: () => say('Turn into a task') },
            { id: 'translate', label: 'Translate to Arabic', onSelect: () => say('Translate to Arabic') },
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <TextMenu
          lang="ar"
          extra={(say) => [
            { id: 'translate', label: 'ترجمة', onSelect: () => say('ترجمة') },
            { id: 'share', label: 'مشاركة', onSelect: () => say('مشاركة') },
            { id: 'task', label: 'تحويل لمهمة للفريق', onSelect: () => say('تحويل لمهمة للفريق') },
          ]}
        />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: an action shown but not run">
        <ChipMenu
          label="Finance board"
          items={(say) => [
            { id: 'rename', label: 'Rename', onSelect: () => say('Rename') },
            { id: 'delete', label: 'Delete', tone: 'danger', disabled: true, onSelect: () => say('Delete') },
          ]}
        />
      </DemoCase>
    </DemoPage>
  );
}
