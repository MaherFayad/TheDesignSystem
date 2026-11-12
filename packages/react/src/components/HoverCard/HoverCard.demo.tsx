import type { ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { HoverCard, HoverCardContent, HoverCardTrigger, type HoverCardSize } from './index';

interface Person {
  name: string;
  handle: string;
  bio?: string;
  meta?: string;
}

const sara: Person = {
  name: 'Sara Ahmed',
  handle: '@sara',
  bio: 'Design lead on the spring launch. Owns the brand board and the icon set.',
  meta: '12 boards, joined March 2024',
};

/**
 * A person card in a sentence: the link opens the profile page, the card
 * previews it. The gallery opens cards at once (openDelay 0) so the contract
 * suite and screenshots can hover them; products keep the 500 ms default.
 */
function PersonCard({
  person,
  size,
  trigger,
  side,
  children,
}: {
  person: Person;
  size?: HoverCardSize;
  trigger: string;
  side?: 'top' | 'bottom' | 'start' | 'end';
  children?: ReactNode;
}) {
  return (
    <HoverCard size={size} openDelay={0}>
      <HoverCardTrigger>
        <a href={`#profile-${person.handle.slice(1)}`} data-demo-trigger={trigger}>
          {person.name}
        </a>
      </HoverCardTrigger>
      <HoverCardContent side={side}>
        <p>
          <strong>{person.name}</strong> <bdi>{person.handle}</bdi>
        </p>
        {children ?? (
          <>
            <p>{person.bio ?? 'No bio yet.'}</p>
            {person.meta && <p>{person.meta}</p>}
          </>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

/** The card's link inside running text, as in a product. */
function Line({ before = 'Last edit by', after = '5 minutes ago.', children }: { before?: string; after?: string; children: ReactNode }) {
  return (
    <p>
      {before} {children} {after}
    </p>
  );
}

export default function HoverCardDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes sm and md: hover or focus the name">
        <DemoRow label="sm">
          <Line>
            <PersonCard person={sara} size="sm" trigger="sm" />
          </Line>
        </DemoRow>
        <DemoRow label="md">
          <Line>
            <PersonCard person={sara} size="md" trigger="md" />
          </Line>
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <Line before="آخر تعديل من" after="قبل 5 دقايق.">
              <PersonCard
                person={{ name: 'سارة أحمد', handle: '@sara', bio: 'مسؤولة التصميم في إطلاق الربيع.', meta: '12 لوحة' }}
                trigger="ar"
              />
            </Line>
          </DemoRow>
          <DemoRow label="جنب النهاية">
            <Line before="آخر تعديل من" after="قبل 5 دقايق.">
              <PersonCard person={{ name: 'سارة أحمد', handle: '@sara', bio: 'مسؤولة التصميم.' }} side="end" trigger="ar-end" />
            </Line>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="A person with no bio: the card says so">
        <Line>
          <PersonCard person={{ name: 'Omar Ali', handle: '@omar' }} trigger="empty" />
        </Line>
      </DemoCase>

      <DemoCase id="one" title="One line: a link preview">
        <p>
          Read the{' '}
          <HoverCard size="sm" openDelay={0}>
            <HoverCardTrigger>
              <a href="#brand-guide" data-demo-trigger="one">
                brand guide
              </a>
            </HoverCardTrigger>
            <HoverCardContent>
              <p>Brand guide, updated yesterday.</p>
            </HoverCardContent>
          </HoverCard>{' '}
          before you export.
        </p>
      </DemoCase>

      <DemoCase id="long-text" title="Long name and bio: they wrap">
        <Line>
          <PersonCard
            person={{
              name: 'Alexandra Konstantinopoulou Whitfield',
              handle: '@alexandra.konstantinopoulou',
              bio: `${sample.en.long} ${sample.en.word}`,
            }}
            trigger="long-text"
          />
        </Line>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <Line before="آخر تعديل من" after="قبل 5 دقايق.">
          <PersonCard person={{ name: 'عبدالرحمن الشمري', handle: '@abdulrahman', bio: sample.ar.long }} trigger="long-arabic" />
        </Line>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the card says what it waits for">
        <Line>
          <PersonCard person={sara} trigger="loading">
            <p>Loading profile</p>
          </PersonCard>
        </Line>
      </DemoCase>

      <DemoCase id="error" title="Error: the card points to the page itself">
        <Line>
          <PersonCard person={sara} trigger="error">
            <p>The profile did not load. Open the link to see it.</p>
          </PersonCard>
        </Line>
      </DemoCase>
    </DemoPage>
  );
}
