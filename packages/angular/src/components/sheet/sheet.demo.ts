// The Sheet demo: the same cases, ids, triggers and copy as
// packages/react/src/components/Sheet/Sheet.demo.tsx. React's ShareSheet,
// ArabicSheet, ConfirmSheet and HeaderActionSheet render no element of
// their own, so here they are templates; the Arabic ones are declared inside
// the Arabic theme, because DI follows declaration and the portal copies the
// theme it is opened in.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsFieldset } from '../fieldset/fieldset';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInput } from '../input/input';
import { DS_SHEET, type SheetSize } from './sheet';

const sizes: SheetSize[] = ['sm', 'md', 'lg'];

const confirmCopy = {
  en: {
    open: 'New list',
    title: 'New list',
    legend: 'List details',
    name: 'Name',
    namePlaceholder: 'For example, launch checklist',
    note: 'Note',
    notePlaceholder: 'Optional',
    confirm: 'Save list',
  },
  ar: {
    open: 'قائمة جديدة',
    title: 'قائمة جديدة',
    legend: 'بيانات القائمة',
    name: 'الاسم',
    namePlaceholder: 'مثلا، مهام الإطلاق',
    note: 'ملاحظة',
    notePlaceholder: 'اختياري',
    confirm: 'حفظ القائمة',
  },
} as const;

const headerActionCopy = {
  en: { open: 'Pass details', title: 'Pass details', share: 'Share pass', confirm: 'Save changes', body: 'Seat 14, hall B. Doors open at 7:30 pm.' },
  ar: { open: 'تفاصيل البطاقة', title: 'تفاصيل البطاقة', share: 'مشاركة البطاقة', confirm: 'حفظ التغييرات', body: 'المقعد 14، القاعة ب. فتح الأبواب الساعة 7:30 مساء.' },
} as const;

const notes = Array.from({ length: 14 }, (_, i) => i);
const boardFields = ['Board name', 'Owner', 'Team', 'Due date', 'Tag'];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_SHEET, DsButton, DsField, DsFieldset, DsIconButton, DsInput, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- A quick share task: the common sheet. -->
    <ng-template #share let-s>
      <ng-container dsSheet [size]="s.size ?? 'md'" [detents]="s.detents" [defaultDetent]="s.defaultDetent ?? 0">
        <button dsButton dsSheetTrigger [attr.data-demo-trigger]="s.trigger">{{ s.label }}</button>
        <ng-template dsSheetContent title="Share Spring launch" description="People with the link can view the board.">
          <div dsSheetBody>
            <div dsField label="Invite by email"><div dsInput placeholder="name@example.com"></div></div>
          </div>
          <div dsSheetFooter>
            <button dsButton dsSheetClose>Discard invite</button>
            <button dsButton dsSheetClose tone="accent" emphasis="solid">Send invite</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- Order M9.6: the confirm in the header at the inline end, off until the list has a name. -->
    <ng-template #confirmSheet let-t let-trigger="trigger">
      <ng-container dsSheet size="lg" (openChange)="$event && confirmName.set('')">
        <button dsButton dsSheetTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
        <ng-template dsSheetContent [title]="t.title">
          <ng-container dsSheetConfirm [label]="t.confirm" [disabled]="confirmName().trim() === ''" />
          <div dsSheetBody>
            <fieldset dsFieldset variant="inset" [legend]="t.legend">
              <div dsField [label]="t.name">
                <div dsInput variant="plain" clearable [value]="confirmName()" (valueChange)="confirmName.set($event ?? '')" [placeholder]="t.namePlaceholder"></div>
              </div>
              <div dsField [label]="t.note"><div dsInput variant="plain" clearable [placeholder]="t.notePlaceholder"></div></div>
            </fieldset>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- Order C5: one more action in the header, between the close control and the confirm. -->
    <ng-template #headerAction let-t let-trigger="trigger">
      <ng-container dsSheet size="md">
        <button dsButton dsSheetTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
        <ng-template dsSheetContent [title]="t.title">
          <ng-template dsSheetHeaderAction><button dsIconButton icon="share" [label]="t.share"></button></ng-template>
          <ng-container dsSheetConfirm [label]="t.confirm" />
          <div dsSheetBody><p>{{ t.body }}</p></div>
        </ng-template>
      </ng-container>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes sm, md and lg: drag the handle down, press Escape or the close control">
      <div data-demo="row">
        @for (size of sizes; track size) {
          <ng-container [ngTemplateOutlet]="share" [ngTemplateOutletContext]="{ $implicit: { size, trigger: size, label: 'Open ' + size + ' sheet' } }" />
        }
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arabic let-long>
          <ng-container dsSheet>
            <button dsButton dsSheetTrigger [attr.data-demo-trigger]="long ? 'long-arabic' : 'arabic'">مشاركة اللوحة</button>
            <ng-template dsSheetContent [title]="long ? 'مشاركة لوحة إطلاق الربيع مع فريق التصميم وكل المراجعين' : 'مشاركة اللوحة'"
              [description]="long ? sample.ar.long : 'اللي عندهم الرابط يقدرون يشوفون اللوحة.'">
              <div dsSheetBody>
                <div dsField label="الدعوة بالإيميل"><div dsInput placeholder="name@example.com"></div></div>
              </div>
              <div dsSheetFooter>
                <button dsButton dsSheetClose wrap>إغلاق المشاركة</button>
                <button dsButton dsSheetClose wrap tone="accent" emphasis="solid">{{ long ? 'إرسال الدعوة لكل أعضاء الفريق' : 'إرسال الدعوة' }}</button>
              </div>
            </ng-template>
          </ng-container>
        </ng-template>
        <div data-demo="row" label="عربي">
          <ng-container [ngTemplateOutlet]="arabic" [ngTemplateOutletContext]="{ $implicit: false }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: nothing to show yet">
      <div data-demo="row">
        <ng-container dsSheet size="sm">
          <button dsButton dsSheetTrigger data-demo-trigger="empty">Show recent files</button>
          <ng-template dsSheetContent title="Recent files">
            <div dsSheetBody><p>No recent files. Files you open show here.</p></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One action">
      <div data-demo="row">
        <ng-container dsSheet size="sm">
          <button dsButton dsSheetTrigger data-demo-trigger="one">Duplicate board</button>
          <ng-template dsSheetContent title="Duplicate Spring launch?" description="The copy keeps every frame, without comments.">
            <div dsSheetFooter><button dsButton dsSheetClose tone="accent" emphasis="solid">Duplicate board</button></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many fields: focus opens on the first one">
      <div data-demo="row">
        <ng-container dsSheet size="lg">
          <button dsButton dsSheetTrigger data-demo-trigger="many">New board</button>
          <ng-template dsSheetContent title="Create a board" description="You can change every detail later.">
            <div dsSheetBody>
              <div style="display: grid; gap: var(--ds-space-l)">
                @for (name of boardFields; track name) {
                  <div dsField [label]="name"><div dsInput></div></div>
                }
              </div>
            </div>
            <div dsSheetFooter>
              <button dsButton dsSheetClose>Discard board</button>
              <button dsButton dsSheetClose tone="accent" emphasis="solid">Create board</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Long content: the body scrolls, the header and the footer stay">
      <div data-demo="row">
        <ng-container dsSheet>
          <button dsButton dsSheetTrigger data-demo-trigger="too-many">Show release notes</button>
          <ng-template dsSheetContent title="Release notes">
            <div dsSheetBody>
              @for (n of notes; track n) {
                <p>{{ sample.en.long }}</p>
              }
            </div>
            <div dsSheetFooter><button dsButton dsSheetClose>Close notes</button></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long title, description and labels: they wrap">
      <div data-demo="row">
        <ng-container dsSheet>
          <button dsButton dsSheetTrigger data-demo-trigger="long-text">Share the archive</button>
          <ng-template dsSheetContent title="Share the Northwind design and research archive with every reviewer on the team" [description]="sample.en.long">
            <div dsSheetFooter>
              <button dsButton dsSheetClose wrap>Keep the archive private for now</button>
              <button dsButton dsSheetClose wrap tone="accent" emphasis="solid">Share the archive with every reviewer</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="row">
          <ng-container dsSheet>
            <button dsButton dsSheetTrigger data-demo-trigger="long-arabic">مشاركة اللوحة</button>
            <ng-template dsSheetContent title="مشاركة لوحة إطلاق الربيع مع فريق التصميم وكل المراجعين" [description]="sample.ar.long">
              <div dsSheetBody>
                <div dsField label="الدعوة بالإيميل"><div dsInput placeholder="name@example.com"></div></div>
              </div>
              <div dsSheetFooter>
                <button dsButton dsSheetClose wrap>إغلاق المشاركة</button>
                <button dsButton dsSheetClose wrap tone="accent" emphasis="solid">إرسال الدعوة لكل أعضاء الفريق</button>
              </div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the body says so, and a drag or Escape still closes it">
      <div data-demo="row">
        <ng-container dsSheet size="sm">
          <button dsButton dsSheetTrigger data-demo-trigger="loading">Show comments</button>
          <ng-template dsSheetContent title="Comments" [aria-busy]="true">
            <div dsSheetBody><p role="status">Loading the comments of this board.</p></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the body says what failed">
      <div data-demo="row">
        <ng-container dsSheet size="sm">
          <button dsButton dsSheetTrigger data-demo-trigger="error">Show comments offline</button>
          <ng-template dsSheetContent title="Comments">
            <div dsSheetBody><p role="alert">Could not load the comments. Check your connection, then try again.</p></div>
            <div dsSheetFooter><button dsButton tone="accent" emphasis="solid">Load comments</button></div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="detents" heading="Detents: half and all of the room; drag between them, or focus the handle and use the arrows, Enter or a press">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="share" [ngTemplateOutletContext]="{ $implicit: { trigger: 'detents', label: 'Share at half height', detents: [0.5, 1] } }" />
        <ng-container [ngTemplateOutlet]="share" [ngTemplateOutletContext]="{ $implicit: { trigger: 'detents-px', label: 'Share at 320px', detents: [320, 0.9], defaultDetent: 1 } }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="detents-arabic" heading="Detents in Arabic">
      <div dsTheme [lang]="'ar'" [dir]="'rtl'" data-demo="content">
        <div data-demo="row">
          <ng-container dsSheet [detents]="[0.5, 1]">
            <button dsButton dsSheetTrigger data-demo-trigger="detents-arabic">مشاركة اللوحة</button>
            <ng-template dsSheetContent title="مشاركة إطلاق الربيع" description="يمكن لمن لديه الرابط عرض اللوحة.">
              <div dsSheetBody>اسحب المقبض أو استخدم مفاتيح الأسهم لتغيير الارتفاع.</div>
            </ng-template>
          </ng-container>
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="confirm" heading="Confirm in the header: after the close control, off until the list has a name">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="confirmSheet" [ngTemplateOutletContext]="{ $implicit: confirmCopy.en, trigger: 'confirm' }" />
        <div dsTheme [lang]="'ar'" [dir]="'rtl'" data-demo="content">
          <ng-template #confirmArabic let-t let-trigger="trigger">
            <ng-container dsSheet size="lg" (openChange)="$event && confirmName.set('')">
              <button dsButton dsSheetTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
              <ng-template dsSheetContent [title]="t.title">
                <ng-container dsSheetConfirm [label]="t.confirm" [disabled]="confirmName().trim() === ''" />
                <div dsSheetBody>
                  <fieldset dsFieldset variant="inset" [legend]="t.legend">
                    <div dsField [label]="t.name">
                      <div dsInput variant="plain" clearable [value]="confirmName()" (valueChange)="confirmName.set($event ?? '')" [placeholder]="t.namePlaceholder"></div>
                    </div>
                    <div dsField [label]="t.note"><div dsInput variant="plain" clearable [placeholder]="t.notePlaceholder"></div></div>
                  </fieldset>
                </div>
              </ng-template>
            </ng-container>
          </ng-template>
          <ng-container [ngTemplateOutlet]="confirmArabic" [ngTemplateOutletContext]="{ $implicit: confirmCopy.ar, trigger: 'confirm-arabic' }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="header-action" heading="One more action in the header: close, share, then confirm">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="headerAction" [ngTemplateOutletContext]="{ $implicit: headerActionCopy.en, trigger: 'header-action' }" />
        <div dsTheme [lang]="'ar'" [dir]="'rtl'" data-demo="content">
          <ng-template #headerActionArabic let-t let-trigger="trigger">
            <ng-container dsSheet size="md">
              <button dsButton dsSheetTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
              <ng-template dsSheetContent [title]="t.title">
                <ng-template dsSheetHeaderAction><button dsIconButton icon="share" [label]="t.share"></button></ng-template>
                <ng-container dsSheetConfirm [label]="t.confirm" />
                <div dsSheetBody><p>{{ t.body }}</p></div>
              </ng-template>
            </ng-container>
          </ng-template>
          <ng-container [ngTemplateOutlet]="headerActionArabic" [ngTemplateOutletContext]="{ $implicit: headerActionCopy.ar, trigger: 'header-action-arabic' }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="disabled" heading="Not dismissible while sending: the close control is disabled, a drag and Escape wait">
      <div data-demo="row">
        <ng-container dsSheet size="sm" [(open)]="busyOpen" [dismissible]="!busy()">
          <button dsButton dsSheetTrigger data-demo-trigger="disabled">Send invites</button>
          <ng-template dsSheetContent title="Send 12 invites?" description="Each person gets an email with the link.">
            <div dsSheetFooter>
              <button dsButton dsSheetClose [disabled]="busy()">Discard invite</button>
              <button dsButton tone="accent" emphasis="solid" [loading]="busy()" loadingLabel="Sending invites" (click)="send()">Send invites</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>
  `,
})
export default class SheetDemo {
  protected readonly sizes = sizes;
  protected readonly sample = sample;
  protected readonly notes = notes;
  protected readonly boardFields = boardFields;
  protected readonly confirmCopy = confirmCopy;
  protected readonly headerActionCopy = headerActionCopy;
  protected readonly confirmName = signal('');
  protected readonly busyOpen = signal(false);
  protected readonly busy = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  /** Send runs for two seconds: nothing dismisses the sheet until it ends. */
  protected send(): void {
    this.busy.set(true);
    this.timer = setTimeout(() => {
      this.busy.set(false);
      this.busyOpen.set(false);
    }, 2000);
  }
}
