import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import BentoDemo from './Bento.demo';
import { Bento, BentoItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="bento"]');
  if (!el) throw new Error('no bento rendered');
  return el;
}

describe('Bento', () => {
  it('stamps the defaults: a div with 4 columns, items 1x1 divs', () => {
    const el = root(
      render(
        <Bento>
          <BentoItem>A</BentoItem>
        </Bento>,
      ).container,
    );
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-columns')).toBe('4');
    expect(el.hasAttribute('data-part')).toBe(false);
    const item = el.querySelector('[data-part="item"]');
    expect(item?.tagName).toBe('DIV');
    expect(item?.getAttribute('data-span')).toBe('1x1');
    expect(item?.hasAttribute('data-ds')).toBe(false);
  });

  it('takes columns, spans, elements and refs, and keeps source order', () => {
    const ref = createRef<HTMLElement>();
    const itemRef = createRef<HTMLElement>();
    const el = root(
      render(
        <Bento as="ul" columns={3} ref={ref} className="x" aria-label="Overview">
          <BentoItem as="li" span="2x2" ref={itemRef}>
            A
          </BentoItem>
          <BentoItem as="li" span="2x1">
            B
          </BentoItem>
          <BentoItem as="li" span="1x2">
            C
          </BentoItem>
        </Bento>,
      ).container,
    );
    expect(el.tagName).toBe('UL');
    expect(el.getAttribute('data-columns')).toBe('3');
    expect(el.className).toBe('x');
    expect(ref.current).toBe(el);
    const items = Array.from(el.querySelectorAll('[data-part="item"]'));
    expect(items.map((i) => i.tagName)).toEqual(['LI', 'LI', 'LI']);
    expect(items.map((i) => i.getAttribute('data-span'))).toEqual(['2x2', '2x1', '1x2']);
    expect(items.map((i) => i.textContent)).toEqual(['A', 'B', 'C']);
    expect(itemRef.current).toBe(items[0]);
  });

  it('renders every demo case', () => {
    const { container } = render(<BentoDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
