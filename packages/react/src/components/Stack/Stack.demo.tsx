import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme';
import { DemoBox } from './DemoBox';
import { Stack } from './index';

const three = ['Inbox', 'Drafts', 'Sent'];
const threeAr = ['الوارد', 'المسودات', 'المرسلة'];

export default function StackDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Directions, gaps, alignment and wrap">
        <DemoRow label="Block, gap s">
          <Stack>
            {three.map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </DemoRow>
        <DemoRow label="Inline, gap 2xs">
          <Stack direction="inline" gap="2xs">
            {three.map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </DemoRow>
        <DemoRow label="Inline, gap xl">
          <Stack direction="inline" gap="xl">
            {three.map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </DemoRow>
        <DemoRow label="Inline, gap none">
          <Stack direction="inline" gap="none">
            {three.map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </DemoRow>
        {(['start', 'center', 'end', 'stretch'] as const).map((align) => (
          <DemoRow key={align} label={`Align ${align}`}>
            <Stack direction="inline" align={align} style={{ minBlockSize: 'var(--ds-space-9xl)' }}>
              <DemoBox>Short</DemoBox>
              <DemoBox style={{ paddingBlock: 'var(--ds-space-xl)' }}>Tall</DemoBox>
            </Stack>
          </DemoRow>
        ))}
        {(['start', 'center', 'end', 'between'] as const).map((justify) => (
          <Stack key={justify} direction="inline" justify={justify}>
            <DemoBox>{`Justify ${justify}`}</DemoBox>
            <DemoBox>End item</DemoBox>
          </Stack>
        ))}
        <Theme dir="rtl" lang="ar">
          <Stack direction="inline" justify="between">
            {threeAr.map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No children: the stack takes no space">
        <Stack direction="inline" gap="xl" />
        <p>The empty stack above adds no height.</p>
      </DemoCase>

      <DemoCase id="one" title="One child">
        <Stack>
          <DemoBox>{sample.en.short}</DemoBox>
        </Stack>
      </DemoCase>

      <DemoCase id="many" title="A list rendered as a stack">
        <Stack as="ul" gap="2xs">
          {sample.en.items.map((t) => (
            <DemoBox key={t} as="li">
              {t}
            </DemoBox>
          ))}
        </Stack>
      </DemoCase>

      <DemoCase id="too-many" title="Too many for one line: wrap">
        <Stack direction="inline" gap="xs" wrap>
          {[...sample.en.items, ...sample.en.items, ...sample.en.items].map((t, i) => (
            <DemoBox key={`${t}-${i}`}>{t}</DemoBox>
          ))}
        </Stack>
      </DemoCase>

      <DemoCase id="long-text" title="Long text and a long word in a row">
        <Stack direction="inline" gap="m" align="start">
          <DemoBox style={{ flex: '1 1 0' }}>{sample.en.long}</DemoBox>
          <DemoBox style={{ flex: '1 1 0' }}>{sample.en.word}</DemoBox>
        </Stack>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text in a row" lang="ar">
        <Stack direction="inline" gap="m" align="start">
          <DemoBox style={{ flex: '1 1 0' }}>{sample.ar.long}</DemoBox>
          <DemoBox style={{ flex: '1 1 0' }}>{sample.ar.short}</DemoBox>
        </Stack>
        <Stack direction="inline" gap="xs" wrap>
          {sample.ar.items.map((t) => (
            <DemoBox key={t}>{t}</DemoBox>
          ))}
        </Stack>
      </DemoCase>
    </DemoPage>
  );
}
