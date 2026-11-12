// Stages of the /interactions page for the navigation and shared indicators family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { type ReactNode } from 'react';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@the-system/react';

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'tab-slide': () => (
    <Tabs defaultValue="general">
      <TabsList aria-label="Board settings">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsPanel value="general">Name the board.</TabsPanel>
      <TabsPanel value="members">Invite people.</TabsPanel>
      <TabsPanel value="history">Every saved version.</TabsPanel>
    </Tabs>
  ),
};
