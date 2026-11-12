import { DemoCase, DemoGrid, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { InlineEdit, type InlineEditSize } from './index';

const sizes: InlineEditSize[] = ['xs', 'sm', 'md', 'lg'];

const required = (value: string) => (value.trim() === '' ? 'Add a name of at least 1 letter.' : undefined);
const requiredAr = (value: string) => (value.trim() === '' ? 'اكتب اسم من حرف واحد على الأقل.' : undefined);

const arLabels = {
  editLabel: 'تعديل اسم اللوحة',
  saveLabel: 'حفظ التغييرات',
  cancelLabel: 'إلغاء التغييرات',
  savedLabel: 'تم الحفظ',
  placeholder: 'إضافة اسم',
} as const;

const boards = ['Spring launch', 'Brand refresh', 'Pricing page', 'Onboarding emails', 'Q3 roadmap', 'Team offsite'];

/** InlineEdit in every content case. */
export default function InlineEditDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes">
        <DemoRow>
          {sizes.map((size) => (
            <InlineEdit key={size} size={size} label="Board name" defaultValue={`Spring launch, ${size}`} validate={required} />
          ))}
        </DemoRow>
        <Theme lang="ar" data-demo="content">
          <DemoRow label="عربي">
            <InlineEdit label="اسم اللوحة" defaultValue="إطلاق الربيع" validate={requiredAr} {...arLabels} />
          </DemoRow>
        </Theme>
      </DemoCase>

      <DemoCase id="empty" title="Empty, shows the placeholder">
        <InlineEdit label="Board name" placeholder="Add a board name" />
      </DemoCase>

      <DemoCase id="one" title="One value">
        <InlineEdit label="Board name" defaultValue="Spring launch" validate={required} />
      </DemoCase>

      <DemoCase id="many" title="A list of names">
        <DemoGrid min="14rem">
          {boards.map((board) => (
            <InlineEdit key={board} size="sm" label="Board name" defaultValue={board} validate={required} />
          ))}
        </DemoGrid>
      </DemoCase>

      <DemoCase id="long-text" title="Long value in a narrow container">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <InlineEdit label="Board name" defaultValue={sample.en.long} />
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="نص عربي طويل" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-dialog-width-sm)' }}>
          <InlineEdit label="اسم اللوحة" defaultValue={sample.ar.long} {...arLabels} />
        </div>
      </DemoCase>

      <DemoCase id="error" title="Invalid with a message, open and closed">
        <InlineEdit label="Board name" defaultValue="Spring launch" defaultEditing error="A board with this name exists. Add a word, for example Spring launch 2." />
        <InlineEdit label="Board name" defaultValue="Spring launch" error="A board with this name exists. Add a word, for example Spring launch 2." />
      </DemoCase>

      <DemoCase id="disabled" title="Disabled">
        <InlineEdit label="Board name" defaultValue="Spring launch" disabled />
      </DemoCase>
    </DemoPage>
  );
}
