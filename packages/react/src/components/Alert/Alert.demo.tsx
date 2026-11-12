// Alert demo. One section per content case. The variants case shows every
// tone in each emphasis, both sizes, and an Arabic row. The error case
// mounts a live danger alert after load, the way a form error summary or a
// failed sync shows up.
import { useState } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Alert, type AlertEmphasis, type AlertTone } from './index';

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

/** An alert that leaves when its close button is pressed, and a button to bring it back. */
function Dismissible() {
  const [open, setOpen] = useState(true);
  return open ? (
    <Alert tone="info" title={copy.info.title} onClose={() => setOpen(false)}>
      {copy.info.body}
    </Alert>
  ) : (
    <Button size="sm" emphasis="ghost" onClick={() => setOpen(true)}>
      Show alert again
    </Button>
  );
}

/** Mounts a danger alert after load: role alert, read at once. */
function LiveError() {
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  return (
    <>
      <DemoRow>
        <Button onClick={() => setFailed(true)}>Sync files</Button>
      </DemoRow>
      {failed && (
        <Alert
          live
          tone="danger"
          title={copy.danger.title}
          onClose={() => setFailed(false)}
          actions={
            <Button
              size="sm"
              tone="danger"
              emphasis="outline"
              loading={retrying}
              loadingLabel="Retrying sync"
              onClick={() => {
                setRetrying(true);
                window.setTimeout(() => {
                  setRetrying(false);
                  setFailed(false);
                }, 1500);
              }}
            >
              Retry sync
            </Button>
          }
        >
          {copy.danger.body}
        </Alert>
      )}
    </>
  );
}

export default function AlertDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: six tones in soft, outline and solid, two sizes, and Arabic">
        {emphases.map((emphasis) => (
          <DemoGrid key={emphasis} min="18rem">
            {tones.map((tone) => (
              <Alert key={tone} tone={tone} emphasis={emphasis} title={copy[tone].title}>
                {copy[tone].body}
              </Alert>
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="18rem">
          <Alert size="sm" tone="warning" title={copy.warning.title}>
            {copy.warning.body}
          </Alert>
          <Alert size="md" tone="warning" title={copy.warning.title}>
            {copy.warning.body}
          </Alert>
        </DemoGrid>
        <DemoGrid min="18rem">
          <Alert
            tone="danger"
            emphasis="solid"
            title={copy.danger.title}
            onClose={() => undefined}
            actions={
              <>
                <Button size="sm">Retry sync</Button>
                <Button size="sm" emphasis="ghost">
                  Open files
                </Button>
              </>
            }
          >
            {copy.danger.body}
          </Alert>
          <Alert
            tone="warning"
            emphasis="outline"
            title={copy.warning.title}
            onClose={() => undefined}
            actions={<Button size="sm" emphasis="outline">Manage storage</Button>}
          >
            {copy.warning.body}
          </Alert>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="18rem">
            {(['info', 'warning', 'danger'] as const).map((tone) => (
              <Alert key={tone} tone={tone} title={copyAr[tone].title} onClose={() => undefined}>
                {copyAr[tone].body}
              </Alert>
            ))}
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a title and no body">
        <Alert tone="success" title="All files synced" />
      </DemoCase>

      <DemoCase id="one" title="One alert with a close button">
        <Dismissible />
      </DemoCase>

      <DemoCase id="many" title="Many: a form error summary with a list">
        <Alert tone="danger" title="Fix 3 fields to save the board">
          <ul>
            {errors.slice(0, 3).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve errors, the list wraps in full">
        <Alert tone="danger" title="Fix 12 fields to save the board">
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the box grows and the text wraps">
        <Alert
          tone="warning"
          title="Some references on the board Spring campaign moodboard for the retail launch could not be loaded"
          onClose={() => undefined}
          actions={<Button size="sm" emphasis="outline">Upload copies</Button>}
        >
          <p>{sample.en.long}</p>
          <p>{sample.en.word}</p>
        </Alert>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Alert
          tone="danger"
          title="تعذر نشر الصفحة لأن بعض الصور في اللوحة ما تحملت"
          onClose={() => undefined}
          actions={<Button size="sm" emphasis="outline">إعادة النشر</Button>}
        >
          {sample.ar.long}
        </Alert>
        <Alert tone="info" emphasis="outline" title={copyAr.info.title}>
          {copyAr.info.body}
        </Alert>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the action shows its progress, the alert stays">
        <Alert
          tone="info"
          title="Sync paused while you are offline"
          actions={
            <Button size="sm" emphasis="outline" loading loadingLabel="Reconnecting">
              Reconnect now
            </Button>
          }
        >
          {copy.info.body}
        </Alert>
      </DemoCase>

      <DemoCase id="error" title="Error: a live danger alert mounted after load">
        <LiveError />
      </DemoCase>
    </DemoPage>
  );
}
