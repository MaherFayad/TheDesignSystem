import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Field } from '../Field/Field';
import SearchFieldDemo from './SearchField.demo';
import { SearchField } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="search-field"]');
  if (!el) throw new Error('no search field root');
  return el;
}

describe('SearchField', () => {
  it('renders the box, the icon and a search input as the control', () => {
    const { container } = render(<SearchField aria-label="Search boards" />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    expect(box.hasAttribute('data-empty')).toBe(true);
    const input = screen.getByRole('searchbox', { name: 'Search boards' });
    expect(input.getAttribute('type')).toBe('search');
    expect(input.closest('[data-ds="input"]')?.getAttribute('data-part')).toBe('control');
    expect(box.querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(box.querySelector('[data-part="clear"]')).toBeNull();
  });

  it('maps size and shape', () => {
    const { container } = render(<SearchField aria-label="Search" size="lg" shape="pill" defaultValue="a" />);
    expect(root(container).getAttribute('data-size')).toBe('lg');
    expect(root(container).getAttribute('data-shape')).toBe('pill');
    expect(container.querySelector('[data-part="clear"]')?.getAttribute('data-size')).toBe('sm');
  });

  it('shows the clear button with a query; clearing empties it and focuses the input', () => {
    const onValueChange = vi.fn();
    const onClear = vi.fn();
    const { container } = render(<SearchField aria-label="Search" defaultValue="launch" onValueChange={onValueChange} onClear={onClear} />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    const clear = screen.getByRole('button', { name: 'Clear search' });
    expect(clear.getAttribute('data-part')).toBe('clear');
    fireEvent.click(clear);
    expect(input.value).toBe('');
    expect(onValueChange).toHaveBeenLastCalledWith('');
    expect(onClear).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
    expect(root(container).hasAttribute('data-empty')).toBe(true);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('clears on the first Escape and lets the second bubble', () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={(e) => outer(e.key)}>
        <SearchField aria-label="Search" defaultValue="launch" />
      </div>,
    );
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.value).toBe('');
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(outer).toHaveBeenCalledWith('Escape');
  });

  it('calls onSubmit with the query on Enter', () => {
    const onSubmit = vi.fn();
    render(<SearchField aria-label="Search" defaultValue="launch" onSubmit={onSubmit} />);
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('launch');
  });

  it('works controlled', () => {
    function Controlled() {
      const [q, setQ] = useState('a');
      return (
        <>
          <SearchField aria-label="Search" value={q} onValueChange={setQ} />
          <output>{q}</output>
        </>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ab' } });
    expect(screen.getByText('ab').tagName).toBe('OUTPUT');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input.value).toBe('');
  });

  it('shows the spinner and a polite status while loading', () => {
    const { container } = render(<SearchField aria-label="Search" defaultValue="a" loading loadingLabel="Searching boards" />);
    expect(root(container).hasAttribute('data-loading')).toBe(true);
    expect(container.querySelector('[data-part="end"] [data-part="spinner"]')).not.toBeNull();
    expect(screen.getByRole('status').textContent).toBe('Searching boards');
  });

  it('keeps the end content while loading, after the spinner', () => {
    const { container } = render(<SearchField aria-label="Search" loading end={<button type="button">Filter</button>} />);
    const end = container.querySelector('[data-part="end"]');
    expect(end?.children[0]?.getAttribute('data-part')).toBe('spinner');
    expect(end?.textContent).toBe('Filter');
  });

  it('ignores Enter and Escape that end an IME composition', () => {
    const onSubmit = vi.fn();
    render(<SearchField aria-label="Search" defaultValue="كلمة" onSubmit={onSubmit} />);
    const input = screen.getByRole('searchbox') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter', keyCode: 229 });
    fireEvent.keyDown(input, { key: 'Escape', keyCode: 229 });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input.value).toBe('كلمة');
  });

  it('follows the Field and hides clear while disabled or read only', () => {
    const { container } = render(
      <Field label="Search members" error="Type at least 2 letters." disabled>
        <SearchField defaultValue="s" />
      </Field>,
    );
    const box = root(container);
    expect(box.hasAttribute('data-invalid')).toBe(true);
    expect(box.hasAttribute('data-disabled')).toBe(true);
    const input = screen.getByRole('searchbox', { name: 'Search members' }) as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(container.querySelector('[data-part="clear"]')).toBeNull();
    const ro = render(<SearchField aria-label="Saved" readOnly defaultValue="x" />);
    expect(ro.container.querySelector('[data-part="clear"]')).toBeNull();
    expect(root(ro.container).hasAttribute('data-readonly')).toBe(true);
  });

  it('sends the ref and native props to the input, className and style to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<SearchField ref={ref} aria-label="Search" name="q" className="box" style={{ maxInlineSize: '10rem' }} />);
    expect(ref.current?.getAttribute('name')).toBe('q');
    expect(root(container).className).toBe('box');
    expect(root(container).style.maxInlineSize).toBe('10rem');
  });

  it('renders the demo with every case', () => {
    const { container } = render(<SearchFieldDemo />);
    const ids = Array.from(container.querySelectorAll('[data-demo-case]')).map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']);
  });
});
