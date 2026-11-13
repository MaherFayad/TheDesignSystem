// @vitest-environment jsdom
// The selection marker family (order 1.23): the exit copy of a popup and the
// press point. Moved with the code from
// packages/react/src/components/ListBox/ListBox.motion.test.tsx (order 1.29);
// the marker on a rendered ListBox keeps its test there.
import { describe, expect, it, vi } from 'vitest';
import { exitGhost, setPressPoint } from './selection-marker';

describe('selection marker helpers', () => {
  it('review B6: a closed popup leaves an inert copy that plays the exit', () => {
    const layer = document.createElement('div');
    layer.setAttribute('data-ds', 'theme');
    const wrapper = document.createElement('div');
    const node = document.createElement('div');
    node.id = 'menu-1';
    node.setAttribute('role', 'menu');
    node.setAttribute('data-state', 'closed');
    wrapper.append(node);
    layer.append(wrapper);
    document.body.append(layer);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
    const a = proto.animate;
    const g = proto.getAnimations;
    proto.animate = () => ({}) as Animation;
    proto.getAnimations = () => [{ finished: new Promise(() => {}) } as unknown as Animation];
    const rect = vi.spyOn(node, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 120, 80));
    try {
      exitGhost(node);
      const copies = document.querySelectorAll("[role='menu'][inert]");
      expect(copies).toHaveLength(1);
      expect(copies[0]?.getAttribute('aria-hidden')).toBe('true');
      expect(copies[0]?.id).toBe('');
      // An open menu (a page that unmounts) makes no copy.
      node.setAttribute('data-state', 'open');
      exitGhost(node);
      expect(document.querySelectorAll("[role='menu'][inert]")).toHaveLength(1);
    } finally {
      rect.mockRestore();
      proto.animate = a;
      proto.getAnimations = g;
      for (const el of document.querySelectorAll("[data-ds='theme']")) el.remove();
    }
  });

  it('platform hook: a press writes where it landed', () => {
    const el = document.createElement('span');
    document.body.append(el);
    const rect = vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 100, 40));
    try {
      setPressPoint(el, 'chip', 30, 30);
      expect(el.style.getPropertyValue('--_chip-press-x')).toBe('20px');
      expect(el.style.getPropertyValue('--_chip-press-y')).toBe('10px');
    } finally {
      rect.mockRestore();
      el.remove();
    }
  });
});
