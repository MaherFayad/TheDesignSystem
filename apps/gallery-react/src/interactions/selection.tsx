// Stages of the /interactions page for the selection controls and lists family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import { Button, Checkbox, List, ListItem, RangeSlider, Slider } from '@the-system/react';

function ListStage() {
  const [key, setKey] = useState(0);
  return (
    <>
      <List key={key} aria-label="Inbox">
        <ListItem start="mail" title="Sara Alqahtani" description="Brand review moved to Thursday" />
        <ListItem start="file" title="Omar Alharbi" description="Invoice 2041 is ready to download" />
        <ListItem start="bell" title="Design team" description="New comments on the onboarding board" />
      </List>
      <Button size="sm" data-interaction-trigger="" onClick={() => setKey((k) => k + 1)}>
        Paint the list again
      </Button>
    </>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'check-draw': () => <Checkbox label="Snap frames to the grid" data-interaction-trigger="" />,
  'slider-nudge': () => (
    <div style={{ inlineSize: '100%' }}>
      <Slider label="Volume" unit="%" defaultValue={100} data-interaction-trigger="" />
    </div>
  ),
  'slider-pull': () => (
    <div style={{ display: 'grid', gap: 'var(--ds-space-l)', inlineSize: '100%' }}>
      <Slider label="Opacity" unit="%" defaultValue={40} />
      <RangeSlider label="Price" unit="SAR" min={0} max={1000} step={50} defaultValue={[200, 800]} thumbLabels={['Minimum price', 'Maximum price']} />
    </div>
  ),
  'list-stagger': () => <ListStage />,
};
