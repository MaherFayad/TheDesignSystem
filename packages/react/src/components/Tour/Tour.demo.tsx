import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Tour, type TourSize, type TourStep } from './index';

/** The targets: a small toolbar in the case, with ids under a prefix so cases never share one. */
function Toolbar({ prefix, labels }: { prefix: string; labels: readonly string[] }) {
  return (
    <DemoRow>
      {labels.map((label, i) => (
        <Button key={label} id={`${prefix}-${i}`} size="sm">
          {label}
        </Button>
      ))}
    </DemoRow>
  );
}

const en = ['New board', 'Share board', 'Export board', 'Board settings'] as const;
const ar = ['لوحة جديدة', 'مشاركة اللوحة', 'تصدير اللوحة', 'إعدادات اللوحة'] as const;

function enSteps(prefix: string, count = 3): TourStep[] {
  const all: TourStep[] = [
    { target: `#${prefix}-0`, title: 'Start a board', body: 'Each board holds one project: frames, notes and comments.' },
    { target: `#${prefix}-1`, title: 'Share with your team', body: 'People with the link can view the board and leave comments.' },
    { target: `#${prefix}-2`, title: 'Export a copy', body: 'Download the board as a PDF or as images.', side: 'top' },
    { target: `#${prefix}-3`, title: 'Board settings', body: 'Rename the board, set its cover and pick who can edit it.', side: 'end' },
  ];
  return Array.from({ length: count }, (_, i) => all[i % all.length]!);
}

/** One tour with its toolbar and the Button that starts it. */
function TourExample({
  prefix,
  steps,
  size,
  trigger,
  start = 'Start tour',
  labels = en,
}: {
  prefix: string;
  steps: TourStep[];
  size?: TourSize;
  trigger: string;
  start?: string;
  labels?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Toolbar prefix={prefix} labels={labels} />
      <DemoRow>
        <Button data-demo-trigger={trigger} tone="accent" onClick={() => setOpen(true)}>
          {start}
        </Button>
      </DemoRow>
      <Tour steps={steps} open={open} onOpenChange={setOpen} size={size} />
    </>
  );
}

export default function TourDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm and md; the ring marks the target, the page stays usable">
        <TourExample prefix="tour-md" steps={enSteps('tour-md', 4)} trigger="md" start="Start tour" />
        <TourExample prefix="tour-sm" steps={enSteps('tour-sm', 4)} size="sm" trigger="sm" start="Start compact tour" />
        <Theme lang="ar" data-demo="content">
          <TourExample
            prefix="tour-ar"
            labels={ar}
            trigger="ar"
            start="بدء الجولة"
            steps={[
              { target: '#tour-ar-0', title: 'إنشاء لوحة', body: 'كل لوحة فيها مشروع واحد: الإطارات والملاحظات والتعليقات.', side: 'end' },
              { target: '#tour-ar-1', title: 'مشاركة الفريق', body: 'أي أحد عنده الرابط يقدر يشوف اللوحة ويعلق عليها.' },
            ]}
          />
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One step: the next button finishes the tour">
        <TourExample prefix="tour-one" steps={enSteps('tour-one', 1)} trigger="one" />
      </DemoCase>

      <DemoCase id="many" title="Four steps with back and next">
        <TourExample prefix="tour-many" steps={enSteps('tour-many', 4)} trigger="many" />
      </DemoCase>

      <DemoCase id="too-many" title="Twelve steps: the progress line keeps count; keep real tours to five">
        <TourExample prefix="tour-lots" steps={enSteps('tour-lots', 12)} trigger="too-many" />
      </DemoCase>

      <DemoCase id="long-text" title="Long title and body: they wrap">
        <TourExample
          prefix="tour-long"
          trigger="long-text"
          steps={[{ target: '#tour-long-1', title: 'Share the board with everyone on your team and every guest', body: `${sample.en.long} ${sample.en.word}` }]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <TourExample
          prefix="tour-long-ar"
          labels={ar}
          trigger="long-arabic"
          start="بدء الجولة"
          steps={[{ target: '#tour-long-ar-1', title: 'مشاركة اللوحة مع كل أعضاء الفريق والضيوف', body: sample.ar.long }]}
        />
      </DemoCase>

      <DemoCase id="error" title="A target that is not on the page: the step shows near the middle, with no ring">
        <TourExample
          prefix="tour-missing"
          trigger="error"
          steps={[{ target: '#not-on-this-page', title: 'Comments panel', body: 'Open a board to see its comments panel.' }]}
        />
      </DemoCase>
    </DemoPage>
  );
}
