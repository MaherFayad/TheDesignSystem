// The ActionSheet demo: the same cases, ids, triggers and copy as
// packages/react/src/components/ActionSheet/ActionSheet.demo.tsx.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DS_ACTION_SHEET, type ActionSheetActionTone, type ActionSheetPlacementChoice } from './action-sheet';

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

interface Sheet {
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

const sheets = {
  variants: { trigger: 'variants', title: en.title, description: en.description, items: en.three },
  anchored: { trigger: 'anchored', text: 'Anchored', placement: 'anchored', title: en.title, items: en.three },
  center: { trigger: 'center', text: 'Center', placement: 'center', title: en.title, items: en.three },
  bottom: { trigger: 'bottom', text: 'Bottom', placement: 'bottom', title: en.title, items: en.three },
  noDanger: { trigger: 'no-danger', text: 'No danger action', items: en.three.slice(1), label: 'Actions for Spring launch' },
  one: { trigger: 'one', items: [{ label: 'Copy link' }], label: 'Actions for Spring launch' },
  many: { trigger: 'many', title: en.title, items: en.many },
  longText: {
    trigger: 'long-text',
    title: 'Spring launch, the board for the whole marketing team and every partner agency',
    description: 'The board is shared with 4 people. Anything you move or delete changes for each of them right away.',
    items: [
      { label: 'Duplicate the board with every frame, comment and attached file' },
      { label: 'Move the board to another folder and keep the same sharing' },
      { label: 'Delete the board and every file in it for good', tone: 'danger' },
    ],
  },
  longArabic: { trigger: 'long-arabic', more: ar.more, title: ar.title, description: ar.description, items: ar.long },
  arabic: { trigger: 'arabic', more: ar.more, title: ar.title, items: ar.three },
  disabled: {
    trigger: 'disabled',
    title: en.title,
    items: [{ label: 'Duplicate board' }, { label: 'Move to folder', disabled: true }, { label: 'Delete board', tone: 'danger' }],
  },
} satisfies Record<string, Sheet>;

/**
 * One sheet with its trigger, a more button by default, is the template
 * #sheet: React's Sheet renders no element of its own, so neither does
 * this. The loading sheet is the template #loadingSheet: the action runs,
 * the sheet stays open, Escape and a press outside do nothing, the item
 * shows loading.
 */
@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_ACTION_SHEET, DsButton, DsIconButton, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #sheet let-s>
      <ng-container dsActionSheet [placement]="s.placement ?? 'auto'">
        @if (s.text) {
          <button dsButton dsActionSheetTrigger [attr.data-demo-trigger]="s.trigger">{{ s.text }}</button>
        } @else {
          <button dsIconButton dsActionSheetTrigger [attr.data-demo-trigger]="s.trigger" icon="more" [label]="s.more ?? en.more"></button>
        }
        <ng-template dsActionSheetContent [title]="s.title" [description]="s.description" [label]="s.label">
          @for (item of s.items; track item.label) {
            <button dsActionSheetAction [tone]="item.tone ?? 'neutral'" [disabled]="item.disabled ?? false">{{ item.label }}</button>
          }
        </ng-template>
      </ng-container>
    </ng-template>

    <ng-template #loadingSheet>
      <ng-container dsActionSheet [(open)]="loadingOpen" [dismissible]="!busy()">
        <button dsButton dsActionSheetTrigger data-demo-trigger="loading">Export the board</button>
        <ng-template dsActionSheetContent [title]="en.title">
          <button dsActionSheetAction (click)="run($event)" [loading]="busy()" loadingLabel="Exporting">Export as PDF</button>
          <button dsActionSheetAction [disabled]="busy()">Export as image</button>
          <button dsActionSheetCancel [disabled]="busy()"></button>
        </ng-template>
      </ng-container>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants">
      <div style="display: flex; justify-content: flex-end">
        <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.variants }" />
      </div>
      <div data-demo="row" label="placement">
        <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.anchored }" />
        <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.center }" />
        <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.bottom }" />
        <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.noDanger }" />
      </div>
    </section>
    <section data-demo="case" data-demo-case="one" heading="One action">
      <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.one }" />
    </section>
    <section data-demo="case" data-demo-case="many" heading="Many actions">
      <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.many }" />
    </section>
    <section data-demo="case" data-demo-case="long-text" heading="Long text">
      <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.longText }" />
    </section>
    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <!-- DI follows declaration, so the Arabic sheets are declared inside the Arabic theme: their portal copies it. -->
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #sheetAr let-s>
          <ng-container dsActionSheet>
            <button dsIconButton dsActionSheetTrigger [attr.data-demo-trigger]="s.trigger" icon="more" [label]="s.more"></button>
            <ng-template dsActionSheetContent [title]="s.title" [description]="s.description">
              @for (item of s.items; track item.label) {
                <button dsActionSheetAction [tone]="item.tone ?? 'neutral'">{{ item.label }}</button>
              }
            </ng-template>
          </ng-container>
        </ng-template>
        <div style="display: flex; justify-content: flex-end">
          <ng-container [ngTemplateOutlet]="sheetAr" [ngTemplateOutletContext]="{ $implicit: sheets.longArabic }" />
        </div>
        <div data-demo="row">
          <ng-container [ngTemplateOutlet]="sheetAr" [ngTemplateOutletContext]="{ $implicit: sheets.arabic }" />
        </div>
      </div>
    </section>
    <section data-demo="case" data-demo-case="loading" heading="Loading">
      <ng-container [ngTemplateOutlet]="loadingSheet" />
    </section>
    <section data-demo="case" data-demo-case="disabled" heading="Disabled action">
      <ng-container [ngTemplateOutlet]="sheet" [ngTemplateOutletContext]="{ $implicit: sheets.disabled }" />
    </section>
  `,
})
export default class ActionSheetDemo {
  protected readonly en = en;
  protected readonly sheets: Record<keyof typeof sheets, Sheet> = sheets;
  protected readonly loadingOpen = signal(false);
  protected readonly busy = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected run(event: MouseEvent): void {
    event.preventDefault();
    this.busy.set(true);
    this.timer = setTimeout(() => {
      this.busy.set(false);
      this.loadingOpen.set(false);
    }, 2000);
  }
}
