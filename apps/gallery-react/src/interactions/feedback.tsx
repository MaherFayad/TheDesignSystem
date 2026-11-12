// Stages of the /interactions page for the feedback, progress, data display and layout family
// (orders 1.21 and 1.22). One live stage per interaction id of
// packages/motion/src/interactions/content.ts. Each stage marks the control
// that plays it with data-interaction-trigger, so the page's replay control
// can press it again. Owned by the family agent of order 1.22.
import { useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Banner,
  Button,
  Callout,
  Card,
  CardDescription,
  CardHeader,
  CardLink,
  CardTitle,
  EmptyState,
  ErrorState,
  Kbd,
  Meter,
  NotificationCenter,
  ProgressBar,
  ProgressCircle,
  ResizableHandle,
  ResizablePanel,
  ResizablePanels,
  Skeleton,
  SplitView,
  Spinner,
  Stat,
  StatusDot,
  Tile,
  TileLink,
  TileTitle,
  toast,
  type AvatarStatusTone,
  type NotificationItem,
} from '@the-system/react';

const column = { display: 'grid', gap: 'var(--ds-space-s)', inlineSize: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ds-space-s)' } as const;

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
  const [delta, setDelta] = useState(0.12);
  return (
    <>
      <Stat label="Live visitors" value={value} delta={delta} hint="Since 9:00" />
      <div style={row}>
        <Button
          size="sm"
          data-interaction-trigger="up"
          onClick={() => {
            setValue((v) => v + 87);
            setDelta(0.12);
          }}
        >
          Add visitors
        </Button>
        <Button
          size="sm"
          emphasis="soft"
          onClick={() => {
            setValue((v) => v - 21);
            setDelta(-0.04);
          }}
        >
          Remove visitors
        </Button>
      </div>
    </>
  );
}

function SkeletonStage() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <div style={{ inlineSize: '14rem', position: 'relative' }}>
        {loading ? (
          <>
            <Skeleton size="lg" width="60%" />
            <Skeleton />
            <Skeleton width="80%" />
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontWeight: 600 }}>Brand review</p>
            <p style={{ margin: 0 }}>Moved to Thursday at 10:00 in room 4.</p>
          </>
        )}
      </div>
      <Button size="sm" data-interaction-trigger="" onClick={() => setLoading((v) => !v)}>
        {loading ? 'Load the content' : 'Show the placeholder'}
      </Button>
    </>
  );
}

function AlertStage() {
  const [shown, setShown] = useState(false);
  const [n, setN] = useState(0);
  return (
    <div style={column}>
      <div style={row}>
        <Button
          size="sm"
          data-interaction-trigger=""
          onClick={() => {
            setShown(true);
            setN((v) => v + 1);
          }}
        >
          Show the messages
        </Button>
      </div>
      {shown && (
        <div key={n} style={column}>
          <Alert tone="warning" title="Could not sync 3 files" actions={<Button size="sm">Try again</Button>}>
            Your local copies are safe.
          </Alert>
          <Banner tone="info">The workspace moves to the new plan on Monday.</Banner>
          <Callout tone="success" title="تم الحفظ" lang="ar" dir="rtl">
            التغييرات محفوظة في المسودة.
          </Callout>
        </div>
      )}
    </div>
  );
}

function DismissStage() {
  const [items, setItems] = useState(['a', 'b']);
  return (
    <div style={column}>
      <Button
        size="sm"
        data-interaction-trigger=""
        onClick={(event) => {
          // Press the first alert's own close button, so the dismiss plays as a person would see it.
          const close = event.currentTarget.parentElement?.querySelector<HTMLElement>('[data-ds="alert"]:not([inert]) [data-part="close"]');
          if (close) close.click();
          else setItems(['a', 'b']);
        }}
      >
        Dismiss the first
      </Button>
      <div style={{ ...column, position: 'relative' }}>
        {items.map((id) =>
          id === 'a' ? (
            <Alert key={id} tone="danger" title="Payment failed" onClose={() => setItems((v) => v.filter((x) => x !== id))}>
              Update the card on file.
            </Alert>
          ) : (
            <Alert key={id} tone="info" title="New version ready" onClose={() => setItems((v) => v.filter((x) => x !== id))} />
          ),
        )}
        <p style={{ margin: 0 }}>The page below closes the gap.</p>
      </div>
    </div>
  );
}

function StateStage() {
  const [n, setN] = useState(0);
  return (
    <div style={column}>
      <Button size="sm" data-interaction-trigger="" onClick={() => setN((v) => v + 1)}>
        Show the empty and error states
      </Button>
      <div key={n} style={{ ...column, gridTemplateColumns: '1fr 1fr' }}>
        <EmptyState size="sm" icon="search" title="No results" actions={<Button size="sm">Clear the filters</Button>}>
          Try another word.
        </EmptyState>
        <ErrorState size="sm" title="Could not load the board" onRetry={() => undefined} />
      </div>
    </div>
  );
}

function ProgressStage() {
  const [v, setV] = useState(20);
  return (
    <div style={column}>
      <ProgressBar label="Uploading files" value={v} />
      <div style={row}>
        <ProgressCircle label="Upload" value={v} size="lg" />
        <Button size="sm" data-interaction-trigger="" onClick={() => setV((x) => (x >= 100 ? 20 : Math.min(100, x + 40)))}>
          Advance the upload
        </Button>
      </div>
    </div>
  );
}

const people = ['Sara Ali', 'Omar Haddad', 'Lina Saad', 'Nora Fahad', 'Hadi Nasser', 'Ali Kamal', 'Maha Odeh'];

function AvatarGroupStage() {
  const [n, setN] = useState(2);
  return (
    <div style={row}>
      <AvatarGroup label={`${n} people`} max={4}>
        {people.slice(0, n).map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>
      <Button size="sm" data-interaction-trigger="" onClick={() => setN((v) => (v >= people.length ? 2 : v + 1))}>
        Add a person
      </Button>
      <Button size="sm" emphasis="soft" onClick={() => setN((v) => Math.max(1, v - 1))}>
        Remove a person
      </Button>
    </div>
  );
}

function BadgeStage() {
  const [n, setN] = useState(3);
  return (
    <div style={row}>
      <Badge tone="danger" emphasis="solid" count={n} countLabel={(c) => `${c} unread`} />
      <Badge tone="accent" dot count={n} countLabel={(c) => `${c} new`} />
      <Button size="sm" data-interaction-trigger="" onClick={() => setN((v) => v + 1)}>
        Add a message
      </Button>
      <Button size="sm" emphasis="soft" onClick={() => setN((v) => Math.max(0, v - 1))}>
        Read a message
      </Button>
    </div>
  );
}

const statuses: AvatarStatusTone[] = ['success', 'warning', 'danger', 'neutral'];

function AvatarStatusStage() {
  const [i, setI] = useState(1);
  return (
    <div style={row}>
      <Avatar name="Sara Ali" size="lg" status={statuses[i % statuses.length]} />
      <StatusDot label="Syncing" tone="info" pulse key={`dot-${i}`} />
      <Button size="sm" data-interaction-trigger="" onClick={() => setI((v) => v + 1)}>
        Change the status
      </Button>
    </div>
  );
}

const now = new Date();
const base: NotificationItem[] = [
  { id: 'n1', title: 'Omar commented on Brand review', time: now, unread: true },
  { id: 'n2', title: 'Lina invited you to Launch plan', time: now, unread: false, tone: 'info' },
];

function NotificationStage() {
  const [items, setItems] = useState(base);
  const [n, setN] = useState(3);
  return (
    <div style={column}>
      <div style={row}>
        <Button
          size="sm"
          data-interaction-trigger=""
          onClick={() => {
            setItems((v) => [{ id: `n${n}`, title: `Build ${n} passed`, time: new Date(), unread: true, tone: 'success' }, ...v]);
            setN((x) => x + 1);
          }}
        >
          Add a notification
        </Button>
        <Button size="sm" emphasis="soft" onClick={() => setItems((v) => v.slice(1))}>
          Remove the newest
        </Button>
      </div>
      <NotificationCenter size="sm" items={items} now={now} onMarkAllRead={() => setItems((v) => v.map((x) => ({ ...x, unread: false })))} />
    </div>
  );
}

function MeterStage() {
  const [n, setN] = useState(0);
  return (
    <div style={column}>
      <Button size="sm" data-interaction-trigger="" onClick={() => setN((v) => v + 1)}>
        Show the meters
      </Button>
      <div key={n} style={column}>
        <Meter label="Storage used" value={72} high={80} />
        <Meter label="Seats" value={34} />
      </div>
    </div>
  );
}

function CardStage() {
  return (
    <div style={{ ...row, alignItems: 'stretch' }}>
      <Card style={{ inlineSize: '12rem' }} data-interaction-trigger="">
        <CardHeader>
          <CardTitle>
            <CardLink href="#brand">Brand review</CardLink>
          </CardTitle>
          <CardDescription>Move the pointer over the card.</CardDescription>
        </CardHeader>
      </Card>
      <Tile style={{ inlineSize: '10rem' }}>
        <TileTitle>
          <TileLink href="#launch">Launch plan</TileLink>
        </TileTitle>
      </Tile>
    </div>
  );
}

function KbdStage() {
  const press = () => {
    for (const key of ['Control', 'k']) window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    setTimeout(() => {
      for (const key of ['k', 'Control']) window.dispatchEvent(new KeyboardEvent('keyup', { key }));
    }, 300);
  };
  return (
    <div style={row}>
      <Kbd platform="other">Ctrl+K</Kbd>
      <Kbd platform="other">Shift+Enter</Kbd>
      <Button size="sm" data-interaction-trigger="" onClick={press}>
        Press Control K
      </Button>
      <span>Or press the keys.</span>
    </div>
  );
}

function SpinnerStage() {
  const [n, setN] = useState(0);
  return (
    <div style={row}>
      <Spinner key={n} label="Loading files" tone="accent" />
      <Button size="sm" data-interaction-trigger="" onClick={() => setN((v) => v + 1)}>
        Show the spinner again
      </Button>
    </div>
  );
}

function HandleStage() {
  return (
    <ResizablePanels style={{ blockSize: '6rem', inlineSize: '100%', border: '1px solid var(--ds-color-border-default)' }}>
      <ResizablePanel defaultSize={50}>
        <p style={{ margin: 'var(--ds-space-s)' }}>Layers</p>
      </ResizablePanel>
      <ResizableHandle label="Resize layers" data-interaction-trigger="" />
      <ResizablePanel>
        <p style={{ margin: 'var(--ds-space-s)' }}>Canvas</p>
      </ResizablePanel>
    </ResizablePanels>
  );
}

function SplitStage() {
  const [show, setShow] = useState(false);
  return (
    <div style={column}>
      <Button size="sm" data-interaction-trigger="" onClick={() => setShow((v) => !v)}>
        {show ? 'Back to the list' : 'Open the message'}
      </Button>
      <SplitView
        layout="stacked"
        style={{ blockSize: '7rem', inlineSize: '100%', border: '1px solid var(--ds-color-border-default)' }}
        primaryLabel="Messages"
        secondaryLabel="Message"
        showSecondary={show}
        onShowSecondaryChange={setShow}
        primary={<p style={{ margin: 'var(--ds-space-s)' }}>Brand review, Launch plan, Weekly summary</p>}
        secondary={<p style={{ margin: 'var(--ds-space-s)' }}>Brand review moved to Thursday.</p>}
      />
    </div>
  );
}

function AccordionStage() {
  return (
    <div style={{ inlineSize: '100%' }}>
      <Accordion>
        <AccordionItem value="billing">
          <AccordionTrigger data-interaction-trigger="">Billing</AccordionTrigger>
          <AccordionContent>
            <p style={{ margin: 0 }}>Your plan renews on 12 March.</p>
            <ul style={{ margin: 0 }}>
              <li>Ten members</li>
              <li>Unlimited boards</li>
            </ul>
            <p style={{ margin: 0 }}>Change the card on file from the billing page.</p>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="members">
          <AccordionTrigger>Members</AccordionTrigger>
          <AccordionContent>Invite people by email. Each person gets the role you pick.</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function ErrorDetailsStage() {
  return <ErrorState size="sm" title="Could not load the board" code="ERR 504" onRetry={() => undefined} />;
}

/** Live stages by interaction id. */
export const stages: Record<string, () => ReactNode> = {
  'alert-entrance': () => <AlertStage />,
  'alert-dismiss': () => <DismissStage />,
  'state-illustration': () => <StateStage />,
  'error-state-details': () => <ErrorDetailsStage />,
  'accordion-reveal': () => <AccordionStage />,
  'skeleton-swap': () => <SkeletonStage />,
  'stat-roll': () => <StatStage />,
  'toast-enter': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', tone: 'info', title: 'New version ready', description: 'Reload the page to get it.' })}>
      Show a toast
    </Button>
  ),
  'toast-stack': () => <ToastStackStage />,
  'toast-swipe': () => (
    <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' })}>
      Show a toast
    </Button>
  ),
  'notification-change': () => <NotificationStage />,
  'progress-spring': () => <ProgressStage />,
  'progress-celebrate': () => <ProgressStage />,
  'meter-fill': () => <MeterStage />,
  'avatar-status': () => <AvatarStatusStage />,
  'status-pulse': () => <AvatarStatusStage />,
  'avatar-group-change': () => <AvatarGroupStage />,
  'badge-count': () => <BadgeStage />,
  'card-lift': () => <CardStage />,
  'spinner-loop': () => <SpinnerStage />,
  'kbd-press': () => <KbdStage />,
  'handle-grip': () => <HandleStage />,
  'split-view-pane': () => <SplitStage />,
};
