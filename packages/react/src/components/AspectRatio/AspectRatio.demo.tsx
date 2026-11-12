import type { ReactNode } from 'react';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Theme } from '../../theme';
import { DemoBox } from '../Stack/DemoBox';
import { AspectRatio } from './index';

const ratios = [
  ['16 by 9', 16 / 9],
  ['4 by 3', 4 / 3],
  ['1 by 1', 1],
  ['3 by 4', 3 / 4],
] as const;

/** A square picture with a circle, so crop and letterbox show. Inline svg fits through preserveAspectRatio. */
function Picture({ fit, label }: { fit: 'cover' | 'contain'; label: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet'}
      role="img"
      aria-label={label}
      style={{ color: 'var(--ds-color-text-muted)', background: 'var(--ds-color-bg-surface-2)' }}
    >
      <rect x="0" y="0" width="100" height="100" fill="currentColor" opacity="0.25" />
      <circle cx="50" cy="50" r="40" fill="currentColor" />
    </svg>
  );
}

/** Caps a single example at a phone width so it fits the screenshot. */
function Narrow({ children }: { children: ReactNode }) {
  return <div style={{ maxInlineSize: 'var(--ds-breakpoint-phone)' }}>{children}</div>;
}

function Fill({ children }: { children: string }) {
  return <DemoBox style={{ blockSize: '100%', display: 'grid', placeItems: 'center' }}>{children}</DemoBox>;
}

export default function AspectRatioDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Ratios and fit">
        <DemoGrid min="calc(var(--ds-breakpoint-phone) / 3)">
          {ratios.map(([name, ratio]) => (
                <AspectRatio key={name} ratio={ratio}>
                  <Fill>{name}</Fill>
                </AspectRatio>
          ))}
        </DemoGrid>
        <DemoGrid min="calc(var(--ds-breakpoint-phone) / 3)">
            <AspectRatio ratio={16 / 9} fit="cover">
              <Picture fit="cover" label="A circle, cropped to fill the box" />
            </AspectRatio>
            <AspectRatio ratio={16 / 9} fit="contain">
              <Picture fit="contain" label="A circle, letterboxed inside the box" />
            </AspectRatio>
        </DemoGrid>
        <Theme dir="rtl" lang="ar">
          <DemoGrid min="calc(var(--ds-breakpoint-phone) / 3)">
              <AspectRatio ratio={4 / 3}>
                <Fill>صورة الغلاف</Fill>
              </AspectRatio>
              <AspectRatio ratio={1}>
                <Fill>صورة الملف</Fill>
              </AspectRatio>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="No media yet: the box keeps its space">
        <Narrow>
          <AspectRatio ratio={16 / 9} style={{ background: 'var(--ds-color-bg-surface-2)' }} />
        </Narrow>
      </DemoCase>

      <DemoCase id="one" title="One picture at 16 by 9">
        <Narrow>
          <AspectRatio ratio={16 / 9}>
            <Picture fit="cover" label="A circle on a gray field" />
          </AspectRatio>
        </Narrow>
      </DemoCase>

      <DemoCase id="many" title="A gallery of square thumbnails">
        <DemoGrid min="var(--ds-space-12xl)">
          {sample.en.items.map((t) => (
                <AspectRatio key={t} ratio={1}>
                  <Fill>{t}</Fill>
                </AspectRatio>
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Text longer than the box is clipped, not grown">
        <DemoGrid min="calc(var(--ds-breakpoint-phone) / 3)">
            <AspectRatio ratio={16 / 9}>
              <Fill>{sample.en.long}</Fill>
            </AspectRatio>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic caption in a ratio box" lang="ar">
        <DemoGrid min="calc(var(--ds-breakpoint-phone) / 3)">
            <AspectRatio ratio={4 / 3}>
              <Fill>{sample.ar.long}</Fill>
            </AspectRatio>
        </DemoGrid>
      </DemoCase>
    </DemoPage>
  );
}
