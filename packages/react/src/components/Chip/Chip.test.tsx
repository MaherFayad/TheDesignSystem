import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import ChipDemo from './Chip.demo';
import { Chip } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="chip"]');
  if (!el) throw new Error('no chip rendered');
  return el;
}

describe('Chip', () => {
  it('the pressable form is a native button with the label part', () => {
    const { container } = render(<Chip onClick={() => undefined}>Images</Chip>);
    const el = root(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Images');
    expect(screen.getByRole('button', { name: 'Images' })).toBe(el);
    expect(el.hasAttribute('aria-pressed')).toBe(false);
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('defaults to md, neutral, soft and pill, and takes the axes', () => {
    const plain = root(render(<Chip onClick={() => undefined}>A</Chip>).container);
    expect(plain.getAttribute('data-size')).toBe('md');
    expect(plain.getAttribute('data-tone')).toBe('neutral');
    expect(plain.getAttribute('data-emphasis')).toBe('soft');
    expect(plain.getAttribute('data-shape')).toBe('pill');
    const set = root(
      render(
        <Chip size="xs" tone="danger" emphasis="outline" onClick={() => undefined}>
          A
        </Chip>,
      ).container,
    );
    expect(set.getAttribute('data-size')).toBe('xs');
    expect(set.getAttribute('data-tone')).toBe('danger');
    expect(set.getAttribute('data-emphasis')).toBe('outline');
  });

  it('presses with click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Images</Chip>);
    const el = screen.getByRole('button', { name: 'Images' });
    await user.click(el);
    el.focus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(3);
  });

  it('selected is a toggle with aria-pressed, data-selected and a check', () => {
    const on = root(render(<Chip selected onClick={() => undefined}>Videos</Chip>).container);
    expect(on.getAttribute('aria-pressed')).toBe('true');
    expect(on.getAttribute('data-selected')).toBe('');
    expect(on.querySelector('[data-part="icon"] [data-icon="check"]')).not.toBeNull();
    const off = root(render(<Chip selected={false} onClick={() => undefined}>Videos</Chip>).container);
    expect(off.getAttribute('aria-pressed')).toBe('false');
    expect(off.hasAttribute('data-selected')).toBe(false);
    expect(off.querySelector('[data-part="icon"]')).toBeNull();
  });

  it('selected shows the check in place of start', () => {
    const el = root(
      render(
        <Chip selected start="image" onClick={() => undefined}>
          Images
        </Chip>,
      ).container,
    );
    expect(el.querySelector('[data-part="icon"] [data-icon="check"]')).not.toBeNull();
    expect(el.querySelector('[data-icon="image"]')).toBeNull();
  });

  it('disabled stays focusable and blocks pressing', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const el = root(render(<Chip disabled onClick={onClick}>Images</Chip>).container);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    expect(el.hasAttribute('disabled')).toBe(false);
    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('the removable form is a span with a named remove CloseButton', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const { container } = render(<Chip onRemove={onRemove}>Arabic</Chip>);
    const el = root(container);
    expect(el.tagName).toBe('SPAN');
    expect(el.getAttribute('data-removable')).toBe('');
    const remove = screen.getByRole('button', { name: 'Remove Arabic' });
    expect(remove.getAttribute('data-ds')).toBe('close-button');
    expect(remove.getAttribute('data-part')).toBe('remove');
    await user.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('Delete and Backspace on the remove button remove the chip', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip onRemove={onRemove} removeLabel="Remove filter Arabic">
        Arabic
      </Chip>,
    );
    screen.getByRole('button', { name: 'Remove filter Arabic' }).focus();
    await user.keyboard('{Delete}');
    await user.keyboard('{Backspace}');
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it('a disabled removable chip blocks removing', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip disabled onRemove={onRemove}>
        Arabic
      </Chip>,
    );
    const remove = screen.getByRole('button', { name: 'Remove Arabic' });
    await user.click(remove);
    remove.focus();
    await user.keyboard('{Delete}');
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('the default remove name follows an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <Chip onRemove={() => undefined}>العربية</Chip>
      </Theme>,
    );
    expect(screen.getByRole('button', { name: 'إزالة العربية' })).toBeTruthy();
  });

  it('the demo resets removed chips with a Button, not a Chip used as an action', async () => {
    const user = userEvent.setup();
    const { container } = render(<ChipDemo />);
    const one = container.querySelector<HTMLElement>('[data-demo-case="one"]')!;
    await user.click(one.querySelector<HTMLElement>('[data-part="remove"]')!);
    const reset = one.querySelector<HTMLElement>('[data-demo-reset]');
    expect(reset?.getAttribute('data-ds')).toBe('button');
    expect(document.activeElement).toBe(reset);
  });

  it('renders every demo case', () => {
    const { container } = render(<ChipDemo />);
    const cases = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']);
  });
});

describe('Chip CSS', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Chip.css'), 'utf8');
  const forced = css.slice(css.indexOf('@media (forced-colors: active)'));
  const rule = (selector: string, from: string) => {
    const at = from.indexOf(`${selector} {`);
    if (at < 0) return '';
    return from.slice(at, from.indexOf('}', at));
  };

  // Chromium draws a Canvas backplate behind forced text, so HighlightText on
  // a forced Highlight fill vanishes. The selected root must opt out of forcing.
  it('a selected chip keeps its label in forced colors', () => {
    const selected = rule("[data-ds='chip'][data-selected]", forced);
    expect(selected).toMatch(/forced-color-adjust:\s*none/);
    expect(selected).toMatch(/background-color:\s*Highlight/);
    expect(selected).toMatch(/color:\s*HighlightText/);
  });

  // A mixed xs row lines up: the removable xs chip keeps the xs height.
  it('an xs removable chip does not change the chip height', () => {
    const xs = rule("[data-ds='chip'][data-removable][data-size='xs']", css);
    expect(xs).not.toMatch(/--_chip-height/);
  });
});
