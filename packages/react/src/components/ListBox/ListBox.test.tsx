import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ListBoxDemo from './ListBox.demo';
import { ListBox, listBoxOptionId, type ListBoxOption } from './index';
import { sortOptions } from './samples';

beforeAll(() => {
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.scrollIntoView ??= () => undefined;
});

const rows: ListBoxOption[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'drafts', label: 'Drafts', disabled: true },
  { value: 'sent', label: 'Sent' },
  { value: 'spam', label: 'Spam' },
];

const option = (name: string) => screen.getByRole('option', { name });

describe('ListBox', () => {
  it('renders the root, options and states', () => {
    render(<ListBox aria-label="Folders" items={rows} defaultValue="sent" />);
    const root = screen.getByRole('listbox', { name: 'Folders' });
    expect(root.getAttribute('data-ds')).toBe('list-box');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-orientation')).toBe('vertical');
    expect(option('Sent').getAttribute('aria-selected')).toBe('true');
    expect(option('Sent').hasAttribute('data-selected')).toBe(true);
    expect(option('Sent').querySelector('[data-part="indicator"] svg')).not.toBeNull();
    expect(option('Inbox').getAttribute('aria-selected')).toBe('false');
    expect(option('Drafts').getAttribute('aria-disabled')).toBe('true');
    expect(option('Drafts').getAttribute('data-disabled')).toBe('');
  });

  it('makes the selected option the one tab stop', () => {
    render(<ListBox aria-label="Folders" items={rows} defaultValue="sent" />);
    expect(option('Sent').tabIndex).toBe(0);
    expect(option('Inbox').tabIndex).toBe(-1);
  });

  it('moves with the arrows, skips disabled options, and Home and End go to the edges', async () => {
    const user = userEvent.setup();
    render(<ListBox aria-label="Folders" items={rows} />);
    await user.tab();
    expect(document.activeElement).toBe(option('Inbox'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(option('Sent'));
    expect(option('Sent').hasAttribute('data-highlighted')).toBe(true);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(option('Spam'));
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(option('Spam'));
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(option('Inbox'));
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(option('Inbox'));
  });

  it('wraps with loop', async () => {
    const user = userEvent.setup();
    render(<ListBox aria-label="Folders" items={rows} loop />);
    await user.tab();
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(option('Spam'));
  });

  it('selects with Enter, Space and a click in single mode', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<ListBox aria-label="Folders" items={rows} onValueChange={onValueChange} />);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('inbox');
    await user.keyboard('{ArrowDown}[Space]');
    expect(onValueChange).toHaveBeenLastCalledWith('sent');
    await user.click(option('Spam'));
    expect(onValueChange).toHaveBeenLastCalledWith('spam');
    await user.click(option('Drafts'));
    expect(onValueChange).toHaveBeenCalledTimes(3);
  });

  it('toggles in multiple mode and selects all with Ctrl+A', async () => {
    const user = userEvent.setup();
    function Multi() {
      const [value, setValue] = useState<string[]>(['spam']);
      return <ListBox aria-label="Folders" selectionMode="multiple" items={rows} value={value} onValueChange={setValue} />;
    }
    render(<Multi />);
    const root = screen.getByRole('listbox');
    expect(root.getAttribute('aria-multiselectable')).toBe('true');
    await user.tab();
    expect(document.activeElement).toBe(option('Spam'));
    await user.keyboard('[Space]');
    expect(option('Spam').getAttribute('aria-selected')).toBe('false');
    await user.keyboard('{Home}[Space]');
    expect(option('Inbox').getAttribute('aria-selected')).toBe('true');
    await user.keyboard('{Control>}a{/Control}');
    expect(option('Sent').getAttribute('aria-selected')).toBe('true');
    expect(option('Spam').getAttribute('aria-selected')).toBe('true');
    expect(option('Drafts').getAttribute('aria-selected')).toBe('false');
  });

  it('moves by typeahead', async () => {
    const user = userEvent.setup();
    render(<ListBox aria-label="Folders" items={rows} />);
    await user.tab();
    await user.keyboard('sp');
    expect(document.activeElement).toBe(option('Spam'));
  });

  it('does not change the value when disabled or read only', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<ListBox aria-label="Folders" items={rows} disabled onValueChange={onValueChange} />);
    expect(screen.getByRole('listbox').getAttribute('aria-disabled')).toBe('true');
    await user.click(option('Inbox'));
    rerender(<ListBox aria-label="Folders" items={rows} readOnly onValueChange={onValueChange} />);
    expect(screen.getByRole('listbox').hasAttribute('data-readonly')).toBe(true);
    await user.click(option('Inbox'));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks the matched part with mark, across Arabic diacritics', () => {
    render(<ListBox aria-label="Cities" items={[{ value: 'ahsa', label: 'الأحساء' }]} query="الاح" />);
    const mark = document.querySelector('mark');
    expect(mark?.textContent).toBe('الأح');
  });

  it('draws groups with labels and a separator between them, and drops an empty group', () => {
    render(
      <ListBox
        aria-label="Cities"
        items={[
          { label: 'Saudi Arabia', options: [{ value: 'riyadh', label: 'Riyadh' }] },
          { label: 'Empty', options: [] },
          { label: 'Gulf', options: [{ value: 'doha', label: 'Doha' }] },
        ]}
      />,
    );
    expect(screen.getAllByRole('group').map((g) => g.getAttribute('aria-labelledby') && g.textContent)).toEqual([
      'Saudi ArabiaRiyadh',
      'GulfDoha',
    ]);
    expect(screen.getByRole('group', { name: 'Gulf' })).toBeTruthy();
    expect(document.querySelectorAll('[data-part="separator"]').length).toBe(1);
  });

  it('shows the empty part when there is no option', () => {
    render(<ListBox aria-label="Cities" items={[]} empty="No cities yet" />);
    expect(document.querySelector('[data-part="empty"]')?.textContent).toBe('No cities yet');
    // A listbox must own options: an empty list is a named group.
    expect(screen.getByRole('group', { name: 'Cities' }).getAttribute('data-ds')).toBe('list-box');
  });

  it('with virtualFocus, takes no focus and the pointer moves the highlight', async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    render(
      <ListBox
        aria-label="Folders"
        id="folders"
        items={rows}
        virtualFocus
        highlightedValue="inbox"
        onHighlightedValueChange={onHighlight}
      />,
    );
    expect(option('Inbox').hasAttribute('tabindex')).toBe(false);
    expect(option('Inbox').id).toBe(listBoxOptionId('folders', 'inbox'));
    await user.hover(option('Sent'));
    expect(onHighlight).toHaveBeenLastCalledWith('sent');
  });

  it('names options by label and describes them by description', () => {
    render(<ListBox aria-label="Sort by" items={sortOptions('en')} />);
    const name = option('Name');
    const describedBy = name.getAttribute('aria-describedby');
    expect(describedBy && document.getElementById(describedBy)?.textContent).toBe('A to Z');
  });

  it('follows the reading direction in a horizontal list', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <ListBox aria-label="Folders" orientation="horizontal" items={rows} />
      </Theme>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(option('Sent'));
  });

  it('gives stable safe ids for any value', () => {
    expect(listBoxOptionId('l', 'a b/é')).toBe('l-option-a_20b_2f_e9');
  });

  it('renders the demo', () => {
    render(<ListBoxDemo />);
    expect(document.querySelectorAll('[data-ds="list-box"]').length).toBeGreaterThan(5);
  });
});
