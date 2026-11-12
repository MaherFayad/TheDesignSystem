import { useRef, useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { Chip, type ChipEmphasis, type ChipSize, type ChipTone } from './index';

const tones: ChipTone[] = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'];
const emphases: ChipEmphasis[] = ['soft', 'outline'];
const sizes: ChipSize[] = ['xs', 'sm', 'md'];

const toneLabel: Record<ChipTone, string> = {
  neutral: 'All files',
  accent: 'Shared with me',
  success: 'Published',
  warning: 'Needs review',
  danger: 'Failed',
  info: 'Beta',
};

/** Noun forms in white Saudi dialect, no diacritics. */
const toneLabelAr: Record<ChipTone, string> = {
  neutral: 'كل الملفات',
  accent: 'مشاركة معي',
  success: 'منشورة',
  warning: 'تحتاج مراجعة',
  danger: 'فشلت',
  info: 'تجريبي',
};

const filters = ['Images', 'Videos', 'Documents', 'Audio', 'Archives', 'Code', 'Fonts', 'Spreadsheets', 'Slides', 'Sketches', 'Templates', 'Icons'];
const filtersAr = ['الصور', 'الفيديو', 'المستندات', 'الصوت', 'الأرشيف', 'الأكواد'];

/** A row of toggle chips: a filter bar. */
function FilterBar({ labels, lang }: { labels: readonly string[]; lang?: 'ar' }) {
  const [on, setOn] = useState<Set<string>>(() => new Set([labels[0]!]));
  return (
    <DemoRow>
      {labels.map((label) => (
        <Chip
          key={label}
          lang={lang}
          selected={on.has(label)}
          onClick={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (next.has(label)) next.delete(label);
              else next.add(label);
              return next;
            })
          }
        >
          {label}
        </Chip>
      ))}
    </DemoRow>
  );
}

/**
 * Removable chips that move focus after a removal: to the next chip's remove
 * button, else the previous one, else the reset button.
 */
function RemovableList({ labels, removeWord, resetLabel }: { labels: readonly string[]; removeWord: string; resetLabel: string }) {
  const [items, setItems] = useState<string[]>([...labels]);
  const rowRef = useRef<HTMLDivElement>(null);
  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
    requestAnimationFrame(() => {
      const buttons = rowRef.current?.querySelectorAll<HTMLElement>('[data-part="remove"]');
      const target = buttons?.[Math.min(index, (buttons?.length ?? 1) - 1)];
      (target ?? rowRef.current?.querySelector<HTMLElement>('[data-demo-reset]'))?.focus();
    });
  };
  return (
    <div ref={rowRef}>
      <DemoRow>
        {items.map((label, index) => (
          <Chip key={label} onRemove={() => remove(index)} removeLabel={`${removeWord} ${label}`}>
            {label}
          </Chip>
        ))}
        {items.length === 0 && (
          <Chip data-demo-reset="" onClick={() => setItems([...labels])}>
            {resetLabel}
          </Chip>
        )}
      </DemoRow>
    </div>
  );
}

export default function ChipDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: each tone in soft and outline, selected, removable, three sizes">
        {tones.map((tone) => (
          <DemoRow key={tone} label={tone}>
            {emphases.map((emphasis) => (
              <Chip key={emphasis} tone={tone} emphasis={emphasis} onClick={() => undefined}>
                {toneLabel[tone]}
              </Chip>
            ))}
            <Chip tone={tone} selected onClick={() => undefined}>
              {toneLabel[tone]}
            </Chip>
            <Chip tone={tone} onRemove={() => undefined} removeLabel={`Remove filter ${toneLabel[tone]}`}>
              {toneLabel[tone]}
            </Chip>
          </DemoRow>
        ))}
        {sizes.map((size) => (
          <DemoRow key={size} label={`Size ${size}`}>
            <Chip size={size} start="image" onClick={() => undefined}>
              Images
            </Chip>
            <Chip size={size} selected onClick={() => undefined}>
              Videos
            </Chip>
            <Chip size={size} emphasis="outline" onRemove={() => undefined} removeLabel="Remove filter Arabic">
              Arabic
            </Chip>
          </DemoRow>
        ))}
        <DemoRow label="Arabic">
          {tones.map((tone) => (
            <Chip key={tone} tone={tone} lang="ar" selected={tone === 'accent'} onClick={() => undefined}>
              {toneLabelAr[tone]}
            </Chip>
          ))}
          <Chip lang="ar" onRemove={() => undefined} removeLabel="إزالة فلتر العربية">
            العربية
          </Chip>
        </DemoRow>
      </DemoCase>

      <DemoCase id="one" title="One removable filter">
        <RemovableList labels={['Arabic']} removeWord="Remove filter" resetLabel="Add filter back" />
      </DemoCase>

      <DemoCase id="many" title="Many: press to filter, remove to clear">
        <FilterBar labels={filters.slice(0, 6)} />
        <RemovableList labels={filters.slice(0, 5)} removeWord="Remove filter" resetLabel="Add filters back" />
      </DemoCase>

      <DemoCase id="too-many" title="Too many: the row wraps">
        <FilterBar labels={filters} />
      </DemoCase>

      <DemoCase id="long-text" title="Long text: the label ends in an ellipsis">
        <div style={{ maxInlineSize: '16rem' }}>
          <DemoRow>
            <Chip onClick={() => undefined}>Every file shared with the design team this quarter</Chip>
            <Chip onRemove={() => undefined} removeLabel="Remove filter Every file shared with the design team">
              Every file shared with the design team this quarter
            </Chip>
          </DemoRow>
        </div>
      </DemoCase>

      <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
        <FilterBar labels={filtersAr} lang="ar" />
        <div style={{ maxInlineSize: '16rem' }}>
          <Chip onRemove={() => undefined} removeLabel="إزالة فلتر كل الملفات المشاركة مع فريق التصميم">
            كل الملفات المشاركة مع فريق التصميم هالربع
          </Chip>
        </div>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: stays focusable and does nothing">
        <DemoRow>
          <Chip disabled onClick={() => undefined}>
            Images
          </Chip>
          <Chip disabled selected onClick={() => undefined}>
            Videos
          </Chip>
          <Chip disabled onRemove={() => undefined} removeLabel="Remove filter Arabic">
            Arabic
          </Chip>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
