// M10.10 share-flow: a finished workout as a card, shared through the
// system share sheet first and our own share panel where there is none,
// then a "Link copied" banner (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of two native iOS share screens (Mobbin links
// in `meta.references`): a workout summary card with large numbers over a
// row of share targets, and a send to sheet with people first. Our own
// workout, names and numbers come from ./kit; the card art is drawn from
// tokens. The targets are the app's own places with system icons, never a
// third party app.
//
// Every control and surface is a component of @the-system/react:
// - top bar: Navbar with a back button and the workout as the large title,
//   and a share IconButton at its end;
// - the card: Card with the kit's Art as its media, Stat for each number;
// - the exercises: List variant inset in a ListSection;
// - share: SharePanel around the bar's IconButton and around the capsule
//   Button under the card, system prefer: share() opens the system sheet
//   where it exists, our panel (a Sheet on ios) with people, targets and
//   actions where it does not. Copy link is the panel's own action and its
//   "Link copied" banner;
// - banners: Toaster with position auto, toast() without a close button.
//
// This file's CSS (./share-flow.css) is page layout only.
import type { ReactElement } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardMedia,
  CardTitle,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  SharePanel,
  Stat,
  Toaster,
  toast,
  type ShareAction,
  type ShareKind,
  type SharePerson,
  type ShareTarget,
} from '@the-system/react';
import { Art, ScreenShell, countText, dateText, people, personById, t, workouts, type Lang } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './share-flow.css';

export const meta: ScreenMeta = {
  id: 'share-flow',
  order: 'M10.10',
  title: 'Share a workout card: our share panel with people, targets and actions, then a link copied banner',
  families: ['share panel', 'system share path', 'notification banner'],
  references: [
    { label: 'Sharing a workout card', href: 'https://mobbin.com/screens/089e33d7-e9dc-4726-8ba5-257641fb73f1' },
    { label: 'Sending to people', href: 'https://mobbin.com/screens/4f15982c-81b5-4d48-8ad6-b301662f8968' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/** The day the workout was done. */
const DONE_ON = '2026-11-19';

/** Sets counted in Arabic: one and two as words, 3 to 10 with the plural, 11 and up with the singular. */
function setCount(n: number, lang: Lang): string {
  if (n === 1) return 'مجموعة واحدة';
  if (n === 2) return 'مجموعتين';
  return `${countText(n, lang)} ${n >= 3 && n <= 10 ? 'مجموعات' : 'مجموعة'}`;
}

const words = {
  en: {
    nav: 'Workout',
    back: 'Activity',
    share: 'Share workout',
    duration: 'Duration',
    energy: 'Energy',
    volume: 'Volume',
    exercises: 'Exercises',
    minutes: 'min',
    kcal: 'kcal',
    kg: 'kg',
    sets: (sets: number, reps: number, lang: Lang) => `${countText(sets, lang)} sets of ${countText(reps, lang)}`,
    load: (kg: number, lang: Lang) => (kg === 0 ? 'Body weight' : `${countText(kg, lang)} kg`),
    caption: 'Strength, done in the morning',
    text: (minutes: number, energy: number, lang: Lang) => `${countText(minutes, lang)} minutes, ${countText(energy, lang)} kcal.`,
    message: 'Message',
    club: 'Training club',
    email: 'Email',
    feed: 'Activity feed',
    saveImage: 'Save image',
    addPlan: 'Add to plan',
    sentTo: (name: string) => `Workout sent to ${name}`,
    sharedTo: (label: string) => `Workout shared to ${label}`,
    imageSaved: 'Image saved',
    planned: 'Added to next week',
  },
  ar: {
    nav: 'التمرين',
    back: 'النشاط',
    share: 'مشاركة التمرين',
    duration: 'المدة',
    energy: 'الطاقة',
    volume: 'الحجم',
    exercises: 'الحركات',
    minutes: 'دقيقة',
    kcal: 'سعرة',
    kg: 'كجم',
    sets: (sets: number, reps: number, lang: Lang) => `${setCount(sets, lang)} × ${countText(reps, lang)}`,
    load: (kg: number, lang: Lang) => (kg === 0 ? 'وزن الجسم' : `${countText(kg, lang)} كجم`),
    caption: 'تمرين قوة، الصبح',
    text: (minutes: number, energy: number, lang: Lang) => `${countText(minutes, lang)} دقيقة، ${countText(energy, lang)} سعرة.`,
    message: 'رسالة',
    club: 'نادي التدريب',
    email: 'البريد',
    feed: 'صفحة النشاط',
    saveImage: 'حفظ الصورة',
    addPlan: 'إضافة للخطة',
    sentTo: (name: string) => `التمرين وصل ${name}`,
    sharedTo: (label: string) => `التمرين انرسل عبر ${label}`,
    imageSaved: 'الصورة محفوظة',
    planned: 'انضاف للأسبوع الجاي',
  },
} as const;

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const workout = workouts[0]!;
  const title = t(workout.title, lang);
  const volume = workout.exercises.reduce((sum, e) => sum + e.sets * e.reps * e.weight, 0);

  /** A timed banner with no close button, as the platform's own. */
  const banner = (text: string, start: string) => toast({ title: text, description: title, start, meta: new Date(), lang, closable: false });

  const sharePeople: SharePerson[] = people.slice(0, 6).map((p) => ({ id: p.id, name: t(p.name, lang) }));
  const shareTargets: ShareTarget[] = [
    { id: 'message', label: w.message, icon: 'send' },
    { id: 'club', label: w.club, icon: 'user-plus' },
    { id: 'feed', label: w.feed, icon: 'list' },
    { id: 'email', label: w.email, icon: 'mail' },
  ];
  const shareActions: ShareAction[] = [
    { id: 'image', label: w.saveImage, icon: 'download', onSelect: () => banner(w.imageSaved, 'download') },
    { id: 'plan', label: w.addPlan, icon: 'calendar', onSelect: () => banner(w.planned, 'calendar') },
  ];
  const onShare = (id: string, kind: ShareKind) => {
    if (kind === 'person') {
      const p = personById(id);
      banner(w.sentTo(p ? t(p.name, lang) : id), 'send');
    } else {
      banner(w.sharedTo(shareTargets.find((x) => x.id === id)?.label ?? id), 'send');
    }
  };

  /** One share panel per trigger: the same item, people, targets and actions. */
  const share = (trigger: ReactElement) => (
    <SharePanel
      item={{ title, url: `https://example.com/workouts/${workout.id}-${DONE_ON}`, text: w.text(workout.minutes, workout.energy, lang) }}
      people={sharePeople}
      targets={shareTargets}
      actions={shareActions}
      onShare={onShare}
      lang={lang}
    >
      {trigger}
    </SharePanel>
  );

  const header = (
    <Navbar
      label={w.nav}
      back={{ label: w.back, href: '#activity' }}
      heading={title}
      items={[]}
      end={share(<IconButton icon="share" label={w.share} />)}
    />
  );

  return (
    <ScreenShell header={header}>
      <div data-gallery="share-main">
        <Card data-gallery="share-card" size="lg">
          <CardMedia>
            <Art art="ember" shape="wide" />
          </CardMedia>
          <CardHeader>
            <CardTitle level={2}>{dateText(DONE_ON, lang, 'full')}</CardTitle>
            <CardDescription>{w.caption}</CardDescription>
          </CardHeader>
          <CardBody>
            <div data-gallery="share-stats">
              <Stat label={w.duration} value={`${countText(workout.minutes, lang)} ${w.minutes}`} size="md" />
              <Stat label={w.energy} value={`${countText(workout.energy, lang)} ${w.kcal}`} size="md" />
              <Stat label={w.volume} value={`${countText(volume, lang)} ${w.kg}`} size="md" />
            </div>
          </CardBody>
        </Card>

        <div data-gallery="share-action">
          {share(
            <Button tone="accent" emphasis="solid" shape="pill" size="lg" fullWidth start="share">
              {w.share}
            </Button>,
          )}
        </div>

        <List variant="inset" titleLines="all" aria-label={w.exercises}>
          <ListSection header={w.exercises} level={2}>
            {workout.exercises.map((e) => (
              <ListItem
                key={e.id}
                start={
                  <span data-gallery="share-thumb">
                    <Art art={e.art} />
                  </span>
                }
                title={t(e.name, lang)}
                description={w.sets(e.sets, e.reps, lang)}
                end={<span data-gallery="share-load">{w.load(e.weight, lang)}</span>}
              />
            ))}
          </ListSection>
        </List>
      </div>
      <Toaster position="auto" />
    </ScreenShell>
  );
}
