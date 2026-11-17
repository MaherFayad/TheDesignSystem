// M10.4 settings: the settings of a focus timer app, built only from the
// system's components (docs/plan/reset-ios-families.md section 5). Rebuilt
// from the structure of two native iOS settings screens on Mobbin: grouped
// inset rows with a switch, a stepper and values (timespent), and option
// rows with a segmented control, pop-up buttons and switches (MD Vinyl).
// Our own words, names and numbers; no third party text or marks.
//
// On the phone, the outer screen and the inner screen in portrait the
// settings are one page of groups. On the inner screen in landscape they
// split into a list of categories and the detail of the chosen one, as a
// settings app does on a wide screen.
import { useState, type MouseEvent } from 'react';
import { Icon } from '@the-system/icons/react';
import {
  Field,
  Fieldset,
  Input,
  List,
  ListItem,
  ListSection,
  Navbar,
  NumberField,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  Slider,
  SplitView,
  Switch,
  TabBar,
  TabBarItem,
} from '@the-system/react';
import { ScreenShell, countText, personById, phoneText, t, type Lang, type Text } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './settings.css';

export const meta: ScreenMeta = {
  id: 'settings',
  order: 'M10.4',
  title: 'App settings: grouped rows, switches, a stepper, a pop-up button, a slider, account fields',
  families: ['grouped list', 'section header and footer', 'switch', 'stepper', 'pop-up button', 'slider', 'text fields in grouped rows', 'segmented control', 'split of list and detail (inner screen, landscape)'],
  references: [
    { label: 'Timer settings', href: 'https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e' },
    { label: 'App settings with a slider', href: 'https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf' },
    { label: 'Option rows with a segmented control and pop-up buttons', href: 'https://mobbin.com/screens/cf96a7c3-8875-4577-bcaf-34a4fc6f1b6d' },
    { label: 'Sliders in grouped rows, dark', href: 'https://mobbin.com/screens/86d6ba5d-09d3-4fe8-b1d6-a002cc893166' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/* ------------------------------------------------------------ words */

const words = {
  title: { en: 'Settings', ar: 'الإعدادات' },
  tabs: { en: 'Main', ar: 'التنقل الرئيسي' },
  tabTimer: { en: 'Timer', ar: 'المؤقت' },
  tabHistory: { en: 'History', ar: 'السجل' },
  categories: { en: 'Setting groups', ar: 'مجموعات الإعدادات' },
  interval: { en: 'Interval timer', ar: 'مؤقت الفترات' },
  intervalNote: {
    en: 'Split your time into focus sessions and short breaks, with a countdown before the first session.',
    ar: 'قسم وقتك لجلسات تركيز واستراحات قصيرة، مع عد تنازلي قبل أول جلسة.',
  },
  countdown: { en: 'Countdown', ar: 'العد التنازلي' },
  countdownFirst: { en: 'Countdown at the start', ar: 'عد تنازلي قبل البدء' },
  countdownLength: { en: 'Countdown length', ar: 'مدة العد التنازلي' },
  sessions: { en: 'Sessions', ar: 'الجلسات' },
  sessionCount: { en: 'Number of sessions', ar: 'عدد الجلسات' },
  sessionLength: { en: 'Session length', ar: 'مدة الجلسة' },
  breakLength: { en: 'Break length', ar: 'مدة الاستراحة' },
  display: { en: 'Display', ar: 'العرض' },
  size: { en: 'Clock size', ar: 'حجم الساعة' },
  small: { en: 'Small', ar: 'صغير' },
  medium: { en: 'Medium', ar: 'متوسط' },
  large: { en: 'Large', ar: 'كبير' },
  theme: { en: 'Theme', ar: 'المظهر' },
  system: { en: 'Follow device', ar: 'حسب الجهاز' },
  light: { en: 'Light', ar: 'فاتح' },
  dark: { en: 'Dark', ar: 'داكن' },
  timeLeft: { en: 'Show the time left', ar: 'عرض الوقت المتبقي' },
  sound: { en: 'Sound', ar: 'الصوت' },
  bell: { en: 'Bell at the end of a session', ar: 'جرس نهاية الجلسة' },
  volume: { en: 'Bell volume', ar: 'مستوى صوت الجرس' },
  volumeNote: { en: 'The bell follows this level even when the phone is on silent.', ar: 'الجرس يتبع هذا المستوى حتى لو الجوال على الصامت.' },
  account: { en: 'Account', ar: 'الحساب' },
  accountNote: { en: 'We use your email only to send your weekly summary.', ar: 'نستخدم بريدك بس عشان نرسل لك ملخص الأسبوع.' },
  name: { en: 'Name', ar: 'الاسم' },
  email: { en: 'Email', ar: 'البريد' },
  phone: { en: 'Phone', ar: 'الجوال' },
} satisfies Record<string, Text>;

/** Seconds and minutes in the pop-up buttons, Western digits in both languages. */
function seconds(n: number, lang: Lang): string {
  return lang === 'ar' ? `${countText(n, lang)} ثوان` : `${countText(n, lang)} s`;
}

function minutes(n: number, lang: Lang): string {
  return lang === 'ar' ? `${countText(n, lang)} دقيقة` : `${countText(n, lang)} min`;
}

function options(values: readonly number[], lang: Lang, unit: (n: number, lang: Lang) => string) {
  return values.map((v) => ({ value: String(v), label: unit(v, lang) }));
}

/* ------------------------------------------------------------ the settings state */

interface Settings {
  interval: boolean;
  countdownFirst: boolean;
  countdownLength: string;
  sessions: number | null;
  sessionLength: string;
  breakLength: string;
  size: string;
  theme: string;
  timeLeft: boolean;
  bell: boolean;
  volume: number;
}

const initial: Settings = {
  interval: true,
  countdownFirst: true,
  countdownLength: '5',
  sessions: 3,
  sessionLength: '25',
  breakLength: '5',
  size: 'm',
  theme: 'system',
  timeLeft: true,
  bell: true,
  volume: 60,
};

type Set = <K extends keyof Settings>(key: K, value: Settings[K]) => void;

interface GroupProps {
  lang: Lang;
  s: Settings;
  set: Set;
}

/* ------------------------------------------------------------ the groups */

function TimerGroups({ lang, s, set }: GroupProps) {
  const w = (k: keyof typeof words) => t(words[k], lang);
  return (
    <List variant="inset" titleLines={3} aria-label={w('interval')}>
      <ListSection footer={w('intervalNote')}>
        <ListItem
          start="clock"
          title={w('interval')}
          actions={<Switch aria-label={w('interval')} checked={s.interval} onCheckedChange={(v) => set('interval', v)} />}
        />
      </ListSection>
      <ListSection header={w('countdown')}>
        <ListItem
          title={w('countdownFirst')}
          actions={<Switch aria-label={w('countdownFirst')} checked={s.countdownFirst} onCheckedChange={(v) => set('countdownFirst', v)} />}
        />
        <ListItem
          title={w('countdownLength')}
          actions={
            <Select
              emphasis="ghost"
              aria-label={w('countdownLength')}
              items={options([3, 5, 10], lang, seconds)}
              value={s.countdownLength}
              onValueChange={(v) => v && set('countdownLength', v)}
            />
          }
        />
      </ListSection>
      <ListSection header={w('sessions')}>
        <ListItem
          title={w('sessionCount')}
          actions={
            <NumberField
              variant="stepper"
              aria-label={w('sessionCount')}
              min={1}
              max={12}
              value={s.sessions}
              onChange={(v) => set('sessions', v)}
            />
          }
        />
        <ListItem
          title={w('sessionLength')}
          actions={
            <Select
              emphasis="ghost"
              aria-label={w('sessionLength')}
              items={options([15, 25, 45, 60], lang, minutes)}
              value={s.sessionLength}
              onValueChange={(v) => v && set('sessionLength', v)}
            />
          }
        />
        <ListItem
          title={w('breakLength')}
          actions={
            <Select
              emphasis="ghost"
              aria-label={w('breakLength')}
              items={options([5, 10, 15], lang, minutes)}
              value={s.breakLength}
              onValueChange={(v) => v && set('breakLength', v)}
            />
          }
        />
      </ListSection>
    </List>
  );
}

function DisplayGroups({ lang, s, set }: GroupProps) {
  const w = (k: keyof typeof words) => t(words[k], lang);
  return (
    <List variant="inset" titleLines={3} aria-label={w('display')}>
      <ListSection header={w('display')}>
        <ListItem
          title={w('size')}
          actions={
            <SegmentedControl aria-label={w('size')} size="sm" value={s.size} onValueChange={(v) => set('size', v)}>
              <SegmentedControlItem value="s">{w('small')}</SegmentedControlItem>
              <SegmentedControlItem value="m">{w('medium')}</SegmentedControlItem>
              <SegmentedControlItem value="l">{w('large')}</SegmentedControlItem>
            </SegmentedControl>
          }
        />
        <ListItem
          title={w('theme')}
          actions={
            <Select
              emphasis="ghost"
              aria-label={w('theme')}
              items={[
                { value: 'system', label: w('system') },
                { value: 'light', label: w('light') },
                { value: 'dark', label: w('dark') },
              ]}
              value={s.theme}
              onValueChange={(v) => v && set('theme', v)}
            />
          }
        />
        <ListItem
          title={w('timeLeft')}
          actions={<Switch aria-label={w('timeLeft')} checked={s.timeLeft} onCheckedChange={(v) => set('timeLeft', v)} />}
        />
      </ListSection>
    </List>
  );
}

function SoundGroups({ lang, s, set }: GroupProps) {
  const w = (k: keyof typeof words) => t(words[k], lang);
  return (
    <List variant="inset" titleLines={3} aria-label={w('sound')}>
      <ListSection header={w('sound')}>
        <ListItem
          title={w('bell')}
          actions={<Switch aria-label={w('bell')} checked={s.bell} onCheckedChange={(v) => set('bell', v)} />}
        />
      </ListSection>
      <ListSection header={w('volume')} footer={w('volumeNote')}>
        <ListItem
          start="bell-off"
          end={<Icon name="bell" size="md" />}
          control={
            <Slider
              aria-label={w('volume')}
              min={0}
              max={100}
              step={5}
              value={s.volume}
              onValueChange={(v) => set('volume', v)}
              disabled={!s.bell}
            />
          }
        />
      </ListSection>
    </List>
  );
}

function AccountGroup({ lang }: { lang: Lang }) {
  const w = (k: keyof typeof words) => t(words[k], lang);
  const sara = personById('sara');
  return (
    <Fieldset variant="inset" legend={w('account')} description={w('accountNote')}>
      <Field label={w('name')}>
        <Input variant="plain" clearable autoComplete="name" defaultValue={sara ? t(sara.name, lang) : ''} />
      </Field>
      <Field label={w('email')}>
        <Input variant="plain" clearable type="email" autoComplete="email" defaultValue={sara?.email ?? ''} />
      </Field>
      <Field label={w('phone')}>
        <Input variant="plain" clearable type="tel" autoComplete="tel" dir="ltr" defaultValue={sara ? phoneText(sara.phone) : ''} />
      </Field>
    </Fieldset>
  );
}

/* ------------------------------------------------------------ the categories of the split */

type CategoryId = 'timer' | 'display' | 'sound' | 'account';

const categories: readonly { id: CategoryId; icon: 'clock' | 'sun' | 'bell' | 'user'; name: keyof typeof words }[] = [
  { id: 'timer', icon: 'clock', name: 'tabTimer' },
  { id: 'display', icon: 'sun', name: 'display' },
  { id: 'sound', icon: 'bell', name: 'sound' },
  { id: 'account', icon: 'user', name: 'account' },
];

function Category({ id, ...props }: GroupProps & { id: CategoryId }) {
  if (id === 'timer') return <TimerGroups {...props} />;
  if (id === 'display') return <DisplayGroups {...props} />;
  if (id === 'sound') return <SoundGroups {...props} />;
  return <AccountGroup lang={props.lang} />;
}

/* ------------------------------------------------------------ the screen */

export function Screen({ variant, lang }: ScreenProps) {
  const [s, setState] = useState<Settings>(initial);
  const set: Set = (key, value) => setState((prev) => ({ ...prev, [key]: value }));
  const [chosen, setChosen] = useState<CategoryId>('timer');
  const w = (k: keyof typeof words) => t(words[k], lang);
  const split = variant.frame === 'duo-inner' && variant.orient === 'landscape';
  const groups = { lang, s, set };

  const header = <Navbar label={w('title')} brand={<h1 data-gallery="settings-title">{w('title')}</h1>} items={[]} />;
  const tabs = (
    <div data-gallery="settings-tabs">
      <TabBar aria-label={w('tabs')}>
        <TabBarItem href="#timer" icon="clock" label={w('tabTimer')} />
        <TabBarItem href="#history" icon="history" label={w('tabHistory')} />
        <TabBarItem href="#settings" icon="settings" label={w('title')} active />
      </TabBar>
    </div>
  );

  if (split) {
    const choose = (id: CategoryId) => (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      setChosen(id);
    };
    const current = categories.find((c) => c.id === chosen) ?? categories[0]!;
    return (
      <ScreenShell header={header}>
        <div data-gallery="settings-split">
          <SplitView
            layout="split"
            defaultSizes={[38, 62]}
            primaryLabel={w('categories')}
            secondaryLabel={w(current.name)}
            primary={
              <div data-gallery="settings-pane" data-pane="list">
                <List variant="inset" aria-label={w('categories')}>
                  {categories.map((c) => (
                    <ListItem
                      key={c.id}
                      start={c.icon}
                      title={w(c.name)}
                      href={`#${c.id}`}
                      active={c.id === chosen}
                      linkProps={{ onClick: choose(c.id) }}
                    />
                  ))}
                </List>
              </div>
            }
            secondary={
              <div data-gallery="settings-pane" data-pane="detail">
                <h2 data-gallery="settings-detail-title">{w(current.name)}</h2>
                <Category id={chosen} {...groups} />
              </div>
            }
          />
        </div>
        {tabs}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell header={header}>
      <div data-gallery="settings-page">
        <TimerGroups {...groups} />
        <DisplayGroups {...groups} />
        <SoundGroups {...groups} />
        <AccountGroup lang={lang} />
      </div>
      {tabs}
    </ScreenShell>
  );
}
