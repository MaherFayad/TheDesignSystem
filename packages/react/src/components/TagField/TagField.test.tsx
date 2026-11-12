import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import TagFieldDemo from './TagField.demo';
import { TagField, type TagFieldProps } from './index';

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

function Tags(props: Partial<TagFieldProps>) {
  return (
    <Field label="Tags">
      <TagField {...props} />
    </Field>
  );
}

const input = () => screen.getByLabelText('Tags', { selector: 'input' });
const root = () => input().closest('[data-ds="tag-field"]') as HTMLElement;
const tagLabels = () => [...root().querySelectorAll('[data-part="tag-label"]')].map((n) => n.textContent);
const remove = (tag: string) => screen.getByRole('button', { name: `Remove tag ${tag}` });
const status = () => root().querySelector('[data-part="status"]')?.textContent;

describe('TagField', () => {
  it('renders the box, tags and parts', () => {
    render(<Tags defaultValue={['Design', 'Copy']} />);
    expect(root().getAttribute('data-size')).toBe('md');
    expect(root().getAttribute('data-shape')).toBe('default');
    expect(input().getAttribute('data-part')).toBe('control');
    expect(root().querySelector('[data-part="tags"]')?.getAttribute('role')).toBe('list');
    expect(tagLabels()).toEqual(['Design', 'Copy']);
    const button = remove('Design');
    expect(button.getAttribute('data-ds')).toBe('close-button');
    expect(button.getAttribute('data-part')).toBe('tag-remove');
    expect(button.tabIndex).toBe(-1);
    expect(input().hasAttribute('role')).toBe(false);
  });

  it('Enter, comma and the Arabic comma add tags; duplicates are dropped and announced', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tags onValueChange={onValueChange} />);
    await user.type(input(), 'design{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(['design']);
    await user.type(input(), 'research,');
    expect(tagLabels()).toEqual(['design', 'research']);
    await user.type(input(), 'بحث،');
    expect(tagLabels()).toEqual(['design', 'research', 'بحث']);
    expect((input() as HTMLInputElement).value).toBe('');
    await user.type(input(), 'Design{Enter}');
    expect(tagLabels()).toEqual(['design', 'research', 'بحث']);
    await waitFor(() => expect(status()).toBe('Design is already added'));
  });

  it('pasting lines and commas adds each part', () => {
    render(<Tags />);
    fireEvent.paste(input(), { clipboardData: { getData: () => 'one, two\nthree' } });
    expect(tagLabels()).toEqual(['one', 'two', 'three']);
  });

  it('Backspace on an empty control focuses the last tag, a second removes it and focus goes back', async () => {
    const user = userEvent.setup();
    render(<Tags defaultValue={['Design', 'Copy']} />);
    await user.click(input());
    await user.keyboard('{Backspace}');
    expect(document.activeElement).toBe(remove('Copy'));
    await user.keyboard('{Backspace}');
    expect(tagLabels()).toEqual(['Design']);
    await waitFor(() => expect(document.activeElement).toBe(remove('Design')));
    await waitFor(() => expect(status()).toBe('Removed tag Copy'));
  });

  it('arrows move between tags in reading order and back to the control', async () => {
    const user = userEvent.setup();
    render(<Tags defaultValue={['A', 'B']} />);
    await user.click(input());
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(remove('B'));
    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(remove('A'));
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(document.activeElement).toBe(input());
  });

  it('in RTL the arrow toward the start is ArrowRight', async () => {
    const user = userEvent.setup();
    render(
      <Theme dir="rtl" lang="ar">
        <Field label="Tags">
          <TagField defaultValue={['أ', 'ب']} />
        </Field>
      </Theme>,
    );
    await user.click(input());
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('حذف الوسم ب');
  });

  it('the remove button removes its tag', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Tags defaultValue={['Design', 'Copy']} onValueChange={onValueChange} />);
    await user.click(remove('Design'));
    expect(onValueChange).toHaveBeenLastCalledWith(['Copy']);
  });

  it('suggestions: a combobox that filters, skips added tags, and adds the chosen one', async () => {
    const user = userEvent.setup();
    render(
      <Tags
        defaultValue={['Design']}
        suggestions={[
          { value: 'd', label: 'Design' },
          { value: 'r', label: 'Research' },
          { value: 'p', label: 'Payments' },
        ]}
      />,
    );
    expect(input().getAttribute('role')).toBe('combobox');
    await user.type(input(), 'e');
    const popup = () => document.querySelector('[data-ds="tag-field"][data-part="popup"]');
    await waitFor(() => expect(popup()).not.toBeNull());
    const labels = [...(popup()?.querySelectorAll('[role="option"]') ?? [])].map((n) => n.textContent);
    expect(labels).toEqual(['Research', 'Payments']);
    await user.keyboard('{ArrowDown}');
    expect(input().getAttribute('aria-activedescendant')).toBeTruthy();
    await user.keyboard('{Enter}');
    expect(tagLabels()).toEqual(['Design', 'Research']);
  });

  it('max stops adding and says so', async () => {
    const user = userEvent.setup();
    render(<Tags max={1} defaultValue={['A']} />);
    await user.type(input(), 'B{Enter}');
    expect(tagLabels()).toEqual(['A']);
    await waitFor(() => expect(status()).toBe('You can add up to 1 tag'));
  });

  it('read only shows no remove button; disabled blocks adding', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Tags readOnly defaultValue={['Design']} />
        <Field label="Other" disabled>
          <TagField defaultValue={['Copy']} />
        </Field>
      </>,
    );
    expect(root().hasAttribute('data-readonly')).toBe(true);
    expect(root().querySelector('[data-part="tag-remove"]')).toBeNull();
    await user.type(input(), 'x{Enter}');
    expect(tagLabels()).toEqual(['Design']);
    const other = screen.getByLabelText('Other', { selector: 'input' }) as HTMLInputElement;
    expect(other.disabled).toBe(true);
    expect(other.closest('[data-ds="tag-field"]')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('submits each tag under name and follows the Field error', () => {
    const { container } = render(
      <form>
        <Field label="Tags" error="Add a tag">
          <TagField name="tags" defaultValue={['a', 'b']} />
        </Field>
      </form>,
    );
    expect(root().hasAttribute('data-invalid')).toBe(true);
    expect(new FormData(container.querySelector('form') as HTMLFormElement).getAll('tags')).toEqual(['a', 'b']);
  });

  it('the demo renders the content cases', () => {
    act(() => {
      render(<TagFieldDemo />);
    });
    const ids = [...document.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});
