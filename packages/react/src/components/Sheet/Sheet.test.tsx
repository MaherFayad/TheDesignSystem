import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import { ThemeContext } from '../../theme/context';
import { resolveTheme } from '../../theme/resolve';
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
/** Up, or down on a sheet that will not close, the panel follows a third of the pointer (the rubber band). */
function drag(dy: number, ms = 300, height = 400, dismissible = true) {
  const panel = part('panel') as HTMLElement;
  panel.getBoundingClientRect = () => ({ height, width: 400, top: 0, left: 0, right: 400, bottom: height, x: 0, y: 0, toJSON: () => ({}) });
  const handle = part('handle') as HTMLElement;
  pointer(handle, 'pointerDown', 100, 1);
  expect(rootEl()?.hasAttribute('data-dragging')).toBe(true);
  expect(rootEl()?.getAttribute('data-dragging')).toBe('');
  pointer(handle, 'pointerMove', 100 + dy, 1 + ms / 2);
  expect(panel.style.getPropertyValue('--_dialog-drag-y')).toBe(`${dy < 0 || !dismissible ? dy * (1 / 3) : dy}px`);
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

  it('a quick drag that pauses before the release has no speed left and snaps back (review 3, N28)', async () => {
    render(<Basic defaultOpen />);
    await screen.findByRole('dialog');
    const panel = part('panel') as HTMLElement;
    panel.getBoundingClientRect = () => ({ height: 400, width: 400, top: 0, left: 0, right: 400, bottom: 400, x: 0, y: 0, toJSON: () => ({}) });
    const handle = part('handle') as HTMLElement;
    pointer(handle, 'pointerDown', 100, 1);
    pointer(handle, 'pointerMove', 120, 16);
    pointer(handle, 'pointerMove', 140, 32);
    // The finger rests, then lifts where it was.
    pointer(handle, 'pointerUp', 140, 200);
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    expect(panel.style.getPropertyValue('--_dialog-drag-y')).toBe('');
  });

  it('snaps back on a short slow drag, and above its place gives only a third (rubber band)', async () => {
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
    drag(300, 1000, 400, false);
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
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'detents', 'detents-arabic', 'disabled']);
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

  it('keeps the panel below toasts on the top edge, so they never cover the close control (WCAG 2.4.11)', async () => {
    const g = globalThis as unknown as { ResizeObserver?: unknown };
    const saved = { ro: g.ResizeObserver, rect: HTMLElement.prototype.getBoundingClientRect };
    g.ResizeObserver = class {
      constructor(private cb: () => void) {}
      observe() {
        this.cb();
      }
      disconnect() {}
      unobserve() {}
    };
    // The toaster sits on the top edge, 16px down, one 60px toast tall.
    let top = 16;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const at = this.getAttribute('data-ds') === 'toaster' ? top : 0;
      const height = this.getAttribute('data-ds') === 'toaster' ? 60 : 0;
      return { top: at, bottom: at + height, height, left: 0, right: 0, width: 0, x: 0, y: at, toJSON: () => ({}) } as DOMRect;
    };
    const toaster = document.createElement('ol');
    toaster.setAttribute('data-ds', 'toaster');
    toaster.setAttribute('data-position', 'bottom-end');
    document.body.append(toaster);
    try {
      render(<Basic size="lg" defaultOpen />);
      // No toast yet: nothing to clear.
      expect(rootEl()?.style.getPropertyValue('--_sheet-toast-end')).toBe('');
      const toast = document.createElement('li');
      toast.setAttribute('data-ds', 'toast');
      toaster.append(toast);
      await waitFor(() => expect(rootEl()?.style.getPropertyValue('--_sheet-toast-end')).toBe('76px'));
      toast.remove();
      await waitFor(() => expect(rootEl()?.style.getPropertyValue('--_sheet-toast-end')).toBe(''));
      // A toaster on the bottom edge is not the Sheet's to clear.
      toaster.append(toast);
      top = 600;
      window.dispatchEvent(new Event('resize'));
      await new Promise((r) => requestAnimationFrame(r));
      await waitFor(() => expect(rootEl()?.style.getPropertyValue('--_sheet-toast-end')).toBe(''));
      // Back on the top edge, then the Sheet closes while the toast still shows: the open sheet clears.
      top = 16;
      window.dispatchEvent(new Event('resize'));
      await waitFor(() => expect(rootEl()?.style.getPropertyValue('--_sheet-toast-end')).toBe('76px'));
      await userEvent.click(screen.getByRole('button', { name: 'Close sheet' }));
      await waitFor(() => expect(rootEl()).toBeNull());
    } finally {
      toaster.remove();
      g.ResizeObserver = saved.ro;
      HTMLElement.prototype.getBoundingClientRect = saved.rect;
    }
    // The root's top gap is the larger of its own gap and the toasts' end plus a gap.
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Dialog.css'), 'utf8');
    const at = css.indexOf("  [data-ds='sheet'] {");
    const rule = css.slice(at, css.indexOf('\n  }', at));
    expect(rule).toMatch(/padding-block: max\(calc\(var\(--ds-space-5xl\) \+ env\(safe-area-inset-top, 0px\)\), calc\(var\(--_sheet-toast-end\) \+ var\(--ds-space-s\)\)\) 0;/);
  });
});

describe('Sheet detents (order 1.29)', () => {
  function Detents(props: SheetProps) {
    return <Basic defaultOpen detents={[0.5, 1]} {...props} />;
  }
  const handle = () => part('handle') as HTMLElement;
  const vh = () => window.innerHeight;

  it('rests at a detent: data-detent and the working heights on the root, the handle a named button', async () => {
    render(<Detents />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(rootEl()?.getAttribute('data-detent')).toBe('0'));
    expect(rootEl()?.style.getPropertyValue('--_dialog-detent-height')).toBe(`${Math.round(vh() / 2)}px`);
    expect(rootEl()?.style.getPropertyValue('--_dialog-detent-max')).toBe(`${vh()}px`);
    expect(handle().tagName).toBe('BUTTON');
    expect(handle().getAttribute('type')).toBe('button');
    expect(handle().hasAttribute('aria-hidden')).toBe(false);
    expect(screen.getByRole('button', { name: 'Sheet size, 1 of 2' })).toBe(handle());
  });

  it('moves between detents with the keys and the button (WCAG 2.5.7)', async () => {
    const user = userEvent.setup();
    const changes: number[] = [];
    render(<Detents onDetentChange={(i) => changes.push(i)} />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(rootEl()?.getAttribute('data-detent')).toBe('0'));
    handle().focus();
    await user.keyboard('{ArrowUp}');
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    expect(screen.getByRole('button', { name: 'Sheet size, 2 of 2' })).toBe(handle());
    await user.keyboard('{ArrowUp}');
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    await user.keyboard('{Home}');
    expect(rootEl()?.getAttribute('data-detent')).toBe('0');
    await user.keyboard('{Enter}');
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    await user.keyboard(' ');
    expect(rootEl()?.getAttribute('data-detent')).toBe('0');
    await user.click(handle());
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    expect(changes).toEqual([1, 0, 1, 0, 1]);
  });

  it('settles on the nearest detent by position and speed, gives a rubber band past the largest, and closes on a flick down', async () => {
    render(<Detents />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(rootEl()?.getAttribute('data-detent')).toBe('0'));
    const panel = part('panel') as HTMLElement;
    // A quick drag up by 80px carries on to the largest detent.
    pointer(handle(), 'pointerDown', 500, 1);
    pointer(handle(), 'pointerMove', 460, 16);
    pointer(handle(), 'pointerMove', 420, 32);
    pointer(handle(), 'pointerUp', 420, 40);
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    expect(panel.style.getPropertyValue('--_dialog-drag-y')).toBe('');
    // Past the largest: less than the pointer, and back on release.
    pointer(handle(), 'pointerDown', 500, 100);
    pointer(handle(), 'pointerMove', 300, 1100);
    const over = Number.parseFloat(panel.style.getPropertyValue('--_dialog-drag-y'));
    expect(over).toBeLessThan(0);
    expect(over).toBeGreaterThan(-48);
    pointer(handle(), 'pointerUp', 300, 2100);
    expect(rootEl()?.getAttribute('data-detent')).toBe('1');
    // A flick down from the smallest closes it.
    act(() => handle().focus());
    fireEvent.keyDown(handle(), { key: 'Home' });
    expect(rootEl()?.getAttribute('data-detent')).toBe('0');
    pointer(handle(), 'pointerDown', 500, 3000);
    pointer(handle(), 'pointerMove', 540, 3016);
    pointer(handle(), 'pointerMove', 580, 3032);
    pointer(handle(), 'pointerUp', 580, 3040);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('with dismissible false a flick down settles on the smallest detent', async () => {
    render(<Detents dismissible={false} />);
    await screen.findByRole('dialog');
    await waitFor(() => expect(rootEl()?.getAttribute('data-detent')).toBe('0'));
    pointer(handle(), 'pointerDown', 500, 1);
    pointer(handle(), 'pointerMove', 540, 16);
    pointer(handle(), 'pointerMove', 580, 32);
    pointer(handle(), 'pointerUp', 580, 40);
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
    expect(rootEl()?.getAttribute('data-detent')).toBe('0');
  });
});

/** A Desk theme whose style.json would turn on these optional parts (order 1.29: no style does yet). */
function WithParts({ ds, parts, children }: { ds: string; parts: string[]; children: ReactNode }) {
  const base = resolveTheme({ style: 'desk' });
  const value = { ...base, styleData: { ...base.styleData, optionalParts: { ...base.styleData.optionalParts, [ds]: parts } } };
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

describe('Sheet optional parts (order 1.29)', () => {
  it('a title bar replaces the header: the title inside, the close control at its end, the description after it', async () => {
    render(
      <WithParts ds="sheet" parts={['titlebar']}>
        <Basic defaultOpen />
      </WithParts>,
    );
    const panel = await screen.findByRole('dialog', { name: 'Share Spring launch' });
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['handle', 'titlebar', 'description', 'body', 'footer']);
    const bar = part('titlebar');
    expect(bar?.querySelector('[data-part="title"]')?.textContent).toBe('Share Spring launch');
    expect(bar?.querySelector('[data-part="close"]')?.getAttribute('aria-label')).toBe('Close sheet');
  });

  it('with controls, the close light closes the sheet', async () => {
    const user = userEvent.setup();
    render(
      <WithParts ds="sheet" parts={['titlebar', 'controls']}>
        <Basic defaultOpen />
      </WithParts>,
    );
    await screen.findByRole('dialog');
    expect(part('titlebar')?.querySelector('[data-ds="window-controls"]')?.getAttribute('aria-label')).toBe('Sheet controls');
    await user.click(screen.getByRole('button', { name: 'Close sheet' }));
    await waitFor(() => expect(rootEl()).toBeNull());
  });
});
