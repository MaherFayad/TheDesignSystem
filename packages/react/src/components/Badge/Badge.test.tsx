import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BadgeDemo from './Badge.demo';
import { Badge, formatBadgeCount } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="badge"]');
  if (!el) throw new Error('no badge rendered');
  return el;
}

describe('Badge', () => {
  it('renders a label part with no role and no focus', () => {
    const el = root(render(<Badge>Beta</Badge>).container);
    expect(el.tagName).toBe('SPAN');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('tabindex')).toBe(false);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Beta');
  });

  it('defaults to neutral, soft and sm, and takes the shared axes', () => {
    const plain = root(render(<Badge>Draft</Badge>).container);
    expect(plain.getAttribute('data-tone')).toBe('neutral');
    expect(plain.getAttribute('data-emphasis')).toBe('soft');
    expect(plain.getAttribute('data-size')).toBe('sm');
    const set = root(
      render(
        <Badge tone="danger" emphasis="solid" size="xs">
          Failed
        </Badge>,
      ).container,
    );
    expect(set.getAttribute('data-tone')).toBe('danger');
    expect(set.getAttribute('data-emphasis')).toBe('solid');
    expect(set.getAttribute('data-size')).toBe('xs');
  });

  it('formats counts over max as max+', () => {
    expect(formatBadgeCount(3)).toBe('3');
    expect(formatBadgeCount(99)).toBe('99');
    expect(formatBadgeCount(100)).toBe('99+');
    expect(formatBadgeCount(4580, 999)).toBe('999+');
    expect(formatBadgeCount(-2)).toBe('0');
  });

  it('shows 99+ and reads the full number', () => {
    const el = root(render(<Badge count={120} />).container);
    const label = el.querySelector('[data-part="label"]')!;
    expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('99+');
    expect(label.textContent).toBe('99+120');
  });

  it('reads the count words when countLabel is set', () => {
    const el = root(render(<Badge count={3} countLabel={(n) => `${n} unread messages`} />).container);
    const label = el.querySelector('[data-part="label"]')!;
    expect(label.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
    expect(label.textContent).toBe('33 unread messages');
  });

  it('a count is drawn aria-hidden, so its digits can roll, and read once from a hidden copy', () => {
    const el = root(render(<Badge count={7} />).container);
    const label = el.querySelector('[data-part="label"]');
    expect(label?.querySelector('[aria-hidden="true"] > bdi')?.textContent).toBe('7');
    expect(label?.textContent).toBe('77');
  });

  it('the dot form hides the label visually, keeps it for assistive tech and drops the icon', () => {
    const el = root(
      render(
        <Badge dot start="check" tone="success">
          Online
        </Badge>,
      ).container,
    );
    expect(el.getAttribute('data-dot')).toBe('');
    expect(el.querySelector('[data-part="icon"]')).toBeNull();
    const label = el.querySelector<HTMLElement>('[data-part="label"]')!;
    expect(label.textContent).toBe('Online');
    expect(label.style.position).toBe('absolute');
    expect(root(render(<Badge>Beta</Badge>).container).hasAttribute('data-dot')).toBe(false);
  });

  it('the dot form with a count keeps the count words', () => {
    const el = root(render(<Badge dot count={3} countLabel={(n) => `${n} unread messages`} />).container);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('3 unread messages');
  });

  it('a negative count shows and reads zero', () => {
    const el = root(render(<Badge count={-3} countLabel={(n) => `${n} new`} />).container);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('00 new');
  });

  it('renders the icon part hidden from assistive tech', () => {
    const el = root(render(<Badge start="check">Verified</Badge>).container);
    const icon = el.querySelector('[data-part="icon"]');
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(icon?.querySelector('[data-icon="check"]')).not.toBeNull();
  });

  it('passes ref and native props to the root', () => {
    let node: HTMLSpanElement | null = null;
    const { container } = render(
      <Badge id="b" ref={(el) => void (node = el)}>
        New
      </Badge>,
    );
    expect(root(container).id).toBe('b');
    expect(node).toBe(root(container));
  });

  it('renders every demo case', () => {
    const { container } = render(<BadgeDemo />);
    const cases = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
