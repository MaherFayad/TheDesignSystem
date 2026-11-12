import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ToolbarDemo from './Toolbar.demo';
import { fitCount, overflowEntries } from './Toolbar';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarLink,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
  type ToolbarProps,
} from './index';

function Example(props: Partial<ToolbarProps> & { onDelete?: () => void; deleteDisabled?: boolean }) {
  const { onDelete, deleteDisabled, ...rest } = props;
  return (
    <Toolbar aria-label="Canvas tools" {...(rest as object)}>
      <ToolbarToggleGroup type="multiple" aria-label="Text style">
        <ToolbarToggleItem value="bold" icon="star" label="Bold" />
        <ToolbarToggleItem value="italic">Italic</ToolbarToggleItem>
      </ToolbarToggleGroup>
      <ToolbarSeparator />
      <ToolbarGroup aria-label="Zoom">
        <ToolbarButton icon="zoom-in" label="Zoom in" />
      </ToolbarGroup>
      <ToolbarButton start="plus">Add frame</ToolbarButton>
      <ToolbarButton icon="trash" label="Delete frame" emphasis="soft" disabled={deleteDisabled} onClick={onDelete} />
      <ToolbarLink href="#guide">Open the guide</ToolbarLink>
    </Toolbar>
  );
}

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="toolbar"]');
  if (!el) throw new Error('no toolbar rendered');
  return el;
}

describe('Toolbar', () => {
  it('renders the anatomy with role toolbar, a name and the default axes', () => {
    const { container } = render(<Example />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('toolbar');
    expect(el.getAttribute('aria-label')).toBe('Canvas tools');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-overflow')).toBe('menu');
    expect(el.hasAttribute('data-overflowing')).toBe(false);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['group', 'separator', 'group', 'item', 'item', 'item', 'more']);
  });

  it('passes size and emphasis to the items; an item keeps its own', () => {
    const { container } = render(<Example size="sm" emphasis="outline" />);
    const items = Array.from(container.querySelectorAll<HTMLElement>('[data-part="item"]'));
    const buttons = items.filter((i) => i.getAttribute('data-ds') !== 'link');
    for (const b of buttons) expect(b.getAttribute('data-size')).toBe('sm');
    expect(screen.getByRole('button', { name: 'Zoom in' }).getAttribute('data-emphasis')).toBe('outline');
    expect(screen.getByRole('button', { name: 'Delete frame' }).getAttribute('data-emphasis')).toBe('soft');
    expect(screen.getByRole('link', { name: 'Open the guide' }).getAttribute('data-size')).toBe('sm');
  });

  it('items are system components carrying data-part item', () => {
    render(<Example />);
    expect(screen.getByRole('button', { name: 'Zoom in' }).getAttribute('data-ds')).toBe('icon-button');
    expect(screen.getByRole('button', { name: 'Add frame' }).getAttribute('data-ds')).toBe('button');
    expect(screen.getByRole('link', { name: 'Open the guide' }).getAttribute('data-ds')).toBe('link');
    expect(screen.getByRole('group', { name: 'Zoom' }).getAttribute('data-part')).toBe('group');
    expect(screen.getByRole('separator').getAttribute('data-orientation')).toBe('vertical');
  });

  it('has one tab stop and moves with the arrow keys, Home and End', async () => {
    render(<Example />);
    await userEvent.tab();
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(document.activeElement).toBe(bold);
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }));
    // jsdom loads no CSS, so the More trigger is laid out and is the last item.
    await userEvent.keyboard('{End}');
    expect(document.activeElement?.getAttribute('data-part')).toBe('more');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(bold);
    await userEvent.tab();
    expect(document.body.contains(document.activeElement) && root(document.body).contains(document.activeElement)).toBe(false);
  });

  it('reverses the arrows in right to left layouts', async () => {
    render(
      <Theme dir="rtl" lang="ar">
        <Example />
      </Theme>,
    );
    screen.getByRole('button', { name: 'Bold' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Italic' }));
  });

  it('toggles items on and off with aria-pressed and data-state', async () => {
    render(<Example />);
    const bold = screen.getByRole('button', { name: 'Bold' });
    expect(bold.getAttribute('aria-pressed')).toBe('false');
    expect(bold.getAttribute('data-state')).toBe('off');
    await userEvent.click(bold);
    expect(bold.getAttribute('aria-pressed')).toBe('true');
    expect(bold.getAttribute('data-state')).toBe('on');
  });

  it('keeps a disabled item reachable but inert', async () => {
    const onDelete = vi.fn();
    render(<Example deleteDisabled onDelete={onDelete} />);
    const del = screen.getByRole('button', { name: 'Delete frame' });
    expect(del.getAttribute('aria-disabled')).toBe('true');
    screen.getByRole('button', { name: 'Add frame' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(del);
    await userEvent.keyboard('{Enter}');
    await userEvent.click(del);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('wrap mode renders no overflow trigger', () => {
    const { container } = render(<Example overflow="wrap" />);
    expect(container.querySelector('[data-part="more"]')).toBeNull();
    expect(root(container).getAttribute('data-overflow')).toBe('wrap');
  });

  it('names the overflow trigger in the language of the page', () => {
    render(
      <Theme lang="ar" dir="rtl">
        <Example />
      </Theme>,
    );
    expect(document.querySelector('[data-part="more"]')?.getAttribute('aria-label')).toBe('أدوات أكثر');
  });

  it('counts what fits', () => {
    const none = () => false;
    expect(fitCount([30, 30, 30], 4, 200, 34, none)).toBe(3);
    expect(fitCount([30, 30, 30], 4, 80, 34, none)).toBe(1);
    expect(fitCount([30, 1, 30, 30], 4, 90, 34, (i) => i === 1)).toBe(1);
    expect(fitCount([30, 30], 4, 10, 34, none)).toBe(0);
  });

  it('builds the overflow entries from hidden items', () => {
    const { container } = render(<Example />);
    const segments = Array.from(root(container).children).filter((c) => c.getAttribute('data-part') !== 'more') as HTMLElement[];
    const entries = overflowEntries(segments);
    expect(entries.map((e) => (e.kind === 'separator' ? '|' : e.label))).toEqual([
      'Bold',
      'Italic',
      '|',
      'Zoom in',
      '|',
      'Add frame',
      'Delete frame',
      'Open the guide',
    ]);
    expect(entries[0]?.pressed).toBe(false);
    expect(entries[0]?.icon).toBe('star');
    expect(entries[5]?.pressed).toBeUndefined();
  });

  it('opens the More tools menu with the hidden items, and choosing one clicks it', async () => {
    const onDelete = vi.fn();
    const { container } = render(<Example onDelete={onDelete} />);
    const el = root(container);
    // jsdom has no layout: mark the last items hidden by hand, as the measure does.
    const del = screen.getByRole('button', { name: 'Delete frame' });
    del.setAttribute('data-overflowed', '');
    screen.getByRole('link', { name: 'Open the guide' }).setAttribute('data-overflowed', '');
    const more = el.querySelector<HTMLElement>('[data-part="more"]');
    if (!more) throw new Error('no more trigger');
    expect(more.getAttribute('aria-label')).toBe('More tools');
    await userEvent.click(more);
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['Delete frame', 'Open the guide']);
    await userEvent.click(items[0] as HTMLElement);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('throws outside a Toolbar', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ToolbarButton>Add frame</ToolbarButton>)).toThrow(/inside a Toolbar/);
    vi.restoreAllMocks();
  });

  it('renders the demo with every case', () => {
    const { container } = render(<ToolbarDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});
