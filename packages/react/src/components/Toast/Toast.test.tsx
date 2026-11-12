import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Dialog } from 'radix-ui';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Dialog as SystemDialog, DialogContent } from '../Dialog';
import ToastDemo from './Toast.demo';
import { Toast, Toaster, isInsideToaster, createToastFunction, createToastStore, type ToastStoreOptions } from './index';
import { liveOffsetY, watchStackShift } from './stackShift';

// jsdom has no pointer capture, which Radix Toast calls on pointer up.
const proto = Element.prototype as unknown as Record<string, unknown>;
proto.hasPointerCapture ??= () => false;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;

/** A clock the test moves by hand, so the store's timers run without waiting. */
function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  return {
    clock: {
      now: () => now,
      setTimeout(fn: () => void, ms: number) {
        seq += 1;
        timers.set(seq, { at: now + ms, fn });
        return seq;
      },
      clearTimeout(handle: unknown) {
        timers.delete(handle as number);
      },
    },
    advance(ms: number) {
      const end = now + ms;
      for (;;) {
        const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        timers.delete(next[0]);
        now = next[1].at;
        act(() => next[1].fn());
      }
      now = end;
    },
  };
}

function setup(options: ToastStoreOptions = {}) {
  const time = fakeClock();
  const store = createToastStore({ clock: time.clock, ...options });
  const toast = createToastFunction(store);
  const fire = (fn: () => unknown) => act(() => void fn());
  return { ...time, store, toast, fire };
}

const toasts = () => Array.from(document.body.querySelectorAll<HTMLElement>('[data-ds="toaster"] > [data-ds="toast"]'));
const openToasts = () => toasts().filter((t) => t.getAttribute('data-state') === 'open');

describe('Toaster', () => {
  it('renders the viewport, portaled to body, with the region name and the position', async () => {
    const { store } = setup();
    const { container } = render(
      <Theme>
        <Toaster store={store} position="top-center" />
      </Theme>,
    );
    const viewport = await waitFor(() => {
      const el = document.body.querySelector<HTMLElement>('[data-ds="toaster"]');
      if (!el) throw new Error('no viewport');
      return el;
    });
    expect(container.contains(viewport)).toBe(false);
    expect(viewport.tagName).toBe('OL');
    expect(viewport.getAttribute('data-position')).toBe('top-center');
    expect(screen.getByRole('region', { name: 'Notifications' }).contains(viewport)).toBe(true);
  });

  it('renders a toast from the bus with the anatomy and the tone', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast.success({ title: 'Draft saved', description: 'Saved to your account.' }));
    const [el] = toasts();
    expect(el).toBeDefined();
    if (!el) return;
    expect(el.tagName).toBe('LI');
    expect(el.getAttribute('data-tone')).toBe('success');
    expect(el.getAttribute('data-state')).toBe('open');
    expect(el.hasAttribute('data-part')).toBe(false);
    const parts = Array.from(el.querySelectorAll(':scope > [data-part]')).map((p) => p.getAttribute('data-part'));
    expect(parts).toEqual(['icon', 'title', 'description', 'close']);
    expect(el.querySelector('[data-part="icon"] [data-ds="icon"]')?.getAttribute('data-icon')).toBe('success');
    const close = within(el).getByRole('button', { name: 'Close notification' });
    expect(close.getAttribute('data-ds')).toBe('close-button');
    expect(close.getAttribute('data-part')).toBe('close');
  });

  it('times out a neutral toast through the store clock, and a danger toast stays', async () => {
    const { store, toast, fire, advance } = setup({ exitTimeout: 100 });
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast('Link copied'));
    fire(() => toast.danger('Could not publish page'));
    expect(openToasts()).toHaveLength(2);
    advance(4000);
    expect(openToasts().map((t) => t.getAttribute('data-tone'))).toEqual(['danger']);
    advance(60 * 60 * 1000);
    expect(openToasts()).toHaveLength(1);
    expect(toasts()).toHaveLength(1);
  });

  it('shows three and keeps the rest waiting', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => {
      for (let i = 1; i <= 8; i += 1) toast({ title: `File ${i} uploaded`, dedupeKey: false });
    });
    expect(openToasts()).toHaveLength(3);
    expect(store.getSnapshot().queued).toHaveLength(5);
  });

  it('the close button closes the toast', async () => {
    const user = userEvent.setup();
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast.danger('Could not publish page'));
    await user.click(screen.getByRole('button', { name: 'Close notification' }));
    expect(store.getSnapshot().visible[0]?.state).toBe('closed');
    // No animation runs in jsdom, so Radix unmounts the closed toast at once.
    expect(toasts()).toHaveLength(0);
  });

  it('the action runs and closes the toast', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast.danger({ title: 'Could not upload photo.jpg', action: { label: 'Retry upload', onAction } }));
    const action = screen.getByRole('button', { name: 'Retry upload' });
    expect(action.closest('[data-part="action"]')).not.toBeNull();
    expect(action.getAttribute('data-ds')).toBe('button');
    await user.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().visible[0]?.state).toBe('closed');
  });

  it('a repeat and an update change the toast in place: same element, focus kept, no remount', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast.danger('Could not save draft'));
    const first = toasts()[0];
    act(() => within(first as HTMLElement).getByRole('button', { name: 'Close notification' }).focus());
    const focused = document.activeElement;
    fire(() => toast.danger('Could not save draft'));
    expect(toasts()).toHaveLength(1);
    expect(toasts()[0]).toBe(first);
    expect(document.activeElement).toBe(focused);
    const count = first?.querySelector('[data-part="title"] > [data-part="count"]');
    expect(count?.textContent).toBe('×2');
    expect(count?.getAttribute('aria-hidden')).toBe('true');

    let id = '';
    fire(() => (id = toast('Saving draft', { duration: Infinity })));
    const saving = toasts().find((t) => t.textContent?.includes('Saving draft'));
    fire(() => toast.update(id, { tone: 'success', title: 'Draft saved' }));
    const updated = toasts().find((t) => t.textContent?.includes('Draft saved'));
    expect(updated).toBe(saving);
    expect(updated?.getAttribute('data-tone')).toBe('success');
  });

  it('copies the axes of the Theme it is mounted in onto the portal Theme', async () => {
    const { store } = setup();
    render(
      <Theme style="desk" scheme="light" density="compact" contrast="more" lang="ar" dir="rtl">
        <Toaster store={store} />
      </Theme>,
    );
    const layer = await waitFor(() => {
      const el = document.body.querySelector<HTMLElement>('[data-toaster-layer]');
      if (!el) throw new Error('no layer');
      return el;
    });
    expect(layer.parentElement).toBe(document.body);
    expect(layer.getAttribute('data-ds')).toBe('theme');
    expect(layer.getAttribute('data-style')).toBe('desk');
    expect(layer.getAttribute('data-scheme')).toBe('light');
    expect(layer.getAttribute('data-density')).toBe('compact');
    expect(layer.getAttribute('data-contrast')).toBe('more');
    expect(layer.getAttribute('lang')).toBe('ar');
    expect(layer.getAttribute('dir')).toBe('rtl');
    expect(layer.getAttribute('aria-live')).toBe('off');
    expect(layer.querySelector('[data-ds="toaster"]')).not.toBeNull();
    // Arabic chrome words come from the mounted language.
    expect(screen.getByRole('region', { name: 'التنبيهات' })).toBeDefined();
  });

  it('a toast with its own lang carries lang, dir and the close label of that language', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast({ lang: 'ar', title: 'المسودة محفوظة' }));
    const [el] = toasts();
    expect(el?.getAttribute('lang')).toBe('ar');
    expect(el?.getAttribute('dir')).toBe('rtl');
    expect(within(el as HTMLElement).getByRole('button', { name: 'إغلاق التنبيه' })).toBeDefined();
  });

  it('announces once per change, in the toast language, and the toast has no live role', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    const polite = () => document.body.querySelector<HTMLElement>('[data-toaster-announce="polite"]');
    const assertive = () => document.body.querySelector<HTMLElement>('[data-toaster-announce="assertive"]');
    expect(polite()?.getAttribute('role')).toBe('status');
    expect(polite()?.getAttribute('aria-live')).toBe('polite');
    expect(assertive()?.getAttribute('role')).toBe('alert');
    expect(assertive()?.getAttribute('aria-live')).toBe('assertive');
    // The regions sit in the themed layer, so they take its language.
    expect(polite()?.closest('[data-toaster-layer]')).not.toBeNull();

    fire(() =>
      toast.danger({
        title: 'Could not upload photo.jpg',
        description: 'The connection dropped',
        action: { label: 'Retry upload', onAction: () => undefined, altText: 'Upload it again from the Files panel' },
      }),
    );
    fire(() => toast.success({ lang: 'ar', title: 'المسودة محفوظة' }));
    await waitFor(() => expect(assertive()?.textContent).toBe('Notification. Could not upload photo.jpg. The connection dropped. Upload it again from the Files panel.'));
    expect(polite()?.textContent).toBe('تنبيه. المسودة محفوظة.');
    expect(polite()?.querySelector('span')?.getAttribute('lang')).toBe('ar');

    // No other live region carries the text: Radix's announcer is muted.
    const regions = Array.from(document.body.querySelectorAll('[aria-live="polite"], [aria-live="assertive"]')).filter((r) =>
      r.textContent?.includes('Could not upload photo.jpg'),
    );
    expect(regions).toHaveLength(1);
    for (const el of toasts()) {
      expect(el.hasAttribute('role')).toBe(false);
      expect(el.hasAttribute('aria-live')).toBe(false);
      expect(el.closest('[aria-live="polite"], [aria-live="assertive"]')).toBeNull();
    }

    // An update is read once more.
    const id = store.getSnapshot().visible[1]?.id ?? '';
    fire(() => toast.update(id, { title: 'تم الحفظ' }));
    await waitFor(() => expect(polite()?.textContent).toBe('تنبيه. تم الحفظ.'));
  });

  it('F8 moves focus to the viewport', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast('Draft saved'));
    fireEvent.keyDown(document, { key: 'F8', code: 'F8' });
    expect(document.activeElement?.getAttribute('data-ds')).toBe('toaster');
  });

  it('pauses the store while the pointer is over a toast or focus is inside', async () => {
    const { store, toast, fire, advance } = setup();
    render(
      <Theme>
        <Button>Page button</Button>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast('Draft saved'));
    const el = toasts()[0] as HTMLElement;
    fireEvent.pointerOver(el, { relatedTarget: document.body });
    expect(store.isPaused()).toBe(true);
    advance(10_000);
    expect(openToasts()).toHaveLength(1);
    fireEvent.pointerOut(el, { relatedTarget: document.body });
    expect(store.isPaused()).toBe(false);
    act(() => screen.getByRole('button', { name: 'Close notification' }).focus());
    expect(store.isPaused()).toBe(true);
    act(() => screen.getByRole('button', { name: 'Page button' }).focus());
    expect(store.isPaused()).toBe(false);
    act(() => window.dispatchEvent(new Event('blur')));
    expect(store.isPaused()).toBe(true);
    act(() => window.dispatchEvent(new Event('focus')));
    expect(store.isPaused()).toBe(false);
  });

  it('stays visible, in the accessibility tree and clickable above an open modal Radix Dialog', async () => {
    const user = userEvent.setup();
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Overlay />
            <Dialog.Content
              aria-describedby={undefined}
              onInteractOutside={(event) => {
                if (isInsideToaster(event.target)) event.preventDefault();
              }}
            >
              <Dialog.Title>Publish page</Dialog.Title>
              <Button>Publish page</Button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </Theme>,
    );
    const dialog = await screen.findByRole('dialog');
    fire(() => toast.danger({ title: 'Could not publish page', action: { label: 'Retry publish', onAction: () => undefined } }));
    const layer = document.body.querySelector<HTMLElement>('[data-toaster-layer]');
    // Radix hides the rest of the page from assistive tech, but not the toasts.
    expect(document.body.querySelector('[data-aria-hidden="true"]')).not.toBeNull();
    expect(layer?.closest('[aria-hidden="true"]')).toBeNull();
    expect(layer?.querySelector('[aria-hidden="true"] [data-ds="toast"]')).toBeNull();
    expect(isInsideToaster(screen.getByRole('button', { name: 'Retry publish' }))).toBe(true);
    expect(isInsideToaster(dialog)).toBe(false);

    // The close button works with the pointer; the dialog stays open.
    await user.click(screen.getByRole('button', { name: 'Close notification' }));
    expect(store.getSnapshot().visible[0]?.state).toBe('closed');
    expect(screen.getByRole('dialog')).toBe(dialog);
  });

  it('Escape closes a toast only from inside the toaster', async () => {
    const user = userEvent.setup();
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Button>Page button</Button>
        <Toaster store={store} />
      </Theme>,
    );
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
    fire(() => toast('Draft saved'));
    act(() => screen.getByRole('button', { name: 'Page button' }).focus());
    await user.keyboard('{Escape}');
    expect(store.getSnapshot().visible[0]?.state).toBe('open');
    act(() => screen.getByRole('button', { name: 'Close notification' }).focus());
    await user.keyboard('{Escape}');
    expect(store.getSnapshot().visible[0]?.state).toBe('closed');
  });

  it('Escape in a system Dialog closes the dialog and keeps a danger toast', async () => {
    const user = userEvent.setup();
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
        <SystemDialog defaultOpen>
          <DialogContent title="Publish this board?">
            <Button>Publish board</Button>
          </DialogContent>
        </SystemDialog>
      </Theme>,
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fire(() => toast.danger('Could not publish board'));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(store.getSnapshot().visible[0]?.state).toBe('open');
    expect(openToasts()).toHaveLength(1);
  });

  it('Escape in the toaster closes the toast and keeps the system Dialog', async () => {
    const { store, toast, fire } = setup();
    render(
      <Theme>
        <Toaster store={store} />
        <SystemDialog defaultOpen>
          <DialogContent title="Publish this board?">
            <Button>Publish board</Button>
          </DialogContent>
        </SystemDialog>
      </Theme>,
    );
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
    fire(() => toast.danger('Could not publish board'));
    // The modal dialog's focus trap pulls real focus back, so the key is sent
    // from the toast's close button: what counts is that the Escape comes
    // from inside the toaster.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Close notification' }), { key: 'Escape', code: 'Escape' });
    expect(store.getSnapshot().visible[0]?.state).toBe('closed');
    expect(screen.getByRole('dialog')).toBe(dialog);
  });
});

describe('Toast', () => {
  it('renders the anatomy with no behavior, no data-state and no close button without onClose', () => {
    const { container } = render(<Toast tone="warning" title="Storage almost full" description="200 MB left." count={2} />);
    const el = container.querySelector<HTMLElement>('[data-ds="toast"]');
    expect(el?.tagName).toBe('DIV');
    expect(el?.getAttribute('data-tone')).toBe('warning');
    expect(el?.hasAttribute('data-state')).toBe(false);
    expect(el?.querySelector('[data-part="count"]')?.textContent).toBe('×2');
    expect(el?.querySelector('[data-part="close"]')).toBeNull();
    expect(el?.hasAttribute('title')).toBe(false);
  });

  it('defaults to neutral, and onClose renders the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<Toast title="Board duplicated" onClose={onClose} className="x" data-testid="t" />);
    const el = container.querySelector<HTMLElement>('[data-ds="toast"]');
    expect(el?.getAttribute('data-tone')).toBe('neutral');
    expect(el?.className).toBe('x');
    expect(el?.getAttribute('data-testid')).toBe('t');
    await user.click(screen.getByRole('button', { name: 'Close notification' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders every demo case', async () => {
    const { container } = render(
      <Theme>
        <ToastDemo />
      </Theme>,
    );
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-trigger]')?.getAttribute('data-ds')).toBe('button');
    const tones = Array.from(container.querySelectorAll('[data-demo-case="variants"] [data-ds="toast"]')).map((t) => t.getAttribute('data-tone'));
    expect(tones).toEqual(['neutral', 'info', 'success', 'warning', 'danger']);
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]');
    expect(arabic?.getAttribute('lang')).toBe('ar');
    await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
  });
});

/** Lays out the toasts of a viewport by hand: jsdom has no layout. Bottom stack: the newest, last, sits lowest. */
function fakeStackLayout(height = 40, gap = 8) {
  const li = HTMLLIElement.prototype;
  const saved = (['offsetTop', 'offsetWidth', 'offsetHeight'] as const).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)] as const);
  Object.defineProperty(li, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      const items = Array.from(this.parentElement?.children ?? []).filter((c) => c.getAttribute('data-ds') === 'toast');
      return (items.indexOf(this) - items.length) * (height + gap);
    },
  });
  Object.defineProperty(li, 'offsetWidth', { configurable: true, get: () => 320 });
  Object.defineProperty(li, 'offsetHeight', { configurable: true, get: () => height });
  return () => {
    for (const [k] of saved) delete (li as unknown as Record<string, unknown>)[k];
  };
}

describe('the toast stack shift (interaction toast-stack)', () => {
  it('moves the toasts that stay from where they were, and skips the new one', async () => {
    const restore = fakeStackLayout();
    const viewport = document.createElement('ol');
    for (let i = 0; i < 2; i += 1) {
      const li = document.createElement('li');
      li.setAttribute('data-ds', 'toast');
      viewport.append(li);
    }
    document.body.append(viewport);
    const play = vi.fn(() => null);
    const stop = watchStackShift(viewport, play);
    const fresh = document.createElement('li');
    fresh.setAttribute('data-ds', 'toast');
    viewport.append(fresh);
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(2);
    for (const call of play.mock.calls as unknown as [HTMLElement, { y: number; width: number; height: number }, { y: number }][]) {
      expect(call[0]).not.toBe(fresh);
      // Each one was 48px lower (one toast and the gap) and plays up into place.
      expect(call[1]).toMatchObject({ x: 0, y: 48, width: 320, height: 40 });
      expect(call[2]).toMatchObject({ x: 0, y: 0 });
    }
    stop();
    viewport.append(document.createElement('li'));
    await Promise.resolve();
    expect(play).toHaveBeenCalledTimes(2);
    viewport.remove();
    restore();
  });

  it('reads the block offset of a running transform', () => {
    const el = document.createElement('div');
    el.style.transform = 'matrix(1, 0, 0, 1, 0, -12)';
    document.body.append(el);
    expect(liveOffsetY(el)).toBe(-12);
    el.style.transform = 'none';
    expect(liveOffsetY(el)).toBe(0);
    el.remove();
  });

  it('plays the shift with the flip primitive in the Toaster, and nothing under reduced motion', async () => {
    const restore = fakeStackLayout();
    const animate = vi.fn(() => ({ playState: 'running', cancel() {}, id: '' }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const hadAnimate = 'animate' in proto;
    proto.animate = animate;
    const matchMedia = window.matchMedia;
    try {
      const { store, toast, fire } = setup();
      const view = render(
        <Theme>
          <Toaster store={store} />
        </Theme>,
      );
      await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
      fire(() => toast({ title: 'File 1 uploaded', dedupeKey: false }));
      await act(async () => undefined);
      animate.mockClear();
      fire(() => toast({ title: 'File 2 uploaded', dedupeKey: false }));
      await act(async () => undefined);
      expect(animate).toHaveBeenCalledTimes(1);
      const [keyframes, timing] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
      expect(timing.id).toBe('ds-motion:flip');
      expect(keyframes[0]?.transform).toBe('translate(0px, 48px)');
      expect(keyframes[1]?.transform).toBe('none');
      expect(toasts()[0]?.style.transformOrigin).toBe('');
      view.unmount();

      // Reduced motion: the stack still changes at once, nothing plays.
      window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
      const second = setup();
      render(
        <Theme>
          <Toaster store={second.store} />
        </Theme>,
      );
      await waitFor(() => expect(document.body.querySelector('[data-ds="toaster"]')).not.toBeNull());
      second.fire(() => second.toast({ title: 'File 1 uploaded', dedupeKey: false }));
      await act(async () => undefined);
      animate.mockClear();
      second.fire(() => second.toast({ title: 'File 2 uploaded', dedupeKey: false }));
      await act(async () => undefined);
      expect(animate).not.toHaveBeenCalled();
      expect(openToasts()).toHaveLength(2);
    } finally {
      window.matchMedia = matchMedia;
      if (hadAnimate) proto.animate = undefined;
      else delete proto.animate;
      restore();
    }
  });
});
