// Order DU5 (docs/plan/reset-duo.md 5.2): fold and column aware overlays.
// With the viewport segments API absent nothing changes; with two segments
// the modal overlays carry data-segment and the floating ones keep to the
// segment of their trigger.
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { Theme } from '../../theme/Theme';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent } from '../AlertDialog';
import { Button } from '../Button';
import { Dialog, DialogContent } from '../Dialog';
import { Drawer, DrawerContent } from '../Drawer';
import { Sheet, SheetContent } from '../Sheet';
import { useFold, useFoldCollision, type CollisionPadding } from './FloatingLayer';

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// The inner screen of the foldable in landscape: the fold at 455 with a 40 band.
const columns = [
  { x: 0, y: 0, width: 455, height: 669 },
  { x: 495, y: 0, width: 456, height: 669 },
];
const rows = [
  { x: 0, y: 0, width: 669, height: 455 },
  { x: 0, y: 495, width: 669, height: 456 },
];

function setSegments(segments: object[] | undefined) {
  if (segments === undefined) delete (window as unknown as { viewport?: unknown }).viewport;
  else Object.defineProperty(window, 'viewport', { configurable: true, value: { segments } });
}

const size = { width: window.innerWidth, height: window.innerHeight };
afterEach(() => {
  setSegments(undefined);
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: size.width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: size.height });
});

function FoldProbe() {
  const fold = useFold();
  return <output data-testid="fold">{fold ? `${fold.layout} ${fold.band.x} ${fold.band.width}` : 'none'}</output>;
}

describe('useFold', () => {
  it('is null without the viewport segments API and with one segment', () => {
    render(<FoldProbe />);
    expect(screen.getByTestId('fold').textContent).toBe('none');
    setSegments([columns[0]!]);
    act(() => void window.dispatchEvent(new Event('resize')));
    expect(screen.getByTestId('fold').textContent).toBe('none');
  });

  it('reads two segments after mount and follows a resize', () => {
    setSegments(columns);
    render(<FoldProbe />);
    expect(screen.getByTestId('fold').textContent).toBe('columns 455 40');
    setSegments(undefined);
    act(() => void window.dispatchEvent(new Event('resize')));
    expect(screen.getByTestId('fold').textContent).toBe('none');
  });
});

describe('data-segment on the modal overlays', () => {
  const root = (ds: string) => document.body.querySelector<HTMLElement>(`[data-ds='${ds}']`);

  it('is absent without a fold', async () => {
    render(
      <Theme>
        <Dialog defaultOpen>
          <DialogContent title="Rename board" />
        </Dialog>
      </Theme>,
    );
    await screen.findByRole('dialog');
    expect(root('dialog')?.hasAttribute('data-segment')).toBe(false);
  });

  it('is start on a Dialog and a Sheet when the segments sit side by side', async () => {
    setSegments(columns);
    const { unmount } = render(
      <Theme>
        <Dialog defaultOpen>
          <DialogContent title="Rename board" />
        </Dialog>
      </Theme>,
    );
    await waitFor(() => expect(root('dialog')?.getAttribute('data-segment')).toBe('start'));
    unmount();
    render(
      <Theme lang="ar" dir="rtl">
        <Sheet defaultOpen>
          <SheetContent title="تفاصيل البطاقة" />
        </Sheet>
      </Theme>,
    );
    await waitFor(() => expect(root('sheet')?.getAttribute('data-segment')).toBe('start'));
  });

  it('is bottom on an AlertDialog when the segments are stacked, and leaves the Drawer alone', async () => {
    setSegments(rows);
    render(
      <Theme>
        <AlertDialog defaultOpen>
          <AlertDialogContent title="Remove pass?">
            <AlertDialogCancel>
              <Button>Keep pass</Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button tone="danger">Remove pass</Button>
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
        <Drawer defaultOpen modal={false}>
          <DrawerContent title="Filters" />
        </Drawer>
      </Theme>,
    );
    await waitFor(() => expect(root('alert-dialog')?.getAttribute('data-segment')).toBe('bottom'));
    expect(root('drawer')?.hasAttribute('data-segment')).toBe(false);
  });
});

function Floating({ base, at }: { base: CollisionPadding; at: { x: number } }) {
  const fold = useFoldCollision(base);
  const [, force] = useState(0);
  return (
    <>
      <span
        ref={(el) => {
          if (!el) return;
          el.getBoundingClientRect = () => ({ left: at.x, top: 100, width: 10, height: 10, right: at.x + 10, bottom: 110, x: at.x, y: 100, toJSON: () => ({}) }) as DOMRect;
        }}
        aria-controls="floating-probe"
      />
      <div id="floating-probe" ref={fold.ref} data-testid="padding" data-padding={JSON.stringify(fold.collisionPadding)} onClick={() => force((n) => n + 1)} />
    </>
  );
}

describe('useFoldCollision', () => {
  it('passes the caller padding through untouched without a fold or a side inset', () => {
    render(<Floating base={8} at={{ x: 100 }} />);
    expect(screen.getByTestId('padding').getAttribute('data-padding')).toBe('8');
  });

  it('keeps an overlay from the start segment out of the band and the other segment', async () => {
    setSegments(columns);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 951 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 669 });
    render(<Floating base={8} at={{ x: 100 }} />);
    await waitFor(() => expect(JSON.parse(screen.getByTestId('padding').getAttribute('data-padding')!)).toEqual({ top: 8, right: 951 - 455 + 8, bottom: 8, left: 8 }));
  });

  it('keeps an overlay from the end segment past the band', async () => {
    setSegments(columns);
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 951 });
    render(<Floating base={{ top: 4, left: 12 }} at={{ x: 800 }} />);
    await waitFor(() => expect(JSON.parse(screen.getByTestId('padding').getAttribute('data-padding')!)).toMatchObject({ left: 495 + 12, top: 4 }));
  });

  it('a Popover from a trigger opens with no change when the API is absent', async () => {
    const { Popover, PopoverContent, PopoverTrigger } = await import('./index');
    render(
      <Theme>
        <Popover defaultOpen>
          <PopoverTrigger>
            <Button>About the lock screen</Button>
          </PopoverTrigger>
          <PopoverContent title="On the lock screen">Text</PopoverContent>
        </Popover>
      </Theme>,
    );
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });
});
