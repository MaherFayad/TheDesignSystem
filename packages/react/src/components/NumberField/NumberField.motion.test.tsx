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

describe('NumberField motion (interaction field-step)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rolls the new digits in the aria-hidden layer over the input, from below on ArrowUp and from above on ArrowDown', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(<NumberField aria-label="Guests" defaultValue={2} />);
      const input = screen.getByRole('textbox', {
        name: 'Guests',
      }) as HTMLInputElement;
      const layer = container.querySelector('[data-ds="number-field"] > span[aria-hidden="true"]:not([data-part])') as HTMLElement;
      expect(layer).not.toBeNull();
      expect(layer.childElementCount).toBe(0);
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      // The input keeps its text for editing; the layer draws the roll.
      expect(input.value).toBe('3');
      expect(layer.textContent).toContain('3');
      expect(rolls(calls).every((c) => layer.contains(c.el))).toBe(true);
      expect(rolls(calls)[0]?.frames[0]).toMatchObject({
        transform: 'translateY(100%)',
        opacity: 0,
      });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      const down = rolls(calls).filter((c) => (c.frames[0] as { transform?: string }).transform === 'translateY(-100%)');
      expect(down.length).toBeGreaterThan(0);
    } finally {
      restore();
    }
  });

  it('places the layer on the input from layout offsets, physical sides, in any direction', () => {
    // A zoom or a transform on an ancestor scales the drawn box; layout
    // offsets stay true. The layer is direction ltr, so it is placed with
    // physical left and top (a logical inset would resolve against its own direction).
    const { calls, restore } = mockAnimate();
    const props = ['offsetLeft', 'offsetTop', 'offsetWidth', 'offsetHeight', 'offsetParent'] as const;
    try {
      const { container } = render(
        <div dir="rtl">
          <NumberField aria-label="Guests" defaultValue={2} />
        </div>,
      );
      const root = container.querySelector('[data-ds="number-field"]') as HTMLElement;
      const input = screen.getByRole('textbox', { name: 'Guests' }) as HTMLInputElement;
      const box = { offsetLeft: 36, offsetTop: 2, offsetWidth: 120, offsetHeight: 40, offsetParent: root };
      for (const k of props) Object.defineProperty(input, k, { configurable: true, get: () => box[k] });
      input.getBoundingClientRect = () => ({ x: 90, y: 5, left: 90, top: 5, right: 390, bottom: 105, width: 300, height: 100, toJSON() {} }) as DOMRect;
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      const layer = root.querySelector(':scope > span[aria-hidden="true"]:not([data-part])') as HTMLElement;
      expect(rolls(calls).length).toBeGreaterThan(0);
      expect(layer.style.left).toBe('36px');
      expect(layer.style.top).toBe('2px');
      expect(layer.style.inlineSize).toBe('120px');
      expect(layer.style.blockSize).toBe('40px');
      expect(layer.style.insetInlineStart).toBe('');
    } finally {
      restore();
    }
  });

  it('rolls on from the digits as drawn on a held key, and typing empties the layer', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(<NumberField aria-label="Guests" defaultValue={2} />);
      const input = screen.getByRole('textbox', {
        name: 'Guests',
      }) as HTMLInputElement;
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp', repeat: true });
      fireEvent.keyDown(input, { key: 'ArrowUp', repeat: true });
      expect(input.value).toBe('5');
      const layer = container.querySelector('[data-ds="number-field"] > span[aria-hidden="true"]:not([data-part])') as HTMLElement;
      expect(layer.querySelector('[data-digit]')?.firstElementChild?.textContent).toBe('5');
      fireEvent(input, new Event('beforeinput', { bubbles: true }));
      expect(layer.childElementCount).toBe(0);
      expect(rolls(calls).length).toBeGreaterThan(0);
    } finally {
      restore();
    }
  });

  it('rolls on a step button press', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(<NumberField aria-label="Seats" defaultValue={1} />);
      const inc = container.querySelector('[data-part="increment"]') as HTMLElement;
      fireEvent.pointerDown(inc, {
        pointerType: 'mouse',
        button: 0,
        pointerId: 1,
      });
      fireEvent.pointerUp(inc, {
        pointerType: 'mouse',
        button: 0,
        pointerId: 1,
      });
      expect(rolls(calls).length).toBeGreaterThan(0);
      const layer = container.querySelector('[data-ds="number-field"] > span[aria-hidden="true"]:not([data-part])');
      expect(rolls(calls).every((c) => layer?.contains(c.el))).toBe(true);
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
