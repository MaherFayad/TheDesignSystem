import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Button } from '../Button';
import { Field } from '../Field';
import { cityOptions, citySections } from '../ListBox/samples';
import ComboboxDemo from './Combobox.demo';
import { defaultResultCount } from './ComboboxBase';
import { Combobox, type ComboboxProps } from './index';

// jsdom has no layout: Radix Popper measures with ResizeObserver.
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
});

function City(props: Partial<ComboboxProps>) {
  return (
    <Field label="City">
      <Combobox items={cityOptions('en')} {...props} />
    </Field>
  );
}

const input = () => screen.getByRole('combobox', { name: 'City' });
const root = () => input().closest('[data-ds="combobox"]') as HTMLElement;
const popup = () => document.querySelector<HTMLElement>('[data-ds="combobox"][data-part="popup"]');
const active = () => {
  const id = input().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id) : null;
};

describe('Combobox', () => {
  it('renders the field with its parts and states', () => {
    render(<City defaultValue="jeddah" />);
    expect(root().getAttribute('data-size')).toBe('md');
    expect(root().getAttribute('data-shape')).toBe('default');
    expect(root().hasAttribute('data-state')).toBe(false);
    expect(input().getAttribute('data-part')).toBe('control');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().getAttribute('aria-autocomplete')).toBe('list');
    expect((input() as HTMLInputElement).value).toBe('Jeddah');
    expect(root().querySelector('[data-part="trigger"]')?.getAttribute('aria-label')).toBe('Show options');
    expect(root().querySelector('[data-part="clear"]')?.getAttribute('aria-label')).toBe('Clear value');
  });

  it('typing filters, opens and highlights the first match; Enter picks it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<City onValueChange={onValueChange} />);
    await user.click(input());
    await user.keyboard('{Escape}');
    await user.type(input(), 'ab');
    expect(popup()?.getAttribute('data-state')).toBe('open');
    const names = Array.from(popup()!.querySelectorAll('[role="option"]')).map((o) => o.textContent);
    expect(names).toEqual(['Abha', 'Abu Dhabi', 'Tabuk']);
    expect(active()?.textContent).toBe('Abha');
    expect(popup()!.querySelector('mark')?.textContent).toBe('Ab');
    await user.keyboard('{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('abha');
    expect((input() as HTMLInputElement).value).toBe('Abha');
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('matches Arabic without diacritics and across alef forms', async () => {
    const user = userEvent.setup();
    render(
      <Theme lang="ar" dir="rtl">
        <Field label="المدينة">
          <Combobox items={cityOptions('ar')} />
        </Field>
      </Theme>,
    );
    const box = screen.getByRole('combobox', { name: 'المدينة' });
    await user.type(box, 'الاحساء');
    const names = Array.from(popup()!.querySelectorAll('[role="option"]')).map((o) => o.textContent);
    expect(names).toEqual(['الأحساء']);
  });

  it('ArrowDown opens on the chosen option and moves; ArrowUp moves back', async () => {
    const user = userEvent.setup();
    render(<City items={cityOptions('en', 'gulf')} defaultValue="doha" />);
    input().focus();
    await user.keyboard('{ArrowDown}');
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(active()?.textContent).toBe('Doha');
    await user.keyboard('{ArrowDown}');
    expect(active()?.textContent).toBe('Manama');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(active()?.textContent).toBe('Abu Dhabi');
  });

  it('Alt+ArrowDown opens without moving the highlight', async () => {
    const user = userEvent.setup();
    render(<City items={cityOptions('en', 'gulf')} />);
    input().focus();
    await user.keyboard('{Alt>}{ArrowDown}{/Alt}');
    expect(input().getAttribute('aria-expanded')).toBe('true');
    expect(input().hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('Escape closes and puts the chosen label back; a second Escape clears', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<City defaultValue="riyadh" onValueChange={onValueChange} />);
    await user.click(input());
    await user.clear(input());
    await user.type(input(), 'ta');
    await user.keyboard('{Escape}');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect((input() as HTMLInputElement).value).toBe('Riyadh');
    await user.keyboard('{Escape}');
    expect((input() as HTMLInputElement).value).toBe('');
    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('a click on an option chooses it and keeps focus in the input', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<City items={citySections('en')} onValueChange={onValueChange} />);
    await user.click(input());
    expect(popup()?.querySelectorAll('[role="group"]').length).toBe(2);
    await user.click(screen.getByRole('option', { name: 'Doha' }));
    expect(onValueChange).toHaveBeenLastCalledWith('doha');
    expect(document.activeElement).toBe(input());
  });

  it('the trigger toggles the list and the clear button clears', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>('taif');
      return <City value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);
    const trigger = root().querySelector<HTMLElement>('[data-part="trigger"]')!;
    await user.click(trigger);
    expect(input().getAttribute('aria-expanded')).toBe('true');
    await user.click(trigger);
    expect(input().getAttribute('aria-expanded')).toBe('false');
    await user.click(root().querySelector<HTMLElement>('[data-part="clear"]')!);
    expect((input() as HTMLInputElement).value).toBe('');
    expect(root().querySelector('[data-part="clear"]')).toBeNull();
  });

  it('blur puts the chosen label back', async () => {
    const user = userEvent.setup();
    render(
      <>
        <City defaultValue="tabuk" />
        <Button>Next</Button>
      </>,
    );
    await user.click(input());
    await user.type(input(), 'xx');
    await user.tab();
    expect((input() as HTMLInputElement).value).toBe('Tabuk');
  });

  it('shows the empty part when nothing matches, and announces the count once typing pauses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<City />);
    await user.type(input(), 'zzz');
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('No results. Try another word.');
    act(() => {
      vi.advanceTimersByTime(500);
    });
    await waitFor(() => expect(root().querySelector('[role="status"]')?.textContent).toBe('No results'));
    vi.useRealTimers();
  });

  it('follows the Field: invalid, disabled and read only', () => {
    const { rerender } = render(
      <Field label="City" error="Choose a city">
        <Combobox items={cityOptions('en')} />
      </Field>,
    );
    expect(root().hasAttribute('data-invalid')).toBe(true);
    expect(input().getAttribute('aria-invalid')).toBe('true');
    rerender(
      <Field label="City" disabled>
        <Combobox items={cityOptions('en')} />
      </Field>,
    );
    expect(root().hasAttribute('data-disabled')).toBe(true);
    expect((input() as HTMLInputElement).disabled).toBe(true);
    rerender(
      <Field label="City" readOnly>
        <Combobox items={cityOptions('en')} defaultValue="riyadh" />
      </Field>,
    );
    expect(root().hasAttribute('data-readonly')).toBe(true);
    expect(root().querySelector('[data-part="clear"]')).toBeNull();
  });

  it('sets data-loading and says it in the popup', async () => {
    const user = userEvent.setup();
    render(<City items={[]} loading loadingLabel="Loading cities" />);
    expect(root().hasAttribute('data-loading')).toBe(true);
    await user.click(input());
    expect(popup()?.querySelector('[data-part="empty"]')?.textContent).toBe('Loading cities');
  });

  it('submits the value with name', () => {
    render(<City name="city" defaultValue="hail" />);
    expect(document.querySelector<HTMLInputElement>('input[type="hidden"][name="city"]')?.value).toBe('hail');
  });

  it('pluralizes the count in English and Arabic', () => {
    expect(defaultResultCount(1, 'en')).toBe('1 result');
    expect(defaultResultCount(4, 'en')).toBe('4 results');
    expect(defaultResultCount(1, 'ar')).toBe('نتيجة وحدة');
    expect(defaultResultCount(2, 'ar')).toBe('نتيجتين');
    expect(defaultResultCount(5, 'ar')).toBe('5 نتائج');
    expect(defaultResultCount(12, 'ar')).toBe('12 نتيجة');
  });

  it('renders the demo', () => {
    render(<ComboboxDemo />);
    expect(document.querySelectorAll('[data-ds="combobox"]').length).toBeGreaterThan(8);
  });
});
