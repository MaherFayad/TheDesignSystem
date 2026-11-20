import { useState } from 'react';
import { DemoCase, DemoPage } from '../../demo';
import { Button } from '../Button';
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
function WithAction() {
  const [page, setPage] = useState(1);
  const last = page === en.length;
  return (
    <div style={{ ...frame, display: 'grid', gap: 'var(--ds-space-m)' }}>
      <Pager label="Introduction" dotsLabel="Introduction pages" page={page} onPageChange={setPage}>
        {en.map((tip) => (
          <PagerPage key={tip.title}>
            <div style={panel}>
              <h3 style={heading}>{tip.title}</h3>
              <p style={text}>{tip.body}</p>
            </div>
          </PagerPage>
        ))}
      </Pager>
      <Button tone="accent" emphasis="solid" shape="pill" fullWidth disabled={last} onClick={() => setPage(page + 1)}>
        Show next tip
      </Button>
    </div>
  );
}

export default function PagerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Swipe between pages, or use the arrow keys, Page Up and Page Down, or the dots">
        <Tips tips={en} label="Introduction" dotsLabel="Introduction pages" />
      </DemoCase>

      <DemoCase id="one" title="One page: no dots">
        <Tips tips={en.slice(0, 1)} label="Introduction" dotsLabel="Introduction pages" />
      </DemoCase>

      <DemoCase id="many" title="Controlled: the action under the pages goes forward">
        <WithAction />
      </DemoCase>

      <DemoCase id="too-many" title="Eight pages: the dots shrink to the compact track when they do not fit">
        <Tips
          tips={Array.from({ length: 8 }, (_, i) => ({ title: `Tip ${i + 1}`, body: 'Each tip is one page; swipe or press a dot.' }))}
          label="Tips"
          dotsLabel="Tip pages"
        />
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the page grows, the pages stay one width">
        <Tips
          tips={[
            { title: 'Plan a whole week of training around the days you are free, and change it any time', body: Array(3).fill(en[0]!.body).join(' ') },
            en[1]!,
          ]}
          label="Introduction"
          dotsLabel="Introduction pages"
        />
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
