import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { getInteraction } from '@the-system/motion';
import { Field } from '../Field/Field';
import SwitchDemo from './Switch.demo';
import { Switch } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="switch"]');
  if (!el) throw new Error('no switch root');
  return el;
}

describe('Switch', () => {
  it('renders a root, a control with role switch, a track with a thumb and a bound label', () => {
    const { container } = render(<Switch label="Auto save" description="Saves as you work." />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-tone')).toBe('accent');
    expect(box.getAttribute('data-state')).toBe('unchecked');
    const control = screen.getByRole('switch', { name: 'Auto save' });
    expect(control.getAttribute('data-part')).toBe('control');
    const track = control.querySelector('[data-part="track"]');
    expect(track?.querySelector('[data-part="thumb"]')).not.toBeNull();
    expect(control.getAttribute('aria-describedby')).toBe(container.querySelector('[data-part="description"]')?.id);
    expect(container.querySelector('label[data-part="label"]')?.getAttribute('for')).toBe(control.id);
  });

  it('maps size to the root', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      expect(root(render(<Switch aria-label="x" size={size} />).container).getAttribute('data-size')).toBe(size);
    }
  });

  it('toggles on click, Space and Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Switch label="Sounds" onCheckedChange={onChange} />);
    const control = screen.getByRole('switch');
    await user.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(root(container).getAttribute('data-state')).toBe('checked');
    await user.keyboard(' ');
    expect(control.getAttribute('aria-checked')).toBe('false');
    await user.keyboard('{Enter}');
    expect(control.getAttribute('aria-checked')).toBe('true');
    await user.click(screen.getByText('Sounds'));
    expect(control.getAttribute('aria-checked')).toBe('false');
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('shows the state text for the current state, hidden from assistive tech', async () => {
    const user = userEvent.setup();
    const { container } = render(<Switch label="Sounds" stateText={{ on: 'On', off: 'Off' }} />);
    const text = container.querySelector('[data-part="state-text"]');
    expect(text?.textContent).toBe('Off');
    expect(text?.getAttribute('aria-hidden')).toBe('true');
    await user.click(screen.getByRole('switch'));
    expect(text?.textContent).toBe('On');
    expect(screen.getByRole('switch', { name: 'Sounds' })).toBeTruthy();
  });

  it('follows a controlled value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Switch aria-label="c" checked={false} onCheckedChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('false');
    rerender(<Switch aria-label="c" checked onCheckedChange={onChange} />);
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true');
  });

  it('read only keeps focus and value but ignores clicks and keys', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Switch label="Fixed" readOnly defaultChecked onCheckedChange={onChange} />);
    const control = screen.getByRole('switch');
    await user.click(control);
    await user.keyboard(' ');
    await user.keyboard('{Enter}');
    await user.click(screen.getByText('Fixed'));
    expect(control.getAttribute('aria-checked')).toBe('true');
    expect(control.getAttribute('aria-readonly')).toBe('true');
    expect(document.activeElement).toBe(control);
    expect(onChange).not.toHaveBeenCalled();
    expect(root(container).hasAttribute('data-readonly')).toBe(true);
  });

  it('reads disabled, invalid and required from a Field', () => {
    const { container } = render(
      <Field disabled required error="Turn this on.">
        <Switch label="Two step" />
      </Field>,
    );
    const control = screen.getByRole('switch', { name: 'Two step' }) as HTMLButtonElement;
    expect(control.disabled).toBe(true);
    expect(control.getAttribute('aria-invalid')).toBe('true');
    expect(control.getAttribute('aria-required')).toBe('true');
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    expect(root(container).hasAttribute('data-invalid')).toBe(true);
  });

  it('sends the ref to the control, className and style to the root', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(<Switch ref={ref} aria-label="r" className="s" rootProps={{ id: 'root' }} />);
    expect(ref.current).toBe(screen.getByRole('switch'));
    expect(root(container).className).toBe('s');
    expect(root(container).id).toBe('root');
  });

  it('renders the demo with every case', () => {
    const { container } = render(<SwitchDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });

  it('the state text is its own bidi run, so on a right to left page it keeps its gap from an English label', () => {
    const { container } = render(<Switch label="Snap to grid" defaultChecked stateText={{ on: 'On', off: 'Off' }} />);
    expect(container.querySelector('[data-part="label"] > [data-part="state-text"]')?.textContent).toBe('On');
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Switch.css'), 'utf8');
    const at = css.indexOf("[data-ds='switch'] [data-part='state-text'] {");
    expect(at).toBeGreaterThan(-1);
    const rule = css.slice(at, css.indexOf('}', at));
    // Without it, "Snap to grid" and "On" join one left to right run and read "Snap to gridOn".
    expect(rule).toMatch(/unicode-bidi:\s*isolate;/);
  });
});

describe('Switch motion (interaction switch-stretch, order 1.22, and the round 1 review)', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Switch.css'), 'utf8');

  it('renders the decorative on tint inside the track, before the thumb', () => {
    render(<Switch label="Auto save" />);
    const track = document.querySelector('[data-part="track"]');
    const tint = track?.firstElementChild;
    expect(tint?.tagName).toBe('SPAN');
    expect(tint?.getAttribute('aria-hidden')).toBe('true');
    expect(tint?.hasAttribute('data-part')).toBe(false);
    expect(track?.lastElementChild?.getAttribute('data-part')).toBe('thumb');
  });

  it('shows the focus ring at once: the ring layer has no transition (B1)', () => {
    const at = css.indexOf("[data-ds='switch'] > [data-part='control']::before {");
    expect(at).toBeGreaterThan(0);
    expect(css.slice(at, css.indexOf('}', at))).not.toContain('transition');
  });

  it('turns the stretch and the dip off under data-motion reduce as under the media query (B2)', () => {
    const at = css.indexOf(":root[data-motion='reduce'] [data-ds='switch'] {");
    expect(at).toBeGreaterThan(0);
    const block = css.slice(at, css.indexOf('}', at));
    expect(block).toContain('--_switch-stretch: 1;');
    expect(block).toContain('--_switch-track-press: 1;');
  });

  it('turns every transition off with its off row (N6)', () => {
    expect(getInteraction('switch-stretch')?.off?.["[data-ds='switch']"]).toMatchObject({ '--_switch-motion': '0' });
    for (const m of css.matchAll(/transition:([^;]+);/g)) {
      const value = m[1] ?? '';
      if (value.trim() === 'none') continue;
      for (const part of value.split(',')) expect(part, part).toContain('* var(--_switch-motion)');
    }
  });

  it('stretches by the scale.stretch token (N10)', () => {
    expect(css).toContain('--_switch-stretch: var(--ds-scale-stretch);');
    expect(css).not.toContain('scale-window-enter');
  });

  it('travels on the bouncy spring', () => {
    expect(css).toContain('--_switch-duration: var(--ds-duration-spring-bouncy);');
    expect(css).toContain('--_switch-ease: var(--ds-ease-spring-bouncy);');
  });
});
