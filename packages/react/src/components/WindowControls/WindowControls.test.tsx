import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import WindowControlsDemo from './WindowControls.demo';
import { WindowControls } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="window-controls"]');
  if (!el) throw new Error('no window controls rendered');
  return el;
}

describe('WindowControls', () => {
  it('renders a named group of three IconButtons, close, minimize and zoom, in that order', () => {
    const { container } = render(<WindowControls onClose={() => undefined} onMinimize={() => undefined} onZoom={() => undefined} />);
    const el = root(container);
    expect(screen.getByRole('group', { name: 'Window controls' })).toBe(el);
    expect(el.getAttribute('data-state')).toBe('active');
    const lights = Array.from(el.children);
    expect(lights.map((l) => l.getAttribute('data-part'))).toEqual(['close', 'minimize', 'zoom']);
    for (const l of lights) {
      expect(l.tagName).toBe('BUTTON');
      expect(l.getAttribute('data-ds')).toBe('icon-button');
      expect(l.getAttribute('data-size')).toBe('xs');
      expect(l.hasAttribute('title')).toBe(false);
    }
    expect(lights.map((l) => l.getAttribute('aria-label'))).toEqual(['Close window', 'Minimize window', 'Zoom window']);
    expect(lights.map((l) => l.querySelector('[data-ds="icon"]')?.getAttribute('data-icon'))).toEqual(['close', 'minimize', 'zoom']);
  });

  it('takes its labels and the inactive state', () => {
    const { container } = render(
      <WindowControls active={false} label="أزرار النافذة" closeLabel="إغلاق النافذة" minimizeLabel="تصغير النافذة" zoomLabel="تكبير النافذة" />,
    );
    expect(root(container).getAttribute('data-state')).toBe('inactive');
    expect(screen.getByRole('group', { name: 'أزرار النافذة' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'تكبير النافذة' })).toBeDefined();
  });

  it('calls each handler, and the zoom light reports aria-pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onMinimize = vi.fn();
    const onZoom = vi.fn();
    render(<WindowControls onClose={onClose} onMinimize={onMinimize} onZoom={onZoom} zoomed />);
    await user.click(screen.getByRole('button', { name: 'Close window' }));
    await user.click(screen.getByRole('button', { name: 'Minimize window' }));
    const zoom = screen.getByRole('button', { name: 'Zoom window' });
    expect(zoom.getAttribute('aria-pressed')).toBe('true');
    zoom.focus();
    await user.keyboard('{Enter}');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onZoom).toHaveBeenCalledTimes(1);
  });

  it('a light with no handler is disabled and out of the tab order', async () => {
    const user = userEvent.setup();
    render(<WindowControls onClose={() => undefined} />);
    const close = screen.getByRole('button', { name: 'Close window' });
    const min = screen.getByRole('button', { name: 'Minimize window' });
    expect(close.hasAttribute('aria-disabled')).toBe(false);
    expect(min.getAttribute('aria-disabled')).toBe('true');
    expect(min.hasAttribute('data-disabled')).toBe(true);
    expect(min.tabIndex).toBe(-1);
    expect(min.hasAttribute('aria-pressed')).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('closeDisabled keeps the close light focusable but aria-disabled, and blocks activation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<WindowControls onClose={onClose} closeDisabled onZoom={() => undefined} />);
    const close = screen.getByRole('button', { name: 'Close window' });
    expect(close.getAttribute('aria-disabled')).toBe('true');
    expect(close.hasAttribute('data-disabled')).toBe(true);
    expect(close.hasAttribute('tabindex')).toBe(false);
    await user.tab();
    expect(document.activeElement).toBe(close);
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    await user.click(close);
    expect(onClose).not.toHaveBeenCalled();
    // Without a handler closeDisabled changes nothing: the light stays inert decoration.
    const { container } = render(<WindowControls closeDisabled />);
    expect(container.querySelector<HTMLElement>('[data-part="close"]')?.tabIndex).toBe(-1);
  });

  it('defaults its labels to Arabic under lang="ar"', () => {
    render(
      <Theme lang="ar">
        <WindowControls onClose={() => undefined} />
      </Theme>,
    );
    expect(screen.getByRole('group', { name: 'أزرار النافذة' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'إغلاق النافذة' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'تصغير النافذة' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'تكبير النافذة' })).toBeDefined();
  });

  it('renders every demo case', () => {
    const { container } = render(<WindowControlsDemo />);
    for (const id of ['variants', 'one', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});

// ------------------------------------------------------------------ motion, order 1.22

describe('motion (order 1.22): window-lights in WindowControls.css', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/WindowControls.css'), 'utf8');

  it('pops the glyphs in one stagger step apart, and leaves together', () => {
    expect(css).toContain("transform: scale(calc(var(--_window-controls-enter-scale) + (1 - var(--_window-controls-enter-scale)) * var(--_window-controls-glyph)));");
    expect(css).toContain("> [data-part='zoom'] > [data-part='icon'] > [data-ds='icon'] {\n    transition-delay: calc(var(--ds-delay-stagger) * 2);");
  });

  it('review N13: a press dips only the dot, never the 24px target', () => {
    expect(css).toContain(":active > [data-part='icon'] {\n    transform: scale(var(--_window-controls-press-scale));");
    expect(css).not.toMatch(/\[data-ds='icon-button'\][^{]*:active \{/);
  });

  it('review B2: the reduced form applies under data-motion="reduce" too', () => {
    expect(css).toContain(":root[data-motion='reduce'] [data-ds='window-controls'] > [data-ds='icon-button'] > [data-part='icon'],");
  });
});
