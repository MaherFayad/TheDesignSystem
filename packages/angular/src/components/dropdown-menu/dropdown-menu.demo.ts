// The DropdownMenu demo: the same cases, ids and copy as
// packages/react/src/components/DropdownMenu/DropdownMenu.demo.tsx. React's
// BoardMenu component is the #boardMenu template here, with its state kept
// per instance in this class: a component of its own would add a host
// element React does not have.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DS_DROPDOWN_MENU, type DropdownMenuChecked } from './dropdown-menu';

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

/** The state one BoardMenu keeps. */
function boardState() {
  return { grid: signal<DropdownMenuChecked>(true), snap: signal<DropdownMenuChecked>(false), sort: signal<string | undefined>('edited') };
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsTheme, DsButton, DsIconButton, NgTemplateOutlet, ...DS_DROPDOWN_MENU],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
      <ng-template #boardMenu let-trigger="trigger" let-size="size" let-lang="lang">
        @let t = copy[lang === 'ar' ? 'ar' : 'en'];
        @let s = stateOf(trigger);
        <ng-container dsDropdownMenu [size]="size ?? 'md'">
          <button dsButton dsDropdownMenuTrigger [attr.data-demo-trigger]="trigger" [size]="size" end="chevron-down">{{ t.trigger }}</button>
          <ng-template dsDropdownMenuContent>
            <div dsDropdownMenuLabel>{{ t.board }}</div>
            <div dsDropdownMenuItem start="edit" shortcut="F2">{{ t.rename }}</div>
            <div dsDropdownMenuItem start="copy" shortcut="Ctrl+D">{{ t.duplicate }}</div>
            <div dsDropdownMenuItem start="download">{{ t.download }}</div>
            <ng-container dsDropdownMenuSub>
              <div dsDropdownMenuSubTrigger start="link">{{ t.share }}</div>
              <ng-template dsDropdownMenuSubContent>
                <div dsDropdownMenuItem start="copy" shortcut="Ctrl+L">{{ t.copyLink }}</div>
                <div dsDropdownMenuItem start="user-plus">{{ t.invite }}</div>
                <div dsDropdownMenuItem start="globe">{{ t.publish }}</div>
              </ng-template>
            </ng-container>
            <div dsDropdownMenuSeparator></div>
            <div dsDropdownMenuGroup>
              <div dsDropdownMenuLabel>{{ t.view }}</div>
              <div dsDropdownMenuCheckboxItem [(checked)]="s.grid" shortcut="Ctrl+G">{{ t.grid }}</div>
              <div dsDropdownMenuCheckboxItem [(checked)]="s.snap">{{ t.snap }}</div>
            </div>
            <div dsDropdownMenuSeparator></div>
            <div dsDropdownMenuRadioGroup [(value)]="s.sort">
              <div dsDropdownMenuLabel>{{ t.sort }}</div>
              <div dsDropdownMenuRadioItem value="name">{{ t.name }}</div>
              <div dsDropdownMenuRadioItem value="edited">{{ t.edited }}</div>
              <div dsDropdownMenuRadioItem value="owner">{{ t.owner }}</div>
            </div>
            <div dsDropdownMenuSeparator></div>
            <div dsDropdownMenuItem start="trash" tone="danger" shortcut="Del">{{ t.remove }}</div>
          </ng-template>
        </ng-container>
      </ng-template>

      <section data-demo="case" data-demo-case="variants" heading="Variants">
        <div data-demo="row" [label]="'Size md'">
          <ng-container [ngTemplateOutlet]="boardMenu" [ngTemplateOutletContext]="{ trigger: 'md' }" />
        </div>
        <div data-demo="row" [label]="'Size sm'">
          <ng-container [ngTemplateOutlet]="boardMenu" [ngTemplateOutletContext]="{ trigger: 'sm', size: 'sm' }" />
        </div>
        <div data-demo="row" [label]="'Icon trigger'">
          <ng-container dsDropdownMenu>
            <button dsIconButton dsDropdownMenuTrigger data-demo-trigger="icon" icon="more" label="More frame actions"></button>
            <ng-template dsDropdownMenuContent align="end">
              <div dsDropdownMenuItem start="copy">Copy frame</div>
              <div dsDropdownMenuItem start="download">Export frame</div>
              <div dsDropdownMenuSeparator></div>
              <div dsDropdownMenuItem start="trash" tone="danger">Delete frame</div>
            </ng-template>
          </ng-container>
        </div>
        <div dsTheme [lang]="'ar'" data-demo="content">
          <div data-demo="row" [label]="'عربي'">
            <ng-container [ngTemplateOutlet]="boardMenu" [ngTemplateOutletContext]="{ trigger: 'ar', lang: 'ar' }" />
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="one" heading="One item">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">Frame actions</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuItem start="copy">Duplicate frame</div>
            </ng-template>
          </ng-container>
        </div>
      </section>

      <section data-demo="case" data-demo-case="many" heading="Many items, grouped">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">Edit</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuGroup>
                <div dsDropdownMenuItem start="history" shortcut="Ctrl+Z">Undo change</div>
                <div dsDropdownMenuItem start="refresh" shortcut="Ctrl+Shift+Z">Redo change</div>
              </div>
              <div dsDropdownMenuSeparator></div>
              <div dsDropdownMenuGroup>
                <div dsDropdownMenuItem shortcut="Ctrl+X">Cut selection</div>
                <div dsDropdownMenuItem start="copy" shortcut="Ctrl+C">Copy selection</div>
                <div dsDropdownMenuItem shortcut="Ctrl+V">Paste here</div>
                <div dsDropdownMenuItem shortcut="Ctrl+A">Select all</div>
              </div>
              <div dsDropdownMenuSeparator></div>
              <ng-container dsDropdownMenuSub>
                <div dsDropdownMenuSubTrigger start="grid">Arrange</div>
                <ng-template dsDropdownMenuSubContent>
                  <div dsDropdownMenuItem>Bring to front</div>
                  <div dsDropdownMenuItem>Send to back</div>
                  <ng-container dsDropdownMenuSub>
                    <div dsDropdownMenuSubTrigger>Align</div>
                    <ng-template dsDropdownMenuSubContent>
                      <div dsDropdownMenuItem>Align to start</div>
                      <div dsDropdownMenuItem>Align to center</div>
                      <div dsDropdownMenuItem>Align to end</div>
                    </ng-template>
                  </ng-container>
                </ng-template>
              </ng-container>
              <div dsDropdownMenuSeparator></div>
              <div dsDropdownMenuItem start="trash" tone="danger" shortcut="Del">Delete selection</div>
            </ng-template>
          </ng-container>
        </div>
      </section>

      <section data-demo="case" data-demo-case="too-many" heading="Too many items: the menu scrolls inside">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">Move to board</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuLabel>40 boards</div>
              @for (name of boards; track name) {
                <div dsDropdownMenuItem start="folder">{{ name }}</div>
              }
            </ng-template>
          </ng-container>
          <div dsTheme [lang]="'ar'" data-demo="content">
            <ng-container dsDropdownMenu>
              <button dsButton dsDropdownMenuTrigger end="chevron-down">نقل إلى لوحة</button>
              <ng-template dsDropdownMenuContent>
                <div dsDropdownMenuLabel>40 لوحة</div>
                @for (name of boardsAr; track name) {
                  <div dsDropdownMenuItem start="folder">{{ name }}</div>
                }
              </ng-template>
            </ng-container>
          </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-text" heading="Long text">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">Export options</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuLabel>Export the selected frames of Spring launch as one file</div>
              <div dsDropdownMenuItem start="download" shortcut="Ctrl+E">Export every frame as a PDF with comments and the version history attached</div>
              <div dsDropdownMenuItem start="image">Export as PNG</div>
              <div dsDropdownMenuItem start="file">Export Supercalifragilisticexpialidocious.json</div>
            </ng-template>
          </ng-container>
        </div>
      </section>

      <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
        <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">خيارات التصدير</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuLabel>تصدير الإطارات المحددة من لوحة إطلاق الربيع في ملف واحد</div>
              <div dsDropdownMenuItem start="download" shortcut="Ctrl+E">تصدير كل الإطارات بصيغة PDF مع التعليقات وسجل النسخ</div>
              <div dsDropdownMenuItem start="image">تصدير بصيغة PNG</div>
              <div dsDropdownMenuItem start="trash" tone="danger">حذف كل الإطارات المحددة من اللوحة والمسودات</div>
            </ng-template>
          </ng-container>
        </div>
        </div>
      </section>

      <section data-demo="case" data-demo-case="disabled" heading="Disabled">
        <div data-demo="row">
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger end="chevron-down">File</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuItem start="file" shortcut="Ctrl+N">New board</div>
              <div dsDropdownMenuItem start="upload" disabled>Import file</div>
              <div dsDropdownMenuCheckboxItem [checked]="true" disabled>Save automatically</div>
              <div dsDropdownMenuSeparator></div>
              <div dsDropdownMenuItem start="trash" tone="danger" disabled>Delete board</div>
            </ng-template>
          </ng-container>
          <ng-container dsDropdownMenu>
            <button dsButton dsDropdownMenuTrigger disabled end="chevron-down">Share board</button>
            <ng-template dsDropdownMenuContent>
              <div dsDropdownMenuItem>Copy link</div>
            </ng-template>
          </ng-container>
        </div>
      </section>
  `,
})
export default class DropdownMenuDemo {
  protected readonly copy = copy;
  protected readonly boards = boards;
  protected readonly boardsAr = boardsAr;
  private readonly state = { md: boardState(), sm: boardState(), ar: boardState() };

  protected stateOf(trigger: string): ReturnType<typeof boardState> {
    return trigger === 'sm' || trigger === 'ar' ? this.state[trigger] : this.state.md;
  }
}
