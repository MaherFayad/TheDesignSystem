import type { ReactElement, ReactNode } from 'react';
import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { PasswordField } from './index';

/** Desk plays every field interaction in full; Studio turns some off. */
function Desk({ children }: { children: ReactNode }) {
  return <Theme style="desk">{children}</Theme>;
}
const render = (ui: ReactElement, style: 'desk' | 'studio' = 'desk') =>
  rtlRender(ui, { wrapper: style === 'desk' ? Desk : ({ children }: { children: ReactNode }) => <Theme style="studio">{children}</Theme> });

interface Call {
  el: Element;
  frames: Keyframe[];
}

/** A stand in for Element.animate (jsdom has none): records each call. */
function mockAnimate() {
  const calls: Call[] = [];
  const animate = vi.fn(function (this: Element, frames: Keyframe[]) {
    calls.push({ el: this, frames });
    return { id: '', playState: 'running', finished: new Promise(() => {}), cancel: vi.fn() } as unknown as Animation;
  });
  Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
  return { calls, restore: () => Reflect.deleteProperty(Element.prototype, 'animate') };
}

describe('PasswordField motion', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('changes the type at once, morphs the eye into the eye off and fades the text back in (password-reveal)', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(<PasswordField aria-label="Password" />);
      const input = container.querySelector('input') as HTMLInputElement;
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
      expect(input.type).toBe('text');
      const icon = container.querySelector('[data-part="toggle"] > [data-part="icon"]') as HTMLElement;
      // The new glyph first, the leaving one after it in an unnamed aria-hidden span.
      const incoming = icon.firstElementChild;
      const leaving = icon.lastElementChild;
      expect(leaving?.getAttribute('aria-hidden')).toBe('true');
      expect(leaving?.hasAttribute('data-part')).toBe(false);
      // Order 1.23: the glyphs trade places along a diagonal line from the top left (the slash is drawn).
      const wipeIn = calls.find((c) => c.el === incoming);
      expect(String(wipeIn?.frames[0]?.clipPath)).toBe('polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%, 0% 0%)');
      expect(String(wipeIn?.frames[2]?.clipPath)).toBe('polygon(0% 0%, 100% 0%, 100% 100%, 100% 100%, 0% 100%)');
      expect(String(calls.find((c) => c.el === leaving)?.frames[2]?.clipPath)).toBe('polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%)');
      for (const c of calls) expect(JSON.stringify(c.frames)).not.toContain('rotate');
      expect(calls.find((c) => c.el === input)?.frames).toEqual([{ opacity: 0 }, { opacity: 1 }]);
      // Hiding again wipes from the other corner.
      calls.length = 0;
      fireEvent.click(screen.getByRole('button', { name: 'Hide password' }));
      expect(input.type).toBe('password');
      expect(String(calls.find((c) => c.el === icon.firstElementChild)?.frames[0]?.clipPath)).toBe('polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%)');
    } finally {
      restore();
    }
  });

  it('plays nothing when the value hides because the form submits', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container } = render(
        <form onSubmit={(e) => e.preventDefault()}>
          <PasswordField aria-label="Password" defaultVisible />
        </form>,
      );
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      expect((container.querySelector('input') as HTMLInputElement).type).toBe('password');
      expect(calls).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('fades only under reduced motion', () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      render(<PasswordField aria-label="Password" />);
      fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
      // The glyphs cross fade and the text fades: three fades, no transform.
      expect(calls).toHaveLength(3);
      for (const c of calls) expect(JSON.stringify(c.frames)).not.toContain('transform');
    } finally {
      restore();
    }
  });

  it('shakes the outer box once when it turns invalid, not the nested Input (error-shake)', () => {
    const { calls, restore } = mockAnimate();
    try {
      const { container, rerender } = render(<PasswordField aria-label="Password" />);
      rerender(<PasswordField aria-label="Password" invalid />);
      const shakes = calls.filter((c) => JSON.stringify(c.frames).includes('translateX'));
      expect(shakes).toHaveLength(1);
      expect(shakes[0]?.el).toBe(container.querySelector('[data-ds="password-field"]'));
    } finally {
      restore();
    }
  });
});
