import { useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Icon } from '../Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

/** The copy of the file menu, in both languages. Arabic: noun form labels, no diacritics. */
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
    star: 'Add to starred',
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
    star: 'إضافة للمميزة',
    remove: 'حذف اللوحة',
  },
} as const;

type Lang = keyof typeof copy;

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
 * actions, so nothing is reachable only by right click.
 */
function FileTile({
  name,
  meta,
  more,
  lang,
  disabled,
  target,
  style,
  ...rest
}: {
  name: string;
  meta: string;
  more: string;
  lang: Lang;
  disabled?: boolean;
  target?: string;
} & HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) {
  const t = copy[lang];
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
        <DropdownMenuContent align="end">
          <DropdownMenuItem start="external">{t.open}</DropdownMenuItem>
          <DropdownMenuItem start="edit">{t.rename}</DropdownMenuItem>
          <DropdownMenuItem start="copy">{t.duplicate}</DropdownMenuItem>
          <DropdownMenuItem start="link">{t.copyLink}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem start="trash" tone="danger">
            {t.remove}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Opens the menu of the tile before it the way the keyboard does: focus on
 * the tile, then Shift+F10. A pointer stand in for a right click, so the
 * gallery and the contract suite can open the menu with a plain click.
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
          const tile = ref.current?.parentElement?.querySelector<HTMLElement>('[role="group"]');
          if (!tile) return;
          tile.focus();
          tile.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }));
        }}
      >
        {label}
      </Button>
    </span>
  );
}

/** Every part: a label, items with icons and shortcuts, a submenu, a checkbox item, a danger item. */
function FileMenu({ size, lang = 'en', demoTrigger, target }: { size?: ContextMenuSize; lang?: Lang; demoTrigger: string; target?: string }) {
  const t = copy[lang];
  const [starred, setStarred] = useState(false);
  return (
    <DemoRow label={size === 'sm' ? 'Size sm' : lang === 'ar' ? 'عربي' : 'Size md'}>
      <ContextMenu size={size}>
        <ContextMenuTrigger>
          <FileTile name={t.file} meta={t.meta} more={t.more} lang={lang} target={target} />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>{t.heading}</ContextMenuLabel>
          <ContextMenuItem start="external" shortcut="Enter">
            {t.open}
          </ContextMenuItem>
          <ContextMenuItem start="edit" shortcut="F2">
            {t.rename}
          </ContextMenuItem>
          <ContextMenuItem start="copy" shortcut="Ctrl+D">
            {t.duplicate}
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger start="link">{t.share}</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem start="copy" shortcut="Ctrl+L">
                {t.copyLink}
              </ContextMenuItem>
              <ContextMenuItem start="user-plus">{t.invite}</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuCheckboxItem checked={starred} onCheckedChange={setStarred}>
            {t.star}
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem start="trash" tone="danger" shortcut="Del">
            {t.remove}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <ShowMenu label={t.show} demoTrigger={demoTrigger} size={size} />
    </DemoRow>
  );
}

const boards = [
  'Spring launch', 'Brand refresh', 'Checkout flow', 'Onboarding', 'Pricing page', 'Help center', 'Mobile app', 'Design review',
  'Icons', 'Type scale', 'Color study', 'Empty states', 'Error pages', 'Dashboard', 'Settings', 'Notifications',
  'Search', 'Profile', 'Billing', 'Team page', 'Invite flow', 'Reports', 'Charts', 'Tables',
  'Forms', 'Navigation', 'Footer', 'Landing page', 'Blog', 'Careers', 'Press kit', 'Events',
  'Partners', 'Docs home', 'API reference', 'Changelog', 'Roadmap', 'Status page', 'Legal', 'Archive',
];

/** A plain tile with a menu built from `items`, for the content cases. */
function CaseMenu({
  name,
  meta,
  more,
  lang = 'en',
  show,
  disabled,
  children,
}: {
  name: string;
  meta: string;
  more: string;
  lang?: Lang;
  show: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <DemoRow>
      <ContextMenu>
        <ContextMenuTrigger disabled={disabled}>
          <FileTile name={name} meta={meta} more={more} lang={lang} disabled={disabled} />
        </ContextMenuTrigger>
        <ContextMenuContent>{children}</ContextMenuContent>
      </ContextMenu>
      {!disabled && <ShowMenu label={show} demoTrigger="" />}
    </DemoRow>
  );
}

export default function ContextMenuDemo() {
  const [sort, setSort] = useState('edited');
  const [grid, setGrid] = useState(true);
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: right click the tile, long press it, or focus it and press Shift+F10">
        <FileMenu demoTrigger="md" target="md" />
        <FileMenu demoTrigger="sm" size="sm" />
        <Theme lang="ar" data-demo="content">
          <FileMenu demoTrigger="ar" lang="ar" />
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <CaseMenu name="Logo.svg" meta="Image, 12 KB" more="More actions for Logo.svg" show="Show menu for Logo.svg">
          <ContextMenuItem start="download">Download image</ContextMenuItem>
        </CaseMenu>
      </DemoCase>

      <DemoCase id="many" title="Many items, grouped">
        <CaseMenu name="Hero frame" meta="Frame, 1440 by 900" more="More actions for Hero frame" show="Show menu for Hero frame">
          <ContextMenuGroup>
            <ContextMenuItem shortcut="Ctrl+X">Cut frame</ContextMenuItem>
            <ContextMenuItem start="copy" shortcut="Ctrl+C">
              Copy frame
            </ContextMenuItem>
            <ContextMenuItem shortcut="Ctrl+V">Paste over frame</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger start="grid">Arrange</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem shortcut="Ctrl+]">Bring to front</ContextMenuItem>
              <ContextMenuItem shortcut="Ctrl+[">Send to back</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="Ctrl+G">
            Show layout grid
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup value={sort} onValueChange={setSort}>
            <ContextMenuLabel>Sort layers by</ContextMenuLabel>
            <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
            <ContextMenuRadioItem value="edited">Date edited</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem start="trash" tone="danger" shortcut="Del">
            Delete frame
          </ContextMenuItem>
        </CaseMenu>
      </DemoCase>

      <DemoCase id="too-many" title="Too many items: the menu scrolls inside">
        <CaseMenu name="Selected frame" meta="Frame, 3 layers" more="More actions for Selected frame" show="Show menu for Selected frame">
          <ContextMenuLabel>Move to board</ContextMenuLabel>
          {boards.map((name) => (
            <ContextMenuItem key={name} start="folder">
              {name}
            </ContextMenuItem>
          ))}
        </CaseMenu>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <CaseMenu
          name="Supercalifragilisticexpialidocious final export.pdf"
          meta="PDF, 4 MB, shared with the whole design team"
          more="More actions for the export"
          show="Show menu for the export"
        >
          <ContextMenuLabel>Export the selected frames of Spring launch as one file</ContextMenuLabel>
          <ContextMenuItem start="download" shortcut="Ctrl+E">
            Export every frame as a PDF with comments and the version history attached
          </ContextMenuItem>
          <ContextMenuItem start="file">Export Supercalifragilisticexpialidocious.json</ContextMenuItem>
        </CaseMenu>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <CaseMenu
          name="ملف التصدير النهائي لإطلاق الربيع"
          meta="ملف PDF، حجمه 4 ميجابايت، مشترك مع فريق التصميم كامل"
          more="إجراءات أكثر لملف التصدير"
          show="عرض قائمة ملف التصدير"
          lang="ar"
        >
          <ContextMenuLabel>تصدير الإطارات المحددة من لوحة إطلاق الربيع في ملف واحد</ContextMenuLabel>
          <ContextMenuItem start="download" shortcut="Ctrl+E">
            تصدير كل الإطارات بصيغة PDF مع التعليقات وسجل النسخ
          </ContextMenuItem>
          <ContextMenuItem start="trash" tone="danger">
            حذف كل الإطارات المحددة من اللوحة والمسودات
          </ContextMenuItem>
        </CaseMenu>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <CaseMenu name="Archive 2024" meta="Folder, read only" more="More actions for Archive 2024" show="Show menu for Archive 2024">
          <ContextMenuItem start="external">Open folder</ContextMenuItem>
          <ContextMenuItem start="edit" disabled>
            Rename folder
          </ContextMenuItem>
          <ContextMenuCheckboxItem checked disabled>
            Sync to this device
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem start="trash" tone="danger" disabled>
            Delete folder
          </ContextMenuItem>
        </CaseMenu>
        <CaseMenu name="Shared with you" meta="Folder, no menu here" more="More actions for Shared with you" show="" disabled>
          <ContextMenuItem>Open folder</ContextMenuItem>
        </CaseMenu>
      </DemoCase>
    </DemoPage>
  );
}
