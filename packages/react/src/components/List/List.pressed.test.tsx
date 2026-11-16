import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { List, ListItem } from './index';

// Order M4: a linked row carries data-pressed from pointerdown to the release.
const down = (el: Element) => fireEvent.pointerDown(el, { pointerId: 1, button: 0, isPrimary: true });
const pressed = (el: Element) => el.hasAttribute('data-pressed');

describe('List linked row press from touch down (M4)', () => {
  it('pointerdown on a linked row sets data-pressed, pointerup and pointercancel clear it', () => {
    const onPointerDown = vi.fn();
    const { container } = render(
      <List>
        <ListItem title="Inbox" href="#inbox" onPointerDown={onPointerDown} />
      </List>,
    );
    const row = container.querySelector('[data-part="item"]')!;
    down(row.querySelector('a')!);
    expect(row.getAttribute('data-pressed')).toBe('');
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(row);
    expect(pressed(row)).toBe(false);
    down(row);
    fireEvent.pointerCancel(row);
    expect(pressed(row)).toBe(false);
  });

  it('a disabled row and a row with no link never set it', () => {
    const { container } = render(
      <List>
        <ListItem title="Inbox" href="#inbox" disabled />
        <ListItem title="Drafts" />
      </List>,
    );
    const [off, plain] = Array.from(container.querySelectorAll('[data-part="item"]')) as [Element, Element];
    down(off);
    down(plain);
    expect(pressed(off)).toBe(false);
    expect(pressed(plain)).toBe(false);
  });
});
