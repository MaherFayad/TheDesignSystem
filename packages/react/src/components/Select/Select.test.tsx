import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { citySections, sortOptions } from '../ListBox/samples';
import SelectDemo from './Select.demo';
import { Select, type SelectProps } from './index';

// jsdom has no layout: Radix Popper measures with ResizeObserver; Radix Select uses pointer capture and scrollIntoView.
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

function Sort(props: Partial<SelectProps>) {
  return (
    <Field label="Sort by">
      <Select items={sortOptions('en')} {...props} />
    </Field>
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Sort by' });
const content = () => document.querySelector<HTMLElement>('[data-ds="select"][data-part="content"]');

describe('Select', () => {
  it('renders the trigger as the root with its parts and axes', () => {
    render(<Sort defaultValue="edited" />);
    const root = trigger();
    expect(root.tagName).toBe('BUTTON');
    expect(root.getAttribute('data-ds')).toBe('select');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-shape')).toBe('default');
    expect(root.hasAttribute('data-state')).toBe(false);
    expect(root.querySelector('[data-part="value"]')?.textContent).toBe('Date edited');
    expect(root.querySelector('[data-part="icon"]')).not.toBeNull();
    expect(root.hasAttribute('data-placeholder')).toBe(false);
  });

  it('shows the placeholder with no value, in English and Arabic', () => {
    render(
      <>
        <Sort />
        <Theme lang="ar">
          <Field label="الترتيب">
            <Select items={sortOptions('ar')} />
          </Field>
        </Theme>
      </>,
    );
    expect(trigger().hasAttribute('data-placeholder')).toBe(true);
    expect(trigger().textContent).toContain('Choose an option');
    expect(screen.getByRole('combobox', { name: 'الترتيب' }).textContent).toContain('اختيار من القائمة');
  });

  it('passes size, shape and the Field states to the root', () => {
    render(
      <Field label="Sort by" error="Choose one" required>
        <Select items={sortOptions('en')} size="lg" shape="pill" />
      </Field>,
    );
    const root = trigger();
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-shape')).toBe('pill');
    expect(root.hasAttribute('data-invalid')).toBe(true);
    expect(root.getAttribute('aria-invalid')).toBe('true');
    expect(root.getAttribute('aria-required')).toBe('true');
    expect(root.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('opens with the keyboard, renders the content as its own root, and Enter chooses', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Sort onValueChange={onValueChange} />);
    const root = trigger();
    root.focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(content()).not.toBeNull());
    expect(root.getAttribute('aria-expanded')).toBe('true');
    const list = content() as HTMLElement;
    expect(list.getAttribute('data-state')).toBe('open');
    expect(list.closest('[data-ds="theme"][data-menu-layer]')).not.toBeNull();
    const items = list.querySelectorAll('[data-part="item"]');
    expect(items).toHaveLength(4);
    expect(items[3]?.hasAttribute('data-disabled')).toBe(true);
    expect(items[0]?.querySelector('[data-part="item-description"]')?.textContent).toBe('A to Z');
    expect(items[0]?.getAttribute('aria-describedby')).toBe(items[0]?.querySelector('[data-part="item-description"]')?.id);
    await waitFor(() => expect(document.activeElement?.getAttribute('data-part')).toBe('item'));
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('edited');
    await waitFor(() => expect(content()).toBeNull());
    expect(root.querySelector('[data-part="value"]')?.textContent).toBe('Date edited');
  });

  it('marks the chosen item with a check and data-state checked', async () => {
    const user = userEvent.setup();
    render(<Sort defaultValue="owner" />);
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(content()).not.toBeNull());
    const checked = content()?.querySelector('[data-part="item"][data-state="checked"]');
    expect(checked?.textContent).toContain('Owner');
    expect(checked?.querySelector('[data-part="indicator"] svg')).not.toBeNull();
    expect(content()?.querySelectorAll('[data-part="indicator"]')).toHaveLength(4);
  });

  it('Escape closes and focus returns to the trigger', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<Sort onOpenChange={onOpenChange} />);
    const root = trigger();
    root.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(content()).not.toBeNull());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(content()).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(document.activeElement).toBe(root);
  });

  it('draws groups with a label and a separator between them', async () => {
    const user = userEvent.setup();
    render(
      <Field label="City">
        <Select items={citySections('en')} />
      </Field>,
    );
    screen.getByRole('combobox', { name: 'City' }).focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(content()).not.toBeNull());
    const groups = content()?.querySelectorAll('[data-part="group"]');
    expect(groups).toHaveLength(2);
    expect(groups?.[0]?.querySelector('[data-part="label"]')?.textContent).toBe('Saudi Arabia');
    expect(content()?.querySelectorAll('[data-part="separator"]')).toHaveLength(1);
  });

  it('read only: focusable, keys and typeahead do not open or change it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Sort readOnly defaultValue="name" onValueChange={onValueChange} />);
    const root = trigger();
    expect(root.hasAttribute('data-readonly')).toBe(true);
    expect(root.getAttribute('aria-readonly')).toBe('true');
    root.focus();
    await user.keyboard('{Enter}{ArrowDown}o');
    expect(content()).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(root);
  });

  it('disabled: native disabled from the Field, data-disabled', () => {
    render(
      <Field label="Sort by" disabled>
        <Select items={sortOptions('en')} />
      </Field>,
    );
    expect((trigger() as HTMLButtonElement).disabled).toBe(true);
    expect(trigger().hasAttribute('data-disabled')).toBe(true);
  });

  it('loading: data-loading, aria-busy and no list', async () => {
    const user = userEvent.setup();
    render(<Sort loading />);
    expect(trigger().hasAttribute('data-loading')).toBe(true);
    expect(trigger().getAttribute('aria-busy')).toBe('true');
    trigger().focus();
    await user.keyboard('{Enter}');
    expect(content()).toBeNull();
  });

  it('says so when there is no option', async () => {
    const user = userEvent.setup();
    render(<Sort items={[]} empty="No statuses yet." />);
    trigger().focus();
    await user.keyboard('{Enter}');
    await waitFor(() => expect(content()).not.toBeNull());
    expect(content()?.querySelector('[data-part="empty"]')?.textContent).toBe('No statuses yet.');
  });

  it('controlled value follows the prop', () => {
    const { rerender } = render(<Sort value="name" />);
    expect(trigger().textContent).toContain('Name');
    rerender(<Sort value={null} />);
    expect(trigger().hasAttribute('data-placeholder')).toBe(true);
  });

  it('the demo renders every content case', () => {
    render(<SelectDemo />);
    const ids = [...document.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
  });
});
