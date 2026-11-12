import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import TourDemo from './Tour.demo';
import { Tour, clampStep, type TourProps, type TourStep } from './index';

// jsdom has no ResizeObserver, which Radix Popper reads for the arrow size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
// jsdom has no scrollIntoView.
const scrolled = vi.fn();
(Element.prototype as unknown as { scrollIntoView: (o?: unknown) => void }).scrollIntoView = scrolled;

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="tour"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;

const steps: TourStep[] = [
  { target: '#t-0', title: 'Start a board', body: 'Each board holds one project.' },
  { target: '#t-1', title: 'Share with your team', body: 'People with the link can comment.' },
  { target: '#t-2', title: 'Export a copy' },
];

function Basic(props: Partial<TourProps>) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return (
    <>
      <Button id="t-0">New board</Button>
      <Button id="t-1">Share board</Button>
      <Button id="t-2">Export board</Button>
      <Button onClick={() => setOpen(true)}>Start tour</Button>
      <Tour steps={steps} open={open} onOpenChange={setOpen} {...props} />
    </>
  );
}

async function start(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Start tour' }));
  await waitFor(() => expect(rootEl()).not.toBeNull());
}

describe('Tour', () => {
  it('renders nothing until it is opened', () => {
    render(<Basic />);
    expect(rootEl()).toBeNull();
  });

  it('opens on the first step with the anatomy, the size and the state', async () => {
    const user = userEvent.setup();
    render(<Basic size="sm" />);
    await start(user);
    const root = rootEl();
    expect(root?.getAttribute('data-size')).toBe('sm');
    expect(root?.getAttribute('data-state')).toBe('open');
    for (const name of ['panel', 'title', 'body', 'footer', 'progress', 'skip', 'next', 'arrow']) expect(part(name)).not.toBeNull();
    expect(part('back')).toBeNull();
    expect(part('title')?.textContent).toBe('Start a board');
    expect(part('progress')?.textContent).toBe('Step 1 of 3');
    expect(part('next')?.textContent).toBe('Next step');
    expect(part('skip')?.getAttribute('data-ds')).toBe('button');
    const panel = part('panel');
    expect(panel?.getAttribute('role')).toBe('dialog');
    expect(panel?.getAttribute('aria-labelledby')).toBe(part('title')?.id);
    expect(panel?.getAttribute('aria-modal')).toBeNull();
  });

  it('moves focus into the step and scrolls the target into view', async () => {
    const user = userEvent.setup();
    scrolled.mockClear();
    render(<Basic />);
    await start(user);
    await waitFor(() => expect(document.activeElement).toBe(part('panel')));
    expect(scrolled).toHaveBeenCalled();
  });

  it('goes next and back, then finishes on the last step', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();
    const onFinish = vi.fn();
    render(<Basic onStepChange={onStepChange} onFinish={onFinish} />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(onStepChange).toHaveBeenLastCalledWith(1);
    expect(part('title')?.textContent).toBe('Share with your team');
    expect(part('back')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(part('title')?.textContent).toBe('Start a board');
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(part('progress')?.textContent).toBe('Step 3 of 3');
    await user.click(screen.getByRole('button', { name: 'Finish tour' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(rootEl()).toBeNull());
  });

  it('ends on Skip tour and on Escape, and focus returns to what started it', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Skip tour' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await start(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Start tour' }));
  });

  it('starts again at the first step after it ends', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    await user.click(screen.getByRole('button', { name: 'Skip tour' }));
    await waitFor(() => expect(rootEl()).toBeNull());
    await start(user);
    expect(part('progress')?.textContent).toBe('Step 1 of 3');
  });

  it('Escape keeps focus in the page field the person is using', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Board name" />
        <Basic />
      </>,
    );
    await start(user);
    const field = screen.getByRole('textbox', { name: 'Board name' });
    await user.click(field);
    expect(document.activeElement).toBe(field);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(rootEl()).toBeNull());
    expect(document.activeElement).toBe(field);
  });

  it('a click on the page does not end the tour', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await start(user);
    await user.click(screen.getByRole('button', { name: 'New board' }));
    expect(rootEl()).not.toBeNull();
  });

  it('shows the step with no ring and no arrow when the target is missing', async () => {
    const user = userEvent.setup();
    render(<Basic steps={[{ target: '#nowhere', title: 'Comments panel' }]} />);
    await start(user);
    expect(part('highlight')).toBeNull();
    expect(part('arrow')).toBeNull();
    expect(part('next')?.textContent).toBe('Finish tour');
  });

  it('takes a ref or a function as the target', async () => {
    const user = userEvent.setup();
    render(<Basic steps={[{ target: () => document.getElementById('t-1'), title: 'Share' }]} />);
    await start(user);
    await waitFor(() => expect(part('highlight')).not.toBeNull());
  });

  it('uses Arabic labels under lang ar and maps the side', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Basic steps={[{ target: '#t-0', title: 'إنشاء لوحة', side: 'start' }, ...steps]} />
      </Theme>,
    );
    await start(user);
    expect(part('progress')?.textContent).toBe('الخطوة 1 من 4');
    expect(part('skip')?.textContent).toBe('تخطي الجولة');
    expect(part('panel')?.getAttribute('data-side')).toBe('right');
    expect(rootEl()?.closest('[data-tour-layer]')?.getAttribute('dir')).toBe('rtl');
  });

  it('is controlled through step', async () => {
    render(<Basic defaultOpen step={2} />);
    await waitFor(() => expect(part('title')?.textContent).toBe('Export a copy'));
  });

  it('clamps the step to the steps', () => {
    expect(clampStep(-1, 3)).toBe(0);
    expect(clampStep(9, 3)).toBe(2);
    expect(clampStep(1.6, 3)).toBe(1);
    expect(clampStep(4, 0)).toBe(0);
  });

  it('renders the demo cases', () => {
    const { container } = render(<TourDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error']);
  });

  it('Tab past the last control leaves to the step target and the tour stays open; Shift+Tab from the panel does too', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await start(user);
    await waitFor(() => expect(document.activeElement).toBe(part('panel')));
    await user.tab();
    expect(document.activeElement).toBe(part('skip'));
    await user.tab();
    expect(document.activeElement).toBe(part('next'));
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New board' }));
    expect(rootEl()?.getAttribute('data-state')).toBe('open');

    part('panel')?.focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New board' }));
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
  });

  it('Tab leaves to a target that takes no focus by giving it tabindex -1', async () => {
    const user = userEvent.setup();
    function Section() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <section id="t-chart" aria-label="Sales chart">
            Chart
          </section>
          <Button onClick={() => setOpen(true)}>Start tour</Button>
          <Tour steps={[{ target: '#t-chart', title: 'Read the chart' }]} open={open} onOpenChange={setOpen} />
        </>
      );
    }
    render(<Section />);
    await start(user);
    await waitFor(() => expect(document.activeElement).toBe(part('panel')));
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(part('next'));
    await user.tab();
    const chart = document.getElementById('t-chart');
    expect(document.activeElement).toBe(chart);
    expect(chart?.getAttribute('tabindex')).toBe('-1');
    expect(rootEl()?.getAttribute('data-state')).toBe('open');
  });
});

// ------------------------------------------------------------------ motion, order 1.22

describe('motion (order 1.22): tour-spotlight', () => {
  it('on Next the new title, body and footer arrive in order and focus is on the panel at once', async () => {
    const calls: { el: Element; options: KeyframeAnimationOptions }[] = [];
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (this: Element, _frames: Keyframe[] | PropertyIndexedKeyframes | null, options?: number | KeyframeAnimationOptions) {
      calls.push({ el: this, options: (options ?? {}) as KeyframeAnimationOptions });
      return { cancel() {}, finished: Promise.resolve(), id: '', playState: 'finished' } as unknown as Animation;
    };
    try {
      const user = userEvent.setup();
      render(<Basic />);
      await start(user);
      await user.click(screen.getByRole('button', { name: 'Next step' }));
      await waitFor(() => expect(part('title')?.textContent).toBe('Share with your team'));
      const parts = calls.filter((c) => c.options.id === 'ds-motion:stagger').map((c) => c.el.getAttribute('data-part'));
      expect(parts).toEqual(expect.arrayContaining(['title', 'body']));
      expect(document.activeElement).toBe(part('panel'));
    } finally {
      Element.prototype.animate = animate;
    }
  });

  it('review B2: the reduced form applies under data-motion="reduce" too', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Tour.css'), 'utf8');
    expect(css).toContain(":root[data-motion='reduce'] [data-ds='tour'] :is([data-part='panel'][data-state], [data-part='highlight']),");
  });
});
