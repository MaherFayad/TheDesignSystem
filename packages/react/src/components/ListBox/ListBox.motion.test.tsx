// Order 1.22: row-glide, and the review fixes B5 (the highlighted option is ringed) and N20.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { ListBox } from './index';

const read = (name: string) => readFileSync(join(process.cwd(), `packages/css/src/components/${name}.css`), 'utf8');
const items = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
];

describe('ListBox motion and focus (order 1.22)', () => {
  it('B5: a highlighted option takes the ring, so virtual focus is not marked by fill alone', () => {
    const css = read('ListBox');
    const at = css.indexOf("[data-ds='list-box'] [data-part='option'][data-highlighted] {");
    expect(css.slice(at, css.indexOf('}', at))).toMatch(/--_list-box-option-ring: inset 0 0 0 var\(--ds-border-width-strong\) var\(--_list-box-option-ring-color\);/);
  });

  it('N20: TagField no longer sets the ListBox ring itself', () => {
    expect(read('TagField')).not.toMatch(/--_list-box-option-ring:/);
  });

  it('row-glide: each option holds a decorative layer, and a new highlight travels from the old row', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    proto.animate = animate;
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const i = Array.from(this.closest('[data-ds="list-box"]')?.querySelectorAll('[data-part="option"]') ?? []).indexOf(this.closest('[data-part="option"]')!);
      return new DOMRect(0, i * 32, 200, 32);
    });
    try {
      const { container, rerender } = render(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} virtualFocus highlightedValue="a" />
        </Theme>,
      );
      const layers = container.querySelectorAll("[data-part='option'] > span:first-child");
      expect(layers).toHaveLength(2);
      for (const l of layers) expect(l.getAttribute('aria-hidden')).toBe('true');
      rerender(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} virtualFocus highlightedValue="b" />
        </Theme>,
      );
      await waitFor(() => expect(animate.mock.calls.some((c) => (c as unknown as [Keyframe[], { id: string }])[1].id === 'ds-motion:flip')).toBe(true));
      const [frames] = animate.mock.calls.find((c) => (c as unknown as [Keyframe[], { id: string }])[1].id === 'ds-motion:flip') as unknown as [Keyframe[]];
      // From the old row, 32px above.
      expect(String(frames[0]?.transform)).toMatch(/translate\(0px, -32px\)/);
    } finally {
      proto.animate = original;
      rect.mockRestore();
    }
  });
});
