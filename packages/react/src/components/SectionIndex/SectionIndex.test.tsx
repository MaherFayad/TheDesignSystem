import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { List, ListItem, ListSection } from '../List';
import SectionIndexDemo from './SectionIndex.demo';
import { SectionIndex, type SectionIndexSection } from './index';

const sections: SectionIndexSection[] = [
  { key: 'A', target: 's-a' },
  { key: 'B', target: 's-b' },
  { key: 'C', target: 's-b' },
  { key: 'M', target: 's-m' },
  { key: '#', target: 's-m', label: '# other' },
];

function Page({ onSelect, collapse }: { onSelect?: (k: string, t: string) => void; collapse?: 'auto' | 'never' }) {
  return (
    <>
      <List aria-label="Contacts">
        <ListSection id="s-a" header="A">
          <ListItem title="Amal" />
        </ListSection>
        <ListSection id="s-b" header="B">
          <ListItem title="Bader" />
        </ListSection>
        <ListSection id="s-m" header="M">
          <ListItem title="Maha" />
        </ListSection>
      </List>
      <SectionIndex sections={sections} label="Contacts index" onSelect={onSelect} collapse={collapse} />
    </>
  );
}

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="section-index"]')!;
const items = (c: HTMLElement) => Array.from(root(c).querySelectorAll<HTMLAnchorElement>(':scope > [data-part="item"]'));

afterEach(() => vi.restoreAllMocks());

describe('SectionIndex', () => {
  it('renders a named nav landmark of links, one per key, with fragment hrefs', () => {
    const { container } = render(<Page />);
    const nav = screen.getByRole('navigation', { name: 'Contacts index' });
    expect(nav).toBe(root(container));
    expect(items(container).map((a) => a.textContent)).toEqual(['A', 'B', 'C', 'M', '#']);
    expect(items(container)[2]!.getAttribute('href')).toBe('#s-b');
    expect(screen.getByRole('link', { name: '# other' })).toBeTruthy();
    expect(nav.hasAttribute('data-collapsed')).toBe(false);
    expect(nav.hasAttribute('data-dragging')).toBe(false);
  });

  it('is one Tab stop, and Up, Down, Home and End move between keys', async () => {
    const { container } = render(<Page />);
    const links = items(container);
    expect(links.map((a) => a.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    await userEvent.tab();
    expect(document.activeElement).toBe(links[0]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(links[1]);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(links[4]);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(links[4]);
    await userEvent.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(links[3]);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(links[0]);
    expect(items(container).filter((a) => a.tabIndex === 0)).toHaveLength(1);
  });

  it('Enter jumps: scrolls the section, focuses its heading and marks the key', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const onSelect = vi.fn();
    const { container } = render(<Page onSelect={onSelect} />);
    items(container)[3]!.focus();
    await userEvent.keyboard('{Enter}');
    const heading = screen.getByRole('heading', { name: 'M' });
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
    expect(scroll).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith('M', 's-m');
    expect(items(container)[3]!.getAttribute('data-active')).toBe('');
    expect(items(container)[3]!.getAttribute('aria-current')).toBe('location');
    expect(items(container)[3]!.tabIndex).toBe(0);
  });

  it('a key whose section is missing does not throw and keeps focus', async () => {
    const { container } = render(<SectionIndex sections={[{ key: 'Z', target: 'nowhere' }]} label="Index" />);
    items(container)[0]!.focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(items(container)[0]);
  });

  it('a press and move scrubs through the keys and focuses the last section on release', () => {
    Element.prototype.scrollIntoView = vi.fn();
    const onSelect = vi.fn();
    const { container } = render(<Page onSelect={onSelect} />);
    // Lay the keys out 24px apart from the top of the page.
    items(container).forEach((a, i) => {
      vi.spyOn(a, 'getBoundingClientRect').mockReturnValue({ top: i * 24, bottom: i * 24 + 24, height: 24, left: 0, right: 24, width: 24, x: 0, y: i * 24, toJSON() {} } as DOMRect);
    });
    const nav = root(container);
    fireEvent.pointerDown(nav, { pointerId: 1, button: 0, clientY: 30 });
    expect(nav.getAttribute('data-dragging')).toBe('');
    expect(onSelect).toHaveBeenLastCalledWith('B', 's-b');
    fireEvent.pointerMove(nav, { pointerId: 1, clientY: 40 });
    expect(onSelect).toHaveBeenCalledTimes(1);
    fireEvent.pointerMove(nav, { pointerId: 1, clientY: 80 });
    expect(onSelect).toHaveBeenLastCalledWith('M', 's-m');
    // Past the end of the column: the last key.
    fireEvent.pointerMove(nav, { pointerId: 1, clientY: 500 });
    expect(onSelect).toHaveBeenLastCalledWith('#', 's-m');
    expect(document.activeElement).not.toBe(screen.getByRole('heading', { name: 'M' }));
    fireEvent.pointerUp(nav, { pointerId: 1, clientY: 500 });
    expect(nav.hasAttribute('data-dragging')).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'M' }));
    // The click that follows a pointer press does not jump a second time.
    fireEvent.click(items(container)[4]!, { detail: 1 });
    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('collapses keys into gap dots when the column is short, and never with collapse never', () => {
    const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(5 * 24);
    const many = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('').map((key) => ({ key, target: `t-${key}` }));
    const { container, rerender } = render(<SectionIndex sections={many} label="Index" />);
    const nav = root(container);
    expect(nav.getAttribute('data-collapsed')).toBe('');
    const gaps = nav.querySelectorAll('[data-part="gap"]');
    expect(gaps.length).toBeGreaterThan(0);
    gaps.forEach((g) => expect(g.getAttribute('aria-hidden')).toBe('true'));
    expect(nav.children.length).toBeLessThanOrEqual(5);
    const shown = items(container).map((a) => a.textContent);
    expect(shown[0]).toBe('A');
    expect(shown[shown.length - 1]).toBe('#');
    rerender(<SectionIndex sections={many} label="Index" collapse="never" />);
    expect(root(container).hasAttribute('data-collapsed')).toBe(false);
    expect(items(container)).toHaveLength(27);
    height.mockRestore();
  });

  it('takes the active key from the prop', () => {
    const { container } = render(<SectionIndex sections={sections} label="Index" active="C" />);
    expect(items(container)[2]!.hasAttribute('data-active')).toBe(true);
    expect(items(container)[2]!.tabIndex).toBe(0);
  });

  it('passes props and the ref to the nav', () => {
    let node: HTMLElement | null = null;
    const { container } = render(<SectionIndex sections={sections} label="Index" className="x" ref={(n) => void (node = n)} />);
    expect(root(container).className).toBe('x');
    expect(node).toBe(root(container));
  });

  it('renders the demo cases in order, with the Arabic letters in the Arabic case', () => {
    const { container } = render(<SectionIndexDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-arabic']);
    const ar = container.querySelector('[data-demo-case="long-arabic"] [data-ds="section-index"]')!;
    const keys = Array.from(ar.querySelectorAll('[data-part="item"]')).map((a) => a.textContent);
    expect(keys).toHaveLength(29);
    expect(keys.slice(0, 3)).toEqual(['ا', 'ب', 'ت']);
    expect(keys[28]).toBe('#');
    // 200 contacts, every one a row in a section.
    expect(container.querySelectorAll('[data-demo-case="many"] [data-part="item"][data-linked]')).toHaveLength(200);
  });
});
