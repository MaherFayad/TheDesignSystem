import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Field } from '../Field';
import { Fieldset } from '../Fieldset';
import { Input } from '../Input';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetConfirm,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeaderAction,
  SheetTitle,
  SheetTrigger,
  type SheetProps,
  type SheetSize,
} from './index';

const sizes: SheetSize[] = ['sm', 'md', 'lg'];

/** Fields stack with one step of space. */
const stack = { display: 'grid', gap: 'var(--ds-space-l)' } as const;

/** A quick share task: the common sheet. */
function ShareSheet({ trigger, label, ...props }: SheetProps & { trigger: string; label: string }) {
  return (
    <Sheet {...props}>
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>{label}</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Share Spring launch</SheetTitle>
        <SheetDescription>People with the link can view the board.</SheetDescription>
        <SheetBody>
          <Field label="Invite by email">
            <Input placeholder="name@example.com" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button>Discard invite</Button>
          </SheetClose>
          <SheetClose>
            <Button tone="accent" emphasis="solid">
              Send invite
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ArabicSheet({ trigger, long = false }: { trigger: string; long?: boolean }) {
  return (
    <Sheet>
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>مشاركة اللوحة</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>{long ? 'مشاركة لوحة إطلاق الربيع مع فريق التصميم وكل المراجعين' : 'مشاركة اللوحة'}</SheetTitle>
        <SheetDescription>{long ? sample.ar.long : 'اللي عندهم الرابط يقدرون يشوفون اللوحة.'}</SheetDescription>
        <SheetBody>
          <Field label="الدعوة بالإيميل">
            <Input placeholder="name@example.com" />
          </Field>
        </SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button wrap>إغلاق المشاركة</Button>
          </SheetClose>
          <SheetClose>
            <Button wrap tone="accent" emphasis="solid">
              {long ? 'إرسال الدعوة لكل أعضاء الفريق' : 'إرسال الدعوة'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Send runs for two seconds: nothing dismisses the sheet until it ends. */
function BusySheet() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const send = () => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      setOpen(false);
    }, 2000);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen} dismissible={!busy} size="sm">
      <SheetTrigger>
        <Button data-demo-trigger="disabled">Send invites</Button>
      </SheetTrigger>
      <SheetContent title="Send 12 invites?" description="Each person gets an email with the link.">
        <SheetFooter>
          <SheetClose>
            <Button disabled={busy}>Discard invite</Button>
          </SheetClose>
          <Button tone="accent" emphasis="solid" loading={busy} loadingLabel="Sending invites" onClick={send}>
            Send invites
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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

/** Order M9.6: the confirm in the header at the inline end, off until the list has a name. */
function ConfirmSheet({ lang, trigger }: { lang: 'en' | 'ar'; trigger: string }) {
  const t = confirmCopy[lang];
  const [name, setName] = useState('');
  return (
    <Sheet size="lg" onOpenChange={(next) => (next ? setName('') : undefined)}>
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>{t.open}</Button>
      </SheetTrigger>
      <SheetContent title={t.title}>
        <SheetConfirm label={t.confirm} disabled={name.trim() === ''} />
        <SheetBody>
          <Fieldset variant="inset" legend={t.legend}>
            <Field label={t.name}>
              <Input variant="plain" clearable value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} />
            </Field>
            <Field label={t.note}>
              <Input variant="plain" clearable placeholder={t.notePlaceholder} />
            </Field>
          </Fieldset>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

const headerActionCopy = {
  en: { open: 'Pass details', title: 'Pass details', share: 'Share pass', confirm: 'Save changes', body: 'Seat 14, hall B. Doors open at 7:30 pm.' },
  ar: { open: 'تفاصيل البطاقة', title: 'تفاصيل البطاقة', share: 'مشاركة البطاقة', confirm: 'حفظ التغييرات', body: 'المقعد 14، القاعة ب. فتح الأبواب الساعة 7:30 مساء.' },
} as const;

/** Order C5: one more action in the header, between the close control and the confirm. */
function HeaderActionSheet({ lang, trigger }: { lang: 'en' | 'ar'; trigger: string }) {
  const t = headerActionCopy[lang];
  return (
    <Sheet size="md">
      <SheetTrigger>
        <Button data-demo-trigger={trigger}>{t.open}</Button>
      </SheetTrigger>
      <SheetContent title={t.title}>
        <SheetHeaderAction>
          <IconButton icon="share" label={t.share} />
        </SheetHeaderAction>
        <SheetConfirm label={t.confirm} />
        <SheetBody>
          <p>{t.body}</p>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

export default function SheetDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm, md and lg: drag the handle down, press Escape or the close control" lang="en">
        <DemoRow>
          {sizes.map((size) => (
            <ShareSheet key={size} size={size} trigger={size} label={`Open ${size} sheet`} />
          ))}
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <ArabicSheet trigger="arabic" />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: nothing to show yet" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="empty">Show recent files</Button>
            </SheetTrigger>
            <SheetContent title="Recent files">
              <SheetBody>
                <p>No recent files. Files you open show here.</p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One action" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="one">Duplicate board</Button>
            </SheetTrigger>
            <SheetContent title="Duplicate Spring launch?" description="The copy keeps every frame, without comments.">
              <SheetFooter>
                <SheetClose>
                  <Button tone="accent" emphasis="solid">
                    Duplicate board
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many fields: focus opens on the first one" lang="en">
        <DemoRow>
          <Sheet size="lg">
            <SheetTrigger>
              <Button data-demo-trigger="many">New board</Button>
            </SheetTrigger>
            <SheetContent title="Create a board" description="You can change every detail later.">
              <SheetBody>
                <div style={stack}>
                  {['Board name', 'Owner', 'Team', 'Due date', 'Tag'].map((name) => (
                    <Field key={name} label={name}>
                      <Input />
                    </Field>
                  ))}
                </div>
              </SheetBody>
              <SheetFooter>
                <SheetClose>
                  <Button>Discard board</Button>
                </SheetClose>
                <SheetClose>
                  <Button tone="accent" emphasis="solid">
                    Create board
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="too-many" title="Long content: the body scrolls, the header and the footer stay" lang="en">
        <DemoRow>
          <Sheet>
            <SheetTrigger>
              <Button data-demo-trigger="too-many">Show release notes</Button>
            </SheetTrigger>
            <SheetContent title="Release notes">
              <SheetBody>
                {Array.from({ length: 14 }, (_, i) => (
                  <p key={i}>{sample.en.long}</p>
                ))}
              </SheetBody>
              <SheetFooter>
                <SheetClose>
                  <Button>Close notes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long title, description and labels: they wrap" lang="en">
        <DemoRow>
          <Sheet>
            <SheetTrigger>
              <Button data-demo-trigger="long-text">Share the archive</Button>
            </SheetTrigger>
            <SheetContent title="Share the Northwind design and research archive with every reviewer on the team" description={sample.en.long}>
              <SheetFooter>
                <SheetClose>
                  <Button wrap>Keep the archive private for now</Button>
                </SheetClose>
                <SheetClose>
                  <Button wrap tone="accent" emphasis="solid">
                    Share the archive with every reviewer
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <ArabicSheet trigger="long-arabic" long />
        </DemoRow>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the body says so, and a drag or Escape still closes it" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="loading">Show comments</Button>
            </SheetTrigger>
            <SheetContent title="Comments" aria-busy>
              <SheetBody>
                <p role="status">Loading the comments of this board.</p>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="error" title="Error: the body says what failed" lang="en">
        <DemoRow>
          <Sheet size="sm">
            <SheetTrigger>
              <Button data-demo-trigger="error">Show comments offline</Button>
            </SheetTrigger>
            <SheetContent title="Comments">
              <SheetBody>
                <p role="alert">Could not load the comments. Check your connection, then try again.</p>
              </SheetBody>
              <SheetFooter>
                <Button tone="accent" emphasis="solid">
                  Load comments
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </DemoRow>
      </DemoCase>

      <DemoCase id="detents" title="Detents: half and all of the room; drag between them, or focus the handle and use the arrows, Enter or a press" lang="en">
        <DemoRow>
          <ShareSheet trigger="detents" label="Share at half height" detents={[0.5, 1]} />
          <ShareSheet trigger="detents-px" label="Share at 320px" detents={[320, 0.9]} defaultDetent={1} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="detents-arabic" title="Detents in Arabic" lang="ar">
        <DemoRow>
          <Theme lang="ar" dir="rtl">
            <Sheet detents={[0.5, 1]}>
              <SheetTrigger>
                <Button data-demo-trigger="detents-arabic">مشاركة اللوحة</Button>
              </SheetTrigger>
              <SheetContent title="مشاركة إطلاق الربيع" description="يمكن لمن لديه الرابط عرض اللوحة.">
                <SheetBody>اسحب المقبض أو استخدم مفاتيح الأسهم لتغيير الارتفاع.</SheetBody>
              </SheetContent>
            </Sheet>
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="confirm" title="Confirm in the header: after the close control, off until the list has a name" lang="en">
        <DemoRow>
          <ConfirmSheet lang="en" trigger="confirm" />
          <Theme lang="ar" dir="rtl" data-demo="content">
            <ConfirmSheet lang="ar" trigger="confirm-arabic" />
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="header-action" title="One more action in the header: close, share, then confirm" lang="en">
        <DemoRow>
          <HeaderActionSheet lang="en" trigger="header-action" />
          <Theme lang="ar" dir="rtl" data-demo="content">
            <HeaderActionSheet lang="ar" trigger="header-action-arabic" />
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Not dismissible while sending: the close control is disabled, a drag and Escape wait" lang="en">
        <DemoRow>
          <BusySheet />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
