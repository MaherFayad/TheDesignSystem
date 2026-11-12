import type { CSSProperties } from 'react';
import { Icon } from '@the-system/icons/react';
import { DemoCase, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { IconButton } from '../IconButton';
import { Tile, TileActions, TileGrid, TileLink, TileMedia, TileMeta, TileTitle, type TileSize } from './index';

/** A stand in for a thumbnail: a token filled box with the image icon, so screenshots need no network. */
const thumbStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  aspectRatio: '4 / 3',
  backgroundColor: 'var(--ds-color-bg-surface-4)',
  color: 'var(--ds-color-text-subtle)',
};

function Thumb() {
  return (
    <div style={thumbStyle}>
      <Icon name="image" size="lg" />
    </div>
  );
}

const files = [
  ['Spring launch', 'Edited 2 hours ago'],
  ['Brand refresh', 'Edited yesterday'],
  ['Onboarding flow', 'Edited 3 days ago'],
  ['Pricing page', 'Edited last week'],
  ['Mobile app', 'Edited 12 March'],
  ['Help center', 'Edited 2 March'],
  ['Email templates', 'Edited 28 February'],
  ['Design tokens', 'Edited 20 February'],
  ['Checkout', 'Edited 14 February'],
  ['Search', 'Edited 9 February'],
  ['Settings', 'Edited 2 February'],
  ['Dashboard', 'Edited 29 January'],
  ['Release notes', 'Edited 22 January'],
  ['Icons', 'Edited 15 January'],
  ['Empty states', 'Edited 8 January'],
  ['Marketing site', 'Edited 2 January'],
] as const;

const filesAr = [
  ['إطلاق الربيع', 'آخر تعديل قبل ساعتين'],
  ['تجديد الهوية', 'آخر تعديل أمس'],
  ['رحلة التسجيل', 'آخر تعديل قبل 3 أيام'],
  ['صفحة الأسعار', 'آخر تعديل الأسبوع الماضي'],
] as const;

function FileTile({
  title,
  meta,
  size,
  selected,
  media = true,
  more = 'More actions for',
}: {
  title: string;
  meta: string;
  size?: TileSize;
  selected?: boolean;
  media?: boolean;
  more?: string;
}) {
  return (
    <Tile size={size} selected={selected}>
      {media && (
        <TileMedia>
          <Thumb />
        </TileMedia>
      )}
      <TileTitle>
        <TileLink href={`#${encodeURIComponent(title)}`} aria-current={selected ? 'true' : undefined}>
          {title}
        </TileLink>
      </TileTitle>
      <TileMeta>{meta}</TileMeta>
      <TileActions>
        <IconButton icon="more" label={`${more} ${title}`} emphasis="ghost" size="xs" />
      </TileActions>
    </Tile>
  );
}

export default function TileDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: sizes md and sm, and a selected tile">
        <TileGrid>
          {files.slice(0, 3).map(([title, meta], i) => (
            <FileTile key={title} title={title} meta={meta} selected={i === 1} />
          ))}
          <Tile>
            <TileMedia>
              <Thumb />
            </TileMedia>
            <TileTitle>Static tile</TileTitle>
            <TileMeta>No link: not interactive</TileMeta>
          </Tile>
        </TileGrid>
        <TileGrid>
          {files.slice(3, 8).map(([title, meta]) => (
            <FileTile key={title} title={title} meta={meta} size="sm" media={false} />
          ))}
        </TileGrid>
        <Theme lang="ar" data-demo="content">
          <TileGrid>
            {filesAr.map(([title, meta]) => (
              <FileTile key={title} title={title} meta={meta} more="خيارات" />
            ))}
          </TileGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One tile">
        <TileGrid>
          <FileTile title={files[0][0]} meta={files[0][1]} />
        </TileGrid>
      </DemoCase>

      <DemoCase id="many" title="Many tiles: the 1px gap shows the parent surface">
        <TileGrid>
          {files.slice(0, 8).map(([title, meta]) => (
            <FileTile key={title} title={title} meta={meta} />
          ))}
        </TileGrid>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: sixteen small tiles wrap, nothing scrolls sideways">
        <TileGrid>
          {files.map(([title, meta]) => (
            <FileTile key={title} title={title} meta={meta} size="sm" media={false} />
          ))}
        </TileGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the title stops at two lines, the meta at one">
        <TileGrid>
          <FileTile title={`${sample.en.word} board for the spring launch of the new product line`} meta="Edited 2 hours ago by Sara Ahmed from the design team" />
          <FileTile title={sample.en.long} meta={sample.en.short} />
        </TileGrid>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <TileGrid>
          <FileTile title={sample.ar.long} meta="آخر تعديل قبل ساعتين من فريق التصميم" more="خيارات" />
          <FileTile title="لوحة إطلاق الربيع للمنتجات الجديدة" meta={sample.ar.short} more="خيارات" />
        </TileGrid>
      </DemoCase>
    </DemoPage>
  );
}
