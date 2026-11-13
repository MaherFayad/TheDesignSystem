import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ButtonDemo from './Button.demo';
import { Button } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="button"]');
  if (!el) throw new Error('no button rendered');
  return el;
}

describe('Button', () => {
  it('renders a native button with the anatomy and the default axes', () => {
    const { container } = render(<Button>Save changes</Button>);
    const el = root(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-loading')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('aria-disabled')).toBe(false);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.textContent).toBe('Save changes');
    expect(el.querySelector('[data-part="spinner"]')).toBeNull();
  });

  it('sets the axis attributes from props', () => {
    const { container } = render(
      <Button size="lg" tone="accent" emphasis="solid" shape="pill" type="submit" fullWidth>
        Publish page
      </Button>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('type')).toBe('submit');
    expect(el.getAttribute('data-full-width')).toBe('');
  });

  it('renders icons as parts around the label, by name or as an element', () => {
    const { container } = render(
      <Button start="plus" end={<svg data-testid="custom" />}>
        Add file
      </Button>,
    );
    const el = root(container);
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'label', 'end']);
    const start = el.querySelector('[data-part="start"] [data-ds="icon"]');
    expect(start?.getAttribute('data-icon')).toBe('plus');
    expect(start?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('[data-part="end"] [data-testid="custom"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Add file' })).toBe(el);
  });

  it('calls onClick and activates with Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save changes</Button>);
    const el = screen.getByRole('button', { name: 'Save changes' });
    await user.click(el);
    el.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('disabled keeps focus, sets aria-disabled and blocks activation', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onPointerDown = vi.fn();
    const { container } = render(
      <Button disabled onClick={onClick} onPointerDown={onPointerDown}>
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    await user.click(el);
    el.blur();
    await user.tab();
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
    expect(onPointerDown).not.toHaveBeenCalled();
  });

  it('does not submit its form while disabled or loading', () => {
    const onSubmit = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send form
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('loading shows the spinner, sets aria-busy and blocks clicks, without dimming', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button loading onClick={onClick} start="upload">
        Upload file
      </Button>,
    );
    const el = root(container);
    expect(el.getAttribute('data-loading')).toBe('');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.hasAttribute('data-disabled')).toBe(false);
    const spinner = el.querySelector('[data-part="spinner"]');
    expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    // The label stays in the tree, so the width holds; the hidden status says Loading once.
    const status = el.querySelector('[data-part="status"]');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toBe('Loading');
    expect(screen.getByRole('button', { name: /^Upload file\s*Loading$/ })).toBe(el);
    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element as the button with asChild', () => {
    const onClick = vi.fn();
    render(
      <Button asChild tone="accent" emphasis="solid" end="arrow-forward" onClick={onClick}>
        <a href="#pricing">See pricing</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#pricing');
    expect(link.getAttribute('data-ds')).toBe('button');
    expect(link.getAttribute('data-tone')).toBe('accent');
    expect(link.hasAttribute('type')).toBe(false);
    expect(link.querySelector('[data-part="label"]')?.textContent).toBe('See pricing');
    expect(link.querySelector('[data-part="end"]')).not.toBeNull();
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a disabled asChild link loses its href and blocks click and middle click', () => {
    render(
      <Button asChild disabled>
        <a href="#pricing">See pricing</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'See pricing' });
    expect(link.hasAttribute('href')).toBe(false);
    expect(link.getAttribute('aria-disabled')).toBe('true');
    for (const type of ['click', 'auxclick']) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: type === 'auxclick' ? 1 : 0 });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
  });

  it('takes a custom loading label and the wrap prop', () => {
    const { container } = render(
      <Button loading loadingLabel="Saving changes" wrap>
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Saving changes');
    expect(el.getAttribute('data-wrap')).toBe('');
    const plain = root(render(<Button>Save changes</Button>).container);
    expect(plain.querySelector('[data-part="status"]')).toBeNull();
    expect(plain.hasAttribute('data-wrap')).toBe(false);
  });

  it('takes ref as a prop, and passes className, style and other props through', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <Button ref={ref} className="x" style={{ opacity: 0.5 }} data-testid="b" aria-describedby="hint">
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.getAttribute('data-testid')).toBe('b');
    expect(el.getAttribute('aria-describedby')).toBe('hint');
  });

  it('renders every demo case', () => {
    const { container } = render(<ButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]');
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
    expect(arabic?.getAttribute('lang')).toBe('ar');
    expect(arabic?.getAttribute('dir')).toBe('rtl');
    // Six tones by five emphases in the matrix.
    const variants = container.querySelector('[data-demo-case="variants"]');
    expect(variants?.querySelectorAll('[data-ds="button"][data-tone][data-emphasis]').length).toBeGreaterThanOrEqual(
      30,
    );
  });
});

describe('Button keys while disabled', () => {
  it('passes navigation keys to onKeyDown and swallows the rest', () => {
    const onKeyDown = vi.fn();
    render(
      <Button disabled onKeyDown={onKeyDown}>
        Save draft
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save draft' });
    for (const key of ['Enter', ' ', 'Delete', 'a']) fireEvent.keyDown(button, { key });
    expect(onKeyDown).not.toHaveBeenCalled();
    for (const key of ['ArrowRight', 'Home', 'End', 'Tab']) fireEvent.keyDown(button, { key });
    expect(onKeyDown.mock.calls.map(([e]) => (e as KeyboardEvent).key)).toEqual(['ArrowRight', 'Home', 'End', 'Tab']);
  });
});

describe('Button press (interaction button-press)', () => {
  /** A stand in for Element.animate, which jsdom lacks: it records the keyframes of each call. */
  function mockAnimate() {
    const calls: Keyframe[][] = [];
    const animate = vi.fn((frames: Keyframe[]) => {
      calls.push(frames);
      return { id: '', playState: 'running', finished: Promise.resolve(), cancel: vi.fn() } as unknown as Animation;
    });
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    return { calls, restore: () => Reflect.deleteProperty(HTMLElement.prototype, 'animate') };
  }

  it('plays the press on Enter down and the release on Enter up, once', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<Button>Save changes</Button>);
      const el = screen.getByRole('button');
      fireEvent.keyDown(el, { key: 'Enter' });
      fireEvent.keyDown(el, { key: 'Enter', repeat: true });
      expect(calls).toHaveLength(1);
      expect(JSON.stringify(calls[0])).toContain('scale(');
      expect(el.style.transformOrigin).toBe('50% 50%');
      fireEvent.keyUp(el, { key: 'Enter' });
      expect(calls).toHaveLength(2);
      // A blur after the release plays nothing more.
      fireEvent.blur(el);
      expect(calls).toHaveLength(2);
    } finally {
      restore();
    }
  });

  it('releases on blur when focus leaves while Enter is held', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(<Button>Open dialog</Button>);
      const el = screen.getByRole('button');
      fireEvent.keyDown(el, { key: 'Enter' });
      fireEvent.blur(el);
      expect(calls).toHaveLength(2);
    } finally {
      restore();
    }
  });

  it('does not press while disabled, loading or aria-disabled, nor on Space (CSS :active covers Space)', () => {
    const { calls, restore } = mockAnimate();
    try {
      render(
        <>
          <Button disabled>One</Button>
          <Button loading>Two</Button>
          <Button aria-disabled="true">Three</Button>
          <Button>Four</Button>
        </>,
      );
      const [one, two, three, four] = screen.getAllByRole('button');
      for (const el of [one, two, three]) if (el) fireEvent.keyDown(el, { key: 'Enter' });
      if (four) fireEvent.keyDown(four, { key: ' ' });
      expect(calls).toHaveLength(0);
    } finally {
      restore();
    }
  });

  it('plays nothing under reduced motion: the press has no reduced motion form', () => {
    const { calls, restore } = mockAnimate();
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      render(<Button>Save changes</Button>);
      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(calls).toHaveLength(0);
    } finally {
      restore();
      vi.unstubAllGlobals();
    }
  });

  it('works without the Web Animations API', () => {
    render(<Button>Save changes</Button>);
    const el = screen.getByRole('button');
    fireEvent.keyDown(el, { key: 'Enter' });
    fireEvent.keyUp(el, { key: 'Enter' });
    expect(el.getAttribute('style')).toBeNull();
  });
});

describe('Button loading morph (interaction button-loading)', () => {
  interface Call {
    el: Element;
    frames: Keyframe[];
    finish: () => void;
  }
  function mockAnimate() {
    const calls: Call[] = [];
    const animate = vi.fn(function (this: Element, frames: Keyframe[]) {
      let finish = () => {};
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      calls.push({ el: this, frames, finish: () => finish() });
      return { id: '', playState: 'running', finished, cancel: vi.fn(), effect: { target: this } } as unknown as Animation;
    });
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    return { calls, restore: () => Reflect.deleteProperty(Element.prototype, 'animate') };
  }

  it('rolls the label out and pops the spinner in, then brings the label back while the spinner leaves', async () => {
    const { calls, restore } = mockAnimate();
    try {
      const { rerender } = render(<Button>Save changes</Button>);
      const el = screen.getByRole('button');
      rerender(<Button loading>Save changes</Button>);
      expect(el.getAttribute('aria-busy')).toBe('true');
      const label = el.querySelector('[data-part="label"]');
      const spinner = el.querySelector('[data-part="spinner"]');
      expect(JSON.stringify(calls.find((c) => c.el === label)?.frames)).toContain('translateY');
      expect(JSON.stringify(calls.find((c) => c.el === spinner)?.frames)).toContain('--ds-scale-morph');
      expect(JSON.stringify(calls.find((c) => c.el === el)?.frames)).toContain('--ds-scale-anticipate');
      calls.length = 0;
      rerender(<Button>Save changes</Button>);
      // The state changes at once; the spinner stays for its exit only, hidden from assistive tech.
      expect(el.hasAttribute('aria-busy')).toBe(false);
      expect(el.querySelector('[data-part="status"]')).toBeNull();
      const leaving = el.querySelector('[data-part="spinner"]');
      expect(leaving?.getAttribute('aria-hidden')).toBe('true');
      expect(calls.some((c) => c.el === leaving)).toBe(true);
      expect(calls.some((c) => c.el === label)).toBe(true);
      await act(async () => {
        for (const c of calls) c.finish();
        for (let i = 0; i < 5; i += 1) await Promise.resolve();
      });
      expect(el.querySelector('[data-part="spinner"]')).toBeNull();
    } finally {
      restore();
    }
  });

  it('keeps no leaving spinner without the Web Animations API', () => {
    const { rerender } = render(<Button loading>Save changes</Button>);
    rerender(<Button>Save changes</Button>);
    expect(screen.getByRole('button').querySelector('[data-part="spinner"]')).toBeNull();
  });
});

describe('Button motion CSS (order 1.22 and the round 1 review)', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Button.css'), 'utf8');

  it('holds scale(1) at rest, so a press of scale 1 starts no empty transition (N14)', () => {
    const at = css.indexOf('--_button-duration-out: var(--ds-duration-spring-bouncy);');
    expect(at).toBeGreaterThan(0);
    expect(css.slice(at, css.indexOf('}', at))).toContain('transform: scale(1);');
  });

  it('turns the press, the dip and the nudge off under data-motion reduce as under the media query (B2)', () => {
    const at = css.indexOf(":root[data-motion='reduce'] :is([data-ds='button']");
    const block = css.slice(css.indexOf('{', css.indexOf('--_button-press-scale: 1;', at) - 400), css.indexOf('}', css.indexOf('--_button-press-scale: 1;', at)));
    expect(at).toBeGreaterThan(0);
    expect(block).toContain('--_button-press-scale: 1;');
    expect(block).toContain('--_button-part-press: 1;');
    expect(block).toContain('--_button-shift: 0px;');
  });

  it('springs back on release and multiplies every transition by the motion switch', () => {
    expect(css).toContain('transition: transform calc(var(--_button-duration-out) * var(--_button-motion)) var(--_button-ease-out);');
    expect(css).toContain('--_button-ease-out: var(--ds-ease-spring-bouncy);');
  });
});

describe('Button result (interaction button-result, order 1.23)', () => {
  it('has no result part or status until a result shows', () => {
    const { container } = render(<Button>Save changes</Button>);
    const el = root(container);
    expect(el.hasAttribute('data-result')).toBe(false);
    expect(el.querySelector('[data-part="result"]')).toBeNull();
    expect(el.querySelector('[role="status"]')).toBeNull();
  });

  it('stamps data-result, draws a decorative glyph and says the result once', () => {
    const { container, rerender } = render(<Button resultLabel="Saved">Save changes</Button>);
    const el = root(container);
    // The status waits empty, so the words are read when they arrive.
    expect(el.querySelector('[role="status"]')?.textContent).toBe('');
    rerender(
      <Button result="success" resultLabel="Saved">
        Save changes
      </Button>,
    );
    expect(el.getAttribute('data-result')).toBe('success');
    const glyph = el.querySelector('[data-part="result"]');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    const paths = Array.from(glyph?.querySelectorAll('path') ?? []);
    expect(paths).toHaveLength(1);
    expect(paths[0]?.getAttribute('pathLength')).toBe('1');
    expect(el.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(el.querySelector('[role="status"]')?.textContent).toBe('Saved');
    // The label stays in the flow, so the width holds, and the name stays.
    expect(screen.getByRole('button', { name: /Save changes/ })).toBe(el);
  });

  it('draws the error mark in two strokes and goes back, keeping the glyph for the exit', () => {
    const { container, rerender } = render(
      <Button result="error" resultLabel="Could not save">
        Save changes
      </Button>,
    );
    const el = root(container);
    expect(el.getAttribute('data-result')).toBe('error');
    expect(el.querySelectorAll('[data-part="result"] path')).toHaveLength(2);
    rerender(<Button resultLabel="Could not save">Save changes</Button>);
    expect(el.hasAttribute('data-result')).toBe(false);
    expect(el.querySelector('[data-part="result"]')).not.toBeNull();
    expect(el.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('says nothing about a result while loading', () => {
    const { container } = render(
      <Button loading result="success" resultLabel="Saved">
        Save changes
      </Button>,
    );
    const statuses = Array.from(root(container).querySelectorAll('[role="status"]')).map((s) => s.textContent);
    expect(statuses).toEqual(['Loading', '']);
  });
});

describe('Button glow (interaction button-glow, order 1.23)', () => {
  function rect(el: HTMLElement) {
    el.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 40, right: 300, bottom: 90, x: 100, y: 50, toJSON: () => ({}) }) as DOMRect;
  }

  it('places the glow of a solid button where the pointer is, as a share of the box', () => {
    const onPointerMove = vi.fn();
    const { container } = render(
      <Button tone="accent" emphasis="solid" onPointerMove={onPointerMove}>
        Publish
      </Button>,
    );
    const el = root(container);
    rect(el);
    fireEvent.pointerMove(el, { clientX: 150, clientY: 60 });
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('25%');
    expect(el.style.getPropertyValue('--_button-glow-y')).toBe('25%');
    expect(onPointerMove).toHaveBeenCalled();
    fireEvent.pointerDown(el, { clientX: 300, clientY: 90 });
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('100%');
  });

  it('sets the ripple origin of any emphasis on pointer down, in px from the inline start (a platform hook)', () => {
    const { container } = render(<Button>Save</Button>);
    const el = root(container);
    rect(el);
    Object.defineProperty(el, 'offsetWidth', { configurable: true, value: 200 });
    Object.defineProperty(el, 'offsetHeight', { configurable: true, value: 40 });
    fireEvent.pointerDown(el, { clientX: 150, clientY: 60 });
    expect(el.style.getPropertyValue('--_button-ripple-x')).toBe('50px');
    expect(el.style.getPropertyValue('--_button-ripple-y')).toBe('10px');
    // The glow place is written too (a style may light a soft fill); Button.css shows it on solid only by default.
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('25%');
  });

  it('leaves link buttons and inert buttons alone', () => {
    const { container, rerender } = render(<Button emphasis="link">Save</Button>);
    const el = root(container);
    rect(el);
    fireEvent.pointerMove(el, { clientX: 150, clientY: 60 });
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('');
    rerender(
      <Button emphasis="solid" disabled>
        Save
      </Button>,
    );
    fireEvent.pointerMove(el, { clientX: 150, clientY: 60 });
    expect(el.style.getPropertyValue('--_button-glow-x')).toBe('');
  });
});

describe('Button press and layers CSS (order 1.23)', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Button.css'), 'utf8');

  it('presses deeper at larger sizes and sinks the parts while held', () => {
    const lg = css.indexOf("[data-size='lg'] {");
    expect(css.slice(lg, css.indexOf('}', lg))).toContain('--_button-press-y: calc(var(--ds-distance-nudge) + var(--ds-border-width-default));');
    const sm = css.indexOf("[data-size='sm'] {");
    expect(css.slice(sm, css.indexOf('}', sm))).toContain('--_button-press-y: var(--ds-border-width-default);');
    expect(css).toContain('--_button-part-y: var(--_button-press-y);');
    expect(css).toContain('--_button-press-layer: 1;');
  });

  it('keeps hover behind a hover capable device, and the glow off under reduced motion and more contrast', () => {
    const media = css.indexOf('@media (hover: hover) {\n    :is(');
    expect(media).toBeGreaterThan(0);
    expect(css.slice(media, css.indexOf('}', media))).toContain('--_button-bg: var(--_button-bg-hover);');
    const reduce = css.indexOf(":root[data-motion='reduce'] :is([data-ds='button'], [data-ds='icon-button'], [data-ds='toggle-button'], [data-ds='close-button'], [data-ds='copy-button'], [data-ds='floating-action-button']) {");
    const block = css.slice(reduce, css.indexOf('}', reduce));
    for (const line of ['--_button-glow: 0;', '--_button-press-y: 0px;', '--_button-shake: 0px;', '--_button-draw: 0;']) expect(block).toContain(line);
    expect(css).toContain("[data-contrast='more'] :is(");
  });
});
