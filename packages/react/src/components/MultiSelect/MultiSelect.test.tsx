import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import { citySections } from '../ListBox/samples';
import type { ListBoxOption } from '../ListBox';
import MultiSelectDemo from './MultiSelect.demo';
import { MultiSelect, defaultSelectedCount, type MultiSelectProps } from './index';

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  const proto = Element.prototype as unknown as Record<string, unknown>;
  proto.scrollIntoView ??= () => undefined;
});

const labels: ListBoxOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'copy', label: 'Copy' },
  { value: 'bug', label: 'Bug' },
  { value: 'legal', label: 'Legal review', disabled: true },
];

function Labels(props: Partial<MultiSelectProps>) {
  return (
    <Field label="Labels">
      <MultiSelect items={labels} {...props} />
    </Field>
  );
}

const trigger = () => screen.getByRole('combobox', { name: 'Labels' });
const root = () => trigger().closest('[data-ds="multi-select"]') as HTMLElement;
const popup = () => document.querySelector<HTMLElement>('[data-ds="multi-select"][data-part="popup"]');
const option = (name: string) => popup()?.querySelector<HTMLElement>(`[role="option"][id$="-option-${name}"]`) ?? null;

describe('MultiSelect', () => {
  it('renders the box, the trigger and the tags', () => {
    render(<Labels defaultValue={['design', 'copy']} />);
    expect(root().getAttribute('data-size')).toBe('md');
    expect(root().getAttribute('data-shape')).toBe('default');
    expect(root().hasAttribute('data-state')).toBe(false);
    expect(trigger().getAttribute('data-part')).toBe('trigger');
    expect(trigger().getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    const tags = root().querySelectorAll('[data-part="tag"]');
    expect([...tags].map((t) => t.textContent)).toEqual(['Design', 'Copy']);
    expect(root().querySelector('[data-part="summary-text"]')?.textContent).toBe('Design and Copy');
  });

  it('shows at most maxTags tags, then a +N tag', () => {
    render(<Labels defaultValue={['design', 'copy', 'bug', 'research']} maxTags={2} />);
    const tags = [...root().querySelectorAll('[data-part="tag"]')];
    expect(tags.map((t) => t.textContent)).toEqual(['Design', 'Copy', '+2']);
    expect(tags[2]?.hasAttribute('data-more')).toBe(true);
  });

  it('count summary, pluralized in Arabic with Intl.PluralRules', () => {
    render(<Labels summary="count" defaultValue={['design', 'copy', 'bug']} />);
    expect(trigger().querySelector('[data-part="value"]')?.textContent).toBe('3 selected');
    expect(defaultSelectedCount(1, 'ar')).toBe('عنصر واحد محدد');
    expect(defaultSelectedCount(2, 'ar')).toBe('عنصرين محددين');
    expect(defaultSelectedCount(3, 'ar')).toBe('3 عناصر محددة');
    expect(defaultSelectedCount(11, 'ar')).toBe('11 عنصر محدد');
    expect(defaultSelectedCount(1, 'en')).toBe('1 selected');
  });

  it('placeholder with no value, in Arabic too', () => {
    render(
      <>
        <Labels />
        <Theme lang="ar">
          <Field label="التصنيفات">
            <MultiSelect items={labels} />
          </Field>
        </Theme>
      </>,
    );
    expect(root().hasAttribute('data-placeholder')).toBe(true);
    expect(trigger().textContent).toContain('Choose options');
    expect(screen.getByRole('combobox', { name: 'التصنيفات' }).textContent).toContain('اختيار من القائمة');
  });

  it('opens with the keyboard; Space toggles, Enter closes and focus returns', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Labels onValueChange={onValueChange} />);
    trigger().focus();
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(popup()).not.toBeNull());
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(popup()?.getAttribute('data-state')).toBe('open');
    expect(popup()?.closest('[data-ds="theme"][data-menu-layer]')).not.toBeNull();
    const list = popup()?.querySelector('[data-ds="list-box"]');
    expect(list?.getAttribute('aria-multiselectable')).toBe('true');
    expect(list?.getAttribute('aria-labelledby')).toBe(trigger().getAttribute('aria-labelledby'));
    await waitFor(() => expect(document.activeElement?.getAttribute('role')).toBe('option'));
    await user.keyboard(' ');
    expect(onValueChange).toHaveBeenLastCalledWith(['design']);
    await user.keyboard('{ArrowDown} ');
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'research']);
    await user.keyboard('{Enter}');
    await waitFor(() => expect(popup()).toBeNull());
    expect(document.activeElement).toBe(trigger());
  });

  it('Ctrl+A selects every enabled option; Clear selection empties it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Labels onValueChange={onValueChange} defaultOpen />);
    await waitFor(() => expect(popup()).not.toBeNull());
    option('design')?.focus();
    await user.keyboard('{Control>}a{/Control}');
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'research', 'copy', 'bug']);
    await user.click(popup()?.querySelector('[data-part="clear"]') as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it('Select all picks the shown enabled options', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Labels onValueChange={onValueChange} defaultOpen />);
    await waitFor(() => expect(popup()).not.toBeNull());
    await user.click(popup()?.querySelector('[data-part="select-all"]') as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith(['design', 'research', 'copy', 'bug']);
  });

  it('search filters the list, ArrowDown moves into it, and it does not take the Field id', async () => {
    const user = userEvent.setup();
    render(
      <Field label="Cities">
        <MultiSelect items={citySections('en')} defaultOpen />
      </Field>,
    );
    await waitFor(() => expect(popup()).not.toBeNull());
    const search = popup()?.querySelector<HTMLInputElement>('[data-part="search"] input');
    expect(search).not.toBeNull();
    expect(search?.getAttribute('aria-label')).toBe('Search options');
    const fieldTrigger = document.querySelector('[data-part="trigger"]');
    expect(search?.id).not.toBe(fieldTrigger?.id);
    await waitFor(() => expect(document.activeElement).toBe(search));
    await user.keyboard('abh');
    const options = popup()?.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(1);
    expect(options?.[0]?.querySelector('mark')?.textContent).toBe('Abh');
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement?.getAttribute('role')).toBe('option');
  });

  it('Tab stays in the popup; Escape closes', async () => {
    const user = userEvent.setup();
    render(<Labels defaultOpen defaultValue={['design']} />);
    await waitFor(() => expect(popup()).not.toBeNull());
    for (let i = 0; i < 4; i += 1) {
      await user.tab();
      expect(popup()?.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard('{Escape}');
    await waitFor(() => expect(popup()).toBeNull());
  });

  it('read only and disabled do not open', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Labels readOnly defaultValue={['design']} />
        <Field label="Other" disabled>
          <MultiSelect items={labels} />
        </Field>
      </>,
    );
    expect(root().hasAttribute('data-readonly')).toBe(true);
    expect(trigger().getAttribute('aria-readonly')).toBe('true');
    await user.click(trigger());
    await user.keyboard('{Enter}');
    expect(popup()).toBeNull();
    const other = screen.getByRole('combobox', { name: 'Other' });
    expect(other.getAttribute('aria-disabled')).toBe('true');
    expect(other.tabIndex).toBe(-1);
    expect(other.closest('[data-ds="multi-select"]')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('follows the Field error and submits each value under name', () => {
    const { container } = render(
      <form>
        <Field label="Labels" error="Choose one">
          <MultiSelect items={labels} name="labels" defaultValue={['design', 'bug']} />
        </Field>
      </form>,
    );
    expect(root().hasAttribute('data-invalid')).toBe(true);
    expect(trigger().getAttribute('aria-invalid')).toBe('true');
    expect(new FormData(container.querySelector('form') as HTMLFormElement).getAll('labels')).toEqual(['design', 'bug']);
  });

  it('controlled value follows the prop', () => {
    const { rerender } = render(<Labels value={['bug']} />);
    expect(root().querySelector('[data-part="tag"]')?.textContent).toBe('Bug');
    rerender(<Labels value={[]} />);
    expect(root().hasAttribute('data-placeholder')).toBe(true);
  });

  it('Select all and Clear selection leave a chosen disabled option in place', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Labels defaultValue={['legal']} onValueChange={onValueChange} defaultOpen />);
    await waitFor(() => expect(popup()).not.toBeNull());
    const clear = popup()?.querySelector('[data-part="clear"]') as HTMLElement;
    expect(clear.getAttribute('aria-disabled')).toBe('true');
    await user.click(popup()?.querySelector('[data-part="select-all"]') as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith(['legal', 'design', 'research', 'copy', 'bug']);
    await user.click(popup()?.querySelector('[data-part="clear"]') as HTMLElement);
    expect(onValueChange).toHaveBeenLastCalledWith(['legal']);
  });

  it('a press on the Field label focuses the trigger', async () => {
    const user = userEvent.setup();
    render(<Labels />);
    await user.click(screen.getByText('Labels'));
    expect(document.activeElement).toBe(trigger());
  });

  it('the demo renders every content case', () => {
    render(<MultiSelectDemo />);
    const ids = [...document.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
  });
});
