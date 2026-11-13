// Stages of the /interactions page for the overlays family (orders 1.21 to
// 1.23). One live stage per interaction id of
// packages/motion/src/interactions. Each stage marks the control that plays
// it with data-interaction-trigger, so the page's replay control can press
// it again. Owned by the family agent of order 1.22.
import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  IconButton,
  Lightbox,
  LightboxTrigger,
  NotificationCenter,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetTitle,
  SheetTrigger,
  Tooltip,
  Tour,
  Window,
  WindowControls,
  WindowLayer,
  toast,
  useTheme,
  type LightboxImage,
  type NotificationItem,
  type TourStep,
} from '@the-system/react';

const column = { display: 'grid', gap: 'var(--ds-space-s)', inlineSize: '100%' } as const;
const row = { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--ds-space-s)' } as const;

/** A made up landscape as an SVG data URL, so the stage works offline. */
function landscape(hue: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" width="1600" height="1000"><rect width="1600" height="1000" fill="hsl(${hue} 60% 80%)"/><circle cx="1150" cy="300" r="90" fill="hsl(${(hue + 50) % 360} 90% 92%)"/><path d="M0 700 Q 400 500 800 680 T 1600 620 V 1000 H 0 Z" fill="hsl(${hue} 35% 45%)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const photos: LightboxImage[] = [
  { src: landscape(200), alt: 'Blue hills under a pale sky', caption: 'Asir mountains at sunrise', width: 1600, height: 1000 },
  { src: landscape(20), alt: 'Orange dunes under a warm sky', caption: 'Empty Quarter dunes', width: 1600, height: 1000 },
];

const thumbStyle: CSSProperties = { display: 'block', inlineSize: '4rem', blockSize: '2.5rem', objectFit: 'cover', borderRadius: 'var(--ds-radius-sm)' };

function TourStage() {
  const [open, setOpen] = useState(false);
  const steps: TourStep[] = [
    { target: '#overlays-tour-a', title: 'Start a board', body: 'Each board holds one project.' },
    { target: '#overlays-tour-b', title: 'Share with your team', body: 'People with the link can comment.' },
    { target: '#overlays-tour-c', title: 'Export a copy', body: 'Download the board as a PDF.' },
  ];
  return (
    <>
      <Button id="overlays-tour-a" size="sm" emphasis="soft">
        New board
      </Button>
      <Button id="overlays-tour-b" size="sm" emphasis="soft">
        Share
      </Button>
      <Button id="overlays-tour-c" size="sm" emphasis="soft">
        Export
      </Button>
      <Button data-interaction-trigger="" onClick={() => setOpen(true)}>
        Start tour
      </Button>
      <Tour steps={steps} open={open} onOpenChange={setOpen} />
    </>
  );
}

function WindowStage() {
  const [open, setOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-m)', inlineSize: '100%' }}>
      <div style={{ display: 'flex', gap: 'var(--ds-space-m)' }}>
        <Button ref={trigger} data-interaction-trigger="" onClick={() => setOpen((v) => !v)}>
          {open ? 'Close window' : 'Open window'}
        </Button>
        <Button emphasis="soft" disabled={!open} onClick={() => setZoomed((v) => !v)}>
          {zoomed ? 'Restore window' : 'Zoom window'}
        </Button>
      </div>
      <WindowLayer style={{ blockSize: '14rem' }}>
        <Window kind="settings" title="Account settings" open={open} onOpenChange={setOpen} zoomed={zoomed} onZoomedChange={setZoomed} origin={trigger}>
          <p style={{ margin: 0 }}>The window grows out of the button and settles.</p>
        </Window>
      </WindowLayer>
    </div>
  );
}

/**
 * The Sheet and the Drawer. On platform ios the Sheet rests at two detents,
 * half and all of the room (order 1.29): the platform's medium and large.
 * The gallery passes them because detents are behavior an app picks (the
 * handle turns into a button with a key path), not a look a platform file
 * can set.
 */
function SheetStage() {
  const { platform } = useTheme();
  return (
    <>
      <Sheet detents={platform === 'ios' ? IOS_DETENTS : undefined}>
        <SheetTrigger>
          <Button data-interaction-trigger="sheet">Open sheet</Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle>Board settings</SheetTitle>
          <SheetBody>Name the board and pick who sees it first.</SheetBody>
        </SheetContent>
      </Sheet>
      <Drawer>
        <DrawerTrigger>
          <Button emphasis="soft" data-interaction-trigger="drawer">
            Open drawer
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerBody>Pick the boards to show.</DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}

const IOS_DETENTS = [0.5, 1] as const;

/** Live stages by interaction id. */
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

/**
 * A toast stage: the trigger and, under it, a room the size of a toast stack.
 * The toasts show in the page's toaster as anywhere else; the recorder moves
 * that toaster onto the room (drives/overlays.cjs) so a clip can hold the
 * trigger and the toasts at a large zoom.
 */
function ToastDock({ children }: { children: ReactNode }) {
  return (
    <div data-toast-stage="" style={{ display: 'grid', justifyItems: 'center', gap: 'var(--ds-space-m)' }}>
      {children}
      <div data-toast-dock="" aria-hidden="true" style={{ inlineSize: 'min(22rem, 90vw)', blockSize: '12rem' }} />
    </div>
  );
}

/** Three toasts at once, so the stack shows its depth and the hover opens it. */
function ToastExpandStage() {
  const [n, setN] = useState(1);
  return (
    <Button
      data-interaction-trigger=""
      onClick={() => {
        toast({ lang: 'en', tone: 'info', title: `Export ${n} ready`, description: 'Saved to your downloads.', dedupeKey: false });
        toast({ lang: 'en', tone: 'success', title: `Board ${n} shared`, description: 'Sara can comment now.', dedupeKey: false });
        toast({ lang: 'en', tone: 'warning', title: 'Storage almost full', description: 'Remove old versions to free space.', dedupeKey: false });
        setN((v) => v + 1);
      }}
    >
      Show three toasts
    </Button>
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

export const stages: Record<string, () => ReactNode> = {
  'popover-spring': () => (
    <>
      <Popover>
        <PopoverTrigger>
          <Button data-interaction-trigger="popover">Open popover</Button>
        </PopoverTrigger>
        <PopoverContent title="Board details">
          <PopoverBody>Created on 12 March by Sara Alqahtani.</PopoverBody>
          <PopoverFooter>
            <Button size="sm" emphasis="soft">
              Copy link
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
      <HoverCard openDelay={0}>
        <HoverCardTrigger>
          <a href="#overlays-profile">Sara Alqahtani</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>
            <strong>Sara Alqahtani</strong>
          </p>
          <p>Product designer in Riyadh.</p>
          <p>12 boards</p>
        </HoverCardContent>
      </HoverCard>
    </>
  ),
  'tooltip-rise': () => (
    <Tooltip content="Copy layer" shortcut="Ctrl+C">
      <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
    </Tooltip>
  ),
  'tooltip-follow': () => (
    <>
      <Tooltip content="Copy layer">
        <IconButton icon="copy" label="Copy layer" data-interaction-trigger="" />
      </Tooltip>
      <Tooltip content="Edit layer">
        <IconButton icon="edit" label="Edit layer" />
      </Tooltip>
      <Tooltip content="Insert link">
        <IconButton icon="link" label="Insert link" />
      </Tooltip>
      <Tooltip content="Delete layer">
        <IconButton icon="trash" label="Delete layer" />
      </Tooltip>
    </>
  ),
  'dialog-spring': () => (
    <>
      <Dialog size="sm">
        <DialogTrigger>
          <Button data-interaction-trigger="dialog">Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Archive this board</DialogTitle>
          <DialogDescription>Members keep read access. You can restore it later.</DialogDescription>
          <DialogBody>The board leaves the sidebar for everyone.</DialogBody>
          <DialogFooter>
            <DialogClose>
              <Button emphasis="soft">Keep board</Button>
            </DialogClose>
            <DialogClose>
              <Button tone="accent">Archive board</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog tone="danger">
        <AlertDialogTrigger>
          <Button tone="danger" emphasis="soft" data-interaction-trigger="alert">
            Delete board
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this board?</AlertDialogTitle>
          <AlertDialogDescription>Its frames and comments go too. This cannot be undone.</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Keep board</Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button tone="danger" emphasis="solid">
                Delete board
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  ),
  'sheet-spring': () => <SheetStage />,
  'lightbox-zoom': () => (
    <Lightbox images={photos}>
      {photos.map((photo, i) => (
        <LightboxTrigger key={photo.src} index={i}>
          <Button emphasis="ghost" aria-label={`View ${photo.alt}`} data-interaction-trigger={i === 0 ? '' : undefined}>
            <img src={photo.src} alt="" style={thumbStyle} />
          </Button>
        </LightboxTrigger>
      ))}
    </Lightbox>
  ),
  'tour-spotlight': () => <TourStage />,
  'window-settle': () => <WindowStage />,
  'window-lights': () => (
    // The recorder presses the trigger: the press lands on the zoom light, which only reports itself.
    <span data-interaction-trigger="" style={{ display: 'inline-flex' }}>
      <WindowControls onClose={() => undefined} onMinimize={() => undefined} onZoom={() => undefined} />
    </span>
  ),
  'toast-enter': () => (
    <ToastDock>
      <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', tone: 'info', title: 'New version ready', description: 'Reload the page to get it.' })}>
      Show a toast
    </Button>
    </ToastDock>
  ),
  'toast-stack': () => (
    <ToastDock>
      <ToastStackStage />
    </ToastDock>
  ),
  'toast-expand': () => (
    <ToastDock>
      <ToastExpandStage />
    </ToastDock>
  ),
  'toast-timer': () => (
    <ToastDock>
      <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', tone: 'success', title: 'Draft saved', description: 'Rest the pointer here to keep it.', dedupeKey: false })}>
      Show a timed toast
    </Button>
    </ToastDock>
  ),
  'dialog-refuse': () => (
    <AlertDialog>
      <AlertDialogTrigger>
        <Button tone="danger" emphasis="soft" data-interaction-trigger="">
          Leave the board
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Leave this board?</AlertDialogTitle>
        <AlertDialogDescription>You lose access until someone invites you again.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button>Stay on board</Button>
          </AlertDialogCancel>
          <AlertDialogAction>
            <Button tone="danger" emphasis="solid">
              Leave board
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  'toast-swipe': () => (
    <ToastDock>
      <Button data-interaction-trigger="" onClick={() => toast({ lang: 'en', title: 'Board duplicated', description: 'Swipe it away or wait.' })}>
      Show a toast
    </Button>
    </ToastDock>
  ),
  'notification-change': () => <NotificationStage />,
};
