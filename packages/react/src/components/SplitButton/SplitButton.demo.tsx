import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { DropdownMenuItem } from '../DropdownMenu';
import { SplitButton } from './index';
import type { SplitButtonEmphasis, SplitButtonShape, SplitButtonSize, SplitButtonTone } from './index';

const emphases: SplitButtonEmphasis[] = ['solid', 'soft', 'outline', 'ghost'];
const tones: SplitButtonTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const sizes: SplitButtonSize[] = ['xs', 'sm', 'md', 'lg'];
const shapes: SplitButtonShape[] = ['default', 'pill', 'square'];

/** The publish menu in both languages. Arabic: noun form labels, no diacritics. */
const copy = {
  en: {
    label: 'Publish page',
    menu: 'More publish options',
    items: ['Schedule publish', 'Publish to staging', 'Save as draft'],
    many: ['Schedule publish', 'Publish to staging', 'Save as draft', 'Copy preview link', 'Export as PDF', 'Share with team', 'Unpublish page'],
  },
  ar: {
    label: 'نشر الصفحة',
    menu: 'خيارات النشر الأخرى',
    items: ['جدولة النشر', 'النشر للتجربة', 'الحفظ كمسودة'],
    many: ['جدولة النشر', 'النشر للتجربة', 'الحفظ كمسودة', 'نسخ رابط المعاينة', 'التصدير بصيغة PDF', 'المشاركة مع الفريق', 'إلغاء النشر'],
  },
} as const;

const icons = ['clock', 'upload', 'file', 'link', 'download', 'send', 'eye-off'] as const;

function Items({ lang = 'en', count = 3 }: { lang?: 'en' | 'ar'; count?: number }) {
  return (
    <>
      {copy[lang].many.slice(0, count).map((item, i) => (
        <DropdownMenuItem key={item} start={icons[i]}>
          {item}
        </DropdownMenuItem>
      ))}
    </>
  );
}

export default function SplitButtonDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: emphasis by tone, sizes, shapes, in a group">
        {emphases.map((emphasis) => (
          <DemoRow key={emphasis} label={emphasis}>
            {tones.map((tone) => (
              <SplitButton key={tone} emphasis={emphasis} tone={tone} label={copy.en.label} menuLabel={copy.en.menu}>
                <Items />
              </SplitButton>
            ))}
          </DemoRow>
        ))}
        <DemoRow label="Sizes">
          {sizes.map((size) => (
            <SplitButton key={size} size={size} tone="accent" emphasis="solid" start="upload" label={copy.en.label} menuLabel={copy.en.menu}>
              <Items />
            </SplitButton>
          ))}
        </DemoRow>
        <DemoRow label="Shapes">
          {shapes.map((shape) => (
            <SplitButton key={shape} shape={shape} label={copy.en.label} menuLabel={copy.en.menu}>
              <Items />
            </SplitButton>
          ))}
        </DemoRow>
        <DemoRow label="In an attached group">
          <ButtonGroup attached emphasis="outline" aria-label="Page actions">
            <Button>Preview page</Button>
            <SplitButton label={copy.en.label} menuLabel={copy.en.menu}>
              <Items />
            </SplitButton>
          </ButtonGroup>
        </DemoRow>
        <h3 data-demo="title">Variants in Arabic</h3>
        <Theme lang="ar" data-demo="content">
          {emphases.map((emphasis) => (
            <DemoRow key={emphasis} label={emphasis}>
              <SplitButton emphasis={emphasis} tone="accent" start="upload" label={copy.ar.label} menuLabel={copy.ar.menu}>
                <Items lang="ar" />
              </SplitButton>
              <SplitButton emphasis={emphasis} label={copy.ar.label} menuLabel={copy.ar.menu}>
                <Items lang="ar" />
              </SplitButton>
            </DemoRow>
          ))}
        </Theme>
      </DemoCase>

      <DemoCase id="one" title="One related action">
        <DemoRow>
          <SplitButton tone="accent" emphasis="solid" label="Save changes" menuLabel="More save options">
            <DropdownMenuItem start="copy">Save as copy</DropdownMenuItem>
          </SplitButton>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Seven related actions, the most a menu holds">
        <DemoRow>
          <SplitButton tone="accent" emphasis="solid" label={copy.en.label} menuLabel={copy.en.menu}>
            <Items count={7} />
          </SplitButton>
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the action label ends in an ellipsis, the trigger keeps its square">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
          <SplitButton label={sample.en.long} menuLabel={copy.en.menu}>
            <Items />
          </SplitButton>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <div style={{ maxInlineSize: 'var(--ds-menu-width-min)' }}>
          <SplitButton label={sample.ar.long} menuLabel={copy.ar.menu}>
            <Items lang="ar" />
          </SplitButton>
        </div>
      </DemoCase>

      <DemoCase id="loading" title="Loading: the action blocks, the menu stays usable">
        <DemoRow>
          <SplitButton loading tone="accent" emphasis="solid" label={copy.en.label} menuLabel={copy.en.menu}>
            <Items />
          </SplitButton>
          <SplitButton loading label={copy.en.label} menuLabel={copy.en.menu}>
            <Items />
          </SplitButton>
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: both halves stay focusable with aria-disabled">
        <DemoRow>
          <SplitButton disabled tone="accent" emphasis="solid" label={copy.en.label} menuLabel={copy.en.menu}>
            <Items />
          </SplitButton>
          <SplitButton disabled emphasis="outline" label={copy.en.label} menuLabel={copy.en.menu}>
            <Items />
          </SplitButton>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
