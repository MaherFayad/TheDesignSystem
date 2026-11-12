import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import StatDemo from './Stat.demo';
import { Stat } from './index';
import { formatStatNumber, statLocale } from './formatStatNumber';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="stat"]')!;
const part = (c: HTMLElement, p: string) => c.querySelector<HTMLElement>(`[data-ds="stat"] > [data-part="${p}"]`);

describe('formatStatNumber', () => {
  it('uses Western digits in Arabic', () => {
    expect(statLocale('ar')).toBe('ar-u-nu-latn');
    expect(statLocale('ar-SA-u-nu-arab')).toBe('ar-SA-u-nu-arab');
    expect(formatStatNumber(48200, 'ar')).toMatch(/48,?200|48٬200/);
    expect(formatStatNumber(48200, 'ar')).not.toMatch(/[٠-٩]/);
  });

  it('falls back to English on a bad locale', () => {
    expect(formatStatNumber(1200, 'not a locale!')).toBe('1,200');
  });
});

describe('Stat', () => {
  it('renders the label and the formatted value at size md', () => {
    const { container } = render(<Stat label="Active users" value={12480} />);
    expect(root(container).getAttribute('data-size')).toBe('md');
    expect(part(container, 'label')?.textContent).toBe('Active users');
    expect(part(container, 'value')?.querySelector('[data-visually-hidden]')?.textContent).toBe('12,480');
    expect(part(container, 'value')?.querySelector('[aria-hidden="true"]')?.textContent).toBe('12,480');
    expect(part(container, 'delta')).toBeNull();
    expect(root(container).hasAttribute('data-tone')).toBe(false);
    expect(root(container).hasAttribute('data-trend')).toBe(false);
  });

  it('takes format options and a node value', () => {
    const { container, rerender } = render(<Stat label="Revenue" value={1500} format={{ style: 'currency', currency: 'USD' }} />);
    expect(part(container, 'value')?.querySelector('[data-visually-hidden]')?.textContent).toBe('$1,500.00');
    rerender(<Stat label="Time" value={14} format={{ style: 'unit', unit: 'minute' }} />);
    expect(part(container, 'value')?.querySelector('[data-visually-hidden]')?.textContent).toBe('14 min');
    rerender(
      <Theme lang="fr">
        <Stat label="Prix" value={1234} format={{ style: 'currency', currency: 'EUR' }} />
      </Theme>,
    );
    // The digit group space stays no break; the space before the currency breaks.
    expect(part(container, 'value')?.querySelector('[data-visually-hidden]')?.textContent).toMatch(/^1\u202f234,00 €$/);
    rerender(<Stat label="Revenue" value="No data" />);
    expect(part(container, 'value')?.textContent).toBe('No data');
  });

  it('derives trend and tone from the sign of the delta and says the trend in words', () => {
    const { container, rerender } = render(<Stat label="Users" value={10} delta={0.12} />);
    expect(root(container).getAttribute('data-trend')).toBe('up');
    expect(root(container).getAttribute('data-tone')).toBe('success');
    expect(part(container, 'delta')?.textContent).toBe('Up 12%');
    expect(part(container, 'delta')?.querySelector('svg')).not.toBeNull();

    rerender(<Stat label="Users" value={10} delta={-0.05} />);
    expect(root(container).getAttribute('data-trend')).toBe('down');
    expect(root(container).getAttribute('data-tone')).toBe('danger');
    expect(part(container, 'delta')?.textContent).toBe('Down 5%');

    rerender(<Stat label="Users" value={10} delta={0} />);
    expect(root(container).getAttribute('data-trend')).toBe('flat');
    expect(root(container).getAttribute('data-tone')).toBe('neutral');
    expect(part(container, 'delta')?.textContent).toBe('No change 0%');
  });

  it('reads a change that rounds to zero as flat, and drops a delta that is not a number', () => {
    const { container, rerender } = render(<Stat label="Users" value={10} delta={0.0004} />);
    expect(root(container).getAttribute('data-trend')).toBe('flat');
    expect(part(container, 'delta')?.textContent).toBe('No change 0%');
    rerender(<Stat label="Users" value={10} delta={Number.NaN} />);
    expect(part(container, 'delta')).toBeNull();
  });

  it('never draws NaN or the infinity sign: a value that is not a finite number reads as no data', () => {
    for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, undefined, null]) {
      const { container, unmount } = render(<Stat label="Users" value={value} />);
      expect(part(container, 'value')?.textContent, String(value)).toBe('No data');
      expect(root(container).hasAttribute('data-empty')).toBe(true);
      unmount();
    }
    const { container, rerender } = render(<Stat label="Users" value={Number.NaN} emptyLabel="Not counted yet" />);
    expect(part(container, 'value')?.textContent).toBe('Not counted yet');
    rerender(<Stat label="Users" value={12} />);
    expect(root(container).hasAttribute('data-empty')).toBe(false);
    rerender(<Stat label="Users" loading />);
    expect(root(container).hasAttribute('data-empty')).toBe(false);
  });

  it('says no data in Arabic under an Arabic Theme', () => {
    const { container } = render(
      <Theme lang="ar" dir="rtl">
        <Stat label="المستخدمين" value={Number.NaN} />
      </Theme>,
    );
    expect(part(container, 'value')?.textContent).toBe('لا توجد بيانات');
  });

  it('warns in development when a node delta has no trend', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<Stat label="Users" value={10} delta={<span>+3</span>} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no trend'));
    warn.mockClear();
    render(<Stat label="Users" value={10} delta={<span>+3</span>} trend="up" />);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('lets the tone and trend be set, for metrics where down is good', () => {
    const { container } = render(<Stat label="Errors" value={3} delta={-0.4} tone="success" />);
    expect(root(container).getAttribute('data-tone')).toBe('success');
    expect(root(container).getAttribute('data-trend')).toBe('down');
  });

  it('speaks the trend in Arabic under an Arabic Theme, and takes overrides', () => {
    const { container, rerender } = render(
      <Theme lang="ar">
        <Stat label="المستخدمين" value={10} delta={0.1} />
      </Theme>,
    );
    expect(part(container, 'delta')?.textContent).toContain('ارتفاع');
    rerender(<Stat label="Users" value={10} delta={0.1} trendLabels={{ up: 'Rose' }} />);
    expect(part(container, 'delta')?.textContent).toBe('Rose 10%');
  });

  it('takes a node delta with an explicit trend', () => {
    const { container } = render(<Stat label="Seats" value={20} delta="3 seats" trend="up" />);
    expect(part(container, 'delta')?.textContent).toBe('Up 3 seats');
  });

  it('renders the hint, the icon hidden, and the size', () => {
    const { container } = render(<Stat label="Boards" value={42} hint="Across 3 teams" icon="grid" size="lg" />);
    expect(part(container, 'hint')?.textContent).toBe('Across 3 teams');
    expect(part(container, 'icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(root(container).getAttribute('data-size')).toBe('lg');
  });

  it('shows loading with aria-busy, a label and no change', () => {
    const { container } = render(<Stat label="Users" loading delta={0.1} />);
    expect(root(container).hasAttribute('data-loading')).toBe(true);
    expect(root(container).getAttribute('data-loading')).toBe('');
    expect(root(container).getAttribute('aria-busy')).toBe('true');
    expect(part(container, 'value')?.textContent).toBe('Loading');
    expect(part(container, 'delta')).toBeNull();
  });

  describe('stat-roll', () => {
    function withAnimate(run: (animate: ReturnType<typeof vi.fn>) => void) {
      const animate = vi.fn(
        () => ({ finished: Promise.resolve(), cancel() {}, effect: { getTiming: () => ({ duration: 300 }) } }) as unknown as Animation,
      );
      const proto = HTMLElement.prototype as unknown as { animate?: unknown };
      const original = proto.animate;
      proto.animate = animate;
      try {
        run(animate);
      } finally {
        proto.animate = original;
      }
    }
    const frames = (animate: ReturnType<typeof vi.fn>, i: number) => (animate.mock.calls[i] as unknown as [Keyframe[], KeyframeAnimationOptions])[0];
    const desk = (v: number) => (
      <Theme style="desk">
        <Stat label="Users" value={v} />
      </Theme>
    );

    const ids = (animate: ReturnType<typeof vi.fn>) => animate.mock.calls.map((c) => String((c as unknown as [Keyframe[], KeyframeAnimationOptions])[1].id));

    it('rolls the changed digits with the digit-roll primitive when the number changes, not on the first paint', () =>
      withAnimate((animate) => {
        const { rerender, container } = render(desk(10));
        expect(animate).not.toHaveBeenCalled();
        rerender(desk(11));
        // One changed column: the new digit rolls in, the old one rolls out.
        expect(ids(animate)).toEqual(['ds-motion:digit-roll', 'ds-motion:digit-roll-out']);
        // Up: from below.
        expect(frames(animate, 0)[0]?.transform).toBe('translateY(100%)');
        // The number is read once, from the hidden copy; the drawn copy is aria-hidden.
        expect(part(container, 'value')?.querySelector('[data-visually-hidden]')?.textContent).toBe('11');
        expect(part(container, 'value')?.querySelector('[aria-hidden="true"]')).not.toBeNull();
      }));

    it('rolls down from above when the number falls', () =>
      withAnimate((animate) => {
        const { rerender } = render(desk(10));
        rerender(desk(9));
        expect(frames(animate, 0)[0]?.transform).toBe('translateY(-100%)');
      }));

    it('rolls at most three times a second: a change within 333ms of the last roll changes in place (review note N3)', () =>
      withAnimate((animate) => {
        const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
        try {
          const { rerender, container } = render(desk(1));
          rerender(desk(2));
          const first = animate.mock.calls.length;
          expect(first).toBeGreaterThan(0);
          // The mocked roll lasts 300ms, shorter than the window: the window holds.
          now.mockReturnValue(1320);
          rerender(desk(3));
          expect(animate.mock.calls.length).toBe(first);
          expect(part(container, 'value')?.querySelector('[aria-hidden="true"]')?.textContent).toBe('3');
          now.mockReturnValue(1340);
          rerender(desk(4));
          expect(animate.mock.calls.length).toBeGreaterThan(first);
        } finally {
          now.mockRestore();
        }
      }));

    it('nudges the trend mark the way the number went', () =>
      withAnimate((animate) => {
        // The trend mark is an SVG icon: give SVG elements the same mock.
        const svg = SVGElement.prototype as unknown as { animate?: unknown };
        const before = svg.animate;
        svg.animate = animate;
        onTestFinished(() => {
          svg.animate = before;
        });
        const { rerender } = render(
          <Theme style="desk">
            <Stat label="Users" value={10} delta={0.1} />
          </Theme>,
        );
        rerender(
          <Theme style="desk">
            <Stat label="Users" value={12} delta={0.1} />
          </Theme>,
        );
        const i = ids(animate).indexOf('ds-motion:stat-trend');
        expect(i).toBeGreaterThanOrEqual(0);
        expect(String(frames(animate, i)[1]?.transform)).toContain('-1 *');
      }));

    it('fades with no roll under reduced motion', () =>
      withAnimate((animate) => {
        const original = window.matchMedia;
        window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
        try {
          const { rerender } = render(desk(1));
          rerender(desk(2));
          expect(animate.mock.calls.length).toBeGreaterThan(0);
          for (let i = 0; i < animate.mock.calls.length; i++) expect(frames(animate, i).every((f) => !('transform' in f))).toBe(true);
        } finally {
          window.matchMedia = original;
        }
      }));

    it('does not roll a node value or the end of loading', () =>
      withAnimate((animate) => {
        const { rerender } = render(<Stat label="Users" loading />);
        rerender(<Stat label="Users" value={5} />);
        rerender(<Stat label="Users" value="Five" />);
        expect(animate).not.toHaveBeenCalled();
      }));
  });

  it('passes props and the ref to the root', () => {
    let node: HTMLDivElement | null = null;
    const { container } = render(<Stat label="A" value={1} className="x" ref={(n) => void (node = n)} />);
    expect(root(container).className).toBe('x');
    expect(node).toBe(root(container));
  });

  it('renders the demo cases in order and the roll button works', async () => {
    const { container, getByRole } = render(<StatDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading']);
    await userEvent.click(getByRole('button', { name: 'Add visitors' }));
    expect(container.textContent).toContain('1,277');
  });
});
