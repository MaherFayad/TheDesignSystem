import { useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Icon } from '../Icon';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../DropdownMenu';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  type ContextMenuSize,
} from './index';

/**
 * One set of menu parts. Each case writes its menu once as a function of a
 * kit, and the demo renders it twice: as the context menu and as the
 * DropdownMenu on the tile. So every action is reachable without a right
 * click, with the same words in the same order.
 */
const contextKit = {
  Item: ContextMenuItem,
  CheckboxItem: ContextMenuCheckboxItem,
  RadioGroup: ContextMenuRadioGroup,
  RadioItem: ContextMenuRadioItem,
  Label: ContextMenuLabel,
  Group: ContextMenuGroup,
  Separator: ContextMenuSeparator,
  Sub: ContextMenuSub,
  SubTrigger: ContextMenuSubTrigger,
  SubContent: ContextMenuSubContent,
};

type Kit = typeof contextKit;

// The DropdownMenu parts take the same props; only the Radix event types differ.
const dropdownKit = {
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Label: DropdownMenuLabel,
  Group: DropdownMenuGroup,
  Separator: DropdownMenuSeparator,
  Sub: DropdownMenuSub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
} as unknown as Kit;

type MenuBody = (k: Kit) => ReactNode;

const tile: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ds-space-m)',
  boxSizing: 'border-box',
  inlineSize: 'min(100%, calc(var(--ds-menu-width-min) * 2))',
  paddingBlock: 'var(--ds-space-xs)',
  paddingInline: 'var(--ds-space-m)',
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-hairline)',
  borderRadius: 'var(--ds-radius-card)',
  backgroundColor: 'var(--ds-color-bg-surface-2)',
  color: 'var(--ds-color-text-default)',
};

const tileText: CSSProperties = { display: 'flex', flexDirection: 'column', flex: '1 1 auto', minInlineSize: 0 };
const tileMeta: CSSProperties = { color: 'var(--ds-color-text-muted)', fontSize: 'var(--ds-font-size-xs)' };

/**
 * A file tile: the item the menu acts on. It takes focus, so Shift+F10 and
 * the Menu key reach the menu, and it carries a DropdownMenu with the same
 * actions as its context menu.
 */
function FileTile({
  name,
  meta,
  more,
  menu,
  disabled,
  target,
  style,
  ...rest
}: {
  name: string;
  meta: string;
  more: string;
  menu: MenuBody;
  disabled?: boolean;
  target?: string;
} & HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div {...rest} tabIndex={0} role="group" aria-label={name} data-demo-target={target} style={{ ...tile, ...style }}>
      <Icon name="file" size="md" />
      <span style={tileText}>
        <span>{name}</span>
        <span style={tileMeta}>{meta}</span>
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger disabled={disabled}>
          <IconButton icon="more" label={more} emphasis="ghost" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">{menu(dropdownKit)}</DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Opens the menu of the tile next to it the way the keyboard does: focus on
 * the tile, then Shift+F10. It stands in for a right click, so the gallery
 * and the contract suite can open the menu with a plain click.
 */
function ShowMenu({ label, demoTrigger, size }: { label: string; demoTrigger: string; size?: ContextMenuSize }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span ref={ref}>
      <Button
        data-demo-trigger={demoTrigger}
        size={size}
        emphasis="soft"
        onClick={() => {
          const target = ref.current?.parentElement?.querySelector<HTMLElement>('[role="group"]');
          if (!target) return;
          target.focus();
          target.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }));
        }}
      >
        {label}
      </Button>
    </span>
  );
}

/** A tile, its context menu, its DropdownMenu and its Show menu button, all from one menu body. */
function FileMenu({
  name,
  meta,
  more,
  show,
  menu,
  size,
  label,
  demoTrigger = '',
  target,
  disabled,
}: {
  name: string;
  meta: string;
  more: string;
  show: string;
  menu: MenuBody;
  size?: ContextMenuSize;
  label?: string;
  demoTrigger?: string;
  target?: string;
  disabled?: boolean;
}) {
  return (
    <DemoRow label={label}>
      <ContextMenu size={size}>
        <ContextMenuTrigger disabled={disabled}>
          <FileTile name={name} meta={meta} more={more} menu={menu} target={target} disabled={disabled} />
        </ContextMenuTrigger>
        <ContextMenuContent>{menu(contextKit)}</ContextMenuContent>
      </ContextMenu>
      {!disabled && <ShowMenu label={show} demoTrigger={demoTrigger} size={size} />}
    </DemoRow>
  );
}

/** The copy of the board menu, in both languages. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    file: 'Q3 roadmap',
    meta: 'Board, edited today',
    more: 'More actions for Q3 roadmap',
    show: 'Show menu for Q3 roadmap',
    heading: 'Board',
    open: 'Open board',
    rename: 'Rename board',
    duplicate: 'Duplicate board',
    share: 'Share board',
    copyLink: 'Copy link',
    invite: 'Invite people',
    star: 'Add to favorites',
    remove: 'Delete board',
  },
  ar: {
    file: 'خطة الربع الثالث',
    meta: 'لوحة، تعديل اليوم',
    more: 'إجراءات أكثر لخطة الربع الثالث',
    show: 'عرض قائمة خطة الربع الثالث',
    heading: 'اللوحة',
    open: 'فتح اللوحة',
    rename: 'إعادة تسمية اللوحة',
    duplicate: 'تكرار اللوحة',
    share: 'مشاركة اللوحة',
    copyLink: 'نسخ الرابط',
    invite: 'دعوة أشخاص',
    star: 'إضافة للمفضلة',
    remove: 'حذف اللوحة',
  },
} as const;

type Lang = keyof typeof copy;

/** Every part: a label, items with icons and shortcuts, a submenu, a checkbox item, a danger item. */
function BoardMenu({ size, lang = 'en', demoTrigger, target, label }: { size?: ContextMenuSize; lang?: Lang; demoTrigger: string; target?: string; label: string }) {
  const t = copy[lang];
  const [starred, setStarred] = useState(false);
  const menu: MenuBody = (k) => (
    <>
      <k.Label>{t.heading}</k.Label>
      <k.Item start="external" shortcut="Enter">
        {t.open}
      </k.Item>
      <k.Item start="edit" shortcut="F2">
        {t.rename}
      </k.Item>
      <k.Item start="copy" shortcut="Ctrl+D">
        {t.duplicate}
      </k.Item>
      <k.Sub>
        <k.SubTrigger start="link">{t.share}</k.SubTrigger>
        <k.SubContent>
          <k.Item start="copy" shortcut="Ctrl+L">
            {t.copyLink}
          </k.Item>
          <k.Item start="user-plus">{t.invite}</k.Item>
        </k.SubContent>
      </k.Sub>
      <k.CheckboxItem checked={starred} onCheckedChange={setStarred}>
        {t.star}
      </k.CheckboxItem>
      <k.Separator />
      <k.Item start="trash" tone="danger" shortcut="Del">
        {t.remove}
      </k.Item>
    </>
  );
  return (
    <FileMenu
      name={t.file}
      meta={t.meta}
      more={t.more}
      show={t.show}
      menu={menu}
      size={size}
      label={label}
      demoTrigger={demoTrigger}
      target={target}
    />
  );
}

const boards = [
  'Spring launch', 'Brand refresh', 'Checkout flow', 'Onboarding', 'Pricing page', 'Help center', 'Mobile app', 'Design review',
  'Icons', 'Type scale', 'Color study', 'Empty states', 'Error pages', 'Dashboard', 'Settings', 'Notifications',
  'Search', 'Profile', 'Billing', 'Team page', 'Invite flow', 'Reports', 'Charts', 'Tables',
  'Forms', 'Navigation', 'Footer', 'Landing page', 'Blog', 'Careers', 'Press kit', 'Events',
  'Partners', 'Docs home', 'API reference', 'Changelog', 'Roadmap', 'Status page', 'Legal', 'Archive',
];

export default function ContextMenuDemo() {
  const [sort, setSort] = useState('edited');
  const [grid, setGrid] = useState(true);
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: right click the tile, long press it, or focus it and press Shift+F10">
        <BoardMenu label="Size md" demoTrigger="md" target="md" />
        <BoardMenu label="Size sm" demoTrigger="sm" size="sm" />
        <Theme lang="ar" data-demo="content">
          <BoardMenu label="عربي" demoTrigger="ar" lang="ar" />
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <FileMenu
          name="Logo.svg"
          meta="Image, 12 KB"
          more="More actions for Logo.svg"
          show="Show menu for Logo.svg"
          menu={(k) => <k.Item start="download">Download image</k.Item>}
        />
      </DemoCase>

      <DemoCase id="many" title="Many items, grouped">
        <FileMenu
          name="Hero frame"
          meta="Frame, 1440 by 900"
          more="More actions for Hero frame"
          show="Show menu for Hero frame"
          menu={(k) => (
            <>
              <k.Group>
                <k.Item shortcut="Ctrl+X">Cut frame</k.Item>
                <k.Item start="copy" shortcut="Ctrl+C">
                  Copy frame
                </k.Item>
                <k.Item shortcut="Ctrl+V">Paste over frame</k.Item>
              </k.Group>
              <k.Separator />
              <k.Sub>
                <k.SubTrigger start="grid">Arrange frame</k.SubTrigger>
                <k.SubContent>
                  <k.Item shortcut="Ctrl+]">Bring to front</k.Item>
                  <k.Item shortcut="Ctrl+[">Send to back</k.Item>
                </k.SubContent>
              </k.Sub>
              <k.CheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="Ctrl+G">
                Show layout grid
              </k.CheckboxItem>
              <k.Separator />
              <k.RadioGroup value={sort} onValueChange={setSort}>
                <k.Label>Sort layers by</k.Label>
                <k.RadioItem value="name">Name</k.RadioItem>
                <k.RadioItem value="edited">Date edited</k.RadioItem>
              </k.RadioGroup>
              <k.Separator />
              <k.Item start="trash" tone="danger" shortcut="Del">
                Delete frame
              </k.Item>
            </>
          )}
        />
      </DemoCase>

      <DemoCase id="too-many" title="Too many items: the menu scrolls inside">
        <FileMenu
          name="Selected frame"
          meta="Frame, 3 layers"
          more="More actions for Selected frame"
          show="Show menu for Selected frame"
          menu={(k) => (
            <>
              <k.Label>Move to board</k.Label>
              {boards.map((name) => (
                <k.Item key={name} start="folder">
                  {name}
                </k.Item>
              ))}
            </>
          )}
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <FileMenu
          name="Supercalifragilisticexpialidocious final export.pdf"
          meta="PDF, 4 MB, shared with the whole design team"
          more="More actions for the export"
          show="Show menu for the export"
          menu={(k) => (
            <>
              <k.Label>Export the selected frames of Spring launch as one file</k.Label>
              <k.Item start="download" shortcut="Ctrl+E">
                Export every frame as a PDF with comments and the version history attached
              </k.Item>
              <k.Item start="file">Export Supercalifragilisticexpialidocious.json</k.Item>
            </>
          )}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <FileMenu
          name="ملف التصدير النهائي لإطلاق الربيع"
          meta="ملف PDF، حجمه 4 ميجابايت، مشترك مع كل فريق التصميم"
          more="إجراءات أكثر لملف التصدير"
          show="عرض قائمة ملف التصدير"
          menu={(k) => (
            <>
              <k.Label>تصدير الإطارات المحددة من لوحة إطلاق الربيع في ملف واحد</k.Label>
              <k.Item start="download" shortcut="Ctrl+E">
                تصدير كل الإطارات بصيغة PDF مع التعليقات وسجل النسخ
              </k.Item>
              <k.Item start="trash" tone="danger">
                حذف كل الإطارات المحددة من اللوحة والمسودات
              </k.Item>
            </>
          )}
        />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <FileMenu
          name="Archive 2024"
          meta="Folder, read only"
          more="More actions for Archive 2024"
          show="Show menu for Archive 2024"
          menu={(k) => (
            <>
              <k.Item start="external">Open folder</k.Item>
              <k.Item start="edit" disabled>
                Rename folder
              </k.Item>
              <k.CheckboxItem checked disabled>
                Sync to this device
              </k.CheckboxItem>
              <k.Separator />
              <k.Item start="trash" tone="danger" disabled>
                Delete folder
              </k.Item>
            </>
          )}
        />
        <FileMenu
          name="Shared with you"
          meta="Folder, no menu here"
          more="More actions for Shared with you"
          show=""
          disabled
          menu={(k) => <k.Item>Open folder</k.Item>}
        />
      </DemoCase>
    </DemoPage>
  );
}
