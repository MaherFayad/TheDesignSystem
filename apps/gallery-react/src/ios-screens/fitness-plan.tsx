// M10.9 fitness-plan: one workout of a training plan, with the week's
// progress, a start capsule, the exercises with a menu on each, a sheet of
// routine actions that rests at a medium detent, and a banner after an
// action (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of the references in `meta.references`: a
// pushed screen with a back button and a more button in the top bar, the
// routine's name as the large title, a full width start capsule, rows of
// exercises with a cover, the sets and the weight and a more button that
// opens a menu; the more button in the bar raises a sheet with a grabber at
// half height, its actions in a grouped list. Their proportions and
// behaviour, never their pictures or words.
//
// Every control and surface is a component of @the-system/react:
// - top bar: Navbar with back, the large title as heading, and the more
//   IconButton at its end as the SheetTrigger;
// - the week: ProgressBar, with an info IconButton that opens a Popover
//   with its arrow;
// - start: Button with shape pill;
// - exercises: List (inset) with ListItem, a DropdownMenu on each row;
// - routine actions: Sheet with detents (medium, then large) and its
//   grabber, a List of actions inside;
// - the banner: Toaster with position auto and toast().
// This file's CSS (./fitness-plan.css) is page layout only.
import { useState } from 'react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
  List,
  ListItem,
  ListSection,
  Navbar,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  ProgressBar,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTrigger,
  Toaster,
  toast,
  TOAST_ACTION_MIN_DURATION,
} from '@the-system/react';
import { Art, ScreenShell, countText, t, workouts, type Exercise, type Lang } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './fitness-plan.css';

export const meta: ScreenMeta = {
  id: 'fitness-plan',
  order: 'M10.9',
  title: 'A workout plan with a medium detent sheet of actions, a menu on an exercise, progress for the week',
  families: ['sheet with detents and grabber', 'menu', 'progress bar', 'toast', 'popover'],
  references: [
    { label: 'A sheet of routine actions', href: 'https://mobbin.com/screens/15cb87a0-88b5-4a37-adf2-d93f9904f81f' },
    { label: 'A menu on a workout', href: 'https://mobbin.com/screens/95037e85-88cb-42be-bd02-a1fbb6891989' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

/** Workouts done this week, of the weekly goal. */
const DONE = 3;
const GOAL = 5;

/** The two detents of the routine sheet: medium (half the screen), then large. */
const DETENTS = [0.5, 0.92] as const;

const words = {
  en: {
    nav: 'Workout',
    back: 'Plan',
    more: 'Routine actions',
    summary: (minutes: number, energy: number, count: number, lang: Lang) => `${countText(minutes, lang)} min, about ${countText(energy, lang)} kcal, ${countText(count, lang)} exercises`,
    week: 'This week',
    done: 'Workouts done',
    weekValue: (done: number, goal: number) => `${done} of ${goal}`,
    goalInfo: 'About the weekly goal',
    goalTitle: 'Weekly goal',
    goalBody: 'Five workouts a week, set in your plan. A workout counts once you log every set in it.',
    start: 'Start workout',
    exercises: 'Exercises',
    sets: (e: Exercise, lang: Lang) => `${countText(e.sets, lang)} sets of ${countText(e.reps, lang)}, ${e.weight === 0 ? 'body weight' : `${countText(e.weight, lang)}\u00a0kg`}`,
    rowMore: (name: string) => `More for ${name}`,
    replace: 'Replace exercise',
    note: 'Add a note',
    up: 'Move up',
    down: 'Move down',
    remove: 'Remove exercise',
    removed: 'Exercise removed',
    undo: 'Undo remove',
    undoAlt: 'Add it back from Edit routine',
    sheetTitle: 'Routine actions',
    sheetClose: 'Close routine actions',
    actionList: 'Routine actions',
    share: 'Share routine',
    duplicate: 'Duplicate routine',
    edit: 'Edit routine',
    calendar: 'Add to calendar',
    reminder: 'Set a reminder',
    del: 'Delete routine',
    shared: 'Link to the routine copied',
    duplicated: 'Routine duplicated',
    added: 'Added to your calendar',
    reminded: 'Reminder set for 6:00 PM',
    deleted: 'Routine deleted',
    noted: 'Note added',
    replaced: 'Pick a new exercise from the library',
    moved: 'Exercise moved',
  },
  ar: {
    nav: 'التمرين',
    back: 'الخطة',
    more: 'خيارات الروتين',
    summary: (minutes: number, energy: number, count: number, lang: Lang) => `${countText(minutes, lang)} دقيقة، حوالي ${countText(energy, lang)} سعرة، ${countText(count, lang)} تمارين`,
    week: 'هذا الأسبوع',
    done: 'التمارين المنجزة',
    weekValue: (done: number, goal: number) => `${done} من ${goal}`,
    goalInfo: 'عن هدف الأسبوع',
    goalTitle: 'هدف الأسبوع',
    goalBody: 'خمس تمارين في الأسبوع حسب خطتك. التمرين ينحسب لما تسجل كل جولاته.',
    start: 'بدء التمرين',
    exercises: 'التمارين',
    sets: (e: Exercise, lang: Lang) => `${countText(e.sets, lang)} جولات × ${countText(e.reps, lang)}، ${e.weight === 0 ? 'وزن الجسم' : `${countText(e.weight, lang)}\u00a0كجم`}`,
    rowMore: (name: string) => `خيارات ${name}`,
    replace: 'استبدال التمرين',
    note: 'إضافة ملاحظة',
    up: 'نقل لفوق',
    down: 'نقل لتحت',
    remove: 'حذف التمرين',
    removed: 'انحذف التمرين',
    undo: 'تراجع',
    undoAlt: 'تقدر ترجعه من تعديل الروتين',
    sheetTitle: 'خيارات الروتين',
    sheetClose: 'إغلاق خيارات الروتين',
    actionList: 'خيارات الروتين',
    share: 'مشاركة الروتين',
    duplicate: 'نسخ الروتين',
    edit: 'تعديل الروتين',
    calendar: 'إضافة للتقويم',
    reminder: 'ضبط تذكير',
    del: 'حذف الروتين',
    shared: 'انتسخ رابط الروتين',
    duplicated: 'انتسخ الروتين',
    added: 'انضاف للتقويم',
    reminded: 'انضبط التذكير الساعة 6:00 م',
    deleted: 'انحذف الروتين',
    noted: 'انضافت الملاحظة',
    replaced: 'اختر تمرين جديد من المكتبة',
    moved: 'انتقل التمرين',
  },
} as const;

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const workout = workouts[0];
  const [ids, setIds] = useState<string[]>(() => workout?.exercises.map((e) => e.id) ?? []);
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!workout) return null;
  const shown = ids.flatMap((id) => workout.exercises.find((e) => e.id === id) ?? []);

  const banner = (title: string, start: string) => toast({ title, start, lang, closable: false });

  const move = (id: string, by: -1 | 1) => {
    setIds((all) => {
      const i = all.indexOf(id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= all.length) return all;
      const next = [...all];
      next.splice(i, 1);
      next.splice(j, 0, id);
      return next;
    });
    banner(w.moved, by < 0 ? 'arrow-up' : 'arrow-down');
  };

  const remove = (e: Exercise) => {
    const at = ids.indexOf(e.id);
    setIds((all) => all.filter((id) => id !== e.id));
    toast({
      title: w.removed,
      description: t(e.name, lang),
      start: 'trash',
      lang,
      duration: TOAST_ACTION_MIN_DURATION,
      action: {
        label: w.undo,
        altText: w.undoAlt,
        onAction: () =>
          setIds((all) => {
            if (all.includes(e.id)) return all;
            const next = [...all];
            next.splice(Math.min(at, next.length), 0, e.id);
            return next;
          }),
      },
    });
  };

  /** A routine action: the sheet closes, then the banner says what happened. */
  const act = (title: string, start: string) => () => {
    setSheetOpen(false);
    banner(title, start);
  };

  const routineSheet = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen} detents={DETENTS} defaultDetent={0}>
      <SheetTrigger>
        <IconButton icon="more" label={w.more} />
      </SheetTrigger>
      <SheetContent title={t(workout.title, lang)} description={w.sheetTitle} closeLabel={w.sheetClose}>
        <SheetBody>
          {/* One grouped list of actions. ListItem has no danger tone, so delete is told apart by its place and its icon: a component request in the report. */}
          <List variant="inset" aria-label={w.actionList}>
            <ListItem start="share" title={w.share} onSelect={act(w.shared, 'link')} chevron={false} />
            <ListItem start="copy" title={w.duplicate} onSelect={act(w.duplicated, 'copy')} chevron={false} />
            <ListItem start="edit" title={w.edit} href="#edit-routine" />
            <ListItem start="calendar" title={w.calendar} onSelect={act(w.added, 'calendar')} chevron={false} />
            <ListItem start="bell" title={w.reminder} onSelect={act(w.reminded, 'bell')} chevron={false} />
            <ListItem start="trash" title={w.del} onSelect={act(w.deleted, 'trash')} chevron={false} />
          </List>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );

  const header = <Navbar label={w.nav} items={[]} back={{ label: w.back, href: '#plan' }} heading={t(workout.title, lang)} end={routineSheet} />;

  return (
    <ScreenShell header={header}>
      <div data-gallery="fp-page">
        <p data-gallery="fp-summary">{w.summary(workout.minutes, workout.energy, shown.length, lang)}</p>

        <section data-gallery="fp-week" aria-labelledby="fp-week-title">
          <div data-gallery="fp-week-head">
            <h2 id="fp-week-title" data-gallery="fp-heading">
              {w.week}
            </h2>
            <Popover>
              <PopoverTrigger>
                <IconButton icon="info" label={w.goalInfo} size="sm" />
              </PopoverTrigger>
              <PopoverContent title={w.goalTitle} side="bottom" align="end">
                <PopoverBody>
                  <p data-gallery="fp-pop-text">{w.goalBody}</p>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          </div>
          <ProgressBar value={DONE} max={GOAL} label={w.done} valueText={(v, m) => w.weekValue(v, m)} />
        </section>

        <div data-gallery="fp-start">
          <Button tone="accent" emphasis="solid" shape="pill" size="lg" start="play" fullWidth wrap>
            {w.start}
          </Button>
        </div>

        <List variant="inset" titleLines={2} aria-label={w.exercises} data-gallery="fp-list">
          <ListSection header={w.exercises} level={2}>
            {shown.map((e, i) => {
              const name = t(e.name, lang);
              return (
                <ListItem
                  key={e.id}
                  href={`#${e.id}`}
                  chevron={false}
                  start={
                    <span data-gallery="fp-cover">
                      <Art art={e.art} />
                    </span>
                  }
                  title={name}
                  description={w.sets(e, lang)}
                  actions={
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <IconButton icon="more" label={w.rowMore(name)} emphasis="ghost" size="sm" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem start="refresh" onSelect={() => banner(w.replaced, 'refresh')}>
                          {w.replace}
                        </DropdownMenuItem>
                        <DropdownMenuItem start="edit" onSelect={() => banner(w.noted, 'edit')}>
                          {w.note}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem start="arrow-up" disabled={i === 0} onSelect={() => move(e.id, -1)}>
                          {w.up}
                        </DropdownMenuItem>
                        <DropdownMenuItem start="arrow-down" disabled={i === shown.length - 1} onSelect={() => move(e.id, 1)}>
                          {w.down}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem start="trash" tone="danger" onSelect={() => remove(e)}>
                          {w.remove}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  }
                />
              );
            })}
          </ListSection>
        </List>
      </div>
      <Toaster position="auto" />
    </ScreenShell>
  );
}
