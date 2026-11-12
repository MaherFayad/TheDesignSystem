import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { iconNames, iconSetIds, mirrorIcons } from '@the-system/icons';
import IconDemo from './Icon.demo';
import { Icon, IconSetContext } from './index';

function svg(container: HTMLElement): SVGSVGElement {
  const el = container.querySelector('svg');
  if (!el) throw new Error('no svg rendered');
  return el;
}

describe('Icon', () => {
  it('renders the root with the anatomy attributes', () => {
    const { container } = render(<Icon name="close" />);
    const el = svg(container);
    expect(el.getAttribute('data-ds')).toBe('icon');
    expect(el.getAttribute('data-icon')).toBe('close');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-set')).toBe('pixel');
    expect(el.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(el.getAttribute('fill')).toBe('currentColor');
    expect(el.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('is hidden by default and gets role img with a label', () => {
    const hidden = svg(render(<Icon name="info" />).container);
    expect(hidden.getAttribute('aria-hidden')).toBe('true');
    expect(hidden.getAttribute('role')).toBeNull();
    const named = svg(render(<Icon name="warning" label="Warning" />).container);
    expect(named.getAttribute('role')).toBe('img');
    expect(named.getAttribute('aria-label')).toBe('Warning');
    expect(named.getAttribute('aria-hidden')).toBeNull();
  });

  it('maps sizes by name and by number', () => {
    const cases = [
      [12, 'sm'],
      [16, 'md'],
      [24, 'lg'],
      ['sm', 'sm'],
      ['lg', 'lg'],
    ] as const;
    for (const [size, name] of cases) {
      const el = svg(render(<Icon name="plus" size={size} />).container);
      expect(el.getAttribute('data-size')).toBe(name);
    }
  });

  it('sets the mirror flag only for directional names', () => {
    for (const name of mirrorIcons) {
      expect(svg(render(<Icon name={name} />).container).hasAttribute('data-mirror')).toBe(true);
    }
    for (const name of ['clock', 'play', 'close', 'chevron-down'] as const) {
      expect(svg(render(<Icon name={name} />).container).hasAttribute('data-mirror')).toBe(false);
    }
  });

  it('reads the set from context, and a prop overrides it', () => {
    const fromContext = svg(
      render(
        <IconSetContext value={{ set: 'line' }}>
          <Icon name="search" />
        </IconSetContext>,
      ).container,
    );
    expect(fromContext.getAttribute('data-set')).toBe('line');
    expect(fromContext.getAttribute('stroke')).toBe('currentColor');
    expect(fromContext.getAttribute('stroke-width')).toBe('2');
    expect(fromContext.querySelector('circle')).not.toBeNull();
    const fromProp = svg(
      render(
        <IconSetContext value={{ set: 'line' }}>
          <Icon name="search" set="pixel" />
        </IconSetContext>,
      ).container,
    );
    expect(fromProp.getAttribute('data-set')).toBe('pixel');
  });

  it('passes props, className and style through to the root', () => {
    const el = svg(render(<Icon name="star" className="x" style={{ opacity: 0.5 }} data-testid="star" />).container);
    expect(el.getAttribute('class')).toBe('x');
    expect(el.getAttribute('data-testid')).toBe('star');
    expect(el.style.opacity).toBe('0.5');
  });

  it('renders the demo with every icon in every set', () => {
    const { container } = render(<IconDemo />);
    expect(container.querySelector('[data-demo-case="variants"]')).not.toBeNull();
    const many = container.querySelector('[data-demo-case="many"]');
    expect(many?.querySelectorAll('[data-ds="icon"]').length).toBe(iconNames.length * iconSetIds.length);
  });
});
