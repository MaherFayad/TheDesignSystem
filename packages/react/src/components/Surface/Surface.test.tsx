import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import SurfaceDemo from './Surface.demo';
import { Surface } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="surface"]');
  if (!el) throw new Error('no surface rendered');
  return el;
}

describe('Surface', () => {
  it('stamps the defaults: level 1, no border, no elevation, card radius, xl padding, a div', () => {
    const el = root(render(<Surface>Box</Surface>).container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-level')).toBe('1');
    expect(el.getAttribute('data-elevation')).toBe('none');
    expect(el.getAttribute('data-radius')).toBe('card');
    expect(el.getAttribute('data-padding')).toBe('xl');
    expect(el.hasAttribute('data-bordered')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.textContent).toBe('Box');
  });

  it('maps every prop to its attribute and spreads the rest on the root', () => {
    const ref = createRef<HTMLElement>();
    const el = root(
      render(
        <Surface
          ref={ref}
          level="body"
          bordered
          elevation="panel"
          radius="pill"
          padding="none"
          as="section"
          className="x"
          aria-label="Summary"
        />,
      ).container,
    );
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('data-level')).toBe('body');
    expect(el.getAttribute('data-bordered')).toBe('');
    expect(el.getAttribute('data-elevation')).toBe('panel');
    expect(el.getAttribute('data-radius')).toBe('pill');
    expect(el.getAttribute('data-padding')).toBe('none');
    expect(el.className).toBe('x');
    expect(el.getAttribute('aria-label')).toBe('Summary');
    expect(ref.current).toBe(el);
  });

  it('takes a number level and writes it as a string', () => {
    expect(root(render(<Surface level={5} />).container).getAttribute('data-level')).toBe('5');
  });

  it('renders every demo case', () => {
    const { container } = render(<SurfaceDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
