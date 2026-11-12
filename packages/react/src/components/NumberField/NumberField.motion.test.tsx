import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { NumberField } from './index';

/** Desk plays every field interaction in full; Studio turns some off. */
function Desk({ children }: { children: ReactNode }) {
  return <Theme style="desk">{children}</Theme>;
}
const render = (ui: ReactElement, style: 'desk' | 'studio' = 'desk') =>
  rtlRender(ui, { wrapper: style === 'desk' ? Desk : ({ children }: { children: ReactNode }) => <Theme style="studio">{children}</Theme> });

interface Call {
  el: Element;
  frames: Keyframe[];
  anim: { playState: string };
}

/** A stand in for Element.animate (jsdom has none): records each call. */
function mockAnimate() {
  const calls: Call[] = [];
  const animate = vi.fn(function (this: Element, frames: Keyframe[]) {
    const anim = { id: '', playState: 'running', finished: new Promise(() => {}), cancel: vi.fn() };
    calls.push({ el: this, frames, anim });
    return anim as unknown as Animation;
  });
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
  return { calls, restore: () => Reflect.deleteProperty(Element.prototype, 'animate') };
}

const rolls = (calls: Call[]) => calls.filter((c) => JSON.stringify(c.frames).includes('translateY'));
const finishAll = (calls: Call[]) => {
  for (const c of calls) c.anim.playState = 'finished';
};

describe('NumberField motion (interaction field-step)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rolls the value in from below on ArrowUp and from above on ArrowDown', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<NumberField aria-label="Guests" defaultValue={2} />);
      const input = screen.getByRole('textbox', { name: 'Guests' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect((input as HTMLInputElement).value).toBe('3');
      expect(rolls(calls)).toHaveLength(1);
      expect(rolls(calls)[0]?.el).toBe(input);
      // A short roll: space.xs of travel, inside the box.
      expect(rolls(calls)[0]?.frames[0]).toMatchObject({ transform: 'translateY(var(--ds-space-xs, 6px))', opacity: 0 });
      finishAll(calls);
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(rolls(calls)[1]?.frames[0]).toMatchObject({ transform: 'translateY(calc(-1 * var(--ds-space-xs, 6px)))' });
    } finally {
      restore();
    }
  });

  it('skips the roll while the last one still plays, so a held key does not flicker', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<NumberField aria-label="Guests" defaultValue={2} />);
      const input = screen.getByRole('textbox', { name: 'Guests' }) as HTMLInputElement;
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp', repeat: true });
      fireEvent.keyDown(input, { key: 'ArrowUp', repeat: true });
      expect(input.value).toBe('5');
      expect(rolls(calls)).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('rolls on a step button press', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(<NumberField aria-label="Seats" defaultValue={1} />);
      const inc = container.querySelector('[data-part="increment"]') as HTMLElement;
      fireEvent.pointerDown(inc, { pointerType: 'mouse', button: 0, pointerId: 1 });
      fireEvent.pointerUp(inc, { pointerType: 'mouse', button: 0, pointerId: 1 });
      expect(rolls(calls)).toHaveLength(1);
      expect(rolls(calls)[0]?.el).toBe(screen.getByRole('textbox', { name: 'Seats' }));
    } finally {
      restore();
    }
  });

  it('does not roll a typed value', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<NumberField aria-label="Guests" defaultValue={2} />);
      const input = screen.getByRole('textbox', { name: 'Guests' }) as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '7' } });
      fireEvent.blur(input);
      expect(input.value).toBe('7');
      expect(rolls(calls)).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('fades under reduced motion', () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      render(<NumberField aria-label="Guests" defaultValue={2} />);
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Guests' }), { key: 'ArrowUp' });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    } finally {
      restore();
    }
  });

  it('changes the number in place with a fade in Studio', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<NumberField aria-label="Guests" defaultValue={2} />, 'studio');
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Guests' }), { key: 'ArrowUp' });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    } finally {
      restore();
    }
  });

  it('shakes the box once when the value turns invalid (error-shake)', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container, rerender } = render(<NumberField aria-label="Guests" />);
      rerender(<NumberField aria-label="Guests" invalid />);
      const shakes = calls.filter((c) => JSON.stringify(c.frames).includes('translateX'));
      expect(shakes).toHaveLength(1);
      expect(shakes[0]?.el).toBe(container.querySelector('[data-ds="number-field"]'));
    } finally {
      restore();
    }
  });
});
