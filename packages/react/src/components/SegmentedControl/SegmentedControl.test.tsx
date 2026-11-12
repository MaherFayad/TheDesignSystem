import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import SegmentedControlDemo from './SegmentedControl.demo';
import { SegmentedControl, SegmentedControlItem } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="segmented-control"]');
  if (!el) throw new Error('no segmented control rendered');
  return el;
}

function Range(props: { onValueChange?: (v: string) => void; value?: string }) {
  return (
    <SegmentedControl aria-label="Calendar range" defaultValue={props.value === undefined ? 'day' : undefined} {...props}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </SegmentedControl>
  );
}

describe('SegmentedControl', () => {
  it('renders a radiogroup of radio items with the anatomy and default attributes', () => {
    const { container } = render(<Range />);
    const el = root(container);
    // Radix renders type single as a radiogroup with radio items and aria-checked.
    expect(screen.getByRole('radiogroup', { name: 'Calendar range' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('data-full-width')).toBe(false);
    const indicator = el.querySelector('[data-part="indicator"]');
    expect(indicator?.getAttribute('aria-hidden')).toBe('true');
    expect(el.firstElementChild).toBe(indicator);
    const items = screen.getAllByRole('radio');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.getAttribute('data-ds')).toBe('toggle-button');
      expect(item.getAttribute('data-part')).toBe('item');
      expect(item.getAttribute('data-size')).toBe('md');
      expect(item.getAttribute('data-emphasis')).toBe('ghost');
      expect(item.hasAttribute('aria-pressed')).toBe(false);
    }
    expect(items.map((i) => i.getAttribute('data-state'))).toEqual(['on', 'off', 'off']);
    expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
  });

  it('selects on click and never goes empty', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Range onValueChange={onValueChange} />);
    const day = screen.getByRole('radio', { name: 'Day' });
    const week = screen.getByRole('radio', { name: 'Week' });
    await user.click(week);
    expect(week.getAttribute('data-state')).toBe('on');
    expect(day.getAttribute('data-state')).toBe('off');
    await user.click(week);
    expect(week.getAttribute('data-state')).toBe('on');
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(['week']);
  });

  it('selection follows focus: the arrows select, Home and End too, and wrap', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Range onValueChange={onValueChange} />);
    const [day, week, month] = screen.getAllByRole('radio');
    await user.tab();
    expect(document.activeElement).toBe(day);
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(week);
    expect(week?.getAttribute('aria-checked')).toBe('true');
    await user.keyboard('{End}');
    expect(month?.getAttribute('data-state')).toBe('on');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(day);
    await user.keyboard('{ArrowLeft}{Home}');
    expect(day?.getAttribute('data-state')).toBe('on');
    // Space on the selected item keeps it selected.
    await user.keyboard(' ');
    expect(day?.getAttribute('data-state')).toBe('on');
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(['week', 'month', 'day', 'month', 'day']);
    await user.tab();
    expect(document.activeElement).toBe(document.body);
  });

  it('Tab enters on the selected item', async () => {
    const user = userEvent.setup();
    render(
      <SegmentedControl aria-label="Calendar range" defaultValue="month">
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
      </SegmentedControl>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Month' }));
  });

  it('reverses the arrows in RTL', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Range />
      </Theme>,
    );
    const [, week] = screen.getAllByRole('radio');
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(week);
    expect(week?.getAttribute('data-state')).toBe('on');
  });

  it('follows a controlled value and only asks for changes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<Range value="day" onValueChange={onValueChange} />);
    await user.click(screen.getByRole('radio', { name: 'Month' }));
    expect(onValueChange).toHaveBeenLastCalledWith('month');
    expect(screen.getByRole('radio', { name: 'Day' }).getAttribute('data-state')).toBe('on');
    rerender(<Range value="month" onValueChange={onValueChange} />);
    expect(screen.getByRole('radio', { name: 'Month' }).getAttribute('data-state')).toBe('on');
  });

  it('a disabled item keeps focus in the arrow order and is never selected', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl aria-label="Calendar range" defaultValue="day" onValueChange={onValueChange}>
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week" disabled>
          Week
        </SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
      </SegmentedControl>,
    );
    const week = screen.getByRole('radio', { name: 'Week' });
    expect(week.getAttribute('aria-disabled')).toBe('true');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(week);
    expect(week.getAttribute('data-state')).toBe('off');
    await user.click(week);
    await user.keyboard(' ');
    expect(week.getAttribute('data-state')).toBe('off');
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Month' }));
    expect(onValueChange.mock.calls.map((c) => c[0])).toEqual(['month']);
  });

  it('disabled on the root marks the root and every item, and stays reachable by Tab', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SegmentedControl aria-label="Calendar range" defaultValue="day" disabled>
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(root(container).getAttribute('data-disabled')).toBe('');
    for (const item of screen.getAllByRole('radio')) expect(item.getAttribute('aria-disabled')).toBe('true');
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Day' }));
  });

  it('sets size, shape and full width; items take the size', () => {
    const { container } = render(
      <SegmentedControl aria-label="Board view" size="lg" shape="pill" fullWidth defaultValue="grid">
        <SegmentedControlItem value="list" icon="list" label="List view" />
        <SegmentedControlItem value="grid" icon="grid" label="Grid view" />
      </SegmentedControl>,
    );
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-full-width')).toBe('');
    const grid = screen.getByRole('radio', { name: 'Grid view' });
    expect(grid.getAttribute('data-size')).toBe('lg');
    expect(Array.from(grid.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon']);
  });

  it('places the indicator under the selected item and slides it with tab-indicator on a change', async () => {
    const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() }) as unknown as Animation);
    const proto = HTMLElement.prototype as unknown as { animate?: unknown; getAnimations?: unknown };
    const saved = { animate: proto.animate, getAnimations: proto.getAnimations, rect: HTMLElement.prototype.getBoundingClientRect };
    proto.animate = animate;
    proto.getAnimations = () => [];
    // A fake layout: each item is 60 by 26 px, side by side from x 3.
    HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
      const part = this.getAttribute('data-part');
      if (part === 'item') {
        const i = Array.from(this.parentElement?.querySelectorAll('[data-part="item"]') ?? []).indexOf(this);
        return DOMRect.fromRect({ x: 3 + i * 60, y: 3, width: 60, height: 26 });
      }
      if (part === 'indicator') {
        const s = this.style;
        const x = Number.parseFloat(s.getPropertyValue('--_segmented-control-indicator-start')) || 0;
        return DOMRect.fromRect({ x: x + 1, y: 3, width: 60, height: 26 });
      }
      return DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 34 });
    };
    try {
      const user = userEvent.setup();
      const { container } = render(<Range />);
      const indicator = root(container).querySelector<HTMLElement>('[data-part="indicator"]');
      expect(indicator?.hidden).toBe(false);
      expect(indicator?.style.getPropertyValue('--_segmented-control-indicator-inline-size')).toBe('60px');
      expect(animate).not.toHaveBeenCalled();
      await user.click(screen.getByRole('radio', { name: 'Month' }));
      await act(async () => {});
      expect(indicator?.style.getPropertyValue('--_segmented-control-indicator-start')).toBe('123px');
      expect(animate).toHaveBeenCalledTimes(1);
      const [frames, options] = animate.mock.calls[0] as unknown as [Keyframe[], KeyframeAnimationOptions];
      expect(options.id).toBe('ds-motion:tab-indicator');
      expect(frames.flatMap((f) => Object.keys(f)).every((k) => k === 'transform')).toBe(true);
    } finally {
      proto.animate = saved.animate;
      proto.getAnimations = saved.getAnimations;
      HTMLElement.prototype.getBoundingClientRect = saved.rect;
    }
  });

  it('passes ref, className and id to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <SegmentedControl aria-label="Calendar range" defaultValue="day" ref={ref} className="x" id="range">
        <SegmentedControlItem value="day">Day</SegmentedControlItem>
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(ref.current).toBe(root(container));
    expect(ref.current?.className).toBe('x');
    expect(ref.current?.id).toBe('range');
  });

  it('renders the demo with every case that applies and no native title', () => {
    const { container } = render(<SegmentedControlDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
    expect(container.querySelector('[title]')).toBeNull();
  });
});
