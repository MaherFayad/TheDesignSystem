import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Theme } from '../../theme/Theme';
import ColorSwatchDemo from './ColorSwatch.demo';
import { ColorSwatch } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-swatch"]')!;

describe('ColorSwatch', () => {
  it('renders the root as an img named by the colour, never by hex', () => {
    const { container } = render(<ColorSwatch color="#0d4289" locale="en" />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Blue, dark');
    expect(el.getAttribute('aria-roledescription')).toBe('colour swatch');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('default');
    expect(el.getAttribute('aria-label')).not.toMatch(/#/);
  });

  it('sets the colour as a custom property, not as a background', () => {
    const { container } = render(<ColorSwatch color="#0d4289" />);
    const el = root(container);
    expect(el.style.getPropertyValue('--_color-swatch-fill')).toBe('rgba(13, 66, 137, 1)');
    expect(el.style.backgroundColor).toBe('');
    expect(el.className).toBe('');
  });

  it('names in Arabic with the colour first, the Arabic comma and Western digits', () => {
    const { container } = render(<ColorSwatch color="#0d428966" locale="ar-SA" aria-label="لون الخلفية" />);
    const el = root(container);
    expect(el.getAttribute('aria-label')).toBe('أزرق غامق، شفافية 60%، لون الخلفية');
    expect(el.getAttribute('aria-roledescription')).toBe('عينة لون');
    expect(/[٠-٩]/.test(el.getAttribute('aria-label')!)).toBe(false);
  });

  it('adds the aria-label after the name in English, and takes a colorName', () => {
    render(<ColorSwatch color="#155eef" locale="en" colorName="Primary blue" aria-label="Fill" />);
    expect(screen.getByRole('img', { name: 'Primary blue, Fill' })).toBeTruthy();
  });

  it('names a fully see through colour', () => {
    const { container } = render(<ColorSwatch color="#00000000" locale="en" />);
    expect(root(container).getAttribute('aria-label')).toBe('Transparent');
  });

  it('defaults the language to the nearest Theme and stamps size and shape', () => {
    const { container } = render(
      <Theme lang="ar">
        <ColorSwatch color="#e03a3a" size="lg" shape="pill" />
      </Theme>,
    );
    const el = root(container);
    expect(el.getAttribute('aria-label')).toBe('أحمر');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-shape')).toBe('pill');
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<ColorSwatchDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic']);
  });
});
