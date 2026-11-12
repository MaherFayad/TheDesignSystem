import { describe, expect, it, vi } from 'vitest';
import {
  TOAST_DURATIONS,
  createToastFunction,
  createToastStore,
  toastDedupeKey,
  toastUrgency,
  type ToastClock,
  type ToastStoreOptions,
} from './toast';

/** A clock the test moves by hand. */
function fakeClock() {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const clock: ToastClock = {
    now: () => now,
    setTimeout(fn, ms) {
      seq += 1;
      timers.set(seq, { at: now + ms, fn });
      return seq;
    },
    clearTimeout(handle) {
      timers.delete(handle as number);
    },
  };
  const advance = (ms: number) => {
    const end = now + ms;
    for (;;) {
      const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      timers.delete(next[0]);
      now = next[1].at;
      next[1].fn();
    }
    now = end;
  };
  return { clock, advance, pending: () => timers.size };
}

function setup(options: ToastStoreOptions = {}) {
  const time = fakeClock();
  const store = createToastStore({ clock: time.clock, ...options });
  const toast = createToastFunction(store);
  const open = () => store.getSnapshot().visible.filter((t) => t.state === 'open');
  return { ...time, store, toast, open };
}

describe('toast store', () => {
  it('adds a toast from a string or options and returns its id', () => {
    const { toast, store } = setup();
    const a = toast('Draft saved');
    const b = toast({ title: 'Board shared', description: 'Anyone with the link can view it.', tone: 'info' });
    const [first, second] = store.getSnapshot().visible;
    expect(first).toMatchObject({ id: a, title: 'Draft saved', tone: 'neutral', state: 'open', count: 1, version: 1 });
    expect(second).toMatchObject({ id: b, tone: 'info', description: 'Anyone with the link can view it.' });
    expect(a).not.toBe(b);
  });

  it('the tone helpers set the tone', () => {
    const { toast, store } = setup({ max: 10 });
    toast.success('Draft saved');
    toast.danger('Could not save draft');
    toast.warning('Storage almost full');
    toast.info('New version ready');
    expect(store.getSnapshot().visible.map((t) => t.tone)).toEqual(['success', 'danger', 'warning', 'info']);
  });

  it('shows three at most and queues the rest, oldest first', () => {
    const { toast, store, open } = setup();
    const ids = Array.from({ length: 8 }, (_, i) => toast({ title: `File ${i + 1} uploaded` }));
    expect(open().map((t) => t.id)).toEqual(ids.slice(0, 3));
    expect(store.getSnapshot().queued.map((t) => t.id)).toEqual(ids.slice(3));
    store.dismiss(ids[0]);
    expect(open().map((t) => t.id)).toEqual(ids.slice(1, 4));
    expect(store.getSnapshot().queued).toHaveLength(4);
  });

  it('takes another max', () => {
    const { toast, open } = setup({ max: 1 });
    toast('One');
    toast('Two');
    expect(open()).toHaveLength(1);
  });

  it('dedupes a repeat by tone, title and description, and bumps the count', () => {
    const { toast, store } = setup();
    const a = toast.danger({ title: 'Could not save draft', description: 'Check your connection.' });
    const b = toast.danger({ title: 'Could not save draft', description: 'Check your connection.' });
    expect(b).toBe(a);
    const [only] = store.getSnapshot().visible;
    expect(store.getSnapshot().visible).toHaveLength(1);
    expect(only).toMatchObject({ count: 2, version: 2 });
    // The same copy in another tone is another toast.
    toast.warning({ title: 'Could not save draft', description: 'Check your connection.' });
    expect(store.getSnapshot().visible).toHaveLength(2);
  });

  it('dedupes by an explicit key, and dedupeKey false stacks', () => {
    const { toast, store } = setup({ max: 10 });
    const a = toast({ title: 'Uploading 1 file', dedupeKey: 'upload' });
    const b = toast({ title: 'Uploading 2 files', dedupeKey: 'upload' });
    expect(b).toBe(a);
    toast({ title: 'Upload failed', dedupeKey: false });
    toast({ title: 'Upload failed', dedupeKey: false });
    expect(store.getSnapshot().visible).toHaveLength(3);
  });

  it('dedupes a waiting toast too', () => {
    const { toast, store } = setup({ max: 1 });
    toast('First');
    const a = toast('Second');
    expect(toast('Second')).toBe(a);
    expect(store.getSnapshot().queued).toHaveLength(1);
    expect(store.getSnapshot().queued[0]?.count).toBe(2);
  });

  it('the dedupe key leaves out the action and the duration', () => {
    expect(toastDedupeKey({ title: 'Saved' })).toBe(toastDedupeKey({ title: 'Saved', tone: 'neutral' }));
    expect(toastDedupeKey({ title: 'Saved', dedupeKey: false })).toBeNull();
    expect(toastDedupeKey({ title: 'Saved', dedupeKey: 'x' })).not.toBe(toastDedupeKey({ title: 'x' }));
  });

  it('closes by tone after its duration, and the next waiting toast starts its own timer', () => {
    const { toast, store, advance, open } = setup({ max: 1 });
    const a = toast.success('Draft saved');
    const b = toast.warning('Storage almost full');
    advance(TOAST_DURATIONS.success - 1);
    expect(open().map((t) => t.id)).toEqual([a]);
    advance(1);
    expect(open().map((t) => t.id)).toEqual([b]);
    expect(store.getSnapshot().visible.find((t) => t.id === a)?.state).toBe('closed');
    advance(TOAST_DURATIONS.warning - 1);
    expect(open().map((t) => t.id)).toEqual([b]);
    advance(1);
    expect(open()).toHaveLength(0);
  });

  it('a danger toast is persistent, even when a duration is asked', () => {
    const { toast, advance, open } = setup();
    const id = toast.danger({ title: 'Could not publish page', duration: 1000 });
    expect(open()[0]?.duration).toBe(Infinity);
    advance(10 * 60 * 1000);
    expect(open().map((t) => t.id)).toEqual([id]);
    toast.dismiss(id);
    expect(open()).toHaveLength(0);
  });

  it('a custom duration and Infinity hold for the other tones', () => {
    const { toast, advance, open } = setup();
    toast({ title: 'Saving draft', duration: Infinity });
    toast({ title: 'Link copied', duration: 1500 });
    advance(1500);
    expect(open().map((t) => t.title)).toEqual(['Saving draft']);
  });

  it('pause keeps the time left and resume runs it out', () => {
    const { toast, store, advance, open } = setup();
    toast('Draft saved');
    advance(3000);
    store.pause();
    expect(store.isPaused()).toBe(true);
    advance(60_000);
    expect(open()).toHaveLength(1);
    store.resume();
    advance(999);
    expect(open()).toHaveLength(1);
    advance(1);
    expect(open()).toHaveLength(0);
  });

  it('a toast that shows while paused waits for resume', () => {
    const { toast, store, advance, open } = setup();
    store.pause();
    toast('Draft saved');
    advance(10_000);
    expect(open()).toHaveLength(1);
    store.resume();
    advance(4000);
    expect(open()).toHaveLength(0);
  });

  it('a repeat restarts the timer', () => {
    const { toast, advance, open } = setup();
    toast('Draft saved');
    advance(3000);
    toast('Draft saved');
    advance(3000);
    expect(open()).toHaveLength(1);
    advance(1000);
    expect(open()).toHaveLength(0);
  });

  it('update changes the toast in place, restarts its timer and takes the duration of a new tone', () => {
    const { toast, store, advance, open } = setup();
    const id = toast({ title: 'Saving draft', duration: Infinity });
    advance(60_000);
    expect(toast.update(id, { tone: 'success', title: 'Draft saved' })).toBe(true);
    const [item] = store.getSnapshot().visible;
    expect(item).toMatchObject({ id, tone: 'success', title: 'Draft saved', version: 2, duration: TOAST_DURATIONS.success });
    advance(TOAST_DURATIONS.success);
    expect(open()).toHaveLength(0);
    expect(toast.update(id, { title: 'Gone' })).toBe(false);
    expect(toast.update('nope', { title: 'Gone' })).toBe(false);
  });

  it('update keeps the dedupe key in step with the copy', () => {
    const { toast, store } = setup();
    const id = toast('Saving draft');
    toast.update(id, { title: 'Draft saved' });
    expect(toast('Draft saved')).toBe(id);
    expect(store.getSnapshot().visible[0]?.count).toBe(2);
  });

  it('a call with the id of an open toast updates it', () => {
    const { toast, store } = setup();
    toast({ id: 'save', title: 'Saving draft' });
    expect(toast({ id: 'save', title: 'Draft saved', tone: 'success' })).toBe('save');
    expect(store.getSnapshot().visible).toHaveLength(1);
    expect(store.getSnapshot().visible[0]).toMatchObject({ title: 'Draft saved', tone: 'success' });
  });

  it('keeps the action, and a repeat may bring a new one', () => {
    const { toast, store } = setup();
    const first = vi.fn();
    const second = vi.fn();
    toast.danger({ title: 'Could not save draft', action: { label: 'Try again', onAction: first } });
    toast.danger({ title: 'Could not save draft', action: { label: 'Try again', onAction: second } });
    store.getSnapshot().visible[0]?.action?.onAction();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('dismiss closes one, dismiss with no id closes all and drops the queue', () => {
    const { toast, store, open } = setup();
    const ids = Array.from({ length: 5 }, (_, i) => toast(`Item ${i + 1} archived`));
    toast.dismiss(ids[1]);
    expect(open().map((t) => t.id)).toEqual([ids[0], ids[2], ids[3]]);
    toast.dismiss();
    expect(open()).toHaveLength(0);
    expect(store.getSnapshot().queued).toHaveLength(0);
    // Dismissing what is gone does nothing.
    const before = store.getSnapshot();
    toast.dismiss('nope');
    expect(store.getSnapshot()).toBe(before);
  });

  it('a closed toast leaves after the exit timeout, or at once on remove', () => {
    const { toast, store, advance } = setup({ exitTimeout: 500 });
    const a = toast('One');
    const b = toast('Two');
    toast.dismiss(a);
    toast.dismiss(b);
    store.remove(b);
    expect(store.getSnapshot().visible.map((t) => t.id)).toEqual([a]);
    advance(500);
    expect(store.getSnapshot().visible).toHaveLength(0);
    // remove does nothing to an open toast.
    const c = toast('Three');
    store.remove(c);
    expect(store.getSnapshot().visible).toHaveLength(1);
  });

  it('the snapshot is stable between changes, empty is one constant, and listeners hear each change', () => {
    const { toast, store } = setup();
    const empty = store.getSnapshot();
    expect(store.getServerSnapshot()).toBe(empty);
    expect(store.getSnapshot()).toBe(empty);
    const listener = vi.fn();
    const off = store.subscribe(listener);
    toast('Draft saved');
    const one = store.getSnapshot();
    expect(store.getSnapshot()).toBe(one);
    expect(listener).toHaveBeenCalledTimes(1);
    store.pause();
    store.resume();
    expect(store.getSnapshot()).toBe(one);
    off();
    toast('Board shared');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getServerSnapshot()).toBe(empty);
  });

  it('urgency: danger is assertive, the rest polite', () => {
    expect(toastUrgency('danger')).toBe('assertive');
    for (const tone of ['neutral', 'success', 'warning', 'info'] as const) expect(toastUrgency(tone)).toBe('polite');
  });

  it('keeps no timer for a persistent toast', () => {
    const { toast, pending } = setup();
    toast.danger('Could not publish page');
    expect(pending()).toBe(0);
  });

  it('a toast with an action never times out, and loses that when the action goes', () => {
    const { toast, advance, open } = setup();
    const id = toast({ title: 'Card moved to Archive', duration: 2000, action: { label: 'Undo move', onAction: () => undefined } });
    expect(open()[0]?.duration).toBe(Infinity);
    advance(60 * 60 * 1000);
    expect(open()).toHaveLength(1);
    toast.update(id, { action: undefined });
    expect(open()[0]?.duration).toBe(TOAST_DURATIONS.neutral);
    advance(TOAST_DURATIONS.neutral);
    expect(open()).toHaveLength(0);
  });

  it('a repeat that brings an action makes the toast persistent', () => {
    const { toast, advance, open } = setup();
    toast('Could not sync board');
    toast('Could not sync board', { action: { label: 'Sync board', onAction: () => undefined } });
    advance(60_000);
    expect(open()).toHaveLength(1);
  });

  it('configure changes the max and the durations', () => {
    const { toast, advance, open } = setup();
    toast.configure({ max: 1, durations: { neutral: 10_000 } });
    toast('One');
    toast('Two');
    expect(open()).toHaveLength(1);
    advance(9999);
    expect(open().map((t) => t.title)).toEqual(['One']);
    advance(1);
    expect(open().map((t) => t.title)).toEqual(['Two']);
    toast.configure({ max: 5 });
    toast.danger('Could not publish page');
    expect(open()).toHaveLength(2);
  });
});
