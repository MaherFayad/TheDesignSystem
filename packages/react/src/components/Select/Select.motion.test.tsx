// Order 1.22 motion of the pickers: menu-rows, row-glide, picker-value-roll and picker-chevron-turn.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Combobox } from '../Combobox';
import { Select } from './index';

const animate = vi.fn(() => ({ finished: Promise.resolve(), cancel() {} }) as unknown as Animation);
const ids = () => animate.mock.calls.map((c) => (c as unknown as [Keyframe[], { id: string }])[1].id);

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.hasPointerCapture ??= () => false;
  proto.setPointerCapture ??= () => undefined;
  proto.releasePointerCapture ??= () => undefined;
  proto.scrollIntoView ??= () => undefined;
  (HTMLElement.prototype as unknown as { animate: unknown }).animate = animate;
});

afterEach(() => animate.mockClear());

const fruit = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];

describe('picker motion (order 1.22)', () => {
  it('Select: the rows stagger in on open, each row holds a glide layer, and a new value rolls into the trigger', async () => {
    const user = userEvent.setup();
    render(
      <Theme style="desk">
        <Select aria-label="Fruit" items={fruit} defaultValue="apple" />
      </Theme>,
    );
    expect(ids()).not.toContain('ds-motion:stagger');
    await user.click(screen.getByRole('combobox'));
    const options = await screen.findAllByRole('option');
    expect(ids().filter((id) => id === 'ds-motion:stagger')).toHaveLength(options.length);
    for (const o of options) expect(o.querySelector(':scope > span:first-child')?.getAttribute('aria-hidden')).toBe('true');
    animate.mockClear();
    await user.click(screen.getByRole('option', { name: 'Cherry' }));
    await waitFor(() => expect(screen.getByRole('combobox').textContent).toContain('Cherry'));
    expect(ids()).toContain('ds-motion:stagger');
  });

  it('Combobox: the options stagger in each time the popup opens', async () => {
    const user = userEvent.setup();
    render(
      <Theme style="desk">
        <Combobox aria-label="Fruit" items={fruit} />
      </Theme>,
    );
    await user.click(screen.getByRole('combobox'));
    await screen.findAllByRole('option');
    expect(ids()).toContain('ds-motion:stagger');
  });

  it('the chevron turns while open, and stands still under the page reduced setting', () => {
    for (const [name, prop] of [
      ['Select', '--_select-turn'],
      ['Combobox', '--_combobox-turn'],
      ['MultiSelect', '--_multi-select-turn'],
    ] as const) {
      const css = readFileSync(join(process.cwd(), `packages/css/src/components/${name}.css`), 'utf8');
      expect(css, name).toMatch(new RegExp(`rotate\\(var\\(${prop}\\)\\)`));
      expect(css, name).toMatch(/:root\[data-motion='reduce'\]/);
    }
  });
});
