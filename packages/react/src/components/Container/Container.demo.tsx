import type { CSSProperties } from 'react';
import { DemoCase, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { Grid } from '../Grid';
import { DemoBox } from '../Stack/DemoBox';
import { Stack } from '../Stack';
import { Container } from './index';

/** Draws the container's own box, so the gutter shows between the line and the content. */
const edge: CSSProperties = { outline: 'var(--ds-border-width-default) dashed var(--ds-color-border-default)' };

export default function ContainerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Widths and gutters">
        {(['sm', 'md', 'lg', 'xl', 'full'] as const).map((width) => (
          <Container key={width} width={width} style={edge}>
            <DemoBox>{`Width ${width}, gutter 3xl`}</DemoBox>
          </Container>
        ))}
        {(['none', 's', '8xl'] as const).map((gutter) => (
          <Container key={gutter} width="md" gutter={gutter} style={edge}>
            <DemoBox>{`Width md, gutter ${gutter}`}</DemoBox>
          </Container>
        ))}
        <Theme dir="rtl" lang="ar">
          <Container width="md" style={edge}>
            <DemoBox>{sample.ar.short}</DemoBox>
          </Container>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No content: only the gutter remains">
        <Container width="sm" style={edge} />
      </DemoCase>

      <DemoCase id="one" title="One child">
        <Container width="md" style={edge}>
          <DemoBox>{sample.en.short}</DemoBox>
        </Container>
      </DemoCase>

      <DemoCase id="many" title="A stack of items">
        <Container width="md" style={edge}>
          <Stack gap="2xs">
            {sample.en.items.slice(0, 6).map((t) => (
              <DemoBox key={t}>{t}</DemoBox>
            ))}
          </Stack>
        </Container>
      </DemoCase>

      <DemoCase id="too-many" title="A wide grid capped by the container">
        <Container width="lg" style={edge}>
          <Grid minItemSize="sm" gap="s">
            {[...sample.en.items, ...sample.en.items].map((t, i) => (
              <DemoBox key={`${t}-${i}`}>{t}</DemoBox>
            ))}
          </Grid>
        </Container>
      </DemoCase>

      <DemoCase id="long-text" title="Long text keeps a readable line length">
        <Container width="sm" style={edge}>
          <p>{sample.en.long}</p>
          <p style={{ overflowWrap: 'anywhere' }}>{sample.en.word}</p>
        </Container>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text in a narrow container" lang="ar">
        <Container width="sm" style={edge}>
          <p>{sample.ar.long}</p>
        </Container>
      </DemoCase>
    </DemoPage>
  );
}
