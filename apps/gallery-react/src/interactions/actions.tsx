// Stages of the /interactions page for the actions and toggles family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { type ReactNode } from 'react';
import { Button, CopyButton, IconButton, Switch, ToggleButton } from '@the-system/react';

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'button-press': () => (
    <>
      <Button data-interaction-trigger="">Save draft</Button>
      <IconButton icon="copy" label="Copy layer" />
      <ToggleButton label="Bold" />
    </>
  ),
  'copy-swap': () => (
    <>
      <CopyButton value="npm install @the-system/react" label="Copy command" data-interaction-trigger="" />
      <CopyButton value="npm install @the-system/react" label="Copy command" iconOnly />
    </>
  ),
  'switch-stretch': () => <Switch label="Auto save" data-interaction-trigger="" />,
};
