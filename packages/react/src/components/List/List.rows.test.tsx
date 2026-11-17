import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';
import { IconButton } from '../IconButton';
import { Slider } from '../Slider';
import { List, ListItem, ListSection } from './index';

// Order C1: wrapped titles, the flush variant, rows that act in place, the
// chevron switch, the control row and the row footer.
// WCAG 2.2: 2.1.1 Keyboard and 4.1.2 Name, role, value (the action row is a
// focusable button named by its title that answers Enter and Space);
// 2.5.8 Target size (the action row's hit area is the whole row, the footer
// buttons are their own targets); 1.4.4, 1.4.10 and 1.4.12 are measured in
// the browser (no sideways scroll at 320, wrapped titles at 200% text and
// with text spacing), not in jsdom.

// jsdom has no ResizeObserver; Radix Slider (the control row) measures the thumb with it.
beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

const rowsOf = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-part="item"]'));

describe('List order C1: wrapped titles', () => {
  it('keeps one line by default and stamps no data-title-lines', () => {
    const { container } = render(
      <List>
        <ListItem title="Number of sessions" />
      </List>,
    );
    expect(rowsOf(container)[0]!.hasAttribute('data-title-lines')).toBe(false);
  });

  it('takes titleLines from the List, from a sectioned List, and from the row, which wins', () => {
    const { container } = render(
      <>
        <List titleLines={3}>
          <ListItem title="Three" />
          <ListItem title="Override" titleLines={1} />
          <ListItem title="Two" titleLines={2} />
        </List>
        <List titleLines={2}>
          <ListSection header="Sessions">
            <ListItem title="In a section" />
          </ListSection>
        </List>
      </>,
    );
    const rows = rowsOf(container);
    expect(rows.map((r) => r.getAttribute('data-title-lines'))).toEqual(['3', null, '2', '2']);
  });
});

describe('List order C1: flush variant', () => {
  it('stamps data-variant flush on the list and on the nested list of a section', () => {
    const { container } = render(
      <List variant="flush" aria-label="Songs">
        <ListSection header="A">
          <ListItem title="Amber gate" />
        </ListSection>
      </List>,
    );
    const nested = container.querySelector('[data-part="section"] > [data-ds="list"]')!;
    expect(nested.getAttribute('data-variant')).toBe('flush');
  });
});

describe('List order C1: a row that acts in place', () => {
  it('is a focusable button named by its title, with data-action and no link', async () => {
    const onSelect = vi.fn();
    const { container } = render(
      <List>
        <ListItem title="Amber gate" description="Maha Saleh" onSelect={onSelect} />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Amber gate' });
    expect(button.getAttribute('data-part')).toBe('title');
    expect(button.getAttribute('tabindex')).toBe('0');
    expect(screen.queryByRole('link')).toBeNull();
    const row = rowsOf(container)[0]!;
    expect(row.hasAttribute('data-action')).toBe(true);
    expect(row.hasAttribute('data-linked')).toBe(false);

    await userEvent.click(button);
    expect(onSelect).toHaveBeenCalledTimes(1);
    button.blur();
    await userEvent.tab();
    expect(document.activeElement).toBe(button);
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('runs on Space at key up, as a native button, and not on key down', () => {
    const onSelect = vi.fn();
    render(
      <List>
        <ListItem title="Blue Diriyah" onSelect={onSelect} />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Blue Diriyah' });
    const down = fireEvent.keyDown(button, { key: ' ' });
    expect(down).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.keyUp(button, { key: ' ' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('a key on an action inside the row does not run the row', () => {
    const onSelect = vi.fn();
    render(
      <List>
        <ListItem title="Cardamom morning" onSelect={onSelect} actions={<IconButton icon="more" label="More for Cardamom morning" />} />
      </List>,
    );
    fireEvent.keyDown(screen.getByRole('button', { name: 'More for Cardamom morning' }), { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('disabled: stays focusable with aria-disabled and never runs', async () => {
    const onSelect = vi.fn();
    render(
      <List>
        <ListItem title="Offline mix" onSelect={onSelect} disabled />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Offline mix' });
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('tabindex')).toBe('0');
    await userEvent.click(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.keyUp(button, { key: ' ' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('active sets aria-current on the button, and the press flag shows from pointer down', () => {
    const { container } = render(
      <List>
        <ListItem title="Now playing" onSelect={() => undefined} active />
      </List>,
    );
    const button = screen.getByRole('button', { name: 'Now playing' });
    expect(button.getAttribute('aria-current')).toBe('true');
    const row = rowsOf(container)[0]!;
    expect(row.hasAttribute('aria-current')).toBe(false);
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, isPrimary: true });
    expect(row.hasAttribute('data-pressed')).toBe(true);
    fireEvent.pointerUp(row);
    expect(row.hasAttribute('data-pressed')).toBe(false);
  });

  it('href wins over onSelect: the row stays a link', () => {
    render(
      <List>
        <ListItem title="Inbox" href="#inbox" onSelect={() => undefined} />
      </List>,
    );
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('List order C1: chevron', () => {
  it('chevron false marks a linked row with data-no-chevron; other rows never carry it', () => {
    const { container } = render(
      <List>
        <ListItem title="Saved article" href="#a" chevron={false} />
        <ListItem title="Settings" href="#b" />
        <ListItem title="Play" onSelect={() => undefined} chevron={false} />
      </List>,
    );
    expect(rowsOf(container).map((r) => r.hasAttribute('data-no-chevron'))).toEqual([true, false, false]);
  });
});

describe('List order C1: control row', () => {
  it('draws the control between the start and end glyphs, with no title, description or link', () => {
    const { container } = render(
      <List>
        <ListItem start="bell-off" end="!" control={<Slider aria-label="Bell volume" defaultValue={40} />} description="Not drawn" href="#ignored" />
      </List>,
    );
    const row = rowsOf(container)[0]!;
    const parts = Array.from(row.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['separator', null, 'start', 'control', 'end']);
    expect(row.hasAttribute('data-linked')).toBe(false);
    expect(screen.getByRole('slider', { name: 'Bell volume' })).toBeTruthy();
  });

  it('draws a title when one is given', () => {
    const { container } = render(
      <List>
        <ListItem title="Text size" control={<Slider aria-label="Text size" defaultValue={2} min={0} max={4} />} />
      </List>,
    );
    expect(rowsOf(container)[0]!.querySelector(':scope > [data-part="title"]')?.textContent).toBe('Text size');
  });
});

describe('List order C1: footer', () => {
  it('draws the row footer after the text, with its own buttons as Tab stops after the row link', async () => {
    const { container } = render(
      <List>
        <ListItem
          title="Why mud walls keep houses cool"
          href="#walls"
          description="Rawdah Review"
          footer={
            <>
              <Button size="sm">Listen</Button>
              <IconButton size="sm" icon="more" label="More for Why mud walls keep houses cool" />
            </>
          }
        />
      </List>,
    );
    const footer = rowsOf(container)[0]!.querySelector(':scope > [data-part="footer"]')!;
    expect(footer.querySelectorAll('button')).toHaveLength(2);
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Why mud walls keep houses cool' }));
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Listen' }));
  });
});
