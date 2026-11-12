// Callout demo: the same cases, ids and copy as
// packages/react/src/components/Callout/Callout.demo.tsx.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEMO, sample } from '../../demo/demo';
import { DsTheme } from '../../theme/theme';
import { DsCallout, type CalloutEmphasis, type CalloutTone } from './callout';

const tones: CalloutTone[] = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];
const emphases: CalloutEmphasis[] = ['soft', 'outline'];

const copy: Record<CalloutTone, { title: string; body: string }> = {
  neutral: { title: 'Boards keep their history', body: 'Every change is kept for 30 days, so you can go back to an earlier version.' },
  accent: { title: 'Move faster with the keyboard', body: 'Press the slash key to search every board from anywhere.' },
  info: { title: 'Shared boards follow the team plan', body: 'Storage on a shared board counts toward the team, not you.' },
  success: { title: 'Works offline', body: 'Edits made offline sync the next time you connect.' },
  warning: { title: 'Large files slow the board', body: 'Images over 20 MB load slowly on phones. Resize them first.' },
  danger: { title: 'Deleting a team deletes its boards', body: 'Move the boards you want to keep to another team first.' },
};

const copyAr: Record<CalloutTone, { title: string; body: string }> = {
  neutral: { title: 'اللوحات تحفظ سجل التعديلات', body: 'كل تعديل ينحفظ 30 يوم، وتقدر ترجع لأي نسخة قبلها.' },
  accent: { title: 'اختصارات لوحة المفاتيح', body: 'اضغط زر الشرطة المائلة عشان تبحث في كل اللوحات من أي مكان.' },
  info: { title: 'اللوحات المشتركة تتبع باقة الفريق', body: 'مساحة اللوحة المشتركة تنحسب على الفريق، مو عليك.' },
  success: { title: 'العمل بدون اتصال', body: 'التعديلات اللي تسويها بدون اتصال تتزامن أول ما يرجع الاتصال.' },
  warning: { title: 'الملفات الكبيرة تبطئ اللوحة', body: 'الصور اللي فوق 20 ميجابايت تتحمل ببطء في الجوال، صغرها قبل الرفع.' },
  danger: { title: 'حذف الفريق يحذف لوحاته', body: 'انقل اللوحات اللي تبيها لفريق ثاني قبل الحذف.' },
};

const steps = [
  'Open the board menu',
  'Choose Export',
  'Pick PDF or PNG',
  'Set the page size',
  'Choose which frames to include',
  'Turn on bleed if you print',
  'Name the file',
  'Pick a folder',
  'Choose a color profile',
  'Set the resolution',
  'Add a password if needed',
  'Select Export board',
];

const GRID = 'grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));';

@Component({
  selector: 'div[data-demo=page]',
  imports: [DEMO, DsCallout, DsTheme],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section data-demo="case" data-demo-case="variants" heading="Variants: six tones in soft and outline, an aside, and Arabic">
      @for (emphasis of emphases; track emphasis) {
        <div data-demo="grid" style="${GRID}">
          @for (tone of tones; track tone) {
            <div dsCallout [tone]="tone" [emphasis]="emphasis" [title]="copy[tone].title">{{ copy[tone].body }}</div>
          }
        </div>
      }
      <div data-demo="grid" style="${GRID}">
        <aside dsCallout tone="accent" [title]="'Related: share a board'">Invite people by email, or copy a link that opens the board for viewing.</aside>
      </div>
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div data-demo="grid" style="${GRID}">
          @for (tone of arTones; track tone) {
            <div dsCallout [tone]="tone" [title]="copyAr[tone].title">{{ copyAr[tone].body }}</div>
          }
        </div>
      </div>
    </section>

    <section data-demo="case" data-demo-case="empty" heading="Empty: a body and no title, named by the tone word">
      <div dsCallout tone="accent">Press <code>/</code> to search every board.</div>
    </section>

    <section data-demo="case" data-demo-case="one" heading="One callout in running text">
      <p>Boards are shared with the whole team by default.</p>
      <div dsCallout tone="info" [title]="copy.info.title">{{ copy.info.body }}</div>
      <p>Change who can edit from the share menu.</p>
    </section>

    <section data-demo="case" data-demo-case="many" heading="Many: a short list of steps">
      <div dsCallout tone="neutral" [title]="'Export a board'">
        <ol>
          @for (s of steps.slice(0, 3); track s) {
            <li>{{ s }}</li>
          }
        </ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="too-many" heading="Too many: twelve steps, the list wraps in full">
      <div dsCallout tone="neutral" emphasis="outline" [title]="'Export a board for print'">
        <ol>
          @for (s of steps; track s) {
            <li>{{ s }}</li>
          }
        </ol>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-text" heading="Long text: the box grows and the text wraps">
      <div dsCallout tone="warning" [title]="'Some references on the board Spring campaign moodboard for the retail launch come from sites that block hotlinking'">
        <p>{{ sample.en.long }}</p>
        <p>{{ sample.en.word }}</p>
      </div>
    </section>

    <section data-demo="case" data-demo-case="long-arabic" heading="Long Arabic text">
      <div dsTheme [lang]="'ar'" data-demo="content">
        <div dsCallout tone="accent" [title]="'نصيحة لمشاركة الملفات مع الفريق'">{{ sample.ar.long }}</div>
        <div dsCallout tone="info" emphasis="outline">{{ copyAr.info.body }}</div>
      </div>
    </section>
  `,
})
export default class CalloutDemo {
  protected readonly tones = tones;
  protected readonly arTones = ['accent', 'warning', 'danger'] as const;
  protected readonly emphases = emphases;
  protected readonly copy = copy;
  protected readonly copyAr = copyAr;
  protected readonly steps = steps;
  protected readonly sample = sample;
}
