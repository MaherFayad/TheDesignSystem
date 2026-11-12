import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Input } from './index';

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

const shakes = (calls: Call[]) => calls.filter((c) => JSON.stringify(c.frames).includes('translateX'));

describe('Input error shake (interaction error-shake)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shakes the box once when the field turns invalid, never on first paint or while it stays invalid', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container, rerender } = render(<Input aria-label="Name" invalid />);
      expect(shakes(calls)).toHaveLength(0);
      rerender(<Input aria-label="Name" invalid={false} />);
      rerender(<Input aria-label="Name" invalid />);
      const box = container.querySelector('[data-ds="input"]');
      expect(shakes(calls)).toHaveLength(1);
      expect(shakes(calls)[0]?.el).toBe(box);
      // Two swings: out and back twice, from rest to rest.
      expect(shakes(calls)[0]?.frames).toHaveLength(6);
      for (const c of shakes(calls)) c.anim.playState = 'finished';
      rerender(<Input aria-label="Name" invalid value="a" onChange={() => {}} />);
      expect(shakes(calls)).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('shakes when the browser refuses a submit, once while a shake still plays', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<Input aria-label="Email" required />);
      const input = screen.getByRole('textbox', { name: 'Email' });
      fireEvent.invalid(input);
      fireEvent.invalid(input);
      expect(shakes(calls)).toHaveLength(1);
      for (const c of shakes(calls)) c.anim.playState = 'finished';
      fireEvent.invalid(input);
      expect(shakes(calls)).toHaveLength(2);
    } finally {
      restore();
    }
  });

  it('does not shake as the control part of another field, which shakes its own box', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender } = render(<Input aria-label="Name" rootProps={{ 'data-part': 'control' } as object} />);
      rerender(<Input aria-label="Name" invalid rootProps={{ 'data-part': 'control' } as object} />);
      expect(shakes(calls)).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('does not move under reduced motion: the error color and message carry it', () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      const { rerender } = render(<Input aria-label="Name" />);
      rerender(<Input aria-label="Name" invalid />);
      expect(calls).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('does not shake in Studio, whose preset turns it off', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender } = render(<Input aria-label="Name" />, 'studio');
      rerender(<Input aria-label="Name" invalid />);
      expect(calls).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('still turns invalid at once without the Web Animations API', () => {
    const { container, rerender } = render(<Input aria-label="Name" />);
    rerender(<Input aria-label="Name" invalid />);
    expect(container.querySelector('[data-ds="input"]')?.hasAttribute('data-invalid')).toBe(true);
  });
});
