import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
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
  type DropdownMenuSize,
} from './index';

/** The copy of the full board menu, in both languages. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    trigger: 'Board actions',
    board: 'Board',
    rename: 'Rename board',
    duplicate: 'Duplicate board',
    download: 'Download board',
    share: 'Share board',
    copyLink: 'Copy link',
    invite: 'Invite people',
    publish: 'Publish to the web',
    view: 'View',
    grid: 'Show grid',
    snap: 'Snap to grid',
    sort: 'Sort by',
    name: 'Name',
    edited: 'Date edited',
    owner: 'Owner',
    remove: 'Delete board',
  },
  ar: {
    trigger: 'إجراءات اللوحة',
    board: 'اللوحة',
    rename: 'إعادة تسمية اللوحة',
    duplicate: 'تكرار اللوحة',
    download: 'تنزيل اللوحة',
    share: 'مشاركة اللوحة',
    copyLink: 'نسخ الرابط',
    invite: 'دعوة أشخاص',
    publish: 'النشر على الويب',
    view: 'العرض',
    grid: 'إظهار الشبكة',
    snap: 'المحاذاة للشبكة',
    sort: 'الترتيب حسب',
    name: 'الاسم',
    edited: 'تاريخ التعديل',
    owner: 'المالك',
    remove: 'حذف اللوحة',
  },
} as const;

/** Every part: a label, items with icons and shortcuts, a submenu, checkbox and radio items, a danger item. */
function BoardMenu({ size, lang = 'en', trigger }: { size?: DropdownMenuSize; lang?: 'en' | 'ar'; trigger: string }) {
  const t = copy[lang];
  const [grid, setGrid] = useState(true);
  const [snap, setSnap] = useState(false);
  const [sort, setSort] = useState('edited');
  return (
    <DropdownMenu size={size}>
      <DropdownMenuTrigger>
        <Button data-demo-trigger={trigger} size={size} end="chevron-down">
          {t.trigger}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t.board}</DropdownMenuLabel>
        <DropdownMenuItem start="edit" shortcut="F2">
          {t.rename}
        </DropdownMenuItem>
        <DropdownMenuItem start="copy" shortcut="Ctrl+D">
          {t.duplicate}
        </DropdownMenuItem>
        <DropdownMenuItem start="download">{t.download}</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger start="link">{t.share}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem start="copy" shortcut="Ctrl+L">
              {t.copyLink}
            </DropdownMenuItem>
            <DropdownMenuItem start="user-plus">{t.invite}</DropdownMenuItem>
            <DropdownMenuItem start="globe">{t.publish}</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t.view}</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid} shortcut="Ctrl+G">
            {t.grid}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={snap} onCheckedChange={setSnap}>
            {t.snap}
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
          <DropdownMenuLabel>{t.sort}</DropdownMenuLabel>
          <DropdownMenuRadioItem value="name">{t.name}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="edited">{t.edited}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="owner">{t.owner}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem start="trash" tone="danger" shortcut="Del">
          {t.remove}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** 40 boards to move a frame to: the menu stops at the viewport edge and scrolls inside. */
const boards = [
  'Spring launch', 'Brand refresh', 'Checkout flow', 'Onboarding', 'Pricing page', 'Help center', 'Mobile app', 'Design review',
  'Icons', 'Type scale', 'Color study', 'Empty states', 'Error pages', 'Dashboard', 'Settings', 'Notifications',
  'Search', 'Profile', 'Billing', 'Team page', 'Invite flow', 'Reports', 'Charts', 'Tables',
  'Forms', 'Navigation', 'Footer', 'Landing page', 'Blog', 'Careers', 'Press kit', 'Events',
  'Partners', 'Docs home', 'API reference', 'Changelog', 'Roadmap', 'Status page', 'Legal', 'Archive',
];

const boardsAr = [
  'إطلاق الربيع', 'تحديث الهوية', 'مسار الدفع', 'التعريف بالمنتج', 'صفحة الأسعار', 'مركز المساعدة', 'تطبيق الجوال', 'مراجعة التصميم',
  'الأيقونات', 'مقاسات الخط', 'دراسة الألوان', 'الحالات الفارغة', 'صفحات الأخطاء', 'لوحة المتابعة', 'الإعدادات', 'التنبيهات',
  'البحث', 'الملف الشخصي', 'الفواتير', 'صفحة الفريق', 'مسار الدعوة', 'التقارير', 'الرسوم البيانية', 'الجداول',
  'النماذج', 'التنقل', 'تذييل الصفحة', 'الصفحة الرئيسية', 'المدونة', 'الوظائف', 'الملف الصحفي', 'الفعاليات',
  'الشركاء', 'بداية الدليل', 'مرجع الواجهة', 'سجل التغييرات', 'خطة العمل', 'صفحة الحالة', 'الشروط', 'الأرشيف',
];

export default function DropdownMenuDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="Size md">
          <BoardMenu trigger="md" />
        </DemoRow>
        <DemoRow label="Size sm">
          <BoardMenu trigger="sm" size="sm" />
        </DemoRow>
        <DemoRow label="Icon trigger">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <IconButton data-demo-trigger="icon" icon="more" label="More frame actions" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem start="copy">Copy frame</DropdownMenuItem>
              <DropdownMenuItem start="download">Export frame</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem start="trash" tone="danger">
                Delete frame
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <BoardMenu trigger="ar" lang="ar" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One item">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">Frame actions</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem start="copy">Duplicate frame</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many items, grouped">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">Edit</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuItem start="history" shortcut="Ctrl+Z">
                  Undo change
                </DropdownMenuItem>
                <DropdownMenuItem start="refresh" shortcut="Ctrl+Shift+Z">
                  Redo change
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem shortcut="Ctrl+X">Cut selection</DropdownMenuItem>
                <DropdownMenuItem start="copy" shortcut="Ctrl+C">
                  Copy selection
                </DropdownMenuItem>
                <DropdownMenuItem shortcut="Ctrl+V">Paste here</DropdownMenuItem>
                <DropdownMenuItem shortcut="Ctrl+A">Select all</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger start="grid">Arrange</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Bring to front</DropdownMenuItem>
                  <DropdownMenuItem>Send to back</DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Align</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Align to start</DropdownMenuItem>
                      <DropdownMenuItem>Align to center</DropdownMenuItem>
                      <DropdownMenuItem>Align to end</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem start="trash" tone="danger" shortcut="Del">
                Delete selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Too many items: the menu scrolls inside">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">Move to board</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>40 boards</DropdownMenuLabel>
              {boards.map((name) => (
                <DropdownMenuItem key={name} start="folder">
                  {name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Theme lang="ar" data-demo="content">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button end="chevron-down">نقل إلى لوحة</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>40 لوحة</DropdownMenuLabel>
                {boardsAr.map((name) => (
                  <DropdownMenuItem key={name} start="folder">
                    {name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">Export options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Export the selected frames of Spring launch as one file</DropdownMenuLabel>
              <DropdownMenuItem start="download" shortcut="Ctrl+E">
                Export every frame as a PDF with comments and the version history attached
              </DropdownMenuItem>
              <DropdownMenuItem start="image">Export as PNG</DropdownMenuItem>
              <DropdownMenuItem start="file">Export Supercalifragilisticexpialidocious.json</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">خيارات التصدير</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>تصدير الإطارات المحددة من لوحة إطلاق الربيع في ملف واحد</DropdownMenuLabel>
              <DropdownMenuItem start="download" shortcut="Ctrl+E">
                تصدير كل الإطارات بصيغة PDF مع التعليقات وسجل النسخ
              </DropdownMenuItem>
              <DropdownMenuItem start="image">تصدير بصيغة PNG</DropdownMenuItem>
              <DropdownMenuItem start="trash" tone="danger">
                حذف كل الإطارات المحددة من اللوحة والمسودات
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <DemoRow>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button end="chevron-down">File</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem start="file" shortcut="Ctrl+N">
                New board
              </DropdownMenuItem>
              <DropdownMenuItem start="upload" disabled>
                Import file
              </DropdownMenuItem>
              <DropdownMenuCheckboxItem checked disabled>
                Save automatically
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem start="trash" tone="danger" disabled>
                Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger disabled>
              <Button end="chevron-down">Share board</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Copy link</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
