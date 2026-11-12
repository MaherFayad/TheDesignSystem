import { DemoCase, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { DemoBox } from '../Stack/DemoBox';
import { Grid, GridItem } from './index';

const six = sample.en.items.slice(0, 6);

export default function GridDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Fixed columns, auto-fit sizes, spans and gaps">
        {([2, 3, 4] as const).map((columns) => (
          <Grid key={columns} columns={columns} gap="s">
            {six.slice(0, columns * 2).map((t) => (
              <DemoBox key={t}>{`${columns} columns: ${t}`}</DemoBox>
            ))}
          </Grid>
        ))}
        {(['sm', 'md', 'lg'] as const).map((min) => (
          <Grid key={min} minItemSize={min} gap="s">
            {six.map((t) => (
              <DemoBox key={t}>{`Auto-fit ${min}: ${t}`}</DemoBox>
            ))}
          </Grid>
        ))}
        <Grid columns={4} gap="s">
          <GridItem span={2} rowSpan={2}>
            <DemoBox style={{ blockSize: '100%' }}>Span 2 by 2</DemoBox>
          </GridItem>
          <DemoBox>One</DemoBox>
          <DemoBox>Two</DemoBox>
          <DemoBox>Three</DemoBox>
          <DemoBox>Four</DemoBox>
          <GridItem span="full">
            <DemoBox>Full row</DemoBox>
          </GridItem>
        </Grid>
        <Grid columns={3} gap="2xs" rowGap="xl">
          {six.map((t) => (
            <DemoBox key={t}>{`Gap 2xs, row gap xl: ${t}`}</DemoBox>
          ))}
        </Grid>
        <Theme dir="rtl" lang="ar">
          <Grid columns={3} gap="s">
            {sample.ar.items.slice(0, 6).map((t, i) => (
              <DemoBox key={t}>{`${i + 1}. ${t}`}</DemoBox>
            ))}
          </Grid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No items: the grid takes no space">
        <Grid columns={3} />
        <p>The empty grid above adds no height.</p>
      </DemoCase>

      <DemoCase id="one" title="One item in an auto-fit grid">
        <Grid>
          <DemoBox>{sample.en.short}</DemoBox>
        </Grid>
      </DemoCase>

      <DemoCase id="many" title="A list rendered as a grid">
        <Grid as="ul" minItemSize="sm" gap="s">
          {sample.en.items.map((t) => (
            <GridItem key={t} as="li">
              <DemoBox>{t}</DemoBox>
            </GridItem>
          ))}
        </Grid>
      </DemoCase>

      <DemoCase id="too-many" title="Twelve columns, kept on phones">
        <Grid columns={12} gap="2xs" keepColumns>
          {Array.from({ length: 36 }, (_, i) => (
            <DemoBox key={i} style={{ paddingInline: 'var(--ds-space-2xs)' }}>
              {String(i + 1)}
            </DemoBox>
          ))}
        </Grid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text and a long word in cells">
        <Grid columns={3} gap="m">
          <DemoBox>{sample.en.long}</DemoBox>
          <DemoBox>{sample.en.word}</DemoBox>
          <DemoBox>{sample.en.short}</DemoBox>
        </Grid>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text in cells" lang="ar">
        <Grid columns={3} gap="m">
          <DemoBox>{sample.ar.long}</DemoBox>
          <DemoBox>{sample.ar.word}</DemoBox>
          <DemoBox>{sample.ar.short}</DemoBox>
        </Grid>
      </DemoCase>
    </DemoPage>
  );
}
