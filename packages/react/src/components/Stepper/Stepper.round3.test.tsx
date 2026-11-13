// Order 1.23, round 3: the check a done step draws (Stepper) and the panel
// and labels a Sidebar uncovers when it expands. jsdom has no Web
// Animations API, so elements get a mock `animate` that records its calls.
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Sidebar, SidebarGroup, SidebarItem } from '../Sidebar';
import { Stepper } from './index';

type Call = [Keyframe[], KeyframeAnimationOptions & { id?: string }];
let animate: ReturnType<typeof vi.fn>;
const saved: [object, unknown][] = [];

beforeEach(() => {
  animate = vi.fn(
    () =>
      ({
        playState: 'running',
        finished: Promise.resolve(),
        effect: { getTiming: () => ({ duration: 200, delay: 0 }), getKeyframes: () => [] },
        cancel() {},
        currentTime: 0,
      }) as unknown as Animation,
  );
  for (const proto of [HTMLElement.prototype, SVGElement.prototype]) {
    saved.push([proto, (proto as unknown as { animate?: unknown }).animate]);
    (proto as unknown as { animate?: unknown }).animate = animate;
  }
});

afterEach(() => {
  for (const [proto, fn] of saved.splice(0)) (proto as { animate?: unknown }).animate = fn;
});

const calls = () => animate.mock.calls as unknown as Call[];
const desk = (node: ReactNode) => <Theme style="desk">{node}</Theme>;
const steps = [{ title: 'Account' }, { title: 'Address' }, { title: 'Payment' }];

describe('stepper-travel, round 3', () => {
  it('draws the check of a step that turns complete, from its end, with stroke-dashoffset', () => {
    const { rerender } = render(desk(<Stepper aria-label="Checkout" steps={steps} current={0} />));
    expect(calls().filter((c) => c[1].id === 'ds-motion:stepper-check')).toHaveLength(0);
    rerender(desk(<Stepper aria-label="Checkout" steps={steps} current={1} />));
    const draws = calls().filter((c) => c[1].id === 'ds-motion:stepper-check');
    expect(draws).toHaveLength(1);
    const [frames] = draws[0] as Call;
    expect(frames[0]?.strokeDashoffset).toBe(-24);
    expect(frames.at(-1)?.strokeDashoffset).toBe(0);
    // Going back draws nothing.
    rerender(desk(<Stepper aria-label="Checkout" steps={steps} current={0} />));
    expect(calls().filter((c) => c[1].id === 'ds-motion:stepper-check')).toHaveLength(1);
  });
});

describe('sidebar-collapse, round 3', () => {
  function Example({ collapsed }: { collapsed: boolean }) {
    return desk(
      <Sidebar label="Main" collapsed={collapsed} onCollapsedChange={() => undefined}>
        <SidebarGroup label="Work">
          <SidebarItem href="#a" start="home">
            Overview
          </SidebarItem>
          <SidebarItem href="#b" start="grid">
            Boards
          </SidebarItem>
        </SidebarGroup>
      </Sidebar>,
    );
  }

  it('wipes the labels in with clip-path when it expands, a stagger step apart', () => {
    const { rerender } = render(<Example collapsed />);
    rerender(<Example collapsed={false} />);
    const wipes = calls().filter((c) => c[1].id === 'ds-motion:sidebar-labels');
    expect(wipes.length).toBeGreaterThanOrEqual(2);
    for (const [frames] of wipes) {
      expect(String(frames[0]?.clipPath)).toMatch(/^inset\(/);
      expect(frames.at(-1)?.clipPath).toBe('inset(0)');
    }
    const delays = wipes.map((c) => Number(c[1].delay));
    expect(delays[1]).toBeGreaterThanOrEqual(delays[0] ?? 0);
  });
});
