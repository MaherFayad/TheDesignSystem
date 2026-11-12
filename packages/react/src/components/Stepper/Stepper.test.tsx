import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import StepperDemo from './Stepper.demo';
import { Stepper, type StepperStep } from './index';

const steps: StepperStep[] = [
  { title: 'Account', description: 'Email and password' },
  { title: 'Address' },
  { title: 'Payment' },
  { title: 'Review' },
];

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="stepper"]');
  if (!el) throw new Error('no stepper rendered');
  return el;
}

function stepEls(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-part="step"]'));
}

describe('Stepper', () => {
  it('renders an ordered list with the default attributes', () => {
    const ref = createRef<HTMLOListElement>();
    const { container } = render(<Stepper steps={steps} ref={ref} />);
    const el = root(container);
    expect(el.tagName).toBe('OL');
    expect(ref.current).toBe(el);
    expect(screen.getByRole('list', { name: 'Steps' })).toBe(el);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(stepEls(container).map((s) => s.tagName)).toEqual(['LI', 'LI', 'LI', 'LI']);
  });

  it('sets size, orientation and the list name from props', () => {
    const { container } = render(<Stepper steps={steps} size="sm" orientation="vertical" aria-label="Checkout steps" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.getAttribute('aria-label')).toBe('Checkout steps');
  });

  it('drops the default name when aria-labelledby is passed', () => {
    const { container } = render(<Stepper steps={steps} aria-labelledby="h" />);
    expect(root(container).hasAttribute('aria-label')).toBe(false);
  });

  it('marks complete, current and upcoming, with aria-current on the current step', () => {
    const { container } = render(<Stepper steps={steps} current={2} />);
    const els = stepEls(container);
    expect(els.map((s) => s.getAttribute('data-state'))).toEqual(['complete', 'complete', 'current', 'upcoming']);
    expect(els.map((s) => s.getAttribute('aria-current'))).toEqual([null, null, 'step', null]);
  });

  it('shows a check for complete steps and the number otherwise, hidden from assistive tech', () => {
    const { container } = render(<Stepper steps={steps} current={1} />);
    const indicators = Array.from(container.querySelectorAll('[data-part="indicator"]'));
    expect(indicators.every((i) => i.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(indicators[0]?.querySelector('svg')).not.toBeNull();
    expect(indicators.slice(1).map((i) => i.textContent)).toEqual(['2', '3', '4']);
  });

  it('says complete in hidden words, so state is not color alone', () => {
    const { container } = render(<Stepper steps={steps} current={1} />);
    const status = container.querySelector('[data-part="step"] [data-part="status"]');
    expect(status?.textContent).toBe(', complete');
  });

  it('renders a connector between steps, not after the last', () => {
    const { container } = render(<Stepper steps={steps} />);
    const els = stepEls(container);
    expect(els.map((s) => s.querySelector('[data-part="connector"]') !== null)).toEqual([true, true, true, false]);
    expect(els[0]?.querySelector('[data-part="connector"]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders the description only when given', () => {
    const { container } = render(<Stepper steps={steps} />);
    expect(container.querySelectorAll('[data-part="description"]')).toHaveLength(1);
  });

  it('takes completed from props over the default', () => {
    const { container } = render(<Stepper steps={steps} current={2} completed={[0]} />);
    expect(stepEls(container).map((s) => s.getAttribute('data-state'))).toEqual(['complete', 'upcoming', 'current', 'upcoming']);
  });

  it('marks invalid and disabled steps and says so', () => {
    const { container } = render(
      <Stepper
        steps={[{ title: 'Account', invalid: true }, { title: 'Address', disabled: true }, { title: 'Review' }]}
        current={2}
        completed={[0]}
      />,
    );
    const [a, b] = stepEls(container);
    expect(a?.getAttribute('data-invalid')).toBe('');
    expect(a?.querySelector('[data-part="status"]')?.textContent).toBe(', complete, has errors');
    expect(b?.getAttribute('data-disabled')).toBe('');
    expect(b?.querySelector('[data-part="status"]')?.textContent).toBe(', unavailable');
  });

  it('is static text when no step can be picked', () => {
    render(<Stepper steps={steps} current={2} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('linear: only reachable steps other than the current one are buttons', async () => {
    const onStepSelect = vi.fn();
    const { container } = render(<Stepper steps={steps} current={1} onStepSelect={onStepSelect} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.getAttribute('data-ds')).toBe('button');
    expect(buttons[0]?.getAttribute('data-part')).toBe('title');
    expect(buttons[0]?.textContent).toBe('Account, complete');
    await userEvent.click(buttons[0] as HTMLElement);
    expect(onStepSelect).toHaveBeenCalledWith(0);
    expect(stepEls(container)[1]?.querySelector('[data-ds="button"]')).toBeNull();
  });

  it('free: every other step that is not disabled is a button', () => {
    render(
      <Stepper
        steps={steps.map((s, i) => (i === 3 ? { ...s, disabled: true } : s))}
        current={0}
        mode="free"
        onStepSelect={() => undefined}
      />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Address', 'Payment']);
  });

  it('moves on its own when uncontrolled', async () => {
    const { container } = render(<Stepper steps={steps} defaultCurrent={2} onStepSelect={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: 'Account, complete' }));
    expect(stepEls(container)[0]?.getAttribute('aria-current')).toBe('step');
  });

  it('keeps later steps complete after going back, so the user can go forward again', async () => {
    const { container } = render(<Stepper steps={steps} defaultCurrent={2} onStepSelect={() => undefined} />);
    await userEvent.click(screen.getByRole('button', { name: 'Account, complete' }));
    expect(stepEls(container).map((s) => s.getAttribute('data-state'))).toEqual(['current', 'complete', 'upcoming', 'upcoming']);
    await userEvent.click(screen.getByRole('button', { name: /^Payment/ }));
    expect(stepEls(container)[2]?.getAttribute('aria-current')).toBe('step');
  });

  it('says current step in hidden words too', () => {
    const { container } = render(<Stepper steps={steps} current={1} />);
    expect(stepEls(container)[1]?.querySelector('[data-part="status"]')?.textContent).toBe(', current step');
  });

  it('Enter activates a step from the keyboard', async () => {
    const onStepSelect = vi.fn();
    render(<Stepper steps={steps} current={2} onStepSelect={onStepSelect} />);
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onStepSelect).toHaveBeenCalledWith(0);
  });

  it('renders link steps through Button asChild', () => {
    render(<Stepper steps={steps.map((s, i) => ({ ...s, href: `#s${i}` }))} current={1} />);
    const link = screen.getByRole('link', { name: 'Account, complete' });
    expect(link.getAttribute('href')).toBe('#s0');
    expect(link.getAttribute('data-ds')).toBe('button');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('uses Arabic words under an Arabic Theme', () => {
    const { container } = render(
      <Theme lang="ar">
        <Stepper steps={steps} current={1} />
      </Theme>,
    );
    expect(root(container).getAttribute('aria-label')).toBe('الخطوات');
    expect(container.querySelector('[data-part="status"]')?.textContent).toBe('، مكتملة');
  });

  it('takes custom labels', () => {
    const { container } = render(<Stepper steps={steps} current={1} labels={{ complete: 'done', list: 'Progress' }} />);
    expect(root(container).getAttribute('aria-label')).toBe('Progress');
    expect(container.querySelector('[data-part="status"]')?.textContent).toBe(', done');
  });

  it('renders the demo with every case that applies', () => {
    const { container } = render(<StepperDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled']);
  });
});
