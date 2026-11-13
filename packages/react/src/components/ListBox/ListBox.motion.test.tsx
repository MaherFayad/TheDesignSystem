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

  it('highlight-marker: one aria-hidden marker in the list, placed at the lit row and moved by transform', async () => {
    const rect = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      if (this.matches('[data-ds="list-box"]')) return new DOMRect(0, 0, 200, 64);
      const i = Array.from(this.closest('[data-ds="list-box"]')?.querySelectorAll('[data-part="option"]') ?? []).indexOf(this);
      return new DOMRect(0, Math.max(0, i) * 32, 200, 32);
    });
    try {
      const { container, rerender } = render(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} virtualFocus highlightedValue="a" />
        </Theme>,
      );
      // No layer per row any more.
      expect(container.querySelectorAll("[data-part='option'] > span:not([data-part])")).toHaveLength(0);
      const marker = container.querySelector<HTMLElement>("[data-ds='list-box'] > [data-part='highlight']");
      expect(marker).not.toBeNull();
      expect(marker?.getAttribute('aria-hidden')).toBe('true');
      expect(marker?.parentElement?.lastElementChild).toBe(marker);
      // First show: at the lit row, shown.
      expect(marker?.style.transform).toMatch(/^translate\(0px(, 0px)?\)$/);
      expect(marker?.style.opacity).toBe('1');
      rerender(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} virtualFocus highlightedValue="b" />
        </Theme>,
      );
      await waitFor(() => expect(marker?.style.transform).toBe('translate(0px, 32px)'));
      expect(marker?.style.blockSize).toBe('32px');
      rerender(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} virtualFocus highlightedValue={null} />
        </Theme>,
      );
      await waitFor(() => expect(marker?.style.opacity).toBe('0'));
    } finally {
      rect.mockRestore();
    }
  });

  it('check-draw-pick: choosing an option draws its check, a first paint does not', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
    const proto = Element.prototype as unknown as { animate?: unknown };
    const original = proto.animate;
    proto.animate = animate;
    try {
      const { rerender } = render(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} value="a" />
        </Theme>,
      );
      const ids = () => animate.mock.calls.map((c) => (c as unknown as [Keyframe[], { id: string }])[1].id);
      expect(ids()).not.toContain('ds-motion:check-draw-pick');
      rerender(
        <Theme style="desk">
          <ListBox aria-label="Fruit" items={items} value="b" />
        </Theme>,
      );
      expect(ids()).toContain('ds-motion:check-draw-pick');
    } finally {
      proto.animate = original;
    }
  });

  it('review B6: the CSS exit of a closed menu only runs on the inert copy', () => {
    for (const name of ['DropdownMenu', 'Combobox', 'MultiSelect', 'TagField']) {
      const css = read(name);
      expect(css, name).toMatch(/\[data-state='closed'\]\[inert\] \{\s*animation:/);
      expect(css, name).not.toMatch(/\[data-state='closed'\] \{\s*animation:/);
    }
    // The copy itself is tested with the helper (packages/motion/src/helpers/selection-marker.test.ts).
  });

  it('review B2 and B3: the menu lean and the private durations are zeroed under both reduced motion forms', () => {
    const css = read('DropdownMenu');
    const media = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(media).toMatch(/--_menu-nudge: 0px;[^}]*--_menu-nudge-duration-in: 0s;/);
    expect(css).toMatch(/:root\[data-motion='reduce'\] :is\(\[data-ds='dropdown-menu'\], \[data-ds='context-menu'\]\) \{\s*--_menu-nudge: 0px;/);
    expect(css).toMatch(/transition: transform var\(--_menu-nudge-duration-in\)/);
  });
});
