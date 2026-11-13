// Order 1.22, feedback family: the interactions played from component code.
// jsdom has no Web Animations API, so each test gives elements a mock
// `animate` that records its calls and resolves at once, and runs the
// animation frame callbacks by hand.
import { act, fireEvent, render } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Avatar } from '../Avatar';
import { AvatarGroup } from '../AvatarGroup';
import { Badge } from '../Badge';
import { Card, CardLink, CardTitle } from '../Card';
import { Kbd } from '../Kbd';
import { Meter } from '../Meter';
import { NotificationCenter, type NotificationItem } from '../NotificationCenter';
import { ProgressBar } from '../ProgressBar';
import { ProgressCircle } from '../ProgressCircle';
import { Skeleton } from '../Skeleton';
import { Alert } from './index';

type Call = [Keyframe[], KeyframeAnimationOptions & { id?: string }];
let animate: ReturnType<typeof vi.fn>;
let frames: FrameRequestCallback[];
const saved: [object, unknown][] = [];

beforeEach(() => {
  animate = vi.fn(function (this: Element) {
    let cancelled = false;
    return {
      id: '',
      playState: 'running',
      finished: Promise.resolve(),
      effect: { getTiming: () => ({ duration: 200, delay: 0 }) },
      cancel() {
        cancelled = !cancelled;
      },
      pause() {},
      play() {},
      currentTime: 0,
    } as unknown as Animation;
  });
  for (const proto of [HTMLElement.prototype, SVGElement.prototype]) {
    saved.push([proto, (proto as unknown as { animate?: unknown }).animate]);
    (proto as unknown as { animate?: unknown }).animate = animate;
  }
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
});

afterEach(() => {
  for (const [proto, fn] of saved.splice(0)) (proto as { animate?: unknown }).animate = fn;
  vi.unstubAllGlobals();
});

const ids = () => (animate.mock.calls as unknown as Call[]).map((c) => String(c[1].id));
/** Desk plays every interaction in full (Studio plays pop and number-roll reduced). */
const desk = (node: ReactNode) => <Theme style="desk">{node}</Theme>;
const flush = () => act(() => frames.splice(0).forEach((cb) => cb(0)));

describe('alert-dismiss', () => {
  function Dismissible() {
    const [shown, setShown] = useState(true);
    return (
      <div>
        {shown && <Alert title="Could not sync 3 files" onClose={() => setShown(false)} />}
        <p>Next</p>
      </div>
    );
  }

  it('closes at once and shrinks a decorative ghost away before the next paint', async () => {
    const { container } = render(<Dismissible />);
    const alert = container.querySelector('[data-ds="alert"]') as HTMLElement;
    alert.getBoundingClientRect = () => ({ x: 0, y: 0, width: 300, height: 60, top: 0, left: 0, right: 300, bottom: 60, toJSON() {} }) as DOMRect;
    fireEvent.click(alert.querySelector('[data-part="close"]') as HTMLElement);
    // The removal never waits.
    expect(container.querySelector('[data-ds="alert"]:not([inert])')).toBeNull();
    flush();
    const ghost = container.querySelector('[data-ds="alert"][inert]');
    expect(ghost?.getAttribute('aria-hidden')).toBe('true');
    expect(ids()).toContain('ds-motion:flip-exit');
    await act(async () => undefined);
    expect(container.querySelector('[data-ds="alert"]')).toBeNull();
  });

  it('plays nothing when the consumer keeps the alert', () => {
    const onClose = vi.fn();
    const { container } = render(<Alert title="Kept" onClose={onClose} />);
    fireEvent.click(container.querySelector('[data-part="close"]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
    flush();
    expect(container.querySelectorAll('[data-ds="alert"]')).toHaveLength(1);
    expect(animate).not.toHaveBeenCalled();
  });
});

describe('skeleton-swap', () => {
  it('fades a ghost of the skeleton over the content that replaced it', async () => {
    function Swap({ loading }: { loading: boolean }) {
      return <div>{loading ? <Skeleton width={120} /> : <p>Loaded</p>}</div>;
    }
    const { container, rerender } = render(<Swap loading />);
    const sk = container.querySelector('[data-ds="skeleton"]') as HTMLElement;
    sk.getBoundingClientRect = () => ({ x: 0, y: 0, width: 120, height: 16, top: 0, left: 0, right: 120, bottom: 16, toJSON() {} }) as DOMRect;
    rerender(<Swap loading={false} />);
    expect(container.textContent).toBe('Loaded');
    flush();
    expect(container.querySelector('[data-ds="skeleton"][inert]')).not.toBeNull();
    // Round 3: the ghost is wiped toward the inline end.
    expect(ids()).toContain('ds-motion:skeleton-wipe');
    await act(async () => undefined);
    expect(container.querySelector('[data-ds="skeleton"]')).toBeNull();
  });
});

describe('badge-count', () => {
  it('rolls the digits and pops when the count changes, not on the first paint', () => {
    const { rerender } = render(desk(<Badge count={3} />));
    expect(animate).not.toHaveBeenCalled();
    rerender(desk(<Badge count={4} />));
    expect(ids()).toEqual(expect.arrayContaining(['ds-motion:digit-roll', 'ds-motion:pop-mark']));
  });

  it('only pops a dot', () => {
    const { rerender } = render(desk(<Badge dot count={3} />));
    rerender(desk(<Badge dot count={5} />));
    expect(ids()).toEqual(['ds-motion:pop-mark']);
  });
});

describe('avatar-group-change', () => {
  const group = (names: string[], max = 3) => desk(
    <AvatarGroup label="People" max={max}>
      {names.map((n) => (
        <Avatar key={n} name={n} />
      ))}
    </AvatarGroup>,
  );

  it('pops a new avatar in, and rolls the overflow count', () => {
    const { rerender } = render(group(['Sara Ali', 'Omar Haddad']));
    expect(animate).not.toHaveBeenCalled();
    rerender(group(['Sara Ali', 'Omar Haddad', 'Lina Saad']));
    expect(ids()).toContain('ds-motion:flip');
    animate.mockClear();
    rerender(group(['Sara Ali', 'Omar Haddad', 'Lina Saad', 'Nora Fahad', 'Hadi Nasser']));
    animate.mockClear();
    rerender(group(['Sara Ali', 'Omar Haddad', 'Lina Saad', 'Nora Fahad', 'Hadi Nasser', 'Ali Kamal']));
    expect(ids()).toEqual(expect.arrayContaining(['ds-motion:digit-roll', 'ds-motion:pop-mark']));
  });
});

describe('notification-change', () => {
  const now = new Date('2026-11-12T10:00:00Z');
  const item = (id: string, unread = true): NotificationItem => ({ id, title: `Comment ${id}`, time: now, unread });

  it('rolls only the number of the unread count and keeps the words whole', async () => {
    const { rerender, container } = render(desk(<NotificationCenter now={now} items={[item('a')]} />));
    rerender(desk(<NotificationCenter now={now} items={[item('b'), item('a')]} />));
    await act(async () => undefined);
    expect(ids()).toEqual(expect.arrayContaining(['ds-motion:flip', 'ds-motion:digit-roll']));
    const drawn = container.querySelector('[data-part="count"] > [aria-hidden="true"]');
    expect(drawn?.querySelector('span')?.textContent?.startsWith('2')).toBe(true);
    expect(drawn?.textContent).toBe('2 unread');
  });
});

describe('progress-celebrate', () => {
  it('pops the bar once per completion, never on a first paint at max', () => {
    const { rerender } = render(desk(<ProgressBar label="Upload" value={100} />));
    expect(ids()).not.toContain('ds-motion:pop-mark');
    rerender(desk(<ProgressBar label="Upload" value={40} />));
    rerender(desk(<ProgressBar label="Upload" value={100} />));
    expect(ids().filter((i) => i === 'ds-motion:pop-mark')).toHaveLength(1);
    rerender(desk(<ProgressBar label="Upload" value={100} max={100} />));
    expect(ids().filter((i) => i === 'ds-motion:pop-mark')).toHaveLength(1);
  });

  it('draws the arc with stroke-dashoffset (CSS, an SVG arc part) and rolls its value', () => {
    const { container, rerender } = render(desk(<ProgressCircle label="Upload" value={20} />));
    const arc = container.querySelector('[data-part="indicator"] > svg[data-part="arc"]');
    expect(arc?.getAttribute('aria-hidden')).toBe('true');
    expect(arc?.querySelector('circle')?.getAttribute('pathLength')).toBe('100');
    rerender(desk(<ProgressCircle label="Upload" value={45} />));
    expect((container.querySelector('[data-part="indicator"]') as HTMLElement).style.getPropertyValue('--_progress-circle-fraction')).toBe('0.45');
    // The turn of round 2 is gone: the stroke draws.
    expect(ids()).not.toContain('ds-motion:progress-sweep');
    expect(ids()).toContain('ds-motion:digit-roll');
  });

  it('beats once with a halo when it completes (round 3)', () => {
    const { rerender } = render(desk(<ProgressCircle label="Upload" value={60} />));
    rerender(desk(<ProgressCircle label="Upload" value={100} />));
    expect(ids().filter((id) => id === 'ds-motion:progress-halo')).toHaveLength(1);
    rerender(desk(<ProgressCircle label="Upload" value={100} />));
    expect(ids().filter((id) => id === 'ds-motion:progress-halo')).toHaveLength(1);
  });
});

describe('meter-fill', () => {
  it('holds the fill empty until the meter is seen, then fills it once on the reveal timing', () => {
    let seen: IntersectionObserverCallback = () => undefined;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          seen = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(desk(<Meter label="Storage" value={40} />));
    const fill = container.querySelector('[data-part="indicator"]') as HTMLElement;
    // jsdom draws nothing, so the meter counts as off screen: held, and no animation waits.
    expect(fill.style.transform).toBe('scaleX(0)');
    expect(animate).not.toHaveBeenCalled();
    act(() => seen([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(fill.style.transform).toBe('');
    // Round 3: the reveal reads the meter's private timing, which defaults to duration.reveal.
    expect(fill.style.transition).toContain('--_meter-reveal-duration');
  });
});

describe('avatar-status', () => {
  it('pops and pulses three times when the status changes, never on the first paint', () => {
    const { rerender } = render(desk(<Avatar name="Sara Ali" status="warning" />));
    expect(animate).not.toHaveBeenCalled();
    rerender(desk(<Avatar name="Sara Ali" status="success" />));
    const pulse = (animate.mock.calls as unknown as Call[]).find((c) => c[1].id === 'ds-motion:avatar-status-pulse');
    // The loop count comes from the live duration so every loop ends before five seconds (3 at 1.4s).
    expect(Number(pulse?.[1].duration) * Number(pulse?.[1].iterations)).toBeLessThan(5000);
    expect(Number(pulse?.[1].iterations)).toBeGreaterThanOrEqual(1);
    expect(ids()).toContain('ds-motion:pop-mark');
  });
});

describe('card-lift', () => {
  it('adds a decorative highlight to an interactive card and moves it to the pointer', () => {
    const { container } = render(
      <Card>
        <CardTitle>
          <CardLink href="#a">Brand review</CardLink>
        </CardTitle>
      </Card>,
    );
    const card = container.querySelector('[data-ds="card"]') as HTMLElement;
    const glow = card.lastElementChild as HTMLElement;
    expect(glow.getAttribute('aria-hidden')).toBe('true');
    expect(glow.childNodes).toHaveLength(0);
    card.getBoundingClientRect = () => ({ x: 10, y: 20, width: 200, height: 100, top: 20, left: 10, right: 210, bottom: 120, toJSON() {} }) as DOMRect;
    fireEvent.pointerMove(card, { clientX: 60, clientY: 50 });
    expect(glow.style.getPropertyValue('--_card-glow-x')).toBe('50px');
    expect(glow.style.getPropertyValue('--_card-glow-y')).toBe('30px');
  });

  it('adds nothing to a card that is not a link', () => {
    const { container } = render(<Card>Plain</Card>);
    expect(container.querySelector('[data-ds="card"] > span[aria-hidden]')).toBeNull();
  });
});

describe('kbd-press', () => {
  it('presses the keycap of a held key and lets it go on release', () => {
    const { container } = render(
      <Theme>
        <Kbd platform="other">Ctrl+K</Kbd>
      </Theme>,
    );
    fireEvent.keyDown(window, { key: 'k' });
    const calls = animate.mock.calls as unknown as Call[];
    expect(calls).toHaveLength(1);
    expect(calls[0]?.[1].id).toBe('ds-motion:kbd-press');
    expect(calls[0]?.[1].fill).toBe('forwards');
    expect((animate.mock.contexts[0] as Element).textContent).toBe('K');
    fireEvent.keyDown(window, { key: 'k', repeat: true });
    expect(animate).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-ds="kbd"]')).not.toBeNull();
  });
});
