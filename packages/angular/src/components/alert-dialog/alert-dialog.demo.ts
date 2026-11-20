// The AlertDialog demo: the same cases, ids, triggers and copy as
// packages/react/src/components/AlertDialog/AlertDialog.demo.tsx. React's
// ToneAlert, ArabicAlert, LoadingAlert and FolderAlert render no element of
// their own, so here they are templates; the Arabic ones are declared inside
// the Arabic theme, because DI follows declaration and the portal copies the
// theme it is opened in.
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import { DS_ALERT_DIALOG, type AlertDialogSize, type AlertDialogTone } from './alert-dialog';

const sizes: AlertDialogSize[] = ['sm', 'md'];
const tones: AlertDialogTone[] = ['neutral', 'danger'];

const copy = {
  neutral: {
    open: 'Leave the board',
    title: 'Leave the board Spring launch?',
    description: 'You lose access right away. An owner has to invite you again.',
    cancel: 'Keep access',
    action: 'Leave board',
  },
  danger: {
    open: 'Delete the board',
    title: 'Delete the board Spring launch?',
    description: 'Its 12 frames and every comment are deleted for good. This cannot be undone.',
    cancel: 'Keep board',
    action: 'Delete board',
  },
} as const;

const fieldsCopy = {
  en: {
    open: 'New folder',
    title: 'New folder',
    description: 'Name the folder for the 4 boards you picked.',
    legend: 'Folder details',
    name: 'Name',
    placeholder: 'For example, spring launch',
    cancel: 'Cancel',
    action: 'Create folder',
  },
  ar: {
    open: 'مجلد جديد',
    title: 'مجلد جديد',
    description: 'اكتب اسم المجلد للوحات الأربع اللي اخترتها.',
    legend: 'بيانات المجلد',
    name: 'الاسم',
    placeholder: 'مثلا، إطلاق الربيع',
    cancel: 'إلغاء',
    action: 'إنشاء المجلد',
  },
} as const;

const toneCases = tones.flatMap((tone) => sizes.map((size) => ({ size, tone, words: copy[tone] })));

/** The state of one loading or failing alert. */
class Run {
  readonly open = signal(false);
  readonly busy = signal(false);
  readonly failed = signal(false);
  constructor(readonly fail: boolean) {}
}

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DS_ALERT_DIALOG, DsButton, DsField, DsInput, DsTheme, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- One question per size and tone. Focus opens on the cancel action. -->
    <ng-template #toneAlert let-c>
      <ng-container dsAlertDialog [size]="c.size" [tone]="c.tone">
        <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="c.size + '-' + c.tone" [tone]="c.tone === 'danger' ? 'danger' : 'neutral'">{{ c.words.open + ' (' + c.size + ')' }}</button>
        <ng-template dsAlertDialogContent [title]="c.words.title" [description]="c.words.description">
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel>{{ c.words.cancel }}</button>
            <button dsButton dsAlertDialogAction [tone]="c.tone === 'danger' ? 'danger' : 'accent'" emphasis="solid">{{ c.words.action }}</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- Order M9.6: an alert with one field. Focus opens on the field; Return runs the default action once it has a value. -->
    <ng-template #folderAlert let-t let-trigger="trigger" let-long="long" let-name="name">
      <ng-container dsAlertDialog (openChange)="$event && name.set('')">
        <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
        <ng-template dsAlertDialogContent [icon]="false"
          [title]="long ? 'مجلد جديد للوحات إطلاق الربيع وكل ملفات الحملة المرفقة فيها' : t.title"
          [description]="long ? sample.ar.long : t.description">
          <fieldset dsAlertDialogBody [legend]="t.legend">
            <div dsField [label]="t.name">
              <div dsInput variant="plain" clearable [value]="name()" (valueChange)="name.set($event ?? '')" [placeholder]="t.placeholder"></div>
            </div>
          </fieldset>
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel wrap>{{ t.cancel }}</button>
            <button dsButton dsAlertDialogAction primary requiresValue wrap>{{ long ? 'إنشاء المجلد ونقل اللوحات له' : t.action }}</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

    <!-- The action runs: the alert stays open, Escape does nothing, the action Button shows loading. -->
    <ng-template #loadingAlert let-r>
      <ng-container dsAlertDialog tone="danger" [open]="r.open()" (openChange)="setRunOpen(r, $event)" [dismissible]="!r.busy()">
        <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="r.fail ? 'error' : 'loading'" tone="danger">{{ r.fail ? 'Delete the team' : 'Delete the project' }}</button>
        <ng-template dsAlertDialogContent [title]="r.fail ? 'Delete the team Design?' : 'Delete the project Spring launch?'" [description]="runDescription">
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel [disabled]="r.busy()">{{ r.fail ? 'Keep team' : 'Keep project' }}</button>
            <button dsButton dsAlertDialogAction tone="danger" emphasis="solid" [loading]="r.busy()" loadingLabel="Deleting" (click)="run(r, $event)">
              {{ r.fail ? (r.failed() ? 'Delete team again' : 'Delete team') : 'Delete project' }}
            </button>
          </div>
        </ng-template>
        <ng-template #runDescription>{{ r.fail ? 'The team and every board in it are deleted for good.' : 'Every board in it is deleted for good. This cannot be undone.' }}<span role="alert">{{ r.failed() ? ' Could not delete the team. Check your connection, then try again.' : '' }}</span></ng-template>
      </ng-container>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Sizes sm and md, tones neutral and danger: focus opens on the cancel action">
      <div data-demo="row">
        @for (c of toneCases; track c.size + c.tone) {
          <ng-container [ngTemplateOutlet]="toneAlert" [ngTemplateOutletContext]="{ $implicit: c }" />
        }
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arabicAlert let-trigger let-long="long">
          <ng-container dsAlertDialog tone="danger">
            <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="trigger" tone="danger">حذف اللوحة</button>
            <ng-template dsAlertDialogContent
              [title]="long ? 'تبي تحذف لوحة إطلاق الربيع مع كل الإطارات والتعليقات والملفات المرفقة فيها؟' : 'تبي تحذف لوحة إطلاق الربيع؟'"
              [description]="long ? sample.ar.long : 'بتنحذف 12 إطار وكل التعليقات، وما تقدر ترجعها بعدين.'">
              <div dsAlertDialogFooter>
                <button dsButton dsAlertDialogCancel wrap>إبقاء اللوحة</button>
                <button dsButton dsAlertDialogAction wrap tone="danger" emphasis="solid">{{ long ? 'حذف اللوحة وكل ملفاتها نهائيا' : 'حذف اللوحة' }}</button>
              </div>
            </ng-template>
          </ng-container>
        </ng-template>
        <div data-demo="row" label="عربي">
          <ng-container [ngTemplateOutlet]="arabicAlert" [ngTemplateOutletContext]="{ $implicit: 'arabic', long: false }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="fields" heading="Fields and the default action: focus opens on the first field, Return runs the default action">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="folderAlert" [ngTemplateOutletContext]="{ $implicit: fieldsCopy.en, trigger: 'one-field', long: false, name: folderName }" />
        <!-- Order M9.6: an alert with two fields, the first required. -->
        <ng-container dsAlertDialog>
          <button dsButton dsAlertDialogTrigger data-demo-trigger="two-fields">Add a link</button>
          <ng-template dsAlertDialogContent [icon]="false" title="Add a link" description="The link shows on the board as a card.">
            <fieldset dsAlertDialogBody legend="Link details">
              <div dsField label="Address"><div dsInput variant="plain" clearable type="url" placeholder="https://example.com"></div></div>
              <div dsField label="Title"><div dsInput variant="plain" clearable placeholder="Shown on the card"></div></div>
            </fieldset>
            <div dsAlertDialogFooter>
              <button dsButton dsAlertDialogCancel>Cancel</button>
              <button dsButton dsAlertDialogAction primary requiresValue>Add link</button>
            </div>
          </ng-template>
        </ng-container>
        <!-- Order M9.6: a default action with no fields. Focus still opens on Cancel. -->
        <ng-container dsAlertDialog>
          <button dsButton dsAlertDialogTrigger data-demo-trigger="default-action">Share with the team</button>
          <ng-template dsAlertDialogContent [icon]="false" title="Share Spring launch with the team?" description="All 8 members can see and comment on it.">
            <div dsAlertDialogFooter>
              <button dsButton dsAlertDialogCancel>Cancel</button>
              <button dsButton dsAlertDialogAction primary>Share board</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <!-- Declared inside the Arabic theme, so the portal copies it. -->
        <ng-template #folderArabic let-t let-trigger="trigger" let-long="long" let-name="name">
      <ng-container dsAlertDialog (openChange)="$event && name.set('')">
        <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
        <ng-template dsAlertDialogContent [icon]="false"
          [title]="long ? 'مجلد جديد للوحات إطلاق الربيع وكل ملفات الحملة المرفقة فيها' : t.title"
          [description]="long ? sample.ar.long : t.description">
          <fieldset dsAlertDialogBody [legend]="t.legend">
            <div dsField [label]="t.name">
              <div dsInput variant="plain" clearable [value]="name()" (valueChange)="name.set($event ?? '')" [placeholder]="t.placeholder"></div>
            </div>
          </fieldset>
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel wrap>{{ t.cancel }}</button>
            <button dsButton dsAlertDialogAction primary requiresValue wrap>{{ long ? 'إنشاء المجلد ونقل اللوحات له' : t.action }}</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

        <div data-demo="row" label="عربي">
          <ng-container [ngTemplateOutlet]="folderArabic" [ngTemplateOutletContext]="{ $implicit: fieldsCopy.ar, trigger: 'fields-arabic', long: false, name: folderNameArabic }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One question with the title and description as inputs, no icon">
      <div data-demo="row">
        <ng-container dsAlertDialog tone="danger">
          <button dsButton dsAlertDialogTrigger data-demo-trigger="one" tone="danger">Remove member</button>
          <ng-template dsAlertDialogContent [icon]="false" title="Remove Sara Ahmed from the team?" description="They lose access to every board of the team at once.">
            <div dsAlertDialogFooter>
              <button dsButton dsAlertDialogCancel>Keep member</button>
              <button dsButton dsAlertDialogAction tone="danger" emphasis="solid">Remove member</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long title, description and labels: they wrap">
      <div data-demo="row">
        <ng-container dsAlertDialog tone="danger" size="sm">
          <button dsButton dsAlertDialogTrigger data-demo-trigger="long-text" tone="danger">Delete the workspace</button>
          <ng-template dsAlertDialogContent title="Delete the workspace Northwind design and research archive with every board in it?" [description]="sample.en.long">
            <div dsAlertDialogFooter>
              <button dsButton dsAlertDialogCancel wrap>Keep the workspace and every board</button>
              <button dsButton dsAlertDialogAction wrap tone="danger" emphasis="solid">Delete the workspace for good</button>
            </div>
          </ng-template>
        </ng-container>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <ng-template #arabicLong let-trigger let-long="long">
          <ng-container dsAlertDialog tone="danger">
            <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="trigger" tone="danger">حذف اللوحة</button>
            <ng-template dsAlertDialogContent title="تبي تحذف لوحة إطلاق الربيع مع كل الإطارات والتعليقات والملفات المرفقة فيها؟" [description]="sample.ar.long">
              <div dsAlertDialogFooter>
                <button dsButton dsAlertDialogCancel wrap>إبقاء اللوحة</button>
                <button dsButton dsAlertDialogAction wrap tone="danger" emphasis="solid">حذف اللوحة وكل ملفاتها نهائيا</button>
              </div>
            </ng-template>
          </ng-container>
        </ng-template>
    <ng-template #folderLong let-t let-trigger="trigger" let-long="long" let-name="name">
      <ng-container dsAlertDialog (openChange)="$event && name.set('')">
        <button dsButton dsAlertDialogTrigger [attr.data-demo-trigger]="trigger">{{ t.open }}</button>
        <ng-template dsAlertDialogContent [icon]="false"
          [title]="long ? 'مجلد جديد للوحات إطلاق الربيع وكل ملفات الحملة المرفقة فيها' : t.title"
          [description]="long ? sample.ar.long : t.description">
          <fieldset dsAlertDialogBody [legend]="t.legend">
            <div dsField [label]="t.name">
              <div dsInput variant="plain" clearable [value]="name()" (valueChange)="name.set($event ?? '')" [placeholder]="t.placeholder"></div>
            </div>
          </fieldset>
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel wrap>{{ t.cancel }}</button>
            <button dsButton dsAlertDialogAction primary requiresValue wrap>{{ long ? 'إنشاء المجلد ونقل اللوحات له' : t.action }}</button>
          </div>
        </ng-template>
      </ng-container>
    </ng-template>

        <div data-demo="row">
          <ng-container [ngTemplateOutlet]="arabicLong" [ngTemplateOutletContext]="{ $implicit: 'long-arabic' }" />
          <ng-container [ngTemplateOutlet]="folderLong" [ngTemplateOutletContext]="{ $implicit: fieldsCopy.ar, trigger: 'long-arabic-fields', long: true, name: folderNameLong }" />
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the action runs, the alert stays and Escape waits">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="loadingAlert" [ngTemplateOutletContext]="{ $implicit: loading }" />
      </div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: the action fails, the alert stays and says why">
      <div data-demo="row">
        <ng-container [ngTemplateOutlet]="loadingAlert" [ngTemplateOutletContext]="{ $implicit: failing }" />
      </div>
    </section>
  `,
})
export default class AlertDialogDemo {
  protected readonly toneCases = toneCases;
  protected readonly fieldsCopy = fieldsCopy;
  protected readonly sample = sample;
  protected readonly folderName = signal('');
  protected readonly folderNameArabic = signal('');
  protected readonly folderNameLong = signal('');
  protected readonly loading = new Run(false);
  protected readonly failing = new Run(true);
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const t of this.timers) clearTimeout(t);
    });
  }

  protected setRunOpen(r: Run, open: boolean): void {
    r.open.set(open);
    if (!open) r.failed.set(false);
  }

  protected run(r: Run, event: MouseEvent): void {
    event.preventDefault();
    r.busy.set(true);
    r.failed.set(false);
    const t = setTimeout(() => {
      this.timers.delete(t);
      r.busy.set(false);
      if (r.fail) r.failed.set(true);
      else r.open.set(false);
    }, 2000);
    this.timers.add(t);
  }
}
