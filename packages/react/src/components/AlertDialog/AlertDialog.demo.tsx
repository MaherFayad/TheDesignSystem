import { useState, type MouseEvent } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { Input } from '../Input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
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
        <AlertDialogDescription>
          {fail ? 'The team and every board in it are deleted for good.' : 'Every board in it is deleted for good. This cannot be undone.'}
          {/* The live region is in place from the start, so the error is announced when it fills. */}
          <span role="alert">{failed ? ' Could not delete the team. Check your connection, then try again.' : ''}</span>
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

const fieldsCopy = {
  en: {
    folder: {
      open: 'New folder',
      title: 'New folder',
      description: 'Name the folder for the 4 boards you picked.',
      legend: 'Folder details',
      name: 'Name',
      placeholder: 'For example, spring launch',
      cancel: 'Cancel',
      action: 'Create folder',
    },
  },
  ar: {
    folder: {
      open: 'مجلد جديد',
      title: 'مجلد جديد',
      description: 'اكتب اسم المجلد للوحات الأربع اللي اخترتها.',
      legend: 'بيانات المجلد',
      name: 'الاسم',
      placeholder: 'مثلا، إطلاق الربيع',
      cancel: 'إلغاء',
      action: 'إنشاء المجلد',
    },
  },
} as const;

/** Order M9.6: an alert with one field. Focus opens on the field; Return runs the default action once it has a value. */
function FolderAlert({ lang, trigger, long = false }: { lang: 'en' | 'ar'; trigger: string; long?: boolean }) {
  const t = fieldsCopy[lang].folder;
  const [name, setName] = useState('');
  return (
    <AlertDialog onOpenChange={(next) => (next ? setName('') : undefined)}>
      <AlertDialogTrigger>
        <Button data-demo-trigger={trigger}>{t.open}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        icon={false}
        title={long && lang === 'ar' ? 'مجلد جديد للوحات إطلاق الربيع وكل ملفات الحملة المرفقة فيها' : t.title}
        description={long && lang === 'ar' ? sample.ar.long : t.description}
      >
        <AlertDialogBody legend={t.legend}>
          <Field label={t.name}>
            <Input variant="plain" clearable value={name} onChange={(event) => setName(event.target.value)} placeholder={t.placeholder} />
          </Field>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button wrap>{t.cancel}</Button>
          </AlertDialogCancel>
          <AlertDialogAction primary requiresValue>
            <Button wrap>{long && lang === 'ar' ? 'إنشاء المجلد ونقل اللوحات له' : t.action}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Order M9.6: an alert with two fields, the first required. */
function LinkAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button data-demo-trigger="two-fields">Add a link</Button>
      </AlertDialogTrigger>
      <AlertDialogContent icon={false} title="Add a link" description="The link shows on the board as a card.">
        <AlertDialogBody legend="Link details">
          <Field label="Address">
            <Input variant="plain" clearable type="url" inputMode="url" autoComplete="url" placeholder="https://example.com" />
          </Field>
          <Field label="Title">
            <Input variant="plain" clearable placeholder="Shown on the card" />
          </Field>
        </AlertDialogBody>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction primary requiresValue>
            <Button>Add link</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Order M9.6: a default action with no fields. Focus still opens on Cancel. */
function DefaultActionAlert() {
  return (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button data-demo-trigger="default-action">Share with the team</Button>
      </AlertDialogTrigger>
      <AlertDialogContent icon={false} title="Share Spring launch with the team?" description="All 8 members can see and comment on it.">
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button>Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction primary>
            <Button>Share board</Button>
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

      <DemoCase id="fields" title="Fields and the default action: focus opens on the first field, Return runs the default action" lang="en">
        <DemoRow>
          <FolderAlert lang="en" trigger="one-field" />
          <LinkAlert />
          <DefaultActionAlert />
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <FolderAlert lang="ar" trigger="fields-arabic" />
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
          <FolderAlert lang="ar" trigger="long-arabic-fields" long />
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
