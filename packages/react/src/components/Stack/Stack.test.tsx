import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import StackDemo from './Stack.demo';
import { Stack } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="stack"]');
  if (!el) throw new Error('no stack rendered');
  return el;
}

describe('Stack', () => {
  it('renders a div with the default attributes', () => {
    const { container } = render(
      <Stack>
        <span>One</span>
      </Stack>,
    );
    const el = root(container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.getAttribute('data-gap')).toBe('s');
    expect(el.hasAttribute('data-wrap')).toBe(false);
    expect(el.hasAttribute('data-align')).toBe(false);
    expect(el.hasAttribute('data-justify')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('maps props to data attributes', () => {
    const { container } = render(<Stack direction="inline" gap="xl" align="center" justify="between" wrap />);
    const el = root(container);
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('data-gap')).toBe('xl');
    expect(el.getAttribute('data-align')).toBe('center');
    expect(el.getAttribute('data-justify')).toBe('between');
    expect(el.getAttribute('data-wrap')).toBe('');
  });

  it('renders as another element, and a list keeps its role', () => {
    const list = root(render(<Stack as="ul" />).container);
    expect(list.tagName).toBe('UL');
    expect(list.getAttribute('role')).toBe('list');
    const nav = root(render(<Stack as="nav" aria-label="Sections" />).container);
    expect(nav.tagName).toBe('NAV');
    expect(nav.hasAttribute('role')).toBe(false);
  });

  it('renders the child element with asChild', () => {
    const { container } = render(
      <Stack asChild direction="inline">
        <section aria-label="Tools">
          <span>A</span>
        </section>
      </Stack>,
    );
    const el = root(container);
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('aria-label')).toBe('Tools');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
  });

  it('stamps gap none and leaves align and justify off by default', () => {
    const el = root(render(<Stack gap="none" />).container);
    expect(el.getAttribute('data-gap')).toBe('none');
    expect(el.hasAttribute('data-align')).toBe(false);
    expect(el.hasAttribute('data-justify')).toBe(false);
  });

  it('leaves the role of an asChild list to the caller', () => {
    const el = root(
      render(
        <Stack asChild>
          <ul role="list" />
        </Stack>,
      ).container,
    );
    expect(el.tagName).toBe('UL');
    expect(el.getAttribute('role')).toBe('list');
  });

  it('passes ref, className, style and rest props to the root', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(<Stack ref={ref} className="x" style={{ opacity: 0.5 }} data-testid="s" />);
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.getAttribute('data-testid')).toBe('s');
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<StackDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="stack"]`)).not.toBeNull();
    }
  });
});
