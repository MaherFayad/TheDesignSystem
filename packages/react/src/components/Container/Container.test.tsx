import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import ContainerDemo from './Container.demo';
import { Container } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="container"]');
  if (!el) throw new Error('no container rendered');
  return el;
}

describe('Container', () => {
  it('defaults to width lg and gutter 3xl on a div', () => {
    const el = root(render(<Container />).container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-width')).toBe('lg');
    expect(el.getAttribute('data-gutter')).toBe('3xl');
    expect(el.hasAttribute('data-size')).toBe(false);
  });

  it('maps width, gutter and the element', () => {
    const el = root(render(<Container width="full" gutter="none" as="main" id="main" />).container);
    expect(el.tagName).toBe('MAIN');
    expect(el.id).toBe('main');
    expect(el.getAttribute('data-width')).toBe('full');
    expect(el.getAttribute('data-gutter')).toBe('none');
  });

  it('passes ref and className to the root', () => {
    const ref = createRef<HTMLElement>();
    const el = root(render(<Container ref={ref} className="x" />).container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<ContainerDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="container"]`)).not.toBeNull();
    }
  });
});
