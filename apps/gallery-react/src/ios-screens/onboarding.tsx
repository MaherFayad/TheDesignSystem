// M10.8 onboarding: three pages that introduce a training app, with page
// dots and one capsule action under them, and a close button over the
// picture that skips the rest (docs/plan/reset-ios-families.md section 5).
//
// Rebuilt from the structure of the reference in `meta.references`: a
// picture over the top half, a short title and two lines of text, the page
// dots, and a full width capsule at the bottom over the home bar; a round
// close button in the corner of the picture. Its proportions and
// behaviour, never its pictures or words. The artwork is the kit's, drawn
// from tokens.
//
// Every control is a component of @the-system/react:
// - the close button: CloseButton with solid emphasis, the raised disc
//   that holds over the picture (order S1);
// - the page dots: Pagination with variant dots (arrow keys, a press on a
//   dot, the compact track when the dots do not fit);
// - the actions: Button with shape pill (and a ghost Button for sign in on
//   the last page).
// This file's CSS (./onboarding.css) is page layout only.
import { useRef, useState } from 'react';
import { Button, CloseButton, Pagination } from '@the-system/react';
import { Art, ScreenShell, t, type ArtName, type Text } from './kit';
import type { ScreenMeta, ScreenProps } from './types';
import './onboarding.css';

export const meta: ScreenMeta = {
  id: 'onboarding',
  order: 'M10.8',
  title: 'Three pages of onboarding with page dots and a capsule action',
  families: ['page control', 'capsule buttons', 'glass close button'],
  references: [{ label: 'Onboarding with page dots', href: 'https://mobbin.com/screens/553ba4e0-41b9-4daa-9e3f-26b882e49254' }],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'built',
};

interface Page {
  id: string;
  art: ArtName;
  title: Text;
  body: Text;
}

const pages: readonly Page[] = [
  {
    id: 'plan',
    art: 'dawn',
    title: { en: 'Plan your week of training', ar: 'خطة تمارينك للأسبوع' },
    body: {
      en: 'Pick the days you train, and the plan sets the workouts around them.',
      ar: 'الخطة ترتب تمارين الأسبوع على حسب الأيام المختارة للتمرين.',
    },
  },
  {
    id: 'track',
    art: 'tide',
    title: { en: 'Log every set as you go', ar: 'تسجيل كل مجموعة أول بأول' },
    body: {
      en: 'Add the weight and the reps after each set. Your progress for the week fills in by itself.',
      ar: 'الوزن والعدات تتسجل بعد كل مجموعة، وتقدمك في الأسبوع يتجدد لحاله.',
    },
  },
  {
    id: 'friends',
    art: 'coral',
    title: { en: 'Train with a friend', ar: 'التمرين مع الأصدقاء' },
    body: {
      en: 'Share a workout with Faisal or Noura and see how the week goes for both of you.',
      ar: 'مشاركة التمرين مع فيصل أو نورة، وتشوفون سوا كيف ماشي أسبوعكم.',
    },
  },
];

const words = {
  en: {
    region: 'Introduction',
    skip: 'Skip introduction',
    dots: 'Introduction pages',
    next: 'Show next tip',
    create: 'Create account',
    signIn: 'Sign in to your account',
  },
  ar: {
    region: 'المقدمة',
    skip: 'تخطي المقدمة',
    dots: 'صفحات المقدمة',
    next: 'النصيحة التالية',
    create: 'إنشاء حساب',
    signIn: 'تسجيل الدخول',
  },
} as const;

export function Screen({ lang }: ScreenProps) {
  const w = words[lang];
  const [page, setPage] = useState(1);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const current = pages[page - 1] ?? pages[0];
  if (!current) return null;
  const last = page === pages.length;

  /** The pages are a line with two ends: the action goes forward, the dots go either way. */
  const go = (to: number) => setPage(Math.min(pages.length, Math.max(1, to)));

  const skip = () => {
    // The skip leads to the last page, the one with the account actions; focus goes to its title.
    go(pages.length);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  return (
    <ScreenShell>
      <section data-gallery="ob-page" aria-label={w.region}>
        <div data-gallery="ob-picture">
          <Art art={current.art} shape="square" />
          {!last && (
            <div data-gallery="ob-close">
              <CloseButton label={w.skip} emphasis="solid" onClick={skip} />
            </div>
          )}
        </div>
        <div data-gallery="ob-text" aria-live="polite">
          <h1 data-gallery="ob-title" ref={titleRef} tabIndex={-1}>
            {t(current.title, lang)}
          </h1>
          <p data-gallery="ob-body">{t(current.body, lang)}</p>
        </div>
        <div data-gallery="ob-dots">
          <Pagination variant="dots" pageCount={pages.length} page={page} onPageChange={go} label={w.dots} />
        </div>
        <div data-gallery="ob-actions">
          {last ? (
            <>
              <Button tone="accent" emphasis="solid" shape="pill" size="lg" fullWidth wrap>
                {w.create}
              </Button>
              <Button tone="accent" emphasis="ghost" shape="pill" size="lg" fullWidth wrap>
                {w.signIn}
              </Button>
            </>
          ) : (
            <Button tone="accent" emphasis="solid" shape="pill" size="lg" fullWidth wrap onClick={() => go(page + 1)}>
              {w.next}
            </Button>
          )}
        </div>
      </section>
    </ScreenShell>
  );
}
