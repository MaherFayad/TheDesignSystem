import { useState } from 'react';
import { DemoCase, DemoPage, DemoRow } from '../../demo';
import { WindowControls } from './index';

function Working({ active = true }: { active?: boolean }) {
  const [zoomed, setZoomed] = useState(false);
  const [said, setSaid] = useState('Nothing pressed yet');
  return (
    <DemoRow label={active ? 'Active' : 'Inactive'}>
      <WindowControls
        active={active}
        zoomed={zoomed}
        onClose={() => setSaid('Close pressed')}
        onMinimize={() => setSaid('Minimize pressed')}
        onZoom={() => {
          setZoomed((z) => !z);
          setSaid('Zoom pressed');
        }}
      />
      <span role="status">{said}</span>
    </DemoRow>
  );
}

export default function WindowControlsDemo() {
  return (
    <DemoPage>
      <DemoCase id="variants" title="Variants: idle dots at rest in an active and an inactive window, as in the source; the colors and the glyphs show on hover and keyboard focus of the group. The lights show here in every style because the demo passes them; Window turns them on only in styles that list the controls optional part.">
        <Working />
        <Working active={false} />
      </DemoCase>

      <DemoCase id="one" title="Close only">
        <DemoRow>
          <WindowControls onClose={() => undefined} />
        </DemoRow>
      </DemoCase>

      <DemoCase id="long-arabic" title="Arabic: the labels default to Arabic, the lights keep their order" lang="ar">
        <DemoRow>
          <WindowControls
            onClose={() => undefined}
            onMinimize={() => undefined}
            onZoom={() => undefined}
          />
        </DemoRow>
      </DemoCase>

      <DemoCase id="disabled" title="Disabled: lights with no handler are idle and out of the tab order; a disabled close keeps its tab stop">
        <DemoRow>
          <WindowControls />
          <WindowControls onClose={() => undefined} />
        </DemoRow>
        <DemoRow label="Close disabled, still focusable">
          <WindowControls onClose={() => undefined} closeDisabled onZoom={() => undefined} />
        </DemoRow>
      </DemoCase>
    </DemoPage>
  );
}
