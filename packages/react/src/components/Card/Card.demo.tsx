import type { CSSProperties } from 'react';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { Icon } from '@the-system/icons/react';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import {
  Card,
  CardActions,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
  type CardEmphasis,
  type CardSize,
} from './index';

const emphases: CardEmphasis[] = ['outline', 'soft', 'solid'];
const sizes: CardSize[] = ['sm', 'md', 'lg'];

/** A stand in for a cover image: a token filled box with the image icon, so screenshots need no network. */
const coverStyle: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  aspectRatio: '16 / 9',
  backgroundColor: 'var(--ds-color-bg-surface-3)',
  color: 'var(--ds-color-text-subtle)',
};

function Cover() {
  return (
    <div style={coverStyle}>
      <Icon name="image" size="lg" />
    </div>
  );
}

const boards = [
  ['Spring launch', 'Updated 2 hours ago'],
  ['Brand refresh', 'Updated yesterday'],
  ['Onboarding flow', 'Updated 3 days ago'],
  ['Pricing page', 'Updated last week'],
  ['Mobile app', 'Updated 12 March'],
  ['Help center', 'Updated 2 March'],
  ['Email templates', 'Updated 28 February'],
  ['Design tokens', 'Updated 20 February'],
  ['Checkout', 'Updated 14 February'],
  ['Search', 'Updated 9 February'],
  ['Settings', 'Updated 2 February'],
  ['Dashboard', 'Updated 29 January'],
] as const;

const boardsAr = [
  ['إطلاق الربيع', 'آخر تحديث قبل ساعتين'],
  ['تجديد الهوية', 'آخر تحديث أمس'],
  ['رحلة التسجيل', 'آخر تحديث قبل 3 أيام'],
] as const;

/** A whole card link with media, a description and one action above the link. */
function BoardCard({
  title,
  meta,
  emphasis,
  size,
  selected,
  disabled,
  more = 'More actions for',
  count = '4 boards',
}: {
  title: string;
  meta: string;
  emphasis?: CardEmphasis;
  size?: CardSize;
  selected?: boolean;
  disabled?: boolean;
  more?: string;
  count?: string;
}) {
  return (
    <Card emphasis={emphasis} size={size} selected={selected} disabled={disabled}>
      <CardMedia>
        <Cover />
      </CardMedia>
      <CardHeader>
        <CardTitle>
          <CardLink href={`#${encodeURIComponent(title)}`} aria-current={selected ? 'true' : undefined}>
            {title}
          </CardLink>
        </CardTitle>
        <CardDescription>{meta}</CardDescription>
      </CardHeader>
      <CardFooter>
        <span>{size ? `Size ${size}` : count}</span>
        <CardActions>
          <IconButton icon="more" label={`${more} ${title}`} emphasis="ghost" size="sm" disabled={disabled} />
        </CardActions>
      </CardFooter>
    </Card>
  );
}

export default function CardDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: emphasis outline, soft and solid at sizes sm, md and lg">
        {sizes.map((size) => (
          <DemoGrid key={size} min="14rem">
            {emphases.map((emphasis) => (
              <BoardCard key={emphasis} title={`${emphasis[0]!.toUpperCase()}${emphasis.slice(1)} card`} meta="Updated 2 hours ago" emphasis={emphasis} size={size} />
            ))}
          </DemoGrid>
        ))}
        <DemoGrid min="14rem">
          <BoardCard title="Selected card" meta="Chosen for the export" selected />
          <Card emphasis="soft">
            <CardHeader>
              <CardTitle>Static card</CardTitle>
              <CardDescription>No link: the card is not interactive.</CardDescription>
            </CardHeader>
            <CardBody>Plan the launch with your team and share the board when it is ready.</CardBody>
            <CardFooter>
              <span>Draft</span>
              <CardActions>
                <Button size="sm">Share board</Button>
                <Button size="sm" tone="accent" emphasis="solid">
                  Publish board
                </Button>
              </CardActions>
            </CardFooter>
          </Card>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="14rem">
            {boardsAr.map(([title, meta], i) => (
              <BoardCard key={title} title={title} meta={meta} emphasis={emphases[i]} more="خيارات" count="4 لوحات" />
            ))}
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty: a card with nothing in its body yet">
        <DemoGrid min="14rem">
          <Card>
            <CardHeader>
              <CardTitle>Recent files</CardTitle>
              <CardDescription>No files yet. Files you open show up here.</CardDescription>
            </CardHeader>
            <CardFooter>
              <CardActions>
                <Button size="sm" start="upload">
                  Upload file
                </Button>
              </CardActions>
            </CardFooter>
          </Card>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="one" title="One card">
        <DemoGrid min="16rem">
          <BoardCard title={boards[0][0]} meta={boards[0][1]} />
        </DemoGrid>
      </DemoCase>

      <DemoCase id="many" title="Many cards in a grid">
        <DemoGrid min="14rem">
          {boards.slice(0, 6).map(([title, meta]) => (
            <BoardCard key={title} title={title} meta={meta} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="too-many" title="Too many: twelve cards wrap, nothing scrolls sideways">
        <DemoGrid min="10rem">
          {boards.map(([title, meta]) => (
            <Card key={title} size="sm" emphasis="soft">
              <CardHeader>
                <CardTitle>
                  <CardLink href={`#${encodeURIComponent(title)}`}>{title}</CardLink>
                </CardTitle>
                <CardDescription>{meta}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long text wraps inside the card">
        <DemoGrid min="16rem">
          <Card>
            <CardHeader>
              <CardTitle>
                <CardLink href="#long">{`${sample.en.word} board for the spring launch of the new product line`}</CardLink>
              </CardTitle>
              <CardDescription>{sample.en.long}</CardDescription>
            </CardHeader>
            <CardBody>{sample.en.long}</CardBody>
            <CardFooter>
              <span>Updated 2 hours ago by Sara Ahmed</span>
              <CardActions>
                <Button size="sm">Share board</Button>
              </CardActions>
            </CardFooter>
          </Card>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoGrid min="16rem">
          <Card>
            <CardMedia>
              <Cover />
            </CardMedia>
            <CardHeader>
              <CardTitle>
                <CardLink href="#long-ar">لوحة إطلاق الربيع للمنتجات الجديدة مع كل الملاحظات والمراجع</CardLink>
              </CardTitle>
              <CardDescription>{sample.ar.short}</CardDescription>
            </CardHeader>
            <CardBody>{sample.ar.long}</CardBody>
            <CardFooter>
              <span>آخر تحديث قبل ساعتين</span>
              <CardActions>
                <Button size="sm">مشاركة اللوحة</Button>
              </CardActions>
            </CardFooter>
          </Card>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: the link loses its href, the title mutes and the media dims">
        <DemoGrid min="14rem">
          <BoardCard title="Archived board" meta="An owner can restore it from the archive" disabled />
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
