// Order 1.22: filter-count-roll and chip-check-pop.
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import { Chip } from '../Chip';
import { FilterBar } from './index';

describe('FilterBar motion (order 1.22)', () => {
  it('the count is read from a visually hidden copy; the drawn copy is aria-hidden and follows it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FilterBar
        aria-label="Files"
        filters={[
          { value: 'a', label: 'Images' },
          { value: 'b', label: 'Video' },
        ]}
        resultCount={4}
      />,
    );
    const count = () => container.querySelector("[data-part='count']")!;
    const drawn = () => count().querySelector(':scope > [aria-hidden="true"]')!;
    expect(count().querySelector('[data-visually-hidden]')?.textContent).toBe('4 results');
    expect(drawn().textContent).toBe('4 results');
    await user.click(screen.getByRole('button', { name: 'Images' }));
    expect(drawn().textContent).toBe(count().querySelector('[data-visually-hidden]')?.textContent);
  });

  it('a chip that turns selected turns its check in (icon morph)', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
    const proto = SVGElement.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    proto.animate = animate;
    try {
      const { rerender } = render(
        <Theme style="desk">
          <Chip selected={false}>Images</Chip>
        </Theme>,
      );
      expect(animate).not.toHaveBeenCalled();
      rerender(
        <Theme style="desk">
          <Chip selected>Images</Chip>
        </Theme>,
      );
      const ids = animate.mock.calls.map((c) => (c as unknown as [Keyframe[], { id: string }])[1].id);
      expect(ids).toContain('ds-motion:icon-morph-in');
    } finally {
      proto.animate = original;
    }
  });
});
