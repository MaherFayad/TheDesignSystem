import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AvatarDemo from './Avatar.demo';
import { Avatar } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="avatar"]');
  if (!el) throw new Error('no avatar rendered');
  return el;
}

describe('Avatar', () => {
  it('is an image named by the name, with initials in a hidden fallback', () => {
    const { container } = render(<Avatar name="Maher Fayad" />);
    const el = root(container);
    expect(screen.getByRole('img', { name: 'Maher Fayad' })).toBe(el);
    const fallback = el.querySelector('[data-part="fallback"]');
    expect(fallback?.textContent).toBe('MF');
    expect(fallback?.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('defaults to md and the circle, and takes size and shape', () => {
    const plain = root(render(<Avatar name="Ada" />).container);
    expect(plain.getAttribute('data-size')).toBe('md');
    expect(plain.getAttribute('data-shape')).toBe('default');
    const set = root(render(<Avatar name="Ada" size="xs" shape="square" />).container);
    expect(set.getAttribute('data-size')).toBe('xs');
    expect(set.getAttribute('data-shape')).toBe('square');
  });

  it('stamps no data-state without an image, and loading while one loads', () => {
    expect(root(render(<Avatar name="Ada" />).container).hasAttribute('data-state')).toBe(false);
    const el = root(render(<Avatar name="Ada" src="/a.png" />).container);
    expect(el.getAttribute('data-state')).toBe('loading');
  });

  it('sets a stable hue from the name', () => {
    const a = root(render(<Avatar name="Sara Alqahtani" />).container);
    const b = root(render(<Avatar name="sara  alqahtani" />).container);
    expect(a.style.getPropertyValue('--_avatar-hue')).toMatch(/^var\(--ds-color-accent-\d+\)$/);
    expect(a.style.getPropertyValue('--_avatar-hue')).toBe(b.style.getPropertyValue('--_avatar-hue'));
  });

  it('shows the icon in place of initials, and the user icon when the name has no letters', () => {
    const team = root(render(<Avatar name="Design team" icon="folder" />).container);
    expect(team.querySelector('[data-part="fallback"] [data-icon="folder"]')).not.toBeNull();
    const none = root(render(<Avatar name="42" />).container);
    expect(none.querySelector('[data-part="fallback"] [data-icon="user"]')).not.toBeNull();
  });

  it('is hidden from assistive tech when decorative', () => {
    const el = root(render(<Avatar name="Maher Fayad" decorative />).container);
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('aria-label')).toBe(false);
  });

  it('adds the status part and its words to the name', () => {
    const el = root(render(<Avatar name="Omar Haddad" status="danger" />).container);
    expect(el.getAttribute('aria-label')).toBe('Omar Haddad, Busy');
    const dot = el.querySelector('[data-part="status"]');
    expect(dot?.getAttribute('data-tone')).toBe('danger');
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    const ar = root(render(<Avatar name="عمر حداد" status="success" statusLabel="متصل" />).container);
    expect(ar.getAttribute('aria-label')).toBe('عمر حداد، متصل');
  });

  it('passes ref and native props to the root', () => {
    let node: HTMLSpanElement | null = null;
    const { container } = render(<Avatar name="Ada" id="me" ref={(el) => void (node = el)} />);
    expect(root(container).id).toBe('me');
    expect(node).toBe(root(container));
  });

  it('renders every demo case', () => {
    const { container } = render(<AvatarDemo />);
    const cases = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'long-text', 'long-arabic', 'error']);
  });
});

/** WCAG relative luminance of a #rrggbb color. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

describe('Avatar fallback contrast', () => {
  const css = readFileSync(join(process.cwd(), 'packages/tokens/dist/css/tokens.css'), 'utf8');
  const blocks = [...css.matchAll(/\[data-style='([a-z]+)'\]\[data-scheme='([a-z]+)'\] \{([^}]*)\}/g)];

  it('reads the style and scheme blocks', () => {
    expect(blocks.length).toBeGreaterThanOrEqual(4);
  });

  it.each(blocks.map((m) => [`${m[1]} ${m[2]}`, m[3]!]))('every hue holds 4.5:1 with text.on-accent in %s', (_, body) => {
    const value = (name: string) => new RegExp(`--ds-${name}: (#[0-9a-f]{6});`).exec(body)?.[1];
    const ink = value('color-text-on-accent');
    expect(ink).toBeDefined();
    for (let hue = 1; hue <= 10; hue += 1) {
      const fill = value(`color-accent-${hue}`);
      expect(fill, `color.accent.${hue}`).toBeDefined();
      expect(ratio(fill!, ink!), `color.accent.${hue}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
