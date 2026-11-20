// M10.3 pass-detail: the front of an event pass and its detail sheet
// (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of a native iOS pass and its detail sheet
// (Mobbin links in `meta.references`): the pass fills the page under a bar
// with one more button; the sheet rises over it with the close control at
// the start of its header and the confirm at the end, the pass's own row
// with a share button, a grouped card of switches with a footer under it, a
// card with one remove row, then the fields of the back of the pass. Our own
// event, names and numbers come from ./kit; the pass art and its entry code
// are drawn from tokens.
//
// Every control and surface is a component of @the-system/react:
// - top bar: Navbar with the large title as its brand and an IconButton at
//   its end, the SheetTrigger of the detail sheet;
// - the pass: Card with the kit's Art as its media and a DescriptionList of
//   its fields;
// - the detail sheet: Sheet (size lg) with SheetConfirm, so close and
//   confirm sit in its header;
// - share: SharePanel around an IconButton, system prefer: the system share
//   sheet first through share(), our panel of people, targets and actions
//   where there is none;
// - grouped rows: List variant inset, ListSection with a footer, Switch;
// - the info button: IconButton as a PopoverTrigger, Popover with its arrow;
// - remove: a danger Button in its own row as an ActionSheetTrigger, the
//   ActionSheet anchored to it (the ios default), one danger action and the
//   built in cancel;
// - after a remove: EmptyState with a restore Button, and a banner (Toaster
//   with position auto, toast() without a close button).
//
// This file's CSS (./pass-detail.css) is page layout only.
import { useState } from 'react';
import {
  ActionSheet,
  ActionSheetAction,
  ActionSheetContent,
  ActionSheetTrigger,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardMedia,
  CardTitle,
  DescriptionList,
  EmptyState,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  SharePanel,
  Sheet,
  SheetBody,
  SheetConfirm,
  SheetContent,
  SheetTrigger,
  Switch,
  Toaster,
  toast,
  type ShareAction,
  type SharePerson,
  type ShareTarget,
} from '@the-system/react';
import { Art, ScreenShell, dateText, passes, people, personById, priceText, t, timeText, type Lang, type Pass } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './pass-detail.css';

export const meta: ScreenMeta = {
  id: 'pass-detail',
  order: 'M10.3',
  title: 'A pass detail sheet: close, share and confirm in the header, switches, a remove row, details',
  families: ['sheet with confirm', 'grouped list', 'switch', 'section footer', 'popover with arrow', 'action sheet', 'share panel and the system share'],
  references: [
    { label: 'A pass detail sheet', href: 'https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5' },
    { label: 'The front of a pass', href: 'https://mobbin.com/screens/e1061c73-0be8-42ba-aaed-3bb1c3321a4e' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ words */

const words = {
  en: {
    title: 'Passes',
    nav: 'Passes',
    details: 'Pass details',
    save: 'Save changes',
    saved: 'Pass settings saved',
    share: 'Share pass',
    settings: 'Pass settings',
    updates: 'Automatic updates',
    lockScreen: 'Show on lock screen',
    lockInfo: 'About the lock screen',
    lockTitle: 'On the lock screen',
    lockBody: 'The pass shows on the lock screen when you are near the venue and close to the start time, so you can open it with one press.',
    notify: 'Allow notifications',
    footer: 'Updates keep the time, the hall and the seat current. Notifications tell you when one of them changes.',
    remove: 'Remove pass',
    removeNote: 'The pass leaves this phone. You can add it again from the email you got it in.',
    removed: 'Pass removed',
    restore: 'Restore pass',
    restored: 'Pass restored',
    emptyTitle: 'No passes',
    emptyBody: 'Passes you add show up here.',
    back: 'Back of the pass',
    holder: 'Holder',
    date: 'Date',
    time: 'Doors open',
    place: 'Place',
    seat: 'Seat',
    price: 'Price',
    number: 'Pass number',
    code: 'Entry code',
    sharedWith: (name: string) => `Pass sent to ${name}`,
    sharedTo: (label: string) => `Pass shared to ${label}`,
    added: 'Added to calendar',
    copiedCode: 'Pass number copied',
    people: 'People',
    message: 'Message',
    email: 'Email',
    group: 'Event group',
    calendar: 'Add to calendar',
    copyNumber: 'Copy number',
  },
  ar: {
    title: 'البطاقات',
    nav: 'البطاقات',
    details: 'تفاصيل البطاقة',
    save: 'حفظ التغييرات',
    saved: 'انحفظت إعدادات البطاقة',
    share: 'مشاركة البطاقة',
    settings: 'إعدادات البطاقة',
    updates: 'التحديث التلقائي',
    lockScreen: 'العرض على شاشة القفل',
    lockInfo: 'عن شاشة القفل',
    lockTitle: 'على شاشة القفل',
    lockBody: 'البطاقة تطلع على شاشة القفل إذا كنت قريب من المكان وقرب وقت البداية، عشان تفتحها بضغطة وحدة.',
    notify: 'الإشعارات',
    footer: 'التحديث يخلي الوقت والقاعة والمقعد محدثة دايم. والإشعارات تنبهك إذا تغير شي منها.',
    remove: 'إزالة البطاقة',
    removeNote: 'البطاقة بتنشال من هذا الجوال. تقدر تضيفها مرة ثانية من الإيميل اللي وصلك.',
    removed: 'انشالت البطاقة',
    restore: 'استرجاع البطاقة',
    restored: 'رجعت البطاقة',
    emptyTitle: 'ما فيه بطاقات',
    emptyBody: 'البطاقات اللي تضيفها تطلع هنا.',
    back: 'ظهر البطاقة',
    holder: 'صاحب البطاقة',
    date: 'التاريخ',
    time: 'فتح الأبواب',
    place: 'المكان',
    seat: 'المقعد',
    price: 'السعر',
    number: 'رقم البطاقة',
    code: 'رمز الدخول',
    sharedWith: (name: string) => `انرسلت البطاقة لـ${name}`,
    sharedTo: (label: string) => `انشاركت البطاقة عبر ${label}`,
    added: 'انضافت للتقويم',
    copiedCode: 'انسخ رقم البطاقة',
    people: 'الأشخاص',
    message: 'رسالة',
    email: 'إيميل',
    group: 'مجموعة الفعالية',
    calendar: 'إضافة للتقويم',
    copyNumber: 'نسخ الرقم',
  },
} as const;

type Words = (typeof words)[Lang];

/** The pass number, our own made up form, set left to right. */
const PASS_NUMBER = 'NDD-2026-0412';

/** The fields of the pass: the front shows the first four, the back shows all of them. */
function fields(pass: Pass, w: Words, lang: Lang) {
  const holder = personById(pass.holder);
  return {
    date: { key: 'date', term: w.date, details: dateText(pass.date, lang, 'full') },
    time: { key: 'time', term: w.time, details: timeText(pass.hours, pass.minutes, lang) },
    seat: { key: 'seat', term: w.seat, details: t(pass.seat, lang) },
    holder: { key: 'holder', term: w.holder, details: holder ? t(holder.name, lang) : '' },
    place: { key: 'place', term: w.place, details: t(pass.place, lang) },
    price: { key: 'price', term: w.price, details: priceText(pass.price, lang) },
    number: { key: 'number', term: w.number, details: <bdi dir="ltr">{PASS_NUMBER}</bdi> },
  };
}

/* ------------------------------------------------------------ the pass */

function PassCard({ pass, w, lang }: { pass: Pass; w: Words; lang: Lang }) {
  const f = fields(pass, w, lang);
  return (
    <Card data-gallery="pass-card" size="lg">
      <CardMedia>
        <Art art={pass.art} shape="wide" />
      </CardMedia>
      <CardHeader>
        <CardTitle level={2}>{t(pass.title, lang)}</CardTitle>
        <CardDescription>{t(pass.place, lang)}</CardDescription>
      </CardHeader>
      <CardBody>
        <DescriptionList orientation="vertical" size="sm" data-gallery="pass-fields" items={[f.date, f.time, f.seat, f.holder]} />
        <div data-gallery="pass-code-box">
          <span data-gallery="pass-code" role="img" aria-label={`${w.code}, ${PASS_NUMBER}`} />
          <bdi dir="ltr" data-gallery="pass-number">
            {PASS_NUMBER}
          </bdi>
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------ the screen */

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const pass = passes[0]!;
  const passTitle = t(pass.title, lang);
  const [present, setPresent] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updates, setUpdates] = useState(true);
  const [lockScreen, setLockScreen] = useState(true);
  const [notify, setNotify] = useState(false);

  /** A timed banner with no close button, as the platform's own. */
  const banner = (title: string, start: 'check' | 'trash' | 'send' | 'calendar' | 'copy' | 'history', description?: string) =>
    toast({ title, description, start, meta: new Date(), lang, closable: false });

  const sharePeople: SharePerson[] = people.filter((p) => p.id !== pass.holder).slice(0, 4).map((p) => ({ id: p.id, name: t(p.name, lang) }));
  const shareTargets: ShareTarget[] = [
    { id: 'message', label: w.message, icon: 'send' },
    { id: 'email', label: w.email, icon: 'mail' },
    { id: 'group', label: w.group, icon: 'user-plus' },
  ];
  const shareActions: ShareAction[] = [
    { id: 'calendar', label: w.calendar, icon: 'calendar', onSelect: () => banner(w.added, 'calendar', passTitle) },
    { id: 'number', label: w.copyNumber, icon: 'copy', onSelect: () => banner(w.copiedCode, 'copy', PASS_NUMBER) },
  ];
  const onShare = (id: string, kind: 'person' | 'target') => {
    if (kind === 'person') {
      const p = personById(id);
      banner(w.sharedWith(p ? t(p.name, lang) : id), 'send', passTitle);
    } else {
      const target = shareTargets.find((x) => x.id === id);
      banner(w.sharedTo(target?.label ?? id), 'send', passTitle);
    }
  };

  const remove = () => {
    setSheetOpen(false);
    setPresent(false);
    banner(w.removed, 'trash', passTitle);
  };

  const f = fields(pass, w, lang);
  const backFields = [f.holder, f.date, f.time, f.place, f.seat, f.price, f.number];

  const detailSheet = (
    <Sheet size="lg" open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger>
        <IconButton icon="more" label={w.details} />
      </SheetTrigger>
      <SheetContent title={w.details}>
        <SheetConfirm label={w.save} onClick={() => banner(w.saved, 'check')} />
        <SheetBody>
          <div data-gallery="pass-sheet">
            <List variant="inset" titleLines="all" aria-label={w.details}>
              <ListItem
                start={
                  <span data-gallery="pass-thumb">
                    <Art art={pass.art} shape="tall" />
                  </span>
                }
                title={passTitle}
                description={`${dateText(pass.date, lang, 'day-month')}, ${timeText(pass.hours, pass.minutes, lang)}`}
                actions={
                  <SharePanel
                    item={{ title: passTitle, url: `https://example.com/passes/${pass.id}`, text: t(pass.place, lang) }}
                    people={sharePeople}
                    targets={shareTargets}
                    actions={shareActions}
                    onShare={onShare}
                    lang={lang}
                  >
                    <IconButton icon="share" label={w.share} />
                  </SharePanel>
                }
              />
            </List>

            <List variant="inset" titleLines="all" aria-label={w.settings}>
              <ListSection header={w.settings} footer={w.footer}>
                <ListItem title={w.updates} actions={<Switch aria-label={w.updates} checked={updates} onCheckedChange={setUpdates} />} />
                <ListItem
                  title={w.lockScreen}
                  actions={
                    <>
                      <Popover size="sm">
                        <PopoverTrigger>
                          <IconButton icon="info" label={w.lockInfo} emphasis="ghost" />
                        </PopoverTrigger>
                        <PopoverContent title={w.lockTitle} side="bottom" align="end">
                          <PopoverBody>
                            <p data-gallery="pass-popover-text">{w.lockBody}</p>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                      <Switch aria-label={w.lockScreen} checked={lockScreen} onCheckedChange={setLockScreen} />
                    </>
                  }
                />
                <ListItem title={w.notify} actions={<Switch aria-label={w.notify} checked={notify} onCheckedChange={setNotify} />} />
              </ListSection>
            </List>

            <List variant="inset" aria-label={w.remove}>
              <ListItem
                title={
                  <ActionSheet>
                    <ActionSheetTrigger>
                      <Button tone="danger" emphasis="ghost" fullWidth data-gallery="pass-remove">
                        {w.remove}
                      </Button>
                    </ActionSheetTrigger>
                    <ActionSheetContent title={passTitle} description={w.removeNote}>
                      <ActionSheetAction tone="danger" start="trash" onClick={remove}>
                        {w.remove}
                      </ActionSheetAction>
                    </ActionSheetContent>
                  </ActionSheet>
                }
              />
            </List>

            <List variant="inset" titleLines="all" aria-label={w.back}>
              <ListSection header={w.back}>
                {backFields.map((field) => (
                  <ListItem key={field.key} title={field.term} description={field.details} />
                ))}
              </ListSection>
            </List>
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );

  const header = <Navbar label={w.nav} brand={<h1 data-gallery="pass-title">{w.title}</h1>} items={[]} end={present ? detailSheet : undefined} />;

  return (
    <ScreenShell header={header}>
      <div data-gallery="pass-main">
        {present ? (
          <PassCard pass={pass} w={w} lang={lang} />
        ) : (
          <div data-gallery="pass-empty">
            <EmptyState
              size="lg"
              icon="tag"
              title={w.emptyTitle}
              headingLevel={2}
              live
              actions={
                <Button
                  onClick={() => {
                    setPresent(true);
                    banner(w.restored, 'history', passTitle);
                  }}
                >
                  {w.restore}
                </Button>
              }
            >
              {w.emptyBody}
            </EmptyState>
          </div>
        )}
      </div>
      <Toaster position="auto" />
    </ScreenShell>
  );
}
