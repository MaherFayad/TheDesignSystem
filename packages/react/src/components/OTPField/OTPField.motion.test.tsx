import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { OTPField } from './index';

/** Desk plays every field interaction in full; Studio turns some off. */
function Desk({ children }: { children: ReactNode }) {
  return <Theme style="desk">{children}</Theme>;
}
const render = (ui: ReactElement, style: 'desk' | 'studio' = 'desk') =>
  rtlRender(ui, { wrapper: style === 'desk' ? Desk : ({ children }: { children: ReactNode }) => <Theme style="studio">{children}</Theme> });

interface Call {
  el: Element;
  frames: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** A stand in for Element.animate (jsdom has none): records each call. */
function mockAnimate() {
  const calls: Call[] = [];
  const animate = vi.fn(function (this: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
    calls.push({ el: this, frames, options });
    return { id: '', playState: 'running', finished: new Promise(() => {}), cancel: vi.fn() } as unknown as Animation;
  });
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
  return { calls, restore: () => Reflect.deleteProperty(Element.prototype, 'animate') };
}

const glyphs = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-part="cell"]')).map((cell) => cell.firstElementChild);

describe('OTPField motion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('draws each character in an unnamed span inside its cell', () => {
    const { container } = render(<OTPField aria-label="Code" length={4} defaultValue="12" />);
    const [a, b, c] = glyphs(container);
    expect(a?.tagName).toBe('SPAN');
    expect(a?.textContent).toBe('1');
    expect(a?.hasAttribute('data-part')).toBe(false);
    expect(b?.textContent).toBe('2');
    expect(c).toBeNull();
  });

  it('pops a typed character into its cell and moves the active cell at once (otp-fill)', async () => {
    const { calls, restore } = mockAnimate();
    try {
      const user = userEvent.setup();
      const { container } = render(<OTPField aria-label="Code" length={4} />);
      await user.click(screen.getByRole('textbox', { name: 'Code' }));
      await user.keyboard('1');
      expect(calls).toHaveLength(1);
      expect(calls[0]?.el).toBe(glyphs(container)[0]);
      expect(String(calls[0]?.frames[0]?.transform)).toContain('scale(');
      expect(container.querySelector('[data-part="cell"][data-active]')).toBe(container.querySelectorAll('[data-part="cell"]')[1]);
      // Backspace clears: nothing pops.
      await user.keyboard('{Backspace}');
      expect(calls).toHaveLength(1);
    } finally {
      restore();
    }
  });

  it('pops a pasted code in a short run over the cells', async () => {
    const { calls, restore } = mockAnimate();
    try {
      const user = userEvent.setup();
      const { container } = render(<OTPField aria-label="Code" />);
      await user.click(screen.getByRole('textbox', { name: 'Code' }));
      await user.paste('482913');
      const fills = calls.filter((c) => c.el.parentElement?.getAttribute('data-part') === 'cell');
      expect(fills.map((c) => c.el)).toEqual(glyphs(container));
      // One run: the steps spread over two stagger steps in all (the token is 0 in jsdom, so the delay is 0).
      expect(fills[0]?.options.delay).toBe(0);
      // The code is complete: the cells take one short wave (otp-complete).
      const cells = Array.from(container.querySelectorAll('[data-part="cell"]'));
      const wave = calls.filter((c) => cells.includes(c.el));
      expect(wave).toHaveLength(6);
      expect(JSON.stringify(wave[0]?.frames)).toContain('translateY');
    } finally {
      restore();
    }
  });

  it('fades under reduced motion', async () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      const user = userEvent.setup();
      render(<OTPField aria-label="Code" length={4} />);
      await user.click(screen.getByRole('textbox', { name: 'Code' }));
      await user.keyboard('7');
      expect(calls).toHaveLength(1);
      expect(calls[0]?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    } finally {
      restore();
    }
  });

  it('shakes the row once when the code turns invalid (error-shake)', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container, rerender } = render(<OTPField aria-label="Code" invalid />);
      expect(calls).toHaveLength(0);
      rerender(<OTPField aria-label="Code" />);
      rerender(<OTPField aria-label="Code" invalid />);
      expect(calls).toHaveLength(1);
      expect(calls[0]?.el).toBe(container.querySelector('[data-ds="otp-field"]'));
    } finally {
      restore();
    }
  });
});
