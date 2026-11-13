import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import TabsDemo from './Tabs.demo';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from './index';

function Example(props: Partial<Parameters<typeof Tabs>[0]> & { disabledB?: boolean }) {
  const { disabledB, ...rest } = props;
  return (
    <Tabs defaultValue="a" {...rest}>
      <TabsList aria-label="Board settings">
        <TabsTrigger value="a" start="settings">
          General
        </TabsTrigger>
        <TabsTrigger value="b" disabled={disabledB}>
          Members
        </TabsTrigger>
        <TabsTrigger value="c" count={12}>
          Comments
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="a">General panel</TabsPanel>
      <TabsPanel value="b">Members panel</TabsPanel>
      <TabsPanel value="c">Comments panel</TabsPanel>
    </Tabs>
  );
}

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="tabs"]');
  if (!el) throw new Error('no tabs rendered');
  return el;
}

describe('Tabs', () => {
  it('renders the anatomy with the default axes', () => {
    const { container } = render(<Example />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('data-part')).toBe(false);
    const list = screen.getByRole('tablist', { name: 'Board settings' });
    expect(list.getAttribute('data-part')).toBe('list');
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    for (const t of tabs) expect(t.getAttribute('data-part')).toBe('trigger');
    expect(tabs[0]?.getAttribute('data-state')).toBe('active');
    expect(tabs[1]?.getAttribute('data-state')).toBe('inactive');
    expect(screen.getByRole('tabpanel').getAttribute('data-part')).toBe('panel');
  });

  it('puts the indicator in the active trigger only, before the label', () => {
    const { container } = render(<Example />);
    const indicators = container.querySelectorAll('[data-part="indicator"]');
    expect(indicators).toHaveLength(1);
    const active = screen.getAllByRole('tab')[0];
    expect(active?.firstElementChild?.getAttribute('data-part')).toBe('indicator');
    expect(active?.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    const parts = Array.from(active?.children ?? []).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['indicator', 'start', 'label']);
  });

  it('renders the count after the label and includes it in the name', () => {
    render(<Example />);
    const tab = screen.getByRole('tab', { name: 'Comments 12' });
    expect(tab.lastElementChild?.getAttribute('data-part')).toBe('count');
  });

  it('sets the axes from props', () => {
    const { container } = render(<Example size="sm" emphasis="soft" orientation="vertical" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical');
  });

  it('activates a tab on click and calls onValueChange', async () => {
    const onValueChange = vi.fn();
    render(<Example onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Members' }));
    expect(onValueChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('tabpanel').textContent).toBe('Members panel');
    expect(screen.getByRole('tab', { name: 'Members' }).querySelector('[data-part="indicator"]')).not.toBeNull();
  });

  it('moves and activates with the arrow keys, Home and End (automatic)', async () => {
    render(<Example />);
    const [a, b, c] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(b);
    expect(b?.getAttribute('data-state')).toBe('active');
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(c);
    expect(c?.getAttribute('data-state')).toBe('active');
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(a);
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(c);
  });

  it('reverses the arrow keys in right to left layouts', async () => {
    render(
      <Theme dir="rtl" lang="ar">
        <Example />
      </Theme>,
    );
    const [a, b] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(b);
  });

  it('only moves focus with manual activation; Enter shows the panel', async () => {
    render(<Example activationMode="manual" />);
    const [a, b] = screen.getAllByRole('tab');
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(b);
    expect(b?.getAttribute('data-state')).toBe('inactive');
    await userEvent.keyboard('{Enter}');
    expect(b?.getAttribute('data-state')).toBe('active');
  });

  it('skips a disabled tab and marks it', async () => {
    render(<Example disabledB />);
    const [a, b, c] = screen.getAllByRole('tab');
    expect(b?.hasAttribute('data-disabled')).toBe(true);
    a?.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(c);
  });

  it('works controlled', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Example value="a" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
    expect(onValueChange).toHaveBeenCalledWith('c');
    expect(screen.getByRole('tabpanel').textContent).toBe('General panel');
    rerender(<Example value="c" onValueChange={onValueChange} />);
    expect(screen.getByRole('tabpanel').textContent).toBe('Comments panel');
  });

  it('Tab moves from the list to the panel', async () => {
    render(<Example />);
    screen.getAllByRole('tab')[0]?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByRole('tabpanel'));
  });

  it('throws outside Tabs', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<TabsList aria-label="x" />)).toThrow(/inside Tabs/);
    vi.restoreAllMocks();
  });

  it('scrolls a default tab past the visible part into view inside the list on load', async () => {
    const rect = (left: number, width: number) => ({ left, right: left + width, width, top: 0, bottom: 32, height: 32, x: left, y: 0, toJSON: () => ({}) });
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') === 'tablist') return rect(0, 300) as DOMRect;
      if (this.getAttribute('role') === 'tab' && this.getAttribute('data-state') === 'active') return rect(680, 60) as DOMRect;
      return rect(0, 0) as DOMRect;
    });
    // Order 1.29 (B14): only a list that overflows is scrolled, so this one holds 740px of tabs in 300.
    const size = (name: 'scrollWidth' | 'clientWidth', px: number) =>
      vi.spyOn(HTMLElement.prototype, name, 'get').mockImplementation(function (this: HTMLElement) {
        return this.getAttribute('role') === 'tablist' ? px : 0;
      });
    const sizes = [size('scrollWidth', 740), size('clientWidth', 300)];
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;
    try {
      render(<Example defaultValue="c" />);
      // Order 1.29: the list reads and scrolls in the frame job (inFrame), a microtask after the commit.
      await Promise.resolve();
      const list = screen.getByRole('tablist');
      expect(list.scrollLeft).toBe(440);
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
      spy.mockRestore();
      for (const s of sizes) s.mockRestore();
    }
  });

  it('order 1.29 B14: a list that fits reads no box and sets no scroll offset for the keep in view check', async () => {
    render(<Example />);
    await Promise.resolve();
    const list = screen.getByRole('tablist');
    const spy = vi.spyOn(list, 'getBoundingClientRect');
    const scroll = vi.spyOn(list, 'scrollLeft', 'set');
    try {
      await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
      // The ink measures the list twice as its anchor (planFollow, planInk); the keep in view check adds none (3 before).
      const reads = spy.mock.calls.length;
      expect(scroll).not.toHaveBeenCalled();
      expect(reads).toBe(2);
    } finally {
      spy.mockRestore();
      scroll.mockRestore();
    }
  });

  it('gives the soft pill a muted text border, so the active tab has a 3:1 edge', () => {
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Tabs.css'), 'utf8');
    const soft = /\[data-ds='tabs'\]\[data-emphasis='soft'\] \{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(soft).toMatch(/--_tabs-indicator-border-color: var\(--ds-color-text-muted\)/);
    expect(soft).toMatch(/--_tabs-indicator-border-width: var\(--ds-border-width-default\)/);
    expect(css).toMatch(/border: var\(--_tabs-indicator-border-width\) solid var\(--_tabs-indicator-border-color\)/);
  });

  describe('tab-slide', () => {
    /** Triggers 100px apart, 80 by 32; the indicator is the 2px line at the block end of its trigger. */
    function boxes() {
      return vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
        const trigger = this.closest('[data-part="trigger"]');
        if (!trigger) return new DOMRect(0, 0, 400, 40);
        const i = Array.from(trigger.parentElement?.children ?? []).indexOf(trigger);
        return this === trigger ? new DOMRect(i * 100, 0, 80, 32) : new DOMRect(i * 100, 30, 80, 2);
      });
    }

    function withAnimate(run: (animate: ReturnType<typeof vi.fn>) => Promise<void>) {
      const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
      const proto = HTMLElement.prototype as unknown as { animate?: unknown };
      const original = proto.animate;
      proto.animate = animate;
      return run(animate).finally(() => {
        proto.animate = original;
      });
    }

    it('slides the indicator from the old tab with the shared pill, stretching on the way, a transform only', () =>
      withAnimate(async (animate) => {
        const rects = boxes();
        try {
          render(<Example />);
          expect(animate).not.toHaveBeenCalled();
          await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
          const slides = animate.mock.calls.filter((c) => (c as unknown as [Keyframe[], KeyframeAnimationOptions])[1].id === 'ds-motion:indicator-slide');
          expect(slides).toHaveLength(1);
          const [frames] = slides[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
          expect(frames[0]?.transform).toBe('translate(-200px, 0px) scale(1, 1)');
          expect(frames[1]?.transform).toMatch(/^translate\(-100px, 0px\) scale\(1\.\d+, 1\)$/);
          expect(frames.at(-1)?.transform).toBe('none');
          for (const f of frames) expect(Object.keys(f).filter((k) => k !== 'offset')).toEqual(['transform']);
          // Round 3: the labels no longer dip and pop; the ink crosses instead (ink.test.ts).
          const answers = animate.mock.calls.filter((c) => (c as unknown as [Keyframe[], KeyframeAnimationOptions])[1].id === 'ds-motion:indicator-answer');
          expect(answers).toHaveLength(0);
        } finally {
          rects.mockRestore();
        }
      }));

    it('jumps under reduced motion', () =>
      withAnimate(async (animate) => {
        const rects = boxes();
        const original = window.matchMedia;
        window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        try {
          render(<Example />);
          await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
          expect(screen.getByRole('tab', { name: 'Comments 12' }).getAttribute('data-state')).toBe('active');
          expect(animate).not.toHaveBeenCalled();
        } finally {
          window.matchMedia = original;
          rects.mockRestore();
        }
      }));
  });

  it('order 1.29 B14: a switch forces no Presence style read and swaps the panels in one commit', async () => {
    // Radix Presence keeps the CSSStyleDeclaration of each panel and reads its
    // animationName when the panel's presence changes: a forced restyle of the
    // whole stage right after the commit, then a second commit that dirties it again.
    const real = window.getComputedStyle.bind(window);
    let reads = 0;
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
      const styles = real(el, pseudo);
      if (!(el as HTMLElement).matches?.('[data-part="panel"]')) return styles;
      return new Proxy(styles, {
        get(target, key) {
          if (key === 'animationName') reads++;
          const v = Reflect.get(target, key, target);
          return typeof v === 'function' ? v.bind(target) : v;
        },
      });
    });
    try {
      const { container } = render(<Example />);
      const panels = () => Array.from(container.querySelectorAll<HTMLElement>('[data-part="panel"]'));
      expect(panels().map((p) => p.hidden)).toEqual([false, true, true]);
      reads = 0;
      await userEvent.click(screen.getByRole('tab', { name: 'Comments 12' }));
      expect(screen.getByRole('tabpanel').textContent).toBe('Comments panel');
      expect(reads).toBe(0);
      // The same DOM as before: every panel stays, the inactive ones hidden and empty.
      expect(panels().map((p) => [p.hidden, p.getAttribute('data-state'), p.textContent])).toEqual([
        [true, 'inactive', ''],
        [true, 'inactive', ''],
        [false, 'active', 'Comments panel'],
      ]);
    } finally {
      spy.mockRestore();
    }
  });

  it('forceMount keeps every panel rendered, as Radix does', () => {
    const { container } = render(
      <Tabs defaultValue="a">
        <TabsList aria-label="Kept">
          <TabsTrigger value="a">One</TabsTrigger>
          <TabsTrigger value="b">Two</TabsTrigger>
        </TabsList>
        <TabsPanel value="a">First</TabsPanel>
        <TabsPanel value="b" forceMount>
          Second
        </TabsPanel>
      </Tabs>,
    );
    const panels = Array.from(container.querySelectorAll<HTMLElement>('[data-part="panel"]'));
    expect(panels.map((p) => [p.hidden, p.textContent, p.getAttribute('data-state')])).toEqual([
      [false, 'First', 'active'],
      [false, 'Second', 'inactive'],
    ]);
  });

  it('renders the demo with every case', () => {
    const { container } = render(<TabsDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});
