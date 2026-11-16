import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TabBar, TabBarItem } from './index';

// Order M4: data-pressed from pointerdown to the release, so a press shows as the finger lands.
const down = (el: Element, init: Record<string, unknown> = {}) => fireEvent.pointerDown(el, { pointerId: 1, button: 0, isPrimary: true, ...init });
const pressed = (el: Element) => el.hasAttribute('data-pressed');

describe('TabBar item press from touch down (M4)', () => {
  it('pointerdown sets data-pressed beside the press point; pointerup, pointercancel and lost capture clear it', () => {
    const onPointerDown = vi.fn();
    const onPointerUp = vi.fn();
    const { container } = render(
      <TabBar aria-label="Main">
        <TabBarItem href="#home" icon="home" label="Home" onPointerDown={onPointerDown} onPointerUp={onPointerUp} />
      </TabBar>,
    );
    const el = container.querySelector('[data-part="item"]')!;
    down(el);
    expect(el.getAttribute('data-pressed')).toBe('');
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(el);
    expect(pressed(el)).toBe(false);
    expect(onPointerUp).toHaveBeenCalledTimes(1);
    down(el);
    fireEvent.pointerCancel(el);
    expect(pressed(el)).toBe(false);
    down(el);
    fireEvent.lostPointerCapture(el);
    expect(pressed(el)).toBe(false);
  });

  it('a secondary button and an aria-disabled item never set it', () => {
    const { container } = render(
      <TabBar aria-label="Main">
        <TabBarItem href="#home" icon="home" label="Home" />
        <TabBarItem href="#inbox" icon="inbox" label="Inbox" aria-disabled="true" />
      </TabBar>,
    );
    const [home, inbox] = Array.from(container.querySelectorAll('[data-part="item"]')) as [Element, Element];
    down(home, { button: 2 });
    expect(pressed(home)).toBe(false);
    down(inbox);
    expect(pressed(inbox)).toBe(false);
  });

  it('works with asChild', () => {
    const { container } = render(
      <TabBar aria-label="Main">
        <TabBarItem icon="home" label="Home" asChild>
          <a href="#home" />
        </TabBarItem>
      </TabBar>,
    );
    const el = container.querySelector('[data-part="item"]')!;
    down(el);
    expect(pressed(el)).toBe(true);
    fireEvent.pointerUp(el);
    expect(pressed(el)).toBe(false);
  });
});
