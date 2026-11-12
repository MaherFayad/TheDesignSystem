import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Avatar } from '../Avatar';
import AvatarGroupDemo from './AvatarGroup.demo';
import { AvatarGroup } from './index';

const names = ['Maher Fayad', 'Sara Alqahtani', 'Omar Haddad', 'Lina Saleh', 'Fahad Alotaibi', 'Noura Alharbi'];

function group(props: Partial<Parameters<typeof AvatarGroup>[0]> = {}) {
  return render(
    <AvatarGroup label="6 people" {...props}>
      {names.map((name) => (
        <Avatar key={name} name={name} />
      ))}
    </AvatarGroup>,
  );
}

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="avatar-group"]');
  if (!el) throw new Error('no avatar group rendered');
  return el;
}

describe('AvatarGroup', () => {
  it('is a group named by its label', () => {
    const { container } = group();
    expect(screen.getByRole('group', { name: '6 people' })).toBe(root(container));
  });

  it('shows four avatars as items in the group size, then a +N count', () => {
    const { container } = group({ size: 'sm' });
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    const items = el.querySelectorAll('[data-ds="avatar"][data-part="item"]');
    expect(items).toHaveLength(4);
    items.forEach((item) => expect(item.getAttribute('data-size')).toBe('sm'));
    const overflow = el.querySelector('[data-part="overflow"]');
    expect(overflow?.textContent).toBe('+2');
    expect(screen.getByRole('img', { name: '2 more' })).toBe(overflow);
  });

  it('defaults to md and four, and takes max and total', () => {
    const plain = root(group().container);
    expect(plain.getAttribute('data-size')).toBe('md');
    const set = root(group({ max: 2, total: 120 }).container);
    expect(set.querySelectorAll('[data-part="item"]')).toHaveLength(2);
    expect(set.querySelector('[data-part="overflow"]')?.textContent).toBe('+118');
  });

  it('has no count when everyone fits', () => {
    const el = root(group({ max: 6 }).container);
    expect(el.querySelector('[data-part="overflow"]')).toBeNull();
  });

  it('takes words for the count', () => {
    group({ overflowLabel: (n) => `${n} آخرين` });
    expect(screen.getByRole('img', { name: '2 آخرين' })).toBeTruthy();
  });

  it('makes the count a button with onOverflowClick', async () => {
    const user = userEvent.setup();
    const onOverflowClick = vi.fn();
    const { container } = group({ onOverflowClick });
    const button = screen.getByRole('button', { name: '+2, 2 more' });
    expect(button.getAttribute('data-ds')).toBe('button');
    expect(button.getAttribute('data-part')).toBe('overflow');
    expect(root(container).contains(button)).toBe(true);
    await user.click(button);
    expect(onOverflowClick).toHaveBeenCalledTimes(1);
  });

  it('renders every demo case', () => {
    const { container } = render(<AvatarGroupDemo />);
    const cases = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-arabic']);
  });
});
