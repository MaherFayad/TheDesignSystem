import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarEnd,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  type MenubarSize,
} from './index';

/** The copy of the application menus, in both languages. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    bar: 'Application menu',
    file: 'File',
    edit: 'Edit',
    view: 'View',
    help: 'Help',
    newBoard: 'New board',
    open: 'Open board',
    recent: 'Open recent',
    save: 'Save board',
    exportAs: 'Export board',
    close: 'Close window',
    undo: 'Undo change',
    redo: 'Redo change',
    cut: 'Cut selection',
    copySel: 'Copy selection',
    paste: 'Paste here',
    remove: 'Delete selection',
    grid: 'Show grid',
    rulers: 'Show rulers',
    zoom: 'Zoom',
    fit: 'Fit to screen',
    actual: 'Actual size',
    docs: 'Read the guide',
    keys: 'Show shortcuts',
    clock: 'Thu 12 Nov 9:41',
  },
  ar: {
    bar: 'قائمة التطبيق',
    file: 'الملف',
    edit: 'التحرير',
    view: 'العرض',
    help: 'المساعدة',
    newBoard: 'لوحة جديدة',
    open: 'فتح لوحة',
    recent: 'الملفات الأخيرة',
    save: 'حفظ اللوحة',
    exportAs: 'تصدير اللوحة',
    close: 'إغلاق النافذة',
    undo: 'تراجع',
    redo: 'إعادة',
    cut: 'قص التحديد',
    copySel: 'نسخ التحديد',
    paste: 'لصق',
    remove: 'حذف التحديد',
    grid: 'إظهار الشبكة',
    rulers: 'إظهار المساطر',
    zoom: 'التكبير',
    fit: 'ملاءمة الشاشة',
    actual: 'الحجم الفعلي',
    docs: 'قراءة الدليل',
    keys: 'عرض الاختصارات',
    clock: 'الخميس 12 نوفمبر 9:41',
  },
} as const;

type Lang = keyof typeof copy;

/** The full application menu: four menus with every part, and a clock at the end. */
function AppMenubar({ size, lang = 'en', defaultValue }: { size?: MenubarSize; lang?: Lang; defaultValue?: string }) {
  const t = copy[lang];
  const [grid, setGrid] = useState(true);
  const [rulers, setRulers] = useState(false);
  const [zoom, setZoom] = useState('fit');
  return (
    <Menubar size={size} aria-label={t.bar} defaultValue={defaultValue}>
      <MenubarMenu value="file">
        <MenubarTrigger>{t.file}</MenubarTrigger>
        <MenubarContent>
          <MenubarItem start="file" shortcut="Ctrl+N">
            {t.newBoard}
          </MenubarItem>
          <MenubarItem start="folder" shortcut="Ctrl+O">
            {t.open}
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger start="history">{t.recent}</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Spring launch</MenubarItem>
              <MenubarItem>Brand refresh</MenubarItem>
              <MenubarItem>Checkout flow</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem start="download" shortcut="Ctrl+S">
            {t.save}
          </MenubarItem>
          <MenubarItem start="upload" shortcut="Ctrl+E">
            {t.exportAs}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem shortcut="Ctrl+W">{t.close}</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="edit">
        <MenubarTrigger>{t.edit}</MenubarTrigger>
        <MenubarContent>
          <MenubarGroup>
            <MenubarItem start="history" shortcut="Ctrl+Z">
              {t.undo}
            </MenubarItem>
            <MenubarItem start="refresh" shortcut="Ctrl+Shift+Z">
              {t.redo}
            </MenubarItem>
          </MenubarGroup>
          <MenubarSeparator />
          <MenubarItem shortcut="Ctrl+X">{t.cut}</MenubarItem>
          <MenubarItem start="copy" shortcut="Ctrl+C">
            {t.copySel}
          </MenubarItem>
          <MenubarItem shortcut="Ctrl+V">{t.paste}</MenubarItem>
          <MenubarSeparator />
          <MenubarItem start="trash" tone="danger" shortcut="Del">
            {t.remove}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="view">
        <MenubarTrigger>{t.view}</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="Ctrl+G">
            {t.grid}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem checked={rulers} onCheckedChange={setRulers} shortcut="Ctrl+R">
            {t.rulers}
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarRadioGroup value={zoom} onValueChange={setZoom}>
            <MenubarLabel>{t.zoom}</MenubarLabel>
            <MenubarRadioItem value="fit" shortcut="Ctrl+1">
              {t.fit}
            </MenubarRadioItem>
            <MenubarRadioItem value="actual" shortcut="Ctrl+0">
              {t.actual}
            </MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu value="help">
        <MenubarTrigger>{t.help}</MenubarTrigger>
        <MenubarContent>
          <MenubarItem start="external">{t.docs}</MenubarItem>
          <MenubarItem start="keyboard" shortcut="Ctrl+/">
            {t.keys}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarEnd>
        <time dateTime="2026-11-12T09:41">{t.clock}</time>
      </MenubarEnd>
    </Menubar>
  );
}

const boards = [
  'Spring launch', 'Brand refresh', 'Checkout flow', 'Onboarding', 'Pricing page', 'Help center', 'Mobile app', 'Design review',
  'Icons', 'Type scale', 'Color study', 'Empty states', 'Error pages', 'Dashboard', 'Settings', 'Notifications',
  'Search', 'Profile', 'Billing', 'Team page', 'Invite flow', 'Reports', 'Charts', 'Tables',
  'Forms', 'Navigation', 'Footer', 'Landing page', 'Blog', 'Careers', 'Press kit', 'Events',
];

const extraMenus = ['Insert', 'Layer', 'Arrange', 'Text', 'Plugins', 'Window', 'Account'];

export default function MenubarDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="Size md">
          <AppMenubar />
        </DemoRow>
        <DemoRow label="Size sm">
          <AppMenubar size="sm" />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <AppMenubar lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One menu">
        <Menubar aria-label="Board menu">
          <MenubarMenu>
            <MenubarTrigger>Board</MenubarTrigger>
            <MenubarContent>
              <MenubarItem start="edit">Rename board</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the row wraps, a long menu scrolls inside">
        <Menubar aria-label="Application menu">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Open recent</MenubarLabel>
              {boards.map((name) => (
                <MenubarItem key={name} start="folder">
                  {name}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
          {extraMenus.map((name) => (
            <MenubarMenu key={name}>
              <MenubarTrigger>{name}</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Show {name.toLowerCase()} panel</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ))}
          <MenubarEnd>Saved</MenubarEnd>
        </Menubar>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Menubar aria-label="Application menu">
          <MenubarMenu>
            <MenubarTrigger>Supercalifragilisticexpialidocious</MenubarTrigger>
            <MenubarContent>
              <MenubarItem start="download" shortcut="Ctrl+E">
                Export every frame as a PDF with comments and the version history attached
              </MenubarItem>
              <MenubarItem start="file">Export Supercalifragilisticexpialidocious.json</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarEnd>Last saved by Maryam at 9:41 on Thursday</MenubarEnd>
        </Menubar>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Menubar aria-label="قائمة التطبيق">
          <MenubarMenu>
            <MenubarTrigger>التصدير والمشاركة</MenubarTrigger>
            <MenubarContent>
              <MenubarItem start="download" shortcut="Ctrl+E">
                تصدير كل الإطارات بصيغة PDF مع التعليقات وسجل النسخ
              </MenubarItem>
              <MenubarItem start="trash" tone="danger">
                حذف كل الإطارات المحددة من اللوحة والمسودات
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarEnd>آخر حفظ الساعة 9:41 يوم الخميس</MenubarEnd>
        </Menubar>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Menubar aria-label="Application menu">
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem start="file">New board</MenubarItem>
              <MenubarItem start="upload" disabled>
                Import file
              </MenubarItem>
              <MenubarCheckboxItem checked disabled>
                Save automatically
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger disabled>Plugins</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Manage plugins</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </DemoCase>

      <DemoCase id="open" title="An open menu">
        <AppMenubar defaultValue="edit" />
      </DemoCase>
    </DemoPage>
  );
}
