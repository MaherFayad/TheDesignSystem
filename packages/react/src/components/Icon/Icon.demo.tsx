import { Fragment } from 'react';
import { iconNames, iconSetIds, mirrorIcons, type IconName } from '@the-system/icons';
import { DemoCase, DemoGrid, DemoPage, DemoRow } from '../../demo';
import { Theme } from '../../theme';
import { Icon, IconSetContext } from './index';

const sizes = ['sm', 'md', 'lg'] as const;
const sample: IconName[] = ['close', 'check', 'search', 'warning', 'settings', 'mail', 'star-half', 'chevron-forward'];
/** Glyphs that never flip, shown next to the mirror list for contrast. */
const fixed: IconName[] = ['clock', 'history', 'play', 'pause', 'trend-up'];

function MirrorRows({ labels }: { labels: { ltr: string; rtl: string } }) {
  return (
    <>
      {(['ltr', 'rtl'] as const).map((dir) => (
        <Theme key={dir} dir={dir}>
          <DemoRow label={labels[dir]}>
            {mirrorIcons.map((name) => (
              <Icon key={name} name={name} />
            ))}
            {fixed.map((name) => (
              <Icon key={name} name={name} />
            ))}
          </DemoRow>
        </Theme>
      ))}
    </>
  );
}

export default function IconDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Sizes in each set, and the mirror flag">
        {iconSetIds.map((set) => (
          <IconSetContext key={set} value={{ set }}>
            {sizes.map((size) => (
              <DemoRow key={size} label={`${set} ${size}`}>
                {sample.map((name) => (
                  <Icon key={name} name={name} size={size} />
                ))}
              </DemoRow>
            ))}
          </IconSetContext>
        ))}
        <MirrorRows labels={{ ltr: 'Left to right', rtl: 'Right to left' }} />
      </DemoCase>

      <DemoCase id="one" title="One icon with a label">
        <DemoRow>
          <Icon name="warning" label="Warning" />
          <span>Storage is almost full</span>
        </DemoRow>
      </DemoCase>

      <DemoCase id="many" title="Every icon in every set">
        {iconSetIds.map((set) => (
          <Fragment key={set}>
            <h3 data-demo="title">{set === 'pixel' ? 'Pixel set' : 'Line set'}</h3>
            <DemoGrid>
              {iconNames.map((name) => (
                <DemoRow key={name}>
                  <Icon name={name} set={set} />
                  <span>{name}</span>
                </DemoRow>
              ))}
            </DemoGrid>
          </Fragment>
        ))}
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: directional icons flip" lang="ar">
        <MirrorRows labels={{ ltr: 'من اليسار', rtl: 'من اليمين' }} />
        <DemoRow>
          <Icon name="warning" label="تحذير" />
          <span>المساحة قربت تخلص، احذف ملفات ما تحتاجها</span>
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
