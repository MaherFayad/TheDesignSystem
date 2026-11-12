import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import WindowDemo from './Window.demo';
import { Window, WindowLayer } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="window"]');
  if (!el) throw new Error('no window rendered');
  return el;
}

/** jsdom has no layout: give the layer and the window boxes. */
function giveLayout(layer: HTMLElement, win: HTMLElement) {
  Object.defineProperty(layer, 'clientWidth', { configurable: true, value: 1000 });
  Object.defineProperty(layer, 'clientHeight', { configurable: true, value: 800 });
  layer.getBoundingClientRect = () => new DOMRect(0, 0, 1000, 800);
  win.getBoundingClientRect = () => new DOMRect(100, 100, 400, 300);
}

function Opener({ style }: { style: 'desk' | 'studio' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <Theme style={style}>
      <Button ref={trigger} onClick={() => setOpen(true)}>
        Open settings
      </Button>
      <WindowLayer>
        <Window title="Account settings" open={open} onOpenChange={setOpen} origin={trigger}>
          Body
        </Window>
      </WindowLayer>
    </Theme>
  );
}

describe('Window', () => {
  it('renders a non modal dialog named by its title, with the anatomy', () => {
    const { container } = render(
      <Window title="Release notes" footer={<Button>Close notes</Button>}>
        Body text
      </Window>,
    );
    const el = root(container);
    expect(screen.getByRole('dialog', { name: 'Release notes' })).toBe(el);
    expect(el.hasAttribute('aria-modal')).toBe(false);
    expect(el.getAttribute('tabindex')).toBe('-1');
    expect(el.getAttribute('data-kind')).toBe('settings');
    expect(el.getAttribute('data-state')).toBe('active');
    expect(el.hasAttribute('data-part')).toBe(false);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['titlebar', 'body', 'footer']);
    expect(el.querySelector('[data-part="titlebar"]')?.getAttribute('data-ds')).toBe('title-bar');
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H2');
    expect(el.querySelector('[data-part="body"]')?.textContent).toBe('Body text');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('sets kind, modal, aria-label and passes props through', () => {
    const { container } = render(
      <Window title="Board" kind="canvas" modal aria-label="Checkout board" className="x" data-testid="w" titleAs="h3">
        Body
      </Window>,
    );
    const el = root(container);
    expect(el.getAttribute('data-kind')).toBe('canvas');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('aria-label')).toBe('Checkout board');
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(el.className).toBe('x');
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H3');
  });

  it('in Desk shows the lights (part controls) and the close light is part close', () => {
    const { container } = render(
      <Theme style="desk">
        <Window title="Notes">Body</Window>
      </Theme>,
    );
    const el = root(container);
    const controls = el.querySelector('[data-part="titlebar"] > [data-part="controls"] [data-ds="window-controls"]');
    expect(controls).not.toBeNull();
    const close = el.querySelectorAll('[data-part="close"]');
    expect(close).toHaveLength(1);
    expect(close[0]?.closest('[data-ds="window-controls"]')).toBe(controls);
    expect(screen.getByRole('button', { name: 'Close window' })).toBe(close[0]);
  });

  it('in Studio has no lights: a plain title bar with a close IconButton, part close', () => {
    const { container } = render(
      <Theme style="studio">
        <Window title="Layers" closeLabel="Close panel">
          Body
        </Window>
      </Theme>,
    );
    const el = root(container);
    expect(el.querySelector('[data-part="controls"]')).toBeNull();
    expect(el.querySelector('[data-ds="window-controls"]')).toBeNull();
    const close = el.querySelector('[data-part="titlebar"] [data-part="actions"] [data-part="close"]');
    expect(close?.getAttribute('data-ds')).toBe('icon-button');
    expect(close?.getAttribute('aria-label')).toBe('Close panel');
  });

  it('Escape closes the window and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    const { container } = render(<Opener style="desk" />);
    const trigger = screen.getByRole('button', { name: 'Open settings' });
    expect(container.querySelector('[data-ds="window"]')).toBeNull();
    await user.click(trigger);
    const el = root(container);
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(container.querySelector('[data-ds="window"]')).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('the close control closes it in Studio too, and onOpenChange hears it', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { container } = render(
      <Theme style="studio">
        <Window title="Layers" onOpenChange={onOpenChange}>
          Body
        </Window>
      </Theme>,
    );
    await user.click(screen.getByRole('button', { name: 'Close window' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(container.querySelector('[data-ds="window"]')).toBeNull());
  });

  it('arrow keys move the window by a step, Shift by a larger one, inside the layer bounds', () => {
    const onFrameChange = vi.fn();
    const { container } = render(
      <WindowLayer>
        <Window title="Notes" defaultFrame={{ x: 100, y: 100, width: 400, height: 300 }} onFrameChange={onFrameChange}>
          Body
        </Window>
      </WindowLayer>,
    );
    const layer = container.querySelector<HTMLElement>('[data-ds="window-layer"]')!;
    const el = root(container);
    giveLayout(layer, el);
    expect(el.hasAttribute('data-movable')).toBe(true);
    act(() => el.focus());
    fireEvent.keyDown(el, { key: 'ArrowRight' });
    expect(onFrameChange).toHaveBeenLastCalledWith({ x: 116, y: 100, width: 400, height: 300 });
    fireEvent.keyDown(el, { key: 'ArrowDown', shiftKey: true });
    expect(onFrameChange).toHaveBeenLastCalledWith({ x: 116, y: 164, width: 400, height: 300 });
    expect(el.style.insetInlineStart).toBe('116px');
    expect(el.style.insetBlockStart).toBe('164px');
    fireEvent.keyDown(el, { key: 'ArrowUp', shiftKey: true });
    fireEvent.keyDown(el, { key: 'ArrowUp', shiftKey: true });
    fireEvent.keyDown(el, { key: 'ArrowUp', shiftKey: true });
    expect(onFrameChange).toHaveBeenLastCalledWith({ x: 116, y: 0, width: 400, height: 300 });
  });

  it('arrow keys inside the body do not move the window, and left moves right in Arabic', () => {
    const onFrameChange = vi.fn();
    const { container } = render(
      <Theme lang="ar">
        <WindowLayer>
          <Window title="ملاحظات" defaultFrame={{ x: 100, y: 100, width: 400, height: 300 }} onFrameChange={onFrameChange}>
            <input aria-label="الاسم" />
          </Window>
        </WindowLayer>
      </Theme>,
    );
    const layer = container.querySelector<HTMLElement>('[data-ds="window-layer"]')!;
    const el = root(container);
    giveLayout(layer, el);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowLeft' });
    expect(onFrameChange).not.toHaveBeenCalled();
    fireEvent.keyDown(el, { key: 'ArrowLeft' });
    expect(onFrameChange).toHaveBeenLastCalledWith({ x: 116, y: 100, width: 400, height: 300 });
  });

  it('a standalone window without a frame does not move', () => {
    const onFrameChange = vi.fn();
    const { container } = render(
      <Window title="Notes" onFrameChange={onFrameChange}>
        Body
      </Window>,
    );
    const el = root(container);
    expect(el.hasAttribute('data-movable')).toBe(false);
    fireEvent.keyDown(el, { key: 'ArrowRight' });
    expect(onFrameChange).not.toHaveBeenCalled();
  });

  it('the lights zoom and minimize when the window can, and are disabled when it cannot', async () => {
    const user = userEvent.setup();
    const onZoomedChange = vi.fn();
    const onMinimizedChange = vi.fn();
    const { container, rerender } = render(
      <Theme style="desk">
        <Window title="Notes">Body</Window>
      </Theme>,
    );
    expect(screen.getByRole('button', { name: 'Zoom window' }).getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByRole('button', { name: 'Minimize window' }).getAttribute('aria-disabled')).toBe('true');
    rerender(
      <Theme style="desk">
        <Window title="Notes" onZoomedChange={onZoomedChange} onMinimizedChange={onMinimizedChange}>
          Body
        </Window>
      </Theme>,
    );
    const zoom = screen.getByRole('button', { name: 'Zoom window' });
    expect(zoom.getAttribute('aria-pressed')).toBe('false');
    await user.click(zoom);
    expect(onZoomedChange).toHaveBeenCalledWith(true);
    expect(root(container).hasAttribute('data-zoomed')).toBe(true);
    expect(zoom.getAttribute('aria-pressed')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'Minimize window' }));
    expect(onMinimizedChange).toHaveBeenCalledWith(true);
    await waitFor(() => expect(root(container).hidden).toBe(true));
    expect(root(container).hasAttribute('data-minimized')).toBe(true);
  });

  it('in a layer, focus brings a window to the front and makes it active', () => {
    const { container } = render(
      <WindowLayer>
        <Window id="a" title="First">
          A
        </Window>
        <Window id="b" title="Second">
          B
        </Window>
      </WindowLayer>,
    );
    const [a, b] = Array.from(container.querySelectorAll<HTMLElement>('[data-ds="window"]'));
    expect(b?.getAttribute('data-state')).toBe('active');
    expect(a?.getAttribute('data-state')).toBe('inactive');
    expect(Number(b?.style.zIndex)).toBeGreaterThan(Number(a?.style.zIndex));
    act(() => a?.focus());
    expect(a?.getAttribute('data-state')).toBe('active');
    expect(b?.getAttribute('data-state')).toBe('inactive');
    expect(Number(a?.style.zIndex)).toBeGreaterThan(Number(b?.style.zIndex));
  });

  it('a modal window keeps Tab inside', async () => {
    const user = userEvent.setup();
    render(
      <Theme style="studio">
        <Window title="Rename" modal>
          <input aria-label="Name" />
        </Window>
      </Theme>,
    );
    const input = screen.getByRole('textbox');
    const close = screen.getByRole('button', { name: 'Close window' });
    input.focus();
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(input);
  });

  it('renders every demo case', () => {
    const { container } = render(<WindowDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]')?.getAttribute('lang')).toBe('ar');
    expect(container.querySelectorAll('[data-demo-case="variants"] [data-ds="window"]')).toHaveLength(3);
  });
});
