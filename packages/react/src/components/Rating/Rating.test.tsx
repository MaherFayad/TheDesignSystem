import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import RatingDemo from './Rating.demo';
import { Rating, starFill } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="rating"]');
  if (!el) throw new Error('no rating root');
  return el;
}

function icons(el: HTMLElement): string[] {
  return [...el.querySelectorAll('[data-part="icon"]')].map((i) => i.getAttribute('data-icon') ?? '');
}

describe('starFill', () => {
  it('rounds to the nearest half', () => {
    expect([1, 2, 3, 4, 5].map((s) => starFill(s, 3.5))).toEqual(['full', 'full', 'full', 'half', 'empty']);
    expect([1, 2, 3].map((s) => starFill(s, 2.8))).toEqual(['full', 'full', 'full']);
    expect([1, 2, 3].map((s) => starFill(s, 2.2))).toEqual(['full', 'full', 'empty']);
    expect(starFill(1, 0)).toBe('empty');
  });
});

describe('Rating', () => {
  it('renders a named radiogroup of stars, each named "n of max stars"', () => {
    const { container } = render(<Rating aria-label="Rate this board" defaultValue={3} />);
    const group = screen.getByRole('radiogroup', { name: 'Rate this board' });
    expect(group).toBe(root(container));
    expect(group.getAttribute('data-size')).toBe('md');
    expect(group.getAttribute('data-tone')).toBe('warning');
    const stars = screen.getAllByRole('radio');
    expect(stars.map((s) => s.getAttribute('aria-label'))).toEqual([1, 2, 3, 4, 5].map((n) => `${n} of 5 stars`));
    expect(screen.getByRole('radio', { name: '3 of 5 stars' }).getAttribute('aria-checked')).toBe('true');
    expect(stars.map((s) => s.hasAttribute('data-filled'))).toEqual([true, true, true, false, false]);
    expect(icons(group)).toEqual(['star-filled', 'star-filled', 'star-filled', 'star', 'star']);
    for (const s of stars) expect(s.getAttribute('data-part')).toBe('item');
  });

  it('supports ten stars and custom names', () => {
    render(<Rating aria-label="Score" max={10} getItemLabel={(n, m) => `${n} من ${m} نجوم`} />);
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    expect(screen.getByRole('radio', { name: '7 من 10 نجوم' })).toBeTruthy();
  });

  it('maps size and tone to the root', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const tone of ['accent', 'warning'] as const) {
        const { container, unmount } = render(<Rating aria-label="R" size={size} tone={tone} />);
        expect(root(container).getAttribute('data-size')).toBe(size);
        expect(root(container).getAttribute('data-tone')).toBe(tone);
        unmount();
      }
    }
  });

  it('picks a score on click and fills the stars up to it', () => {
    const onValueChange = vi.fn();
    const { container } = render(<Rating aria-label="R" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole('radio', { name: '4 of 5 stars' }));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(icons(root(container))).toEqual(['star-filled', 'star-filled', 'star-filled', 'star-filled', 'star']);
  });

  it('changes the score with the arrows, and Home and End pick the ends', async () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="R" defaultValue={3} onValueChange={onValueChange} />);
    const three = screen.getByRole('radio', { name: '3 of 5 stars' });
    three.focus();
    fireEvent.keyDown(three, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: '4 of 5 stars' })));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Home' });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  it('flips the arrows in right to left; Home and End keep their meaning', async () => {
    const onValueChange = vi.fn();
    render(
      <Theme dir="rtl" lang="ar">
        <Rating aria-label="R" defaultValue={3} onValueChange={onValueChange} />
      </Theme>,
    );
    const three = screen.getByRole('radio', { name: '3 of 5 stars' });
    three.focus();
    fireEvent.keyDown(three, { key: 'ArrowLeft' });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('radio', { name: '4 of 5 stars' })));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'End' });
    expect(onValueChange).toHaveBeenLastCalledWith(5);
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Home' });
    expect(onValueChange).toHaveBeenLastCalledWith(1);
  });

  it('read only is role img with a label, half stars and no tab stop', () => {
    const { container } = render(
      <Rating readOnly value={3.5} showValue>
        (128 reviews)
      </Rating>,
    );
    const img = screen.getByRole('img', { name: '3.5 of 5 stars' });
    expect(root(container).hasAttribute('data-readonly')).toBe(true);
    expect(img.getAttribute('data-part')).toBe('stars');
    // The text after the stars is outside the image, so it is read.
    expect(img.contains(screen.getByText(/128 reviews/))).toBe(false);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(icons(img)).toEqual(['star-filled', 'star-filled', 'star-filled', 'star-half', 'star']);
    expect(container.querySelector('[data-part="value"]')?.textContent).toBe('3.5 (128 reviews)');
    expect(container.querySelector('[tabindex]')).toBeNull();
    const unrated = render(<Rating readOnly value={0} aria-label="Template" />);
    expect(unrated.getByRole('img', { name: 'Template: Not rated' })).toBeTruthy();
    const labelled = render(
      <>
        <span id="heading">Service</span>
        <Rating readOnly value={4} aria-labelledby="heading" />
      </>,
    );
    expect(labelled.getByRole('img', { name: 'Service 4 of 5 stars' })).toBeTruthy();
  });

  it('disables every star with native disabled', () => {
    const { container } = render(<Rating aria-label="R" disabled defaultValue={2} />);
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    for (const s of screen.getAllByRole('radio')) expect((s as HTMLButtonElement).disabled).toBe(true);
  });

  it('describes the group with the text after the stars', () => {
    render(<Rating aria-label="R">You can rate it after you open it.</Rating>);
    const id = screen.getByRole('radiogroup').getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(id)?.textContent).toBe('You can rate it after you open it.');
  });

  it('renders every demo case with unique ids and no title attribute', () => {
    const { container } = render(<RatingDemo />);
    expect(container.querySelectorAll('[data-demo-case]').length).toBeGreaterThanOrEqual(8);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
