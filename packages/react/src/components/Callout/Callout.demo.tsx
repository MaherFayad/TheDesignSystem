// Callout demo. One section per content case. The variants case shows every
// tone in soft and outline, a callout without a title, an aside, and an
// Arabic row. A callout is static, so there is no loading or error case.
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Callout, type CalloutEmphasis, type CalloutTone } from './index';

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

export default function CalloutDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: six tones in soft and outline, an aside, and Arabic">
        {emphases.map((emphasis) => (
          <DemoGrid key={emphasis} min="18rem">
            {tones.map((tone) => (
              <Callout key={tone} tone={tone} emphasis={emphasis} title={copy[tone].title}>
                {copy[tone].body}
              </Callout>
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="18rem">
          <Callout tone="accent" as="aside" title="Related: share a board">
            Invite people by email, or copy a link that opens the board for viewing.
          </Callout>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="18rem">
            {(['accent', 'warning', 'danger'] as const).map((tone) => (
              <Callout key={tone} tone={tone} title={copyAr[tone].title}>
                {copyAr[tone].body}
              </Callout>
            ))}
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a body and no title, named by the tone word">
        <Callout tone="accent">
          Press <code>/</code> to search every board.
        </Callout>
      </DemoCase>

      <DemoCase id="one" title="One callout in running text">
        <p>Boards are shared with the whole team by default.</p>
        <Callout tone="info" title={copy.info.title}>
          {copy.info.body}
        </Callout>
        <p>Change who can edit from the share menu.</p>
      </DemoCase>

      <DemoCase id="many" title="Many: a short list of steps">
        <Callout tone="neutral" title="Export a board">
          <ol>
            {steps.slice(0, 3).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Callout>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve steps, the list wraps in full">
        <Callout tone="neutral" emphasis="outline" title="Export a board for print">
          <ol>
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </Callout>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the box grows and the text wraps">
        <Callout tone="warning" title="Some references on the board Spring campaign moodboard for the retail launch come from sites that block hotlinking">
          <p>{sample.en.long}</p>
          <p>{sample.en.word}</p>
        </Callout>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Callout tone="accent" title="نصيحة لمشاركة الملفات مع الفريق">
          {sample.ar.long}
        </Callout>
        <Callout tone="info" emphasis="outline">
          {copyAr.info.body}
        </Callout>
      </DemoCase>
    </DemoPage>
  );
}
