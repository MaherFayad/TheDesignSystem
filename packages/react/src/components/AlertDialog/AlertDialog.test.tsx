import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Toaster, createToastFunction, createToastStore } from '../Toast';

// jsdom has no pointer capture, which Radix Toast calls on pointer up.
const proto = Element.prototype as unknown as Record<string, unknown>;
proto.hasPointerCapture ??= () => false;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
import AlertDialogDemo from './AlertDialog.demo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogProps,
} from './index';

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="alert-dialog"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

function Basic({ onAction, ...props }: AlertDialogProps & { onAction?: () => void }) {
  return (
    <AlertDialog {...props}>
      <AlertDialogTrigger>
        <Button>Delete the board</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete the board Spring launch?</AlertDialogTitle>
        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>
            <Button>Keep board</Button>
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>
            <Button tone="danger" emphasis="solid">
              Delete board
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Delete the board' }));
  return screen.findByRole('alertdialog');
}

describe('AlertDialog', () => {
  it('renders the root, the backdrop and the panel in a themed portal, with the parts in order', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Theme>
        <Basic />
      </Theme>,
    );
    expect(rootEl()).toBeNull();
    const panel = await open(user);
    const root = rootEl();
    expect(container.contains(root)).toBe(false);
    expect(root?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-tone')).toBe('neutral');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(Array.from(root?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    expect(part('panel')).toBe(panel);
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title', 'description', 'footer']);
    expect(part('close')).toBeNull();
    expect(part('cancel')?.getAttribute('data-ds')).toBe('button');
    expect(part('action')?.getAttribute('data-ds')).toBe('button');
    expect(part('icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(part('icon')?.querySelector('[data-icon="info"]')).not.toBeNull();
  });

  it('is named by its title and described by its description', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const panel = await open(user);
    expect(screen.getByRole('alertdialog', { name: 'Delete the board Spring launch?' })).toBe(panel);
    expect(document.getElementById(panel.getAttribute('aria-describedby') ?? '')?.textContent).toBe('This cannot be undone.');
  });

  it('opens with focus on Cancel, in both tones', async () => {
    for (const tone of ['neutral', 'danger'] as const) {
      const user = userEvent.setup();
      const { unmount } = render(<Basic tone={tone} />);
      await open(user);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Keep board' })));
      unmount();
    }
  });

  it('shows the warning icon in the danger tone, a custom icon, or none', async () => {
    const { unmount } = render(<Basic defaultOpen tone="danger" />);
    await waitFor(() => expect(part('icon')?.querySelector('[data-icon="warning"]')).not.toBeNull());
    unmount();
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent icon={false} title="Leave the board?" description="You lose access.">
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Button>Stay on board</Button>
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await screen.findByRole('alertdialog', { name: 'Leave the board?' });
    expect(part('icon')).toBeNull();
  });

  it('sets data-size and data-tone', async () => {
    for (const size of ['sm', 'md'] as const) {
      const { unmount } = render(<Basic defaultOpen size={size} tone="danger" />);
      await waitFor(() => expect(rootEl()?.getAttribute('data-size')).toBe(size));
      expect(rootEl()?.getAttribute('data-tone')).toBe('danger');
      unmount();
    }
  });

  it('closes with Escape, Cancel and the action, never with a backdrop click, and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    let ran = 0;
    render(<Basic onAction={() => ran++} />);
    const trigger = screen.getByRole('button', { name: 'Delete the board' });

    await open(user);
    fireEvent.pointerDown(part('backdrop') as HTMLElement);
    fireEvent.click(part('backdrop') as HTMLElement);
    expect(rootEl()).not.toBeNull();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(trigger);

    await open(user);
    await user.click(screen.getByRole('button', { name: 'Keep board' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(ran).toBe(0);

    await open(user);
    await user.click(screen.getByRole('button', { name: 'Delete board' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(ran).toBe(1);
  });

  it('nudges the panel when a backdrop press is refused, and stays still under reduced motion', async () => {
    const user = userEvent.setup();
    const animate = vi.fn(() => ({ cancel() {}, playState: 'running' }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const had = 'animate' in proto;
    proto.animate = animate;
    try {
      render(<Basic />);
      const panel = await open(user);
      animate.mockClear();
      fireEvent.pointerDown(part('backdrop') as HTMLElement, { button: 0 });
      expect(rootEl()).not.toBeNull();
      expect(animate).toHaveBeenCalledTimes(1);
      expect(animate.mock.contexts[0]).toBe(panel);
      const [, timing] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
      expect(timing.id).toBe('ds-motion:shake');
      // A press inside the panel is not a refusal.
      fireEvent.pointerDown(panel, { button: 0 });
      expect(animate).toHaveBeenCalledTimes(1);
      document.documentElement.setAttribute('data-motion', 'reduce');
      fireEvent.pointerDown(part('backdrop') as HTMLElement, { button: 0 });
      // The reduced shake holds still: whatever plays moves nothing.
      const reduced = animate.mock.calls.slice(1) as unknown as [Keyframe[]][];
      expect(reduced.flatMap(([k]) => k).some((k) => k.transform !== undefined && k.transform !== 'none')).toBe(false);
    } finally {
      document.documentElement.removeAttribute('data-motion');
      if (had) proto.animate = undefined;
      else delete proto.animate;
    }
  });

  it('traps Tab inside the panel', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await open(user);
    const cancel = screen.getByRole('button', { name: 'Keep board' });
    const action = screen.getByRole('button', { name: 'Delete board' });
    await waitFor(() => expect(document.activeElement).toBe(cancel));
    await user.tab();
    expect(document.activeElement).toBe(action);
    await user.tab();
    expect(document.activeElement).toBe(cancel);
  });

  it('with dismissible false, Escape does nothing; preventDefault on the action keeps it open', async () => {
    const user = userEvent.setup();
    function Busy() {
      const [o, setO] = useState(true);
      return (
        <AlertDialog open={o} onOpenChange={setO} dismissible={false}>
          <AlertDialogContent title="Delete the project?" description="This cannot be undone.">
            <AlertDialogFooter>
              <AlertDialogCancel>
                <Button>Keep project</Button>
              </AlertDialogCancel>
              <AlertDialogAction onClick={(e) => e.preventDefault()}>
                <Button tone="danger" emphasis="solid" loading>
                  Delete project
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    render(<Busy />);
    await screen.findByRole('alertdialog');
    await user.keyboard('{Escape}');
    expect(rootEl()).not.toBeNull();
    fireEvent.click(part('action') as HTMLElement);
    expect(rootEl()).not.toBeNull();
  });

  it('copies the Theme axes into the portal, Arabic included', async () => {
    render(
      <Theme style="desk" scheme="light" lang="ar" dir="rtl">
        <Basic defaultOpen />
      </Theme>,
    );
    await waitFor(() => expect(rootEl()).not.toBeNull());
    const layer = rootEl()?.parentElement;
    expect(layer?.getAttribute('data-style')).toBe('desk');
    expect(layer?.getAttribute('data-scheme')).toBe('light');
    expect(layer?.getAttribute('lang')).toBe('ar');
    expect(layer?.getAttribute('dir')).toBe('rtl');
  });

  it('keeps a toast above clickable, and Escape from inside still cancels while the toast stays', async () => {
    const user = userEvent.setup();
    const store = createToastStore();
    const toast = createToastFunction(store);
    let retried = 0;
    render(
      <Theme>
        <Toaster store={store} />
        <Basic defaultOpen />
      </Theme>,
    );
    const panel = await screen.findByRole('alertdialog');
    await waitFor(() => expect(panel.contains(document.activeElement)).toBe(true));
    act(() => void toast.danger({ title: 'Could not delete board', action: { label: 'Retry delete', onAction: () => (retried += 1) } }));
    await user.click(screen.getByRole('button', { name: 'Retry delete' }));
    expect(retried).toBe(1);
    expect(screen.getByRole('alertdialog')).toBe(panel);
    // A second toast, then Escape from inside the alert: the alert cancels, that toast stays.
    act(() => void toast.danger({ title: 'Board is read only' }));
    screen.getByRole('button', { name: 'Keep board' }).focus();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(store.getSnapshot().visible.filter((t) => t.state === 'open').length).toBe(1);
  });

  it('renders the demo with a trigger per case and no native title', () => {
    const { container } = render(<AlertDialogDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'long-text', 'long-arabic', 'loading', 'error']);
    expect(container.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]').length).toBe(5);
    for (const section of Array.from(container.querySelectorAll('[data-demo-case]'))) {
      expect(section.querySelector('[data-demo-trigger]')).not.toBeNull();
    }
    expect(container.querySelector('[title]')).toBeNull();
  });
});
