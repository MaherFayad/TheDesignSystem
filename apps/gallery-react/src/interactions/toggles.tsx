// Stages of the /interactions page for the toggles family (order 1.23):
// Switch, Checkbox, CheckboxGroup, RadioGroup, RadioCard and ToggleButton.
// One live stage per interaction id of packages/motion/src/interactions.
// Each stage marks the control that plays it with data-interaction-trigger,
// so the page's replay control can press it again.
import { type ReactNode } from 'react';
import {
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  RadioCard,
  RadioCardItem,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Theme,
  ToggleButton,
} from '@the-system/react';

const stack = { display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' } as const;

export const stages: Record<string, () => ReactNode> = {
  'toggle-pop': () => (
    <>
      <ToggleButton start="grid" data-interaction-trigger="">
        Grid view
      </ToggleButton>
      <ToggleButton icon="bell" label="Mute alerts" />
      <ButtonGroup aria-label="View" attached>
        <ToggleButton>List</ToggleButton>
        <ToggleButton>Board</ToggleButton>
      </ButtonGroup>
    </>
  ),
  'switch-stretch': () => (
    <>
      <Switch label="Auto save" data-interaction-trigger="" />
      <Switch label="Snap to grid" defaultChecked size="lg" />
      <Theme lang="ar">
        <Switch label="حفظ تلقائي" />
      </Theme>
    </>
  ),
  'check-draw': () => (
    <div style={stack}>
      <Checkbox label="Snap frames to the grid" data-interaction-trigger="" />
      <CheckboxGroup legend="Notify me about" selectAll="All notifications">
        <Checkbox value="comments" label="Comments" />
        <Checkbox value="mentions" label="Mentions" />
        <Checkbox value="invites" label="Invites" />
        <Checkbox value="reviews" label="Reviews" />
      </CheckboxGroup>
    </div>
  ),
  'radio-pop': () => (
    <RadioGroup label="Export as" defaultValue="png">
      <RadioGroupItem value="png" label="PNG" data-interaction-trigger="" />
      <RadioGroupItem value="svg" label="SVG" />
      <RadioGroupItem value="pdf" label="PDF" />
    </RadioGroup>
  ),
  'radio-card-lift': () => (
    <RadioCard aria-label="Plan" defaultValue="team" orientation="horizontal">
      <RadioCardItem value="solo" title="Solo" description="One seat" end="$12" data-interaction-trigger="" />
      <RadioCardItem value="team" title="Team" description="Five seats" end="$48" />
    </RadioCard>
  ),
};
