import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import GridDemo from './Grid.demo';
import { Grid, GridItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="grid"]');
  if (!el) throw new Error('no grid rendered');
  return el;
}

describe('Grid', () => {
  it('defaults to auto-fit at the md minimum with gap l', () => {
    const el = root(render(<Grid />).container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('data-columns')).toBe('auto-fit');
    expect(el.getAttribute('data-min')).toBe('md');
    expect(el.getAttribute('data-gap')).toBe('l');
    expect(el.hasAttribute('data-row-gap')).toBe(false);
    expect(el.hasAttribute('data-keep-columns')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
  });

  it('maps a fixed column count and drops the minimum', () => {
    const el = root(render(<Grid columns={3} minItemSize="lg" gap="s" rowGap="xl" keepColumns />).container);
    expect(el.getAttribute('data-columns')).toBe('3');
    expect(el.hasAttribute('data-min')).toBe(false);
    expect(el.getAttribute('data-gap')).toBe('s');
    expect(el.getAttribute('data-row-gap')).toBe('xl');
    expect(el.getAttribute('data-keep-columns')).toBe('');
  });

  it('renders a list with role list', () => {
    const el = root(
      render(
        <Grid as="ul">
          <GridItem as="li">A</GridItem>
        </Grid>,
      ).container,
    );
    expect(el.tagName).toBe('UL');
    expect(el.getAttribute('role')).toBe('list');
    expect(el.querySelector('li[data-part="item"]')).not.toBeNull();
  });

  it('stamps spans on GridItem only when they differ from 1', () => {
    const { container } = render(
      <Grid>
        <GridItem>plain</GridItem>
        <GridItem span={2} rowSpan={3}>
          wide
        </GridItem>
        <GridItem span="full">full</GridItem>
      </Grid>,
    );
    const items = container.querySelectorAll('[data-part="item"]');
    expect(items[0]?.hasAttribute('data-span')).toBe(false);
    expect(items[0]?.hasAttribute('data-row-span')).toBe(false);
    expect(items[1]?.getAttribute('data-span')).toBe('2');
    expect(items[1]?.getAttribute('data-row-span')).toBe('3');
    expect(items[2]?.getAttribute('data-span')).toBe('full');
  });

  it('passes ref, className and rest props to the root', () => {
    const ref = createRef<HTMLElement>();
    const el = root(render(<Grid ref={ref} className="x" aria-label="Files" />).container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.getAttribute('aria-label')).toBe('Files');
  });

  it('renders every demo case that applies', () => {
    const { container } = render(<GridDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"] [data-ds="grid"]`)).not.toBeNull();
    }
  });
});
