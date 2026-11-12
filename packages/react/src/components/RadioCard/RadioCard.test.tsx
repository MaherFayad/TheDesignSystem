import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import RadioCardDemo from './RadioCard.demo';
import { RadioCard, RadioCardItem, type RadioCardProps } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="radio-card"]');
  if (!el) throw new Error('no radio-card root');
  return el;
}

function Plans(props: Partial<RadioCardProps>) {
  return (
    <RadioCard aria-label="Plan" {...props}>
      <RadioCardItem value="free" title="Free" description="Up to 3 boards." end="$0" />
      <RadioCardItem value="team" title="Team" description="Unlimited boards." end="$12" icon="user" />
    </RadioCard>
  );
}

describe('RadioCard', () => {
  it('renders a radiogroup root and one radio per card with the default axes', () => {
    const { container } = render(<Plans />);
    const group = screen.getByRole('radiogroup', { name: 'Plan' });
    expect(group).toBe(root(container));
    expect(group.getAttribute('data-size')).toBe('md');
    expect(group.getAttribute('data-tone')).toBe('neutral');
    expect(group.getAttribute('data-orientation')).toBe('vertical');
    const cards = screen.getAllByRole('radio');
    expect(cards).toHaveLength(2);
    for (const card of cards) expect(card.getAttribute('data-part')).toBe('item');
  });

  it('names each card by its title and describes it with the text and the end content', () => {
    render(<Plans />);
    const team = screen.getByRole('radio', { name: 'Team' });
    const ids = (team.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Unlimited boards.', '$12']);
    expect(team.querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Free' }).querySelector('[data-part="icon"]')).toBeNull();
  });

  it('maps size, tone and orientation to the root', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const tone of ['neutral', 'accent'] as const) {
        const { container, unmount } = render(<Plans size={size} tone={tone} orientation="horizontal" />);
        expect(root(container).getAttribute('data-size')).toBe(size);
        expect(root(container).getAttribute('data-tone')).toBe(tone);
        expect(root(container).getAttribute('aria-orientation')).toBe('horizontal');
        unmount();
      }
    }
  });

  it('checks on click anywhere on the card and reports the value', () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="free" onValueChange={onValueChange} />);
    const free = screen.getByRole('radio', { name: 'Free' });
    expect(free.getAttribute('data-state')).toBe('checked');
    expect(free.querySelector('[data-part="indicator"]')?.getAttribute('data-state')).toBe('checked');
    fireEvent.click(screen.getByText('Unlimited boards.'));
    expect(onValueChange).toHaveBeenLastCalledWith('team');
    expect(screen.getByRole('radio', { name: 'Team' }).getAttribute('aria-checked')).toBe('true');
    expect(free.getAttribute('data-state')).toBe('unchecked');
  });

  it('follows a controlled value', () => {
    const { rerender } = render(<Plans value="free" />);
    fireEvent.click(screen.getByRole('radio', { name: 'Team' }));
    expect(screen.getByRole('radio', { name: 'Free' }).getAttribute('aria-checked')).toBe('true');
    rerender(<Plans value="team" />);
    expect(screen.getByRole('radio', { name: 'Team' }).getAttribute('aria-checked')).toBe('true');
  });

  it('marks invalid, required and disabled', () => {
    const { container, unmount } = render(<Plans invalid required disabled />);
    const group = root(container);
    expect(group.hasAttribute('data-invalid')).toBe(true);
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(group.getAttribute('aria-required')).toBe('true');
    expect(group.hasAttribute('data-disabled')).toBe(true);
    for (const card of screen.getAllByRole('radio')) expect((card as HTMLButtonElement).disabled).toBe(true);
    unmount();
    render(
      <RadioCard aria-label="Region">
        <RadioCardItem value="me" title="Middle East" />
        <RadioCardItem value="us" title="United States" disabled />
      </RadioCard>,
    );
    const us = screen.getByRole('radio', { name: 'United States' });
    expect((us as HTMLButtonElement).disabled).toBe(true);
    expect(us.hasAttribute('data-disabled')).toBe(true);
  });

  it('moves and selects with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<Plans defaultValue="free" onValueChange={onValueChange} />);
    const free = screen.getByRole('radio', { name: 'Free' });
    free.focus();
    fireEvent.keyDown(free, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Team' })));
    expect(onValueChange).toHaveBeenLastCalledWith('team');
  });

  it('follows the reading direction: ArrowLeft moves to the next card in right to left', async () => {
    const onValueChange = vi.fn();
    render(
      <Theme dir="rtl" lang="ar">
        <Plans defaultValue="free" onValueChange={onValueChange} />
      </Theme>,
    );
    const free = screen.getByRole('radio', { name: 'Free' });
    free.focus();
    fireEvent.keyDown(free, { key: 'ArrowLeft' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Team' })));
    expect(onValueChange).toHaveBeenLastCalledWith('team');
  });

  it('renders every demo case with unique ids and no title attribute', () => {
    const { container } = render(<RadioCardDemo />);
    expect(container.querySelectorAll('[data-demo-case]').length).toBeGreaterThanOrEqual(9);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
