import type { ReactNode } from 'react';
import { DemoCase, DemoPage, DemoRow, sample } from '../../demo';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Tooltip, TooltipProvider, type TooltipSide } from './index';

const sides: TooltipSide[] = ['top', 'start', 'end', 'bottom'];

/** Room around a trigger so a tooltip shown open in the gallery never covers the next one. */
function Spot({ children }: { children: ReactNode }) {
  return <div style={{ display: 'grid', placeItems: 'center', minBlockSize: '5rem' }}>{children}</div>;
}

const tools = [
  { icon: 'copy', label: 'Copy layer', shortcut: 'Ctrl+C' },
  { icon: 'link', label: 'Copy link', shortcut: 'Ctrl+L' },
  { icon: 'user', label: 'Share with people', shortcut: undefined },
  { icon: 'info', label: 'Show layer info', shortcut: 'Ctrl+I' },
  { icon: 'help', label: 'Open help', shortcut: 'F1' },
  { icon: 'close', label: 'Close panel', shortcut: 'Esc' },
] as const;

/** A toolbar of IconButtons: each label is shown in a Tooltip on hover and focus. */
function Toolbar({ count = tools.length }: { count?: number }) {
  return (
    <DemoRow>
      {Array.from({ length: count }, (_, i) => tools[i % tools.length]!).map((tool, i) => (
        <Tooltip key={i} content={tool.label} shortcut={tool.shortcut}>
          <IconButton icon={tool.icon} label={tool.label} />
        </Tooltip>
      ))}
    </DemoRow>
  );
}

export default function TooltipDemo() {
  return (
    <TooltipProvider>
      <DemoPage>
        <DemoCase id="variants" title="Sides top, bottom, start and end, shown open; then live tooltips on hover and focus, with a shortcut">
          <div>
            {sides.map((side) => (
              <Spot key={side}>
                <Tooltip content={`To the ${side} edge`} side={side} open>
                  <Button>{`Align layer ${side}`}</Button>
                </Tooltip>
              </Spot>
            ))}
          </div>
          <Toolbar />
          <Theme lang="ar" data-demo="content">
            <DemoRow label="عربي">
              <Tooltip content="نسخ الرابط" shortcut="Ctrl+L">
                <IconButton icon="link" label="نسخ الرابط" />
              </Tooltip>
              <Spot>
                <Tooltip content="محاذاة الطبقة للبداية" side="start" open>
                  <Button>محاذاة للبداية</Button>
                </Tooltip>
              </Spot>
            </DemoRow>
          </Theme>
        </DemoCase>

        <DemoCase id="one" title="One IconButton: the tooltip shows its label">
          <DemoRow>
            <Tooltip content="Copy link">
              <IconButton icon="link" label="Copy link" />
            </Tooltip>
          </DemoRow>
        </DemoCase>

        <DemoCase id="many" title="A toolbar: after the first tooltip, the next one opens at once">
          <Toolbar />
        </DemoCase>

        <DemoCase id="too-many" title="A long toolbar that wraps: tooltips stay inside the viewport">
          <Toolbar count={18} />
        </DemoCase>

        <DemoCase id="long-text" title="A long hint wraps at 240px">
          <Spot>
            <Tooltip content={sample.en.long} open>
              <Button>Show sync status</Button>
            </Tooltip>
          </Spot>
        </DemoCase>

        <DemoCase id="long-arabic" title="Long Arabic text" lang="ar">
          <Spot>
            <Tooltip content="آخر مزامنة للملف قبل 5 دقايق، وكل التغييرات محفوظة في حسابك ومتاحة على أي جهاز ثاني." shortcut="Ctrl+S" open>
              <Button>حالة المزامنة</Button>
            </Tooltip>
          </Spot>
        </DemoCase>

        <DemoCase id="disabled" title="A disabled action stays focusable, and its tooltip says why">
          <DemoRow>
            <Tooltip content="Select a layer to delete it">
              <Button disabled>Delete layer</Button>
            </Tooltip>
            <Tooltip content="Select a layer to delete it">
              <IconButton icon="trash" label="Delete layer" disabled />
            </Tooltip>
          </DemoRow>
        </DemoCase>
      </DemoPage>
    </TooltipProvider>
  );
}
