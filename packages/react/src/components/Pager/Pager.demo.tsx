// Pager demo. The copy follows the page language: with lang=ar every case
// reads Arabic.
import { useState } from 'react';
import { DemoCase, DemoPage } from '../../demo';
import { useTheme } from '../../theme/hooks';
import { Button } from '../Button';
import { isArabic } from '../Popover/FloatingLayer';
import { Pager, PagerPage } from './index';

/** A phone wide box for the pages. Tokens only. */
const frame = { inlineSize: 'min(100%, 24rem)' } as const;
/** One page: a tinted panel with a heading and text. */
const panel = {
  display: 'grid',
  alignContent: 'start',
  gap: 'var(--ds-space-s)',
  minBlockSize: '12rem',
  padding: 'var(--ds-space-l)',
  borderRadius: 'var(--ds-radius-card)',
  background: 'var(--ds-color-bg-overlay-5)',
} as const;
const heading = { margin: 0, fontSize: 'var(--ds-font-size-xl)' } as const;
const text = { margin: 0 } as const;

interface Tip {
  title: string;
  body: string;
}

const en: Tip[] = [
  { title: 'Plan your week of training', body: 'Pick the days you train, and the plan sets the workouts around them.' },
  { title: 'Log every set as you go', body: 'Add the weight and the reps after each set. Your progress for the week fills in by itself.' },
  { title: 'Train with a friend', body: 'Share a workout with Faisal or Noura and see how the week goes for both of you.' },
];

const ar: Tip[] = [
  { title: 'خطة تمارينك للأسبوع', body: 'الخطة ترتب تمارين الأسبوع على حسب الأيام المختارة للتمرين.' },
  { title: 'تسجيل كل مجموعة أول بأول', body: 'الوزن والعدات تتسجل بعد كل مجموعة، وتقدمك في الأسبوع يتجدد لحاله.' },
  { title: 'التمرين مع الأصدقاء', body: 'مشاركة التمرين مع فيصل أو نورة، وتشوفون سوا كيف ماشي أسبوعكم.' },
];

const words = {
  en: {
    tips: en,
    intro: 'Introduction',
    introPages: 'Introduction pages',
    next: 'Show next tip',
    tip: (n: number) => `Tip ${n}`,
    tipBody: 'Each tip is one page; swipe or press a dot.',
    tipsLabel: 'Tips',
    tipPages: 'Tip pages',
    longTitle: 'Plan a whole week of training around the days you are free, and change it any time',
  },
  ar: {
    tips: ar,
    intro: 'المقدمة',
    introPages: 'صفحات المقدمة',
    next: 'عرض النصيحة التالية',
    tip: (n: number) => `النصيحة ${n}`,
    tipBody: 'كل نصيحة صفحة، اسحب أو اضغط على نقطة.',
    tipsLabel: 'النصائح',
    tipPages: 'صفحات النصائح',
    longTitle: 'خطة تمارين كاملة للأسبوع على حسب الأيام اللي تناسبك، وتقدر تغيرها في أي وقت',
  },
};

type Words = (typeof words)['en'];

function Tips({ tips, label, dotsLabel }: { tips: Tip[]; label: string; dotsLabel: string }) {
  return (
    <div style={frame}>
      <Pager label={label} dotsLabel={dotsLabel}>
        {tips.map((tip) => (
          <PagerPage key={tip.title}>
            <div style={panel}>
              <h3 style={heading}>{tip.title}</h3>
              <p style={text}>{tip.body}</p>
            </div>
          </PagerPage>
        ))}
      </Pager>
    </div>
  );
}

/** Controlled from outside: the action under the pages goes forward. */
function WithAction({ w }: { w: Words }) {
  const [page, setPage] = useState(1);
  const last = page === w.tips.length;
  return (
    <div style={{ ...frame, display: 'grid', gap: 'var(--ds-space-m)' }}>
      <Pager label={w.intro} dotsLabel={w.introPages} page={page} onPageChange={setPage}>
        {w.tips.map((tip) => (
          <PagerPage key={tip.title}>
            <div style={panel}>
              <h3 style={heading}>{tip.title}</h3>
              <p style={text}>{tip.body}</p>
            </div>
          </PagerPage>
        ))}
      </Pager>
      <Button tone="accent" emphasis="solid" shape="pill" fullWidth disabled={last} onClick={() => setPage(page + 1)}>
        {w.next}
      </Button>
    </div>
  );
}

export default function PagerDemo() {
  const w = words[isArabic(useTheme().lang) ? 'ar' : 'en'];
  return (
    <DemoPage>
      <DemoCase id="variants" title="Swipe between pages, or use the arrow keys, Page Up and Page Down, or the dots">
        <Tips tips={w.tips} label={w.intro} dotsLabel={w.introPages} />
      </DemoCase>

      <DemoCase id="one" title="One page: no dots">
        <Tips tips={w.tips.slice(0, 1)} label={w.intro} dotsLabel={w.introPages} />
      </DemoCase>

      <DemoCase id="many" title="Controlled: the action under the pages goes forward">
        <WithAction w={w} />
      </DemoCase>

      <DemoCase id="too-many" title="Eight pages: the dots shrink to the compact track when they do not fit">
        <Tips tips={Array.from({ length: 8 }, (_, i) => ({ title: w.tip(i + 1), body: w.tipBody }))} label={w.tipsLabel} dotsLabel={w.tipPages} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the page grows, the pages stay one width">
        <Tips tips={[{ title: w.longTitle, body: Array(3).fill(w.tips[0]!.body).join(' ') }, w.tips[1]!]} label={w.intro} dotsLabel={w.introPages} />
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the first page is at the right, a swipe to the left goes forward" lang="ar">
        <Tips tips={ar} label="المقدمة" dotsLabel="صفحات المقدمة" />
        <Tips
          tips={[{ title: 'خطة تمارين كاملة للأسبوع على حسب الأيام اللي تناسبك، وتقدر تغيرها في أي وقت', body: Array(3).fill(ar[0]!.body).join(' ') }, ar[1]!]}
          label="المقدمة"
          dotsLabel="صفحات المقدمة"
        />
      </DemoCase>
    </DemoPage>
  );
}
