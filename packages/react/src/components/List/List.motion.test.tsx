// Order 1.22: row-glide layers and collection-flip on List, and tags that keep their element in TagField.
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { TagField } from '../TagField';
import { List, ListItem } from './index';

describe('List and TagField motion (order 1.22)', () => {
  it('each row holds a decorative glide layer with no part name', () => {
    const { container } = render(
      <List aria-label="Pages">
        <ListItem title="Overview" href="#a" />
      </List>,
    );
    const layer = container.querySelector("[data-part='item'] > span[aria-hidden='true']:not([data-part])");
    expect(layer).not.toBeNull();
  });

  it('a removed row shrinks out as an inert clone with no ids, and the clone leaves', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    proto.animate = animate;
    try {
      const rows = (names: string[]) => (
        <Theme style="desk">
          <List aria-label="People">
            {names.map((n) => (
              <ListItem key={n} id={`row-${n}`} title={n} />
            ))}
          </List>
        </Theme>
      );
      const { container, rerender } = render(rows(['Sara', 'Omar']));
      animate.mockClear();
      rerender(rows(['Omar']));
      const ids = animate.mock.calls.map((c) => (c as unknown as [Keyframe[], { id: string }])[1].id);
      expect(ids).toContain('ds-motion:flip-exit');
      const clone = container.querySelector('li[inert]');
      expect(clone?.getAttribute('aria-hidden')).toBe('true');
      expect(clone?.hasAttribute('id')).toBe(false);
      await Promise.resolve();
      await Promise.resolve();
      expect(container.querySelector('li[inert]')).toBeNull();
    } finally {
      proto.animate = original;
    }
  });

  it('TagField keeps the element of each tag when an earlier tag is removed', () => {
    const { container, rerender } = render(<TagField aria-label="Tags" value={['Design', 'Copy']} />);
    const copy = Array.from(container.querySelectorAll("[data-part='tag']")).find((t) => t.textContent?.includes('Copy'));
    rerender(<TagField aria-label="Tags" value={['Copy']} />);
    expect(container.querySelector("[data-part='tag']:not([inert])")).toBe(copy);
  });
});
