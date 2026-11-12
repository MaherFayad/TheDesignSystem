import type { CSSProperties } from 'react';
import { iconNames, iconSetIds, mirrorIcons, type IconName } from '@the-system/icons';
import { Icon, IconSetContext } from './index';

const row: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--ds-space-xs)',
};

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(8rem, 1fr))',
  gap: 'var(--ds-space-xs)',
};

const sizes = ['sm', 'md', 'lg'] as const;
const sample: IconName[] = ['close', 'check', 'search', 'warning', 'settings', 'chevron-forward'];

export default function IconDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-md)' }}>
      <section data-demo-case="variants">
        <h2>Sizes and sets</h2>
        {iconSetIds.map((set) => (
          <IconSetContext key={set} value={{ set }}>
            <h3>{set}</h3>
            {sizes.map((size) => (
              <div key={size} style={row}>
                <span>{size}</span>
                {sample.map((name) => (
                  <Icon key={name} name={name} size={size} />
                ))}
              </div>
            ))}
          </IconSetContext>
        ))}
        <h3>Mirror in right to left</h3>
        {(['ltr', 'rtl'] as const).map((dir) => (
          <div key={dir} dir={dir} style={row}>
            <span>{dir}</span>
            {mirrorIcons.map((name) => (
              <Icon key={name} name={name} />
            ))}
            <Icon name="clock" />
            <Icon name="play" />
          </div>
        ))}
        <h3>With a label</h3>
        <div style={row}>
          <Icon name="warning" label="Warning" />
          <span>Storage is almost full</span>
        </div>
      </section>
      <section data-demo-case="many">
        <h2>Every icon</h2>
        {iconSetIds.map((set) => (
          <div key={set}>
            <h3>{set}</h3>
            <div style={grid}>
              {iconNames.map((name) => (
                <div key={name} style={row}>
                  <Icon name={name} set={set} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
