// Alert demo: the same cases, ids and copy as
// packages/react/src/components/Alert/Alert.demo.tsx. The error case mounts
// a live danger alert after load.
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsAlert, type AlertEmphasis, type AlertTone } from './alert';

const tones: AlertTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];
const emphases: AlertEmphasis[] = ['soft', 'outline', 'solid'];

const copy: Record<AlertTone, { title: string; body: string }> = {
  neutral: { title: 'Board shared with your team', body: 'Everyone on the team can open and comment.' },
  accent: { title: 'New layout for your boards', body: 'Columns now keep their width when you resize the window.' },
  info: { title: 'Sync paused while you are offline', body: 'Your edits are kept on this device until you reconnect.' },
  success: { title: 'All files synced', body: 'The last change was saved a moment ago.' },
  warning: { title: 'Storage almost full', body: 'You have 200 MB left on this plan.' },
  danger: { title: 'Could not sync 3 files', body: 'The server did not answer. Your local copies are safe.' },
};

const copyAr: Record<AlertTone, { title: string; body: string }> = {
  neutral: { title: 'اللوحة مشتركة مع الفريق', body: 'كل أعضاء الفريق يقدرون يفتحونها ويعلقون عليها.' },
  accent: { title: 'تصميم جديد للوحات', body: 'الأعمدة الحين تحافظ على عرضها لما تغير حجم النافذة.' },
  info: { title: 'المزامنة متوقفة بدون اتصال', body: 'تعديلاتك محفوظة في الجهاز لين يرجع الاتصال.' },
  success: { title: 'كل الملفات متزامنة', body: 'آخر تعديل انحفظ قبل شوي.' },
  warning: { title: 'المساحة قربت تخلص', body: 'باقي لك 200 ميجابايت في هذي الباقة.' },
  danger: { title: 'تعذر مزامنة 3 ملفات', body: 'الخادم ما رد على الطلب، والنسخ المحلية محفوظة.' },
};

const errors = [
  'Enter a board name',
  'Pick a team to share with',
  'Add at least one column',
  'Choose a start date that is today or later',
  'Pick an end date after the start date',
  'Enter a budget in whole riyals',
  'Choose who can edit',
  'Add a cover image under 5 MB',
  'Enter a description of 20 words or more',
  'Pick a time zone',
  'Choose a review cycle',
  'Add an owner for each column',
];

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsAlert, DsButton, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #retryOpen><button dsButton size="sm">Retry sync</button><button dsButton size="sm" emphasis="ghost">Open files</button></ng-template>
    <ng-template #manage><button dsButton size="sm" emphasis="outline">Manage storage</button></ng-template>
    <ng-template #upload><button dsButton size="sm" emphasis="outline">Upload copies</button></ng-template>
    <ng-template #republish><button dsButton size="sm" emphasis="outline">إعادة النشر</button></ng-template>
    <ng-template #reconnect><button dsButton size="sm" emphasis="outline" loading loadingLabel="Reconnecting">Reconnect now</button></ng-template>
    <ng-template #retryLive>
      <button dsButton size="sm" tone="danger" emphasis="outline" [loading]="retrying()" loadingLabel="Retrying sync" (click)="retry()">Retry sync</button>
    </ng-template>

    <section data-demo="case" data-demo-case="variants" heading="Variants: six tones in soft, outline and solid, two sizes, and Arabic">
      @for (emphasis of emphases; track emphasis) {
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          @for (tone of tones; track tone) {
            <div dsAlert [tone]="tone" [emphasis]="emphasis" [title]="copy[tone].title">{{ copy[tone].body }}</div>
          }
        </div>
      }
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
        <div dsAlert size="sm" tone="warning" [title]="copy.warning.title">{{ copy.warning.body }}</div>
        <div dsAlert size="md" tone="warning" [title]="copy.warning.title">{{ copy.warning.body }}</div>
      </div>
      <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
        <div dsAlert tone="danger" emphasis="solid" [title]="copy.danger.title" [onClose]="noop" [actions]="retryOpen">{{ copy.danger.body }}</div>
        <div dsAlert tone="warning" emphasis="outline" [title]="copy.warning.title" [onClose]="noop" [actions]="manage">{{ copy.warning.body }}</div>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="grid" style="grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));">
          @for (tone of arTones; track tone) {
            <div dsAlert [tone]="tone" [title]="copyAr[tone].title" [onClose]="noop">{{ copyAr[tone].body }}</div>
          }
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: a title and no body">
      <div dsAlert tone="success" [title]="'All files synced'"></div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One alert with a close button">
      @if (open()) {
        <div dsAlert tone="info" [title]="copy.info.title" [onClose]="dismiss">{{ copy.info.body }}</div>
      } @else {
        <button dsButton size="sm" emphasis="ghost" (click)="open.set(true)">Show alert again</button>
      }
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: a form error summary with a list">
      <div dsAlert tone="danger" [title]="'Fix 3 fields to save the board'">
        <ul>
          @for (e of errors.slice(0, 3); track e) {
            <li>{{ e }}</li>
          }
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: twelve errors, the list wraps in full">
      <div dsAlert tone="danger" [title]="'Fix 12 fields to save the board'">
        <ul>
          @for (e of errors; track e) {
            <li>{{ e }}</li>
          }
        </ul>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: the box grows and the text wraps">
      <div
        dsAlert
        tone="warning"
        [title]="'Some references on the board Spring campaign moodboard for the retail launch could not be loaded'"
        [onClose]="noop"
        [actions]="upload"
      >
        <p>{{ sample.en.long }}</p>
        <p>{{ sample.en.word }}</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsAlert tone="danger" [title]="'تعذر نشر الصفحة لأن بعض الصور في اللوحة ما تحملت'" [onClose]="noop" [actions]="republish">{{ sample.ar.long }}</div>
        <div dsAlert tone="info" emphasis="outline" [title]="copyAr.info.title">{{ copyAr.info.body }}</div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="loading" heading="Loading: the action shows its progress, the alert stays">
      <div dsAlert tone="info" [title]="'Sync paused while you are offline'" [actions]="reconnect">{{ copy.info.body }}</div>
    </section>

    <section data-demo="case" data-demo-case="error" heading="Error: a live danger alert mounted after load">
      <div data-demo="row">
        <button dsButton (click)="failed.set(true)">Sync files</button>
      </div>
      @if (failed()) {
        <div dsAlert live tone="danger" [title]="copy.danger.title" [onClose]="clearFailed" [actions]="retryLive">{{ copy.danger.body }}</div>
      }
    </section>
  `,
})
export default class AlertDemo {
  protected readonly tones = tones;
  protected readonly arTones = ['info', 'warning', 'danger'] as const;
  protected readonly emphases = emphases;
  protected readonly copy = copy;
  protected readonly copyAr = copyAr;
  protected readonly errors = errors;
  protected readonly sample = sample;
  protected readonly open = signal(true);
  protected readonly failed = signal(false);
  protected readonly retrying = signal(false);
  protected readonly noop = () => undefined;
  protected readonly dismiss = () => this.open.set(false);
  protected readonly clearFailed = () => this.failed.set(false);

  protected retry(): void {
    this.retrying.set(true);
    window.setTimeout(() => {
      this.retrying.set(false);
      this.failed.set(false);
    }, 1500);
  }
}
