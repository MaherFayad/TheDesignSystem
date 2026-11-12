import { useId } from 'react';
import { Theme } from '../../theme/Theme';
import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Rating, type RatingSize, type RatingTone } from './index';

const sizes: RatingSize[] = ['sm', 'md', 'lg'];
const tones: RatingTone[] = ['warning', 'accent'];

/** Arabic star names, Western digits. */
const arItemLabel = (score: number, max: number) => `${score} من ${max} نجوم`;
const arValueLabel = (value: number, max: number) => (value > 0 ? `${value} من ${max} نجوم` : 'بدون تقييم');

/** A visible label that names an interactive rating. */
function Labeled({ text, ...props }: Parameters<typeof Rating>[0] & { text: string }) {
  const id = useId();
  return (
    <div style={{ display: 'grid', alignContent: 'start', gap: 'var(--ds-space-2xs)', justifyItems: 'start' }}>
      <span data-demo="label" id={id}>
        {text}
      </span>
      <Rating aria-labelledby={id} {...props} />
    </div>
  );
}

/** Rating in every content case, English and Arabic. */
export default function RatingDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, tones, ten stars and Arabic">
        <DemoGrid min="18rem">
          {tones.flatMap((tone) =>
            sizes.map((size) => (
              <Labeled key={`${tone}-${size}`} text={`Rate this board, ${size}, ${tone}`} size={size} tone={tone} defaultValue={3} />
            )),
          )}
        </DemoGrid>
        <Labeled text="How likely are you to recommend us?" max={10} defaultValue={8} size="sm" showValue />
        <DemoRow label="Read only">
          <Rating readOnly value={4.5} showValue />
          <Rating readOnly value={3} tone="accent" size="sm" />
        </DemoRow>
        <Theme lang="ar">
          <DemoRow>
            <Labeled text="تقييم اللوحة" defaultValue={4} getItemLabel={arItemLabel} />
            <Rating readOnly value={3.5} getValueLabel={arValueLabel} showValue />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Not rated yet">
        <Labeled text="Rate this template" />
        <Rating readOnly value={0}>
          No ratings yet
        </Rating>
      </DemoCase>

      <DemoCase id="one" title="One rating with a count">
        <Rating readOnly value={4.5} showValue>
          (128 reviews)
        </Rating>
      </DemoCase>

      <DemoCase id="many" title="A list of ratings">
        <Labeled text="Rate the session" defaultValue={3} />
        <div style={{ display: 'grid', gap: 'var(--ds-space-xs)' }}>
          {[5, 4.5, 4, 3, 2.5, 1].map((value) => (
            <Rating key={value} readOnly value={value} size="sm" showValue />
          ))}
        </div>
      </DemoCase>

      <DemoCase id="long-text" title="Long text after the stars, in a narrow box">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <Rating readOnly value={4} showValue>
            {sample.en.long}
          </Rating>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)', display: 'grid', gap: 'var(--ds-space-s)' }}>
          <Labeled text="تقييم تجربتك مع اللوحة" defaultValue={2} getItemLabel={arItemLabel} />
          <Rating readOnly value={4.5} getValueLabel={arValueLabel} showValue>
            {sample.ar.long}
          </Rating>
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <Labeled text="Rate this board" disabled defaultValue={2}>
          You can rate it after you open it.
        </Labeled>
      </DemoCase>

      <DemoCase id="readonly" title="Read only">
        <DemoRow>
          <Rating readOnly value={3.5} />
          <Rating readOnly value={7} max={10} showValue size="lg" tone="accent" />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
