import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme';
import { Spinner } from './index';
import type { SpinnerSize, SpinnerTone } from './index';

const sizes: SpinnerSize[] = ['xs', 'sm', 'md', 'lg'];
const tones: SpinnerTone[] = ['neutral', 'accent'];

const tasks = ['Loading files', 'Syncing boards', 'Checking links', 'Building preview', 'Uploading images', 'Saving changes'];
const tasksAr = ['تحميل الملفات', 'مزامنة اللوحات', 'فحص الروابط', 'تجهيز المعاينة', 'رفع الصور', 'حفظ التغييرات'];

export default function SpinnerDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each size in neutral and accent">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {sizes.map((size) => (
              <Spinner key={size} size={size} tone={tone} label={`Loading, size ${size}`} />
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Next to visible text, decorative">
          <span>
            <Spinner size="sm" decorative /> Loading files
          </span>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {tones.map((tone) => (
            <DemoRow key={tone} label={tone}>
              {sizes.map((size) => (
                <Spinner key={size} size={size} tone={tone} label="جار التحميل" />
              ))}
            </DemoRow>
          ))}
          <DemoRow label="مع نص ظاهر">
            <span>
              <Spinner size="sm" decorative /> جار تحميل الملفات
            </span>
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One spinner">
        <DemoRow>
          <Spinner label="Loading files" />
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Many spinners, one per busy row">
        {tasks.map((task) => (
          <DemoRow key={task}>
            <Spinner size="sm" decorative />
            <span>{task}</span>
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="long-text" title="Long text next to a spinner">
        <DemoRow>
          <Spinner size="sm" tone="accent" decorative />
          <span>{sample.en.long}</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <DemoRow>
          <Spinner size="sm" tone="accent" decorative />
          <span>{sample.ar.long}</span>
        </DemoRow>
        {tasksAr.map((task) => (
          <DemoRow key={task}>
            <Spinner size="xs" decorative />
            <span>{task}</span>
          </DemoRow>
        ))}
      </DemoCase>

      <DemoCase id="loading" title="Loading: a busy region names itself, the spinner is decorative">
        <div aria-busy="true" aria-label="Recent boards" role="region">
          <DemoRow>
            <Spinner size="lg" tone="accent" decorative />
          </DemoRow>
        </div>
        <DemoRow>
          <Spinner size="md" label="Loading recent boards" />
          <Theme lang="ar" as="span">
            <Spinner size="md" label="جار تحميل آخر اللوحات" />
          </Theme>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
