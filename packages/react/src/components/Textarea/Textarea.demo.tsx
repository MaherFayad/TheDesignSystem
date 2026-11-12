import { Theme } from '../../theme';
import { DemoCase, DemoGrid, DemoPage, sample } from '../../demo';
import { Field } from '../Field/Field';
import { Textarea } from './index';

const longEn = Array.from({ length: 6 }, () => sample.en.long).join(' ');
const longAr = Array.from({ length: 4 }, () => sample.ar.long).join(' ');
const nearLimit = 'The board opens on the spring launch frame, with the hero and the three product cards in place.';

/** Textarea alone and in a Field, in every content case. */
export default function TextareaDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes, count, fixed height" lang="en">
        <DemoGrid min="16rem">
          {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
            <Field key={size} label={`Notes, size ${size}`}>
              <Textarea size={size} rows={2} placeholder="For example, the hero needs a new photo" />
            </Field>
          ))}
          <Field label="Board summary" description="Up to 200 characters.">
            <Textarea limit={200} defaultValue="A first pass at the spring launch page." />
          </Field>
          <Field label="Release notes" description="Drag the corner to make it taller.">
            <Textarea autoHeight={false} rows={4} />
          </Field>
        </DemoGrid>
        <Theme lang="ar" data-demo="content">
          <DemoGrid min="16rem">
            <Field label="ملاحظات" description="بحد أقصى 200 حرف.">
              <Textarea limit={200} defaultValue="مسودة أولى لصفحة إطلاق الربيع." />
            </Field>
            <Field label="ملخص اللوحة">
              <Textarea size="sm" rows={2} placeholder="مثال: الصورة الرئيسية تحتاج تحديث" />
            </Field>
          </DemoGrid>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, with a hint" lang="en">
        <Field label="Message to the team" description="They see it on the board.">
          <Textarea placeholder="For example, the review is moved to Thursday" />
        </Field>
      </DemoCase>

      <DemoCase id="one" title="One line of text" lang="en">
        <Field label="Board summary">
          <Textarea defaultValue="Spring launch, first pass." />
        </Field>
      </DemoCase>

      <DemoCase id="many" title="Several paragraphs, grows to 8 lines" lang="en">
        <Field label="Brief">
          <Textarea maxRows={8} defaultValue={`${sample.en.long}\n\n${sample.en.long}`} />
        </Field>
      </DemoCase>

      <DemoCase id="too-many" title="Past the cap: the text scrolls inside" lang="en">
        <Field label="Brief" description="Shows 6 lines, then scrolls.">
          <Textarea maxRows={6} defaultValue={longEn} />
        </Field>
      </DemoCase>

      <DemoCase id="long-text" title="One long word" lang="en">
        <div style={{ maxInlineSize: '20rem' }}>
          <Field label="Link to the file">
            <Textarea defaultValue={sample.en.word.repeat(3)} />
          </Field>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <Field label="وصف اللوحة" description="بحد أقصى 1000 حرف.">
          <Textarea maxRows={6} limit={1000} defaultValue={longAr} />
        </Field>
      </DemoCase>

      <DemoCase id="error" title="Near and past the limit" lang="en">
        <DemoGrid min="16rem">
          <Field label="Board summary" description="Up to 100 characters.">
            <Textarea limit={100} defaultValue={nearLimit} />
          </Field>
          <Field label="Board summary" error="Remove 9 characters, so the summary fits on the card.">
            <Textarea limit={100} defaultValue={`${nearLimit} Add the last.`} />
          </Field>
        </DemoGrid>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled" lang="en">
        <Field label="Board summary" disabled description="Only owners can edit the summary.">
          <Textarea defaultValue="Spring launch, first pass." />
        </Field>
      </DemoCase>

      <DemoCase id="readonly" title="Read only" lang="en">
        <Field label="Original brief" readOnly>
          <Textarea defaultValue={sample.en.long} />
        </Field>
      </DemoCase>
    </DemoPage>
  );
}
