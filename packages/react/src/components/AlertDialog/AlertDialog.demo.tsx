import { useState, type MouseEvent } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogSize,
  type AlertDialogTone,
} from './index';

const sizes: AlertDialogSize[] = ['sm', 'md'];
const tones: AlertDialogTone[] = ['neutral', 'danger'];

const copy = {
  neutral: {
    open: 'Leave the board',
    title: 'Leave the board Spring launch?',
    description: 'You lose access right away. An owner has to invite you again.',
    cancel: 'Stay on board',
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

/** One question per size and tone. Focus opens on the cancel action. */
function ToneAlert({ size, tone }: { size: AlertDialogSize; tone: AlertDialogTone }) {
  const words = copy[tone];
  return (
    <AlertDialog size={size} tone={tone}>
      <AlertDialogTrigger>
        <Button data-demo-trigger={`${size}-${tone}`} tone={tone === 'danger' ? 'danger' : 'neutral'}>
          {`${words.open} (${size})`}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{words.title}</AlertDialogTitle>
        <AlertDialogDescription>{words.description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button>{words.cancel}</Button>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Button tone={tone === 'danger' ? 'danger' : 'accent'} emphasis="solid">
              {words.action}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ArabicAlert({ trigger, long = false }: { trigger: string; long?: boolean }) {
  return (
    <AlertDialog tone="danger">
      <AlertDialogTrigger>
        <Button data-demo-trigger={trigger} tone="danger">
          حذف اللوحة
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{long ? 'تبي تحذف لوحة إطلاق الربيع مع كل الإطارات والتعليقات والملفات المرفقة فيها؟' : 'تبي تحذف لوحة إطلاق الربيع؟'}</AlertDialogTitle>
        <AlertDialogDescription>
          {long ? sample.ar.long : 'بتنحذف 12 إطار وكل التعليقات، وما تقدر ترجعها بعدين.'}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button wrap>إبقاء اللوحة</Button>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Button wrap tone="danger" emphasis="solid">
              {long ? 'حذف اللوحة وكل ملفاتها نهائيا' : 'حذف اللوحة'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The action runs: the alert stays open, Escape does nothing, the action Button shows loading. */
function LoadingAlert({ fail = false }: { fail?: boolean }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const run = (event: MouseEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailed(false);
    window.setTimeout(() => {
      setBusy(false);
      if (fail) setFailed(true);
      else setOpen(false);
    }, 2000);
  };
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFailed(false);
      }}
      tone="danger"
      dismissible={!busy}
    >
      <AlertDialogTrigger>
        <Button data-demo-trigger={fail ? 'error' : 'loading'} tone="danger">
          {fail ? 'Delete the team' : 'Delete the project'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{fail ? 'Delete the team Design?' : 'Delete the project Spring launch?'}</AlertDialogTitle>
        <AlertDialogDescription role={failed ? 'alert' : undefined}>
          {failed
            ? 'Could not delete the team. Check your connection, then try again.'
            : 'Every board in it is deleted for good. This cannot be undone.'}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button disabled={busy}>{fail ? 'Keep team' : 'Keep project'}</Button>
          </AlertDialogCancel>
          <AlertDialogAction onClick={run}>
            <Button tone="danger" emphasis="solid" loading={busy} loadingLabel="Deleting">
              {fail ? (failed ? 'Delete team again' : 'Delete team') : 'Delete project'}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AlertDialogDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm and md, tones neutral and danger: focus opens on the cancel action" lang="en">
        <DemoRow>
          {tones.flatMap((tone) => sizes.map((size) => <ToneAlert key={`${size}-${tone}`} size={size} tone={tone} />))}
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <ArabicAlert trigger="arabic" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One question with the title and description as props, no icon" lang="en">
        <DemoRow>
          <AlertDialog tone="danger">
            <AlertDialogTrigger>
              <Button data-demo-trigger="one" tone="danger">
                Remove member
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent icon={false} title="Remove Sara Ahmed from the team?" description="They lose access to every board of the team at once.">
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Button>Keep member</Button>
                </AlertDialogCancel>
                <AlertDialogAction>
                  <Button tone="danger" emphasis="solid">
                    Remove member
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, description and labels: they wrap" lang="en">
        <DemoRow>
          <AlertDialog tone="danger" size="sm">
            <AlertDialogTrigger>
              <Button data-demo-trigger="long-text" tone="danger">
                Delete the workspace
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete the workspace Northwind design and research archive with every board in it?</AlertDialogTitle>
              <AlertDialogDescription>{sample.en.long}</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  <Button wrap>Keep the workspace and every board</Button>
                </AlertDialogCancel>
                <AlertDialogAction>
                  <Button wrap tone="danger" emphasis="solid">
                    Delete the workspace for good
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ArabicAlert trigger="long-arabic" long />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the action runs, the alert stays and Escape waits" lang="en">
        <DemoRow>
          <LoadingAlert />
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the action fails, the alert stays and says why" lang="en">
        <DemoRow>
          <LoadingAlert fail />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
