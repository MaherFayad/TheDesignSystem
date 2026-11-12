import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Lightbox, LightboxTrigger, type LightboxImage, type LightboxProps } from './index';

/**
 * A made up landscape as an SVG data URL: a sky, a sun and two hills in one
 * hue, so every demo and every screenshot shows the same pictures offline.
 */
function landscape(hue: number, wide = true): string {
  const [w, h] = wide ? [1600, 1000] : [900, 1400];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue} 60% 78%)"/><stop offset="1" stop-color="hsl(${(hue + 30) % 360} 70% 88%)"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#s)"/>
<circle cx="${w * 0.72}" cy="${h * 0.3}" r="${h * 0.09}" fill="hsl(${(hue + 50) % 360} 90% 92%)"/>
<path d="M0 ${h * 0.7} Q ${w * 0.25} ${h * 0.5} ${w * 0.5} ${h * 0.68} T ${w} ${h * 0.62} V ${h} H 0 Z" fill="hsl(${hue} 35% 45%)"/>
<path d="M0 ${h * 0.82} Q ${w * 0.35} ${h * 0.7} ${w * 0.7} ${h * 0.85} T ${w} ${h * 0.8} V ${h} H 0 Z" fill="hsl(${hue} 40% 28%)"/>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const enImages: LightboxImage[] = [
  { src: landscape(200), alt: 'Blue hills under a pale sky with a low sun', caption: 'Asir mountains at sunrise', width: 1600, height: 1000 },
  { src: landscape(20), alt: 'Orange dunes under a warm sky', caption: 'Empty Quarter dunes in the afternoon', width: 1600, height: 1000 },
  { src: landscape(140, false), alt: 'Green slopes in a tall frame', caption: 'Terraces near Al Baha', width: 900, height: 1400 },
  { src: landscape(280), alt: 'Purple ridges at dusk', width: 1600, height: 1000 },
];

const arImages: LightboxImage[] = [
  { src: landscape(200), alt: 'جبال زرقاء تحت سماء فاتحة وشمس منخفضة', caption: 'جبال عسير وقت الشروق', width: 1600, height: 1000 },
  { src: landscape(20), alt: 'كثبان برتقالية تحت سماء دافية', caption: 'كثبان الربع الخالي العصر', width: 1600, height: 1000 },
  { src: landscape(140, false), alt: 'منحدرات خضراء في إطار طولي', caption: 'مدرجات قريبة من الباحة', width: 900, height: 1400 },
];

const manyImages: LightboxImage[] = Array.from({ length: 12 }, (_, i) => ({
  src: landscape((i * 30) % 360, i % 4 !== 3),
  alt: `Landscape study ${i + 1}, hills in one hue`,
  caption: `Study ${i + 1} of the hills series`,
}));

const tooManyImages: LightboxImage[] = Array.from({ length: 120 }, (_, i) => ({
  src: landscape((i * 7) % 360),
  alt: `Frame ${i + 1} of the time lapse`,
}));

function Viewer({ trigger, label, at = 0, ...props }: Omit<LightboxProps, 'children'> & { trigger: string; label: string; at?: number }) {
  return (
    <Lightbox {...props}>
      <LightboxTrigger index={at}>
        <Button data-demo-trigger={trigger} start="image">
          {label}
        </Button>
      </LightboxTrigger>
    </Lightbox>
  );
}

export default function LightboxDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants">
        <DemoRow label="Gallery">
          <Lightbox images={enImages}>
            {enImages.map((image, i) => (
              <LightboxTrigger key={image.src} index={i}>
                <Button data-demo-trigger={i === 0 ? 'gallery' : undefined} start="image">
                  {`View photo ${i + 1}`}
                </Button>
              </LightboxTrigger>
            ))}
          </Lightbox>
        </DemoRow>
        <DemoRow label="Loop">
          <Viewer trigger="loop" label="View photos in a loop" images={enImages} loop at={3} />
        </DemoRow>
        <DemoRow label="Arabic">
          <Theme lang="ar" dir="rtl">
            <Viewer trigger="ar" label="عرض الصور" images={arImages} />
          </Theme>
        </DemoRow>
      </DemoCase>

      <DemoCase id="empty" title="Empty">
        <DemoRow>
          <Button start="image" disabled>
            View photos
          </Button>
          <span>No photos yet. Add photos to the board to view them here.</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One">
        <Viewer trigger="one" label="View photo" images={[enImages[0] as LightboxImage]} />
      </DemoCase>

      <DemoCase id="many" title="Many">
        <Viewer trigger="many" label="View 12 photos" images={manyImages} at={5} />
      </DemoCase>

      <DemoCase id="too-many" title="Too many">
        <Viewer trigger="too-many" label="View 120 frames" images={tooManyImages} at={99} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text">
        <Viewer
          trigger="long-text"
          label="View photo with a long caption"
          images={[
            {
              ...(enImages[1] as LightboxImage),
              caption:
                'Empty Quarter dunes in the afternoon, taken from the ridge above the camp after the wind dropped. The light stays this warm for about twenty minutes before the sun sets behind the western dunes, so the whole series was shot in one pass.',
            },
            enImages[2] as LightboxImage,
          ]}
        />
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic" lang="ar">
        <Viewer
          trigger="long-arabic"
          label="عرض الصور"
          images={[
            {
              ...(arImages[1] as LightboxImage),
              caption:
                'كثبان الربع الخالي العصر، من فوق التلة اللي جنب المخيم بعد ما هدأت الريح. الضوء يبقى دافي كذا تقريبا عشرين دقيقة قبل ما تغيب الشمس، فصورنا السلسلة كلها مرة وحدة.',
            },
            ...arImages,
          ]}
        />
      </DemoCase>

      <DemoCase id="error" title="Error">
        <Viewer
          trigger="error"
          label="View a missing photo"
          images={[{ src: 'data:image/png;base64,broken', alt: 'A photo that is no longer on the server', caption: 'Uploaded last week' }, enImages[0] as LightboxImage]}
        />
      </DemoCase>
    </DemoPage>
  );
}
