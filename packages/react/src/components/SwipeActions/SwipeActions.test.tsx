import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { List, ListItem } from '../List';
import { SwipeActions, type SwipeAction } from './index';

// jsdom has no layout: every action is 60px wide and every row 360px.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const w = this.getAttribute('data-part') === 'action' ? 60 : 360;
    return { x: 0, y: 0, left: 0, top: 0, width: w, height: 52, right: w, bottom: 52, toJSON: () => ({}) } as DOMRect;
  });
  HTMLElement.prototype.setPointerCapture = () => {};
});
afterEach(() => vi.restoreAllMocks());

const actions = (onSelect = vi.fn()) => ({
  start: [{ label: 'Archive', icon: 'inbox', tone: 'accent', undoable: true, onSelect }] as SwipeAction[],
  end: [
    { label: 'Delete', icon: 'trash', tone: 'danger', onSelect },
    { label: 'Mute', icon: 'bell-off', onSelect },
  ] as SwipeAction[],
});

function Row(props: { onLink?: () => void; fullSwipe?: 'start' | 'end' | 'none'; pointer?: boolean; onSelect?: () => void; disabled?: boolean }) {
  const a = actions(props.onSelect);
  return (
    <List aria-label="Inbox">
      <ListItem
        href="#m1"
        title="Sara Alqahtani"
        description="Brand review moved to Thursday"
        disabled={props.disabled}
        linkProps={{ onClick: props.onLink }}
        swipe={<SwipeActions start={a.start} end={a.end} fullSwipe={props.fullSwipe} pointer={props.pointer} menuLabel="Actions for Sara Alqahtani" />}
      />
    </List>
  );
}

const row = () => document.querySelector<HTMLElement>("[data-part='item']")!;
const swipeRoot = () => document.querySelector<HTMLElement>("[data-ds='swipe-actions']")!;
const group = (side: 'start' | 'end') => document.querySelector<HTMLElement>(`[data-part='actions'][data-side='${side}']`)!;

/** A touch drag on the row's title from `x0` through `xs`, then a release at the last x. */
function drag(xs: number[], pointerType = 'touch') {
  const target = screen.getByRole('link', { name: 'Sara Alqahtani' });
  let t = 0;
  fireEvent.pointerDown(target, { pointerId: 1, clientX: xs[0], clientY: 10, button: 0, isPrimary: true, pointerType, timeStamp: t });
  for (const x of xs.slice(1)) {
    t += 200;
    fireEvent.pointerMove(target, { pointerId: 1, clientX: x, clientY: 10, pointerType, timeStamp: t });
  }
  fireEvent.pointerUp(target, { pointerId: 1, clientX: xs[xs.length - 1], clientY: 10, pointerType, timeStamp: t + 200 });
}

describe('SwipeActions in a ListItem', () => {
  it('renders the swipe part with closed, inert action groups and a named menu button', () => {
    render(<Row />);
    const root = swipeRoot();
    expect(root.parentElement).toBe(row());
    expect(root.getAttribute('data-part')).toBe('swipe');
    expect(root.getAttribute('data-state')).toBe('closed');
    expect(group('start').hasAttribute('inert')).toBe(true);
    expect(group('end').hasAttribute('inert')).toBe(true);
    expect(group('end').getAttribute('data-tone')).toBe('danger');
    expect(group('end').getAttribute('role')).toBe('group');
    // The first end action sits at the outer edge: the end group is drawn in reverse.
    expect(Array.from(group('end').querySelectorAll('[data-part="action"]')).map((b) => b.textContent)).toEqual(['Mute', 'Delete']);
    expect(screen.getByRole('button', { name: 'Actions for Sara Alqahtani' }).getAttribute('data-part')).toBe('menu');
    // The row's own parts stay the List's.
    expect(row().querySelector(':scope > [data-part="title"]')).not.toBeNull();
  });

  it('follows a touch drag and opens the end actions past half their width', () => {
    render(<Row />);
    const target = screen.getByRole('link', { name: 'Sara Alqahtani' });
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 300, clientY: 10, button: 0, isPrimary: true, pointerType: 'touch' });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 285, clientY: 11, pointerType: 'touch' });
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(true);
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 250, clientY: 11, pointerType: 'touch' });
    expect(row().style.getPropertyValue('--_list-shift')).toBe('-50px');
    expect(swipeRoot().style.getPropertyValue('--_swipe-actions-x')).toBe('-50px');
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 250, clientY: 11, pointerType: 'touch' });
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(false);
    expect(group('end').hasAttribute('inert')).toBe(false);
    expect(row().style.getPropertyValue('--_list-shift')).toBe('-60px');
  });

  it('springs back under half and opens the start side the other way', () => {
    render(<Row />);
    drag([100, 111, 108]);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
    drag([100, 115, 150]);
    expect(swipeRoot().getAttribute('data-state')).toBe('open-start');
  });

  it('leaves a steep move to the page scroll', () => {
    render(<Row />);
    const target = screen.getByRole('link', { name: 'Sara Alqahtani' });
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 100, clientY: 10, button: 0, isPrimary: true, pointerType: 'touch' });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 104, clientY: 40, pointerType: 'touch' });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 60, clientY: 60, pointerType: 'touch' });
    expect(swipeRoot().hasAttribute('data-dragging')).toBe(false);
    expect(row().style.getPropertyValue('--_list-shift')).toBe('');
  });

  it('does not drag with a mouse unless pointer is set', () => {
    const { unmount } = render(<Row />);
    drag([300, 280, 240], 'mouse');
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
    unmount();
    render(<Row pointer />);
    drag([300, 280, 240], 'mouse');
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
  });

  it('swallows the click that ends a swipe, so the row link does not follow', () => {
    const onLink = vi.fn();
    render(<Row onLink={onLink} />);
    drag([300, 280, 240]);
    fireEvent.click(screen.getByRole('link', { name: 'Sara Alqahtani' }), { detail: 1 });
    expect(onLink).not.toHaveBeenCalled();
  });

  it('runs the first start action on a full swipe and closes', () => {
    const onSelect = vi.fn();
    render(<Row fullSwipe="start" onSelect={onSelect} />);
    const target = screen.getByRole('link', { name: 'Sara Alqahtani' });
    fireEvent.pointerDown(target, { pointerId: 1, clientX: 10, clientY: 10, button: 0, isPrimary: true, pointerType: 'touch' });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 30, clientY: 10, pointerType: 'touch' });
    fireEvent.pointerMove(target, { pointerId: 1, clientX: 260, clientY: 10, pointerType: 'touch' });
    expect(swipeRoot().hasAttribute('data-armed')).toBe(true);
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 260, clientY: 10, pointerType: 'touch' });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('never arms a full swipe on a danger first action with no undo by default', () => {
    const onSelect = vi.fn();
    render(<Row onSelect={onSelect} />);
    drag([340, 320, 20]);
    expect(onSelect).not.toHaveBeenCalled();
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
  });

  it('runs an action from the open group and closes the row', () => {
    const onSelect = vi.fn();
    render(<Row onSelect={onSelect} />);
    drag([300, 280, 240]);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('closes on a press outside, a tap on the open content and Escape', () => {
    render(
      <>
        <Row />
        <p>Outside</p>
      </>,
    );
    drag([300, 280, 240]);
    expect(swipeRoot().getAttribute('data-state')).toBe('open-end');
    fireEvent.pointerDown(screen.getByText('Outside'), { pointerId: 2, button: 0, isPrimary: true });
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');

    drag([300, 280, 240]);
    const link = screen.getByRole('link', { name: 'Sara Alqahtani' });
    fireEvent.pointerDown(link, { pointerId: 3, clientX: 100, clientY: 10, button: 0, isPrimary: true, pointerType: 'touch' });
    fireEvent.pointerUp(link, { pointerId: 3, clientX: 100, clientY: 10, pointerType: 'touch' });
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');

    drag([300, 280, 240]);
    fireEvent.keyDown(link, { key: 'Escape' });
    expect(swipeRoot().getAttribute('data-state')).toBe('closed');
  });

  it('keeps one row open at a time', () => {
    const a = actions();
    render(
      <List aria-label="Inbox">
        {['Sara', 'Omar'].map((name) => (
          <ListItem key={name} href={`#${name}`} title={name} swipe={<SwipeActions end={a.end} menuLabel={`Actions for ${name}`} />} />
        ))}
      </List>,
    );
    const open = (name: string) => {
      const link = screen.getByRole('link', { name });
      fireEvent.pointerDown(link, { pointerId: 1, clientX: 300, clientY: 10, button: 0, isPrimary: true, pointerType: 'touch' });
      fireEvent.pointerMove(link, { pointerId: 1, clientX: 280, clientY: 10, pointerType: 'touch' });
      fireEvent.pointerMove(link, { pointerId: 1, clientX: 240, clientY: 10, pointerType: 'touch' });
      fireEvent.pointerUp(link, { pointerId: 1, clientX: 240, clientY: 10, pointerType: 'touch' });
    };
    open('Sara');
    open('Omar');
    const states = Array.from(document.querySelectorAll("[data-ds='swipe-actions']")).map((el) => el.getAttribute('data-state'));
    expect(states).toEqual(['closed', 'open-end']);
  });

  it('opens the menu of every action with Shift+F10 and the context menu key', async () => {
    render(<Row />);
    const link = screen.getByRole('link', { name: 'Sara Alqahtani' });
    link.focus();
    await act(async () => {
      fireEvent.keyDown(link, { key: 'F10', shiftKey: true });
    });
    const items = await screen.findAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['Archive', 'Delete', 'Mute']);
    expect(items[1]?.getAttribute('data-tone')).toBe('danger');
  });

  it('draws no swipe on a disabled row', () => {
    render(<Row disabled />);
    expect(document.querySelector("[data-ds='swipe-actions']")).toBeNull();
  });

  it('keeps at most three actions a side', () => {
    const many = ['A', 'B', 'C', 'D'].map((label) => ({ label, onSelect: () => undefined }));
    render(
      <List aria-label="Saved">
        <ListItem title="Guide" swipe={<SwipeActions end={many} menuLabel="Actions for Guide" />} />
      </List>,
    );
    expect(group('end').querySelectorAll('[data-part="action"]')).toHaveLength(3);
  });
});

describe('SwipeActions around content', () => {
  it('wraps the content in the content part and swipes it', () => {
    const a = actions();
    render(
      <SwipeActions end={a.end} menuLabel="Actions for the draft">
        <p>Launch note</p>
      </SwipeActions>,
    );
    const root = document.querySelector<HTMLElement>("[data-ds='swipe-actions']")!;
    expect(root.hasAttribute('data-part')).toBe(false);
    const content = root.querySelector<HTMLElement>(':scope > [data-part="content"]')!;
    expect(content.textContent).toBe('Launch note');
    fireEvent.pointerDown(content, { pointerId: 1, clientX: 300, clientY: 10, button: 0, isPrimary: true, pointerType: 'pen' });
    fireEvent.pointerMove(content, { pointerId: 1, clientX: 280, clientY: 10, pointerType: 'pen' });
    fireEvent.pointerMove(content, { pointerId: 1, clientX: 240, clientY: 10, pointerType: 'pen' });
    fireEvent.pointerUp(content, { pointerId: 1, clientX: 240, clientY: 10, pointerType: 'pen' });
    expect(root.getAttribute('data-state')).toBe('open-end');
    expect(root.style.getPropertyValue('--_swipe-actions-x')).toBe('-60px');
  });
});
