// Stages of the /interactions page for the feedback, progress, data display and layout family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button, Skeleton, Stat, toast } from '@the-system/react';

/** Each press shows a toast with its own title, so the stack grows instead of updating one toast. */
function ToastStackStage() {
  const [n, setN] = useState(1);
  return (
    <Button
      data-interaction-trigger=""
      onClick={() => {
        toast({ lang: 'en', tone: 'success', title: `Draft ${n} saved`, description: 'Saved a moment ago.' });
        setN((v) => v + 1);
      }}
    >
      Show a toast
    </Button>
  );
}

function StatStage() {
  const [value, setValue] = useState(1240);
  return (
    <>
      <Stat label="Live visitors" value={value} />
      <Button size="sm" data-interaction-trigger="up" onClick={() => setValue((v) => v + 37)}>
        Add visitors
      </Button>
      <Button size="sm" emphasis="soft" data-interaction-trigger="down" onClick={() => setValue((v) => v - 21)}>
        Remove visitors
      </Button>
    </>
  );
}

function SkeletonStage() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <div style={{ inlineSize: '12rem' }}>
        {loading ? (
          <>
            <Skeleton size="lg" width="60%" />
            <Skeleton />
          </>
        ) : (
          <p style={{ margin: 0 }}>Brand review moved to Thursday at 10:00.</p>
        )}
      </div>
      <Button size="sm" data-interaction-trigger="" onClick={() => setLoading((v) => !v)}>
        {loading ? 'Load the content' : 'Show the placeholder'}
      </Button>
    </>
  );
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'toast-stack': () => <ToastStackStage />,
  'toast-enter': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', tone: 'info', title: 'New version ready', description: 'Reload the page to get it.' })}>
      Show a toast
    </Button>
  ),
  'toast-swipe': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' })}>
      Show a toast
    </Button>
  ),
  'stat-roll': () => <StatStage />,
  'skeleton-swap': () => <SkeletonStage />,
  'accordion-reveal': () => (
    <div style={{ inlineSize: '100%' }}>
      <Accordion>
        <AccordionItem value="billing">
          <AccordionTrigger>Billing</AccordionTrigger>
          <AccordionContent>Your plan renews on 12 March. Change the card on file or download past invoices from the billing page.</AccordionContent>
        </AccordionItem>
        <AccordionItem value="members">
          <AccordionTrigger>Members</AccordionTrigger>
          <AccordionContent>Invite people by email. Each person gets the role you pick.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};
