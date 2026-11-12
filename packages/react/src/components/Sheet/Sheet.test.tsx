import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import SheetDemo from './Sheet.demo';
import { Sheet, SheetBody, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetTitle, SheetTrigger, type SheetProps } from './index';

const proto = Element.prototype as unknown as Record<string, unknown>;
proto.setPointerCapture ??= () => undefined;
proto.releasePointerCapture ??= () => undefined;
proto.hasPointerCapture ??= () => false;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="sheet"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

function Basic(props: SheetProps) {
  return (
    <Sheet {...props}>
      <SheetTrigger>
        <Button>Share board</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Share Spring launch</SheetTitle>
        <SheetDescription>People with the link can view it.</SheetDescription>
        <SheetBody>Body</SheetBody>
        <SheetFooter>
          <SheetClose>
            <Button>Discard invite</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Fires a pointer event with a fixed timeStamp (jsdom stamps the real time otherwise). */
function pointer(el: HTMLElement, type: 'pointerDown' | 'pointerMove' | 'pointerUp', clientY: number, timeStamp: number) {
  const event = createEvent[type](el, { pointerId: 1, button: 0, clientY });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  Object.defineProperty(event, 'clientY', { value: clientY });
  fireEvent(el, event);
}

/** Drags the handle by dy px over the given ms. jsdom gives the panel no height, so a fake one is set. */
function drag(dy: number, ms = 300, height = 400) {
  const panel = part('panel') as HTMLElement;
  panel.getBoundingClientRect = () => ({ height, width: 400, top: 0, left: 0, right: 400, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  const handle = part('handle') as HTMLElement;
  pointer(handle, 'pointerDown', 100, 1);
  expect(rootEl()?.hasAttribute('data-dragging')).toBe(true);
  expect(rootEl()?.getAttribute('data-dragging')).toBe('');
  pointer(handle, 'pointerMove', 100 + dy, 1 + ms / 2);
  expect(panel.style.getPropertyValue('--_dialog-drag-y')).toBe(`${Math.max(0, dy)}px`);
  pointer(handle, 'pointerUp', 100 + dy, 1 + ms);
}

describe('Sheet', () => {
  it('renders the root, backdrop and panel in a themed portal, the handle first', async () => {
    const user = userEvent.setup();
    render(
      <Theme>
        <Basic />
      </Theme>,
    );
    await user.click(screen.getByRole('button', { name: 'Share board' }));
    const panel = await screen.findByRole('dialog', { name: 'Share Spring launch' });
    const root = rootEl();
    expect(root?.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root?.getAttribute('data-size')).toBe('md');
    expect(root?.getAttribute('data-state')).toBe('open');
    expect(root?.hasAttribute('data-dragging')).toBe(false);
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['handle', 'header', 'body', 'footer']);
    expect(part('handle')?.getAttribute('aria-hidden')).toBe('true');
    expect(part('handle')?.hasAttribute('tabindex')).toBe(false);
    expect(Array.from(part('header')?.children ?? []).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'close']);
    // The close part is the system CloseButton, the same control as Toast and Alert.
    expect(part('close')?.getAttribute('data-ds')).toBe('close-button');
  });

  it('sets data-size for every size', async () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<Basic defaultOpen size={size} />);
      await waitFor(() => expect(rootEl()?.getAttribute('data-size')).toBe(size));
      unmount();
    }
  });

  it('closes with Escape, the close control and SheetClose; focus returns to the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Share board' });
    await user.click(trigger);
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(trigger);
    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Close sheet' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Discard invite' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('closes on a drag past a quarter of its height', async () => {
    render(<Basic defaultOpen />);
    await screen.findByRole('dialog');
    drag(150, 1000);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('closes on a quick flick down', async () => {
    render(<Basic defaultOpen />);
    await screen.findByRole('dialog');
    drag(40, 20);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('snaps back on a short slow drag, and never rises above its place', async () => {
    render(<Basic defaultOpen />);
    await screen.findByRole('dialog');
    drag(40, 1000);
    expect(rootEl()?.hasAttribute('data-dragging')).toBe(false);
    expect(part('panel')?.style.getPropertyValue('--_dialog-drag-y')).toBe('');
    drag(-80, 1000);
    expect(rootEl()).not.toBeNull();
  });

  it('puts the panel back when a controlled parent keeps it open after a drag', async () => {
    render(<Basic open onOpenChange={() => undefined} />);
    await screen.findByRole('dialog');
    drag(300, 1000);
    await waitFor(() => expect(part('panel')?.style.getPropertyValue('--_dialog-drag-y')).toBe(''));
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
  });

  it('clears the drag when pointer capture is lost', async () => {
    render(<Basic defaultOpen />);
    await screen.findByRole('dialog');
    const handle = part('handle') as HTMLElement;
    pointer(handle, 'pointerDown', 100, 1);
    pointer(handle, 'pointerMove', 160, 50);
    fireEvent(handle, Object.assign(createEvent.lostPointerCapture(handle), {}));
    expect(rootEl()?.hasAttribute('data-dragging')).toBe(true);
    const lost = createEvent.lostPointerCapture(handle);
    Object.defineProperty(lost, 'pointerId', { value: 1 });
    fireEvent(handle, lost);
    expect(rootEl()?.hasAttribute('data-dragging')).toBe(false);
    expect(part('panel')?.style.getPropertyValue('--_dialog-drag-y')).toBe('');
  });

  it('with dismissible false, a drag, Escape and the backdrop do nothing', async () => {
    render(<Basic defaultOpen dismissible={false} />);
    await screen.findByRole('dialog');
    drag(300, 1000);
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    fireEvent.pointerDown(part('backdrop') as HTMLElement);
    expect(rootEl()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Close sheet' }).getAttribute('aria-disabled')).toBe('true');
  });

  it('labels the close control in Arabic under lang ar', async () => {
    render(
      <Theme lang="ar" dir="rtl">
        <Basic defaultOpen />
      </Theme>,
    );
    await screen.findByRole('dialog');
    expect(screen.getByRole('button', { name: 'إغلاق النافذة السفلية' })).not.toBeNull();
  });

  it('renders the demo with a trigger per case', () => {
    const { container } = render(<SheetDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled']);
    for (const section of Array.from(container.querySelectorAll('[data-demo-case]'))) {
      expect(section.querySelector('[data-demo-trigger]')).not.toBeNull();
    }
    expect(container.querySelector('[title]')).toBeNull();
  });

  it('moves a bottom toaster to the top edge while a Sheet is open, so toasts never cover its footer', () => {
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Dialog.css'), 'utf8');
    const selector = ":root:has([data-ds='sheet'] > [data-part='panel'][data-state='open']) [data-ds='toaster'][data-position^='bottom'] {";
    const at = css.indexOf(selector);
    expect(at).toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf('}', at));
    expect(rule).toMatch(/inset-block-start: var\(--_toaster-inset-block-start\);/);
    expect(rule).toMatch(/inset-block-end: auto;/);
  });
});
