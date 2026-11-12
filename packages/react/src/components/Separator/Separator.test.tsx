import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import SeparatorDemo from './Separator.demo';
import { Separator } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="separator"]');
  if (!el) throw new Error('no separator rendered');
  return el;
}

describe('Separator', () => {
  it('is decorative and horizontal by default', () => {
    const el = root(render(<Separator />).container);
    expect(el.getAttribute('role')).toBe('none');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-decorative')).toBe('');
    expect(el.hasAttribute('data-labelled')).toBe(false);
    expect(el.children.length).toBe(0);
  });

  it('is announced when not decorative, with aria-orientation when vertical', () => {
    const el = root(render(<Separator decorative={false} orientation="vertical" />).container);
    expect(el.getAttribute('role')).toBe('separator');
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.hasAttribute('data-decorative')).toBe(false);
  });

  it('renders a label between two hidden lines, and names a semantic separator with it', () => {
    const el = root(render(<Separator label="Older messages" decorative={false} />).container);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.textContent).toBe('Older messages');
    expect(el.getAttribute('aria-labelledby')).toBe(label?.id);
    const lines = el.querySelectorAll('[data-part="line"]');
    expect(lines.length).toBe(2);
    for (const line of lines) expect(line.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-labelled')).toBe('');
  });

  it('keeps a decorative label out of the name, and an empty label draws a plain line', () => {
    const decorative = root(render(<Separator label="Or" />).container);
    expect(decorative.hasAttribute('aria-labelledby')).toBe(false);
    const empty = root(render(<Separator label="" />).container);
    expect(empty.hasAttribute('data-labelled')).toBe(false);
    expect(empty.children.length).toBe(0);
  });

  it('passes ref and className to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const el = root(render(<Separator ref={ref} className="x" />).container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<SeparatorDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="separator"]`)).not.toBeNull();
    }
  });
});
