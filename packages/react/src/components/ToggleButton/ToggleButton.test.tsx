import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { ButtonGroup } from '../ButtonGroup';
import ToggleButtonDemo from './ToggleButton.demo';
import { ToggleButton } from './index';

describe('ToggleButton', () => {
  it('renders a native button with the anatomy, off by default', () => {
    render(<ToggleButton start="grid">Grid view</ToggleButton>);
    const el = screen.getByRole('button', { name: 'Grid view' });
    expect(el.getAttribute('data-ds')).toBe('toggle-button');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.getAttribute('data-state')).toBe('off');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['state-layer', 'start', 'label']);
    expect(el.querySelector('[data-part="state-layer"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('toggles with click, Enter and Space, uncontrolled', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<ToggleButton onPressedChange={onPressedChange}>Bold</ToggleButton>);
    const el = screen.getByRole('button', { name: 'Bold' });
    await user.click(el);
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.getAttribute('data-state')).toBe('on');
    await user.keyboard('{Enter}');
    expect(el.getAttribute('data-state')).toBe('off');
    await user.keyboard(' ');
    expect(el.getAttribute('data-state')).toBe('on');
    expect(onPressedChange.mock.calls.map((c) => c[0])).toEqual([true, false, true]);
  });

  it('follows the pressed prop when controlled', () => {
    const { rerender } = render(<ToggleButton pressed={false}>Bold</ToggleButton>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('false');
    rerender(<ToggleButton pressed>Bold</ToggleButton>);
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true');
  });

  it('disabled keeps focus and does not toggle', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(
      <ToggleButton disabled onPressedChange={onPressedChange}>
        Bold
      </ToggleButton>,
    );
    const el = screen.getByRole('button');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    await user.click(el);
    el.blur();
    await user.tab();
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Enter}');
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(el.getAttribute('data-state')).toBe('off');
  });

  it('has an icon only form named by label', () => {
    render(<ToggleButton icon="eye" label="Show guides" defaultPressed />);
    const el = screen.getByRole('button', { name: 'Show guides' });
    expect(el.querySelector('[data-part="icon"] [data-ds="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    expect(el.getAttribute('data-state')).toBe('on');
  });

  it('takes size, emphasis and shape from a ButtonGroup, its own prop wins', () => {
    render(
      <ButtonGroup size="sm" emphasis="outline" shape="pill" aria-label="Formatting">
        <ToggleButton>Bold</ToggleButton>
        <ToggleButton emphasis="ghost">Italic</ToggleButton>
      </ButtonGroup>,
    );
    const [bold, italic] = screen.getAllByRole('button');
    expect(bold?.getAttribute('data-size')).toBe('sm');
    expect(bold?.getAttribute('data-emphasis')).toBe('outline');
    expect(bold?.getAttribute('data-shape')).toBe('pill');
    expect(italic?.getAttribute('data-emphasis')).toBe('ghost');
  });

  it('takes ref as a prop and passes props through', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <ToggleButton ref={ref} className="x" data-testid="t">
        Bold
      </ToggleButton>,
    );
    expect(ref.current).toBe(screen.getByTestId('t'));
    expect(ref.current?.className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<ToggleButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
  });

  it('keeps the label of a pressed toggle readable in forced colors', () => {
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Button.css'), 'utf8');
    const block = css.slice(css.indexOf('@media (forced-colors: active)'));
    const rule = (selector: string) => {
      const at = block.indexOf(`${selector} {`);
      expect(at).toBeGreaterThan(-1);
      return block.slice(at, block.indexOf('}', at));
    };
    // Without this the browser draws a Canvas backplate behind the label on the Highlight fill.
    expect(rule("[data-ds='toggle-button'][data-state='on']")).toMatch(/forced-color-adjust: none;/);
    expect(rule("[data-ds='toggle-button'][data-state='on'] *")).toMatch(/forced-color-adjust: none;/);
  });
});

describe('ToggleButton press (interaction button-press)', () => {
  it('plays the press on Enter and still toggles on the click', () => {
    const frames: Keyframe[][] = [];
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: (f: Keyframe[]) => {
        frames.push(f);
        return { id: '', playState: 'running', finished: Promise.resolve(), cancel: () => {} } as unknown as Animation;
      },
    });
    try {
      render(
        <Theme style="desk">
          <ToggleButton>Grid view</ToggleButton>
        </Theme>,
      );
      const el = screen.getByRole('button');
      fireEvent.keyDown(el, { key: 'Enter' });
      fireEvent.click(el);
      fireEvent.keyUp(el, { key: 'Enter' });
      expect(el.getAttribute('aria-pressed')).toBe('true');
      // The press and its release on the root, and the flood of the state layer (toggle-pop).
      expect(frames).toHaveLength(3);
      expect(JSON.stringify(frames[1])).toContain('clipPath');
      expect(el.getAttribute('data-ds')).toBe('toggle-button');
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, 'animate');
    }
  });
});

describe('ToggleButton flood (interaction toggle-pop, order 1.23)', () => {
  function mockAnimate() {
    const calls: { el: Element; frames: Keyframe[] }[] = [];
    Object.defineProperty(HTMLElement.prototype, 'animate', {
      configurable: true,
      value: function (this: Element, f: Keyframe[]) {
        calls.push({ el: this, frames: f });
        return { id: '', playState: 'running', finished: Promise.resolve(), cancel: () => {} } as unknown as Animation;
      },
    });
    return { calls, restore: () => Reflect.deleteProperty(HTMLElement.prototype, 'animate') };
  }

  it('plays no flood in Studio, whose pop is reduced', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(
        <Theme style="studio">
          <ToggleButton>Grid view</ToggleButton>
        </Theme>,
      );
      fireEvent.click(screen.getByRole('button'));
      expect(calls).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('floods the state layer from the press point when turned on and drains it when off, never moving the root or the content', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(
        <Theme style="desk">
          <ToggleButton start="grid">Grid view</ToggleButton>
        </Theme>,
      );
      const el = screen.getByRole('button');
      fireEvent.pointerDown(el, { clientX: 0, clientY: 0 });
      fireEvent.click(el);
      expect(el.getAttribute('data-state')).toBe('on');
      expect(calls.map((c) => c.el.getAttribute('data-part'))).toEqual(['state-layer']);
      expect(JSON.stringify(calls[0]?.frames)).toContain('circle(150%');
      calls.length = 0;
      fireEvent.keyDown(el, { key: ' ' });
      expect(el.style.getPropertyValue('--_toggle-button-x')).toBe('');
      fireEvent.click(el);
      expect(el.getAttribute('data-state')).toBe('off');
      expect(JSON.stringify(calls[0]?.frames)).toContain('circle(0%');
      expect(calls.some((c) => c.el === el || c.el.getAttribute('data-part') === 'label')).toBe(false);
    } finally {
      restore();
    }
  });

  it('plays no flood under reduced motion, and the state still changes', () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      render(
        <Theme style="desk">
          <ToggleButton>Grid view</ToggleButton>
        </Theme>,
      );
      const el = screen.getByRole('button');
      fireEvent.click(el);
      expect(el.getAttribute('aria-pressed')).toBe('true');
      expect(calls).toHaveLength(0);
    } finally {
      restore();
      vi.unstubAllGlobals();
    }
  });
});

describe('ToggleButton label without icon (review B3)', () => {
  it('warns in development when label is given without icon, since it is dropped', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(<ToggleButton label="Bold">Bold</ToggleButton>);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('ToggleButton: label'));
      warn.mockClear();
      render(<ToggleButton icon="grid" label="Grid view" />);
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
