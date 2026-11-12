import type { CSSProperties, ReactNode } from 'react';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { ScrollArea, type ScrollAreaSize } from './index';

const sizes: ScrollAreaSize[] = ['sm', 'md'];

/** A framed box of a fixed block size, so the area has something to scroll. */
const box = (blockSize: string, maxInlineSize = '100%'): CSSProperties => ({
  blockSize,
  // A max, not a fixed size: a fixed 20rem with the page padding is wider than a 320px screen.
  inlineSize: '100%',
  maxInlineSize,
  border: 'var(--ds-border-width-default) solid var(--ds-color-border-default)',
  borderRadius: 'var(--ds-radius-card)',
});

const pad: CSSProperties = { padding: 'var(--ds-space-l)', margin: 0 };

const listStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 'var(--ds-space-s) var(--ds-space-l)' };

function List({ items }: { items: readonly string[] }) {
  return (
    <ul style={listStyle}>
      {items.map((item, i) => (
        <li key={`${item}-${i}`} style={{ paddingBlock: 'var(--ds-space-s)' }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Strip({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 'var(--ds-space-s)', padding: 'var(--ds-space-l)', inlineSize: 'max-content' }}>{children}</div>;
}

const releaseNotes = [
  'Boards open twice as fast on slow networks.',
  'Comments show the time in your own time zone.',
  'Exported files keep their layer names.',
  'Search finds text inside images.',
  'Shared links remember the last zoom level.',
  'The color picker reads values from the clipboard.',
  'Frames snap to the grid while you drag them.',
  'Version history lists who made each change.',
  'Templates load from the side panel.',
  'Keyboard shortcuts show in every menu.',
];

const tooMany = Array.from({ length: 200 }, (_, i) => `Activity ${i + 1}: a file was updated`);

/** ScrollArea in every content case. */
export default function ScrollAreaDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes and orientations">
        <DemoGrid min="14rem">
          {sizes.map((size) => (
            <ScrollArea key={size} size={size} label={`Release notes, ${size}`} style={box('10rem')}>
              <List items={releaseNotes} />
            </ScrollArea>
          ))}
          <ScrollArea orientation="horizontal" label="Board tags" style={{ ...box('auto'), alignSelf: 'start' }}>
            <Strip>
              {sample.en.items.map((item) => (
                <span key={item} style={{ whiteSpace: 'nowrap' }}>
                  {item}
                </span>
              ))}
            </Strip>
          </ScrollArea>
          <ScrollArea orientation="both" label="Wide notes" style={box('10rem')}>
            <div style={{ ...pad, inlineSize: '40rem' }}>
              {releaseNotes.map((note) => (
                <p key={note} style={{ margin: 0, paddingBlock: 'var(--ds-space-2xs)' }}>
                  {note} {note}
                </p>
              ))}
            </div>
          </ScrollArea>
          <ScrollArea scrollbars="always" fades={false} label="Release notes, scrollbar always shown" style={box('10rem')}>
            <List items={releaseNotes} />
          </ScrollArea>
        </DemoGrid>
        <Theme lang="ar">
          <DemoRow label="العربية">
            <ScrollArea label="المجلدات" style={box('8rem', '14rem')}>
              <List items={sample.ar.items} />
            </ScrollArea>
            <ScrollArea orientation="horizontal" label="الوسوم" style={{ ...box('auto', '14rem'), alignSelf: 'start' }}>
              <Strip>
                {sample.ar.items.map((item) => (
                  <span key={item} style={{ whiteSpace: 'nowrap' }}>
                    {item}
                  </span>
                ))}
              </Strip>
            </ScrollArea>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, nothing to scroll">
        <ScrollArea label="Release notes" style={box('6rem', '18rem')}>
          <p style={pad}>No release notes yet. New versions show here.</p>
        </ScrollArea>
      </DemoCase>

      <DemoCase id="one" title="One item, no overflow">
        <ScrollArea label="Release notes" style={box('6rem', '18rem')}>
          <List items={releaseNotes.slice(0, 1)} />
        </ScrollArea>
      </DemoCase>

      <DemoCase id="many" title="Many items with buttons inside">
        <ScrollArea label="Folders" style={box('12rem', '20rem')}>
          <div style={{ display: 'grid', gap: 'var(--ds-space-s)', padding: 'var(--ds-space-l)' }}>
            {sample.en.items.map((item) => (
              <Button key={item} emphasis="ghost" fullWidth>
                {`Open ${item.toLowerCase()}`}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </DemoCase>

      <DemoCase id="too-many" title="Two hundred items">
        <ScrollArea label="Activity" style={box('14rem', '20rem')}>
          <List items={tooMany} />
        </ScrollArea>
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <ScrollArea label="Notes" style={box('8rem', '18rem')}>
          <p style={{ ...pad, overflowWrap: 'anywhere' }}>
            {sample.en.long} {sample.en.word} {sample.en.long}
          </p>
        </ScrollArea>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <ScrollArea label="الملاحظات" style={box('8rem', '18rem')}>
          <p style={pad}>
            {sample.ar.long} {sample.ar.long}
          </p>
        </ScrollArea>
      </DemoCase>
    </DemoPage>
  );
}
