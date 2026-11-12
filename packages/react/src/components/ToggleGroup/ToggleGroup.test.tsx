import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import ToggleGroupDemo from './ToggleGroup.demo';
import { ToggleGroup, ToggleGroupItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="toggle-group"]');
  if (!el) throw new Error('no toggle group rendered');
  return el;
}

function Views(props: { type?: 'single' }) {
  return (
    <ToggleGroup type={props.type ?? 'single'} aria-label="Board view">
      <ToggleGroupItem value="list">List</ToggleGroupItem>
      <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      <ToggleGroupItem value="columns">Columns</ToggleGroupItem>
    </ToggleGroup>
  );
}

describe('ToggleGroup', () => {
  it('renders the anatomy with default attributes; single is a radiogroup of radios', () => {
    const { container } = render(<Views />);
    const el = root(container);
    expect(screen.getByRole('radiogroup', { name: 'Board view' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('data-attached')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('data-emphasis')).toBe(false);
    const items = screen.getAllByRole('radio');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.getAttribute('data-ds')).toBe('toggle-button');
      expect(item.getAttribute('data-part')).toBe('item');
      expect(item.getAttribute('data-state')).toBe('off');
      expect(item.getAttribute('aria-checked')).toBe('false');
      expect(item.getAttribute('data-size')).toBe('md');
      expect(item.getAttribute('data-emphasis')).toBe('soft');
    }
  });

  it('type multiple is a toolbar of pressed buttons', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="multiple" aria-label="Text style" onValueChange={onValueChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('toolbar', { name: 'Text style' })).toBeTruthy();
    const bold = screen.getByRole('button', { name: 'Bold' });
    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    await user.click(bold);
    await user.click(italic);
    expect(bold.getAttribute('data-state')).toBe('on');
    expect(italic.getAttribute('aria-pressed')).toBe('true');
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual([['bold'], ['bold', 'italic']]);
  });

  it('type single keeps one on and lets it turn off', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="single" aria-label="Board view" defaultValue="list" onValueChange={onValueChange}>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    const list = screen.getByRole('radio', { name: 'List' });
    const grid = screen.getByRole('radio', { name: 'Grid' });
    expect(list.getAttribute('data-state')).toBe('on');
    await user.click(grid);
    expect(list.getAttribute('data-state')).toBe('off');
    expect(grid.getAttribute('aria-checked')).toBe('true');
    await user.click(grid);
    expect(grid.getAttribute('data-state')).toBe('off');
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(['grid', '']);
  });

  it('follows a controlled value', () => {
    const { rerender } = render(
      <ToggleGroup type="single" aria-label="Board view" value="list">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('data-state')).toBe('on');
    rerender(
      <ToggleGroup type="single" aria-label="Board view" value="grid">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('radio', { name: 'Grid' }).getAttribute('data-state')).toBe('on');
    expect(screen.getByRole('radio', { name: 'List' }).getAttribute('data-state')).toBe('off');
  });

  it('has one tab stop; arrows, Home and End move focus; Space toggles', async () => {
    const user = userEvent.setup();
    render(<Views />);
    const [list, grid, columns] = screen.getAllByRole('radio');
    await user.tab();
    expect(document.activeElement).toBe(list);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(grid);
    // Focus alone does not select in a ToggleGroup.
    expect(grid?.getAttribute('data-state')).toBe('off');
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(columns);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(list);
    await user.keyboard('{Home}{ArrowLeft}');
    expect(document.activeElement).toBe(columns);
    await user.keyboard(' ');
    expect(columns?.getAttribute('data-state')).toBe('on');
    await user.keyboard('{Enter}');
    expect(columns?.getAttribute('data-state')).toBe('off');
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('reverses the arrows in RTL', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Views />
      </Theme>,
    );
    const [list, grid] = screen.getAllByRole('radio');
    await user.tab();
    expect(document.activeElement).toBe(list);
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(grid);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(list);
  });

  it('uses ArrowDown and ArrowUp when vertical', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup type="multiple" aria-label="Show on canvas" orientation="vertical">
        <ToggleGroupItem value="rulers">Rulers</ToggleGroupItem>
        <ToggleGroupItem value="guides">Guides</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(root(container).getAttribute('data-orientation')).toBe('vertical');
    const [rulers, guides] = screen.getAllByRole('button');
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(guides);
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(rulers);
  });

  it('passes size, emphasis and shape to the items, and an item prop wins', () => {
    const { container } = render(
      <ToggleGroup type="multiple" aria-label="Text style" size="lg" emphasis="outline" shape="pill" attached>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic" size="sm" emphasis="ghost" shape="square">
          Italic
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    const el = root(container);
    expect(el.getAttribute('data-attached')).toBe('');
    expect(el.getAttribute('data-emphasis')).toBe('outline');
    expect(el.getAttribute('data-shape')).toBe('pill');
    const [bold, italic] = Array.from(el.children);
    expect(bold?.getAttribute('data-size')).toBe('lg');
    expect(bold?.getAttribute('data-emphasis')).toBe('outline');
    expect(bold?.getAttribute('data-shape')).toBe('pill');
    expect(italic?.getAttribute('data-size')).toBe('sm');
    expect(italic?.getAttribute('data-emphasis')).toBe('ghost');
    expect(italic?.getAttribute('data-shape')).toBe('square');
  });

  it('renders the icon only form with the label as the name', () => {
    render(
      <ToggleGroup type="single" aria-label="Board view">
        <ToggleGroupItem value="grid" icon="grid" label="Grid view" />
      </ToggleGroup>,
    );
    const item = screen.getByRole('radio', { name: 'Grid view' });
    expect(Array.from(item.children).map((c) => c.getAttribute('data-part'))).toEqual([null, 'icon']);
    expect(item.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('a single group gives each item a decorative pill span and slides it to the new item', async () => {
    const animate = vi.fn((_frames?: Keyframe[], _options?: KeyframeAnimationOptions) => ({ finished: Promise.resolve(), cancel() {}, playState: 'running' }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const saved = { animate: proto.animate, rect: HTMLElement.prototype.getBoundingClientRect };
    proto.animate = animate;
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const item = this.closest('[data-part="item"]') as HTMLElement | null;
      if (!item) return DOMRect.fromRect({ x: 0, y: 0, width: 300, height: 32 });
      const i = Array.from(item.parentElement?.children ?? []).indexOf(item);
      return DOMRect.fromRect({ x: i * 80, y: 0, width: 72, height: 32 });
    };
    try {
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="single" aria-label="Align" defaultValue="start" onValueChange={onValueChange}>
          <ToggleGroupItem value="start">Start</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
        </ToggleGroup>,
      );
      for (const r of screen.getAllByRole('radio')) expect(r.querySelector(':scope > span[aria-hidden="true"]:not([data-part])')).not.toBeNull();
      expect(animate).not.toHaveBeenCalled();
      await userEvent.click(screen.getByRole('radio', { name: 'Center' }));
      expect(onValueChange).toHaveBeenCalledWith('center');
      expect(screen.getByRole('radio', { name: 'Center' }).getAttribute('data-state')).toBe('on');
      const slide = animate.mock.calls.find((c) => c[1]?.id === 'ds-motion:indicator-slide');
      expect(slide?.[0]?.[0]?.transform).toBe('translate(-80px, 0px) scale(1, 1)');
    } finally {
      proto.animate = saved.animate;
      HTMLElement.prototype.getBoundingClientRect = saved.rect;
    }
  });

  it('a multiple group has no pill span', () => {
    render(
      <ToggleGroup type="multiple" aria-label="Style">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('button', { name: 'Bold' }).querySelector(':scope > span:not([data-part])')).toBeNull();
  });

  it('attached labels keep whole words and carry no block padding (review B4, N21)', () => {
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/ToggleGroup.css'), 'utf8');
    expect(css).not.toMatch(/overflow-wrap: anywhere/);
    expect(css).toMatch(/overflow-wrap: break-word/);
    const attached = css.slice(css.indexOf("[data-ds='toggle-group'][data-attached] > [data-part='item'] {"));
    expect(attached.slice(0, attached.indexOf('}'))).toMatch(/padding-block: 0;/);
  });

  it('a disabled item keeps aria-disabled and focus, does not toggle, and the arrows pass through it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ToggleGroup type="multiple" aria-label="Text style" onValueChange={onValueChange}>
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic" disabled>
          Italic
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>,
    );
    const italic = screen.getByRole('button', { name: 'Italic' });
    expect(italic.getAttribute('aria-disabled')).toBe('true');
    expect(italic.getAttribute('data-disabled')).toBe('');
    expect(italic.hasAttribute('disabled')).toBe(false);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(italic);
    await user.click(italic);
    await user.keyboard(' {Enter}');
    expect(italic.getAttribute('data-state')).toBe('off');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Underline' }));
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bold' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disabled on the group marks the root and every item, and the group stays reachable by Tab', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ToggleGroup type="single" aria-label="Board view" disabled>
        <ToggleGroupItem value="list">List</ToggleGroupItem>
        <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(root(container).getAttribute('data-disabled')).toBe('');
    const items = screen.getAllByRole('radio');
    for (const item of items) expect(item.getAttribute('aria-disabled')).toBe('true');
    await user.tab();
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(items[1]);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(items[0]);
    await user.keyboard(' ');
    expect(items[0]?.getAttribute('data-state')).toBe('off');
  });

  it('passes ref, className and data attributes to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <ToggleGroup type="single" aria-label="Board view" ref={ref} className="x" id="views">
        <ToggleGroupItem value="list">List</ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(ref.current).toBe(root(container));
    expect(ref.current?.className).toBe('x');
    expect(ref.current?.id).toBe('views');
  });

  it('renders the demo with every case and no native title', () => {
    const { container } = render(<ToggleGroupDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(container.querySelector('[title]')).toBeNull();
  });
});

describe('ToggleGroup fix round', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/ToggleGroup.css'), 'utf8');
  const rule = (selector: string) => {
    const at = css.indexOf(`${selector} {`);
    return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
  };

  // WCAG 1.4.10: an attached row never wraps, so at 320px its labels must
  // wrap onto more lines instead of losing words to an ellipsis.
  it('an attached item label wraps instead of ending in an ellipsis', () => {
    const label = rule("[data-ds='toggle-group'][data-attached] > [data-part='item'] > [data-part='label']");
    expect(label).toMatch(/white-space:\s*normal/);
    expect(label).toMatch(/overflow-x:\s*visible/);
    const item = rule("[data-ds='toggle-group'][data-attached] > [data-part='item']");
    expect(item).toMatch(/block-size:\s*auto/);
  });

  // Arabic labels are noun form in white Saudi dialect, never an MSA verb phrase.
  it('the Arabic filter labels are noun form', () => {
    const { container } = render(<ToggleGroupDemo />);
    expect(container.textContent).toContain('موعدها هالأسبوع');
    expect(container.textContent).not.toContain('تنتهي هذا الأسبوع');
  });
});
