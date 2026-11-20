import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { colorSwatchGrid } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import ColorPickerDemo from './ColorPicker.demo';
import { ColorPicker } from './index';

const ARABIC_INDIC = /[٠-٩۰-۹]/;
const inline = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-picker"][data-variant="inline"]')!;
type EyeWindow = { EyeDropper?: unknown };

afterEach(() => {
  delete (window as unknown as EyeWindow).EyeDropper;
});

describe('ColorPicker', () => {
  it('renders the inline anatomy: views, opacity and the footer', () => {
    const { container } = render(<ColorPicker variant="inline" defaultValue="#2e90fa" locale="en" />);
    const el = inline(container);
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Colour');
    for (const part of ['views', 'opacity', 'footer', 'preview', 'saved']) expect(el.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    expect(el.querySelector('[data-part="views"]')!.getAttribute('data-ds')).toBe('tabs');
    expect(el.querySelector('[data-part="opacity"]')!.getAttribute('data-ds')).toBe('color-slider');
    const tabs = within(el).getAllByRole('tab').map((t) => t.textContent);
    expect(tabs).toEqual(['Grid', 'Spectrum', 'Sliders']);
    // The grid view is first: the system palette, 120 swatches.
    expect(el.querySelectorAll('[data-part="views"] [data-ds="color-swatch-picker"] [role="option"]').length).toBe(120);
  });

  it('hides the eyedropper where the browser has none, and shows it where it has one', () => {
    const { container, unmount } = render(<ColorPicker variant="inline" locale="en" />);
    expect(inline(container).querySelector('[data-part="eyedropper"]')).toBeNull();
    unmount();
    (window as unknown as EyeWindow).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#ff0000' });
      }
    };
    render(<ColorPicker variant="inline" locale="en" />);
    expect(screen.getByRole('button', { name: 'Pick a colour from the screen' })).toBeTruthy();
  });

  it('takes the colour picked from the screen and keeps the opacity', async () => {
    (window as unknown as EyeWindow).EyeDropper = class {
      open() {
        return Promise.resolve({ sRGBHex: '#ff0000' });
      }
    };
    const onChange = vi.fn();
    render(<ColorPicker variant="inline" defaultValue="#2e90fa80" onChange={onChange} locale="en" />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pick a colour from the screen' }));
    });
    expect(onChange).toHaveBeenLastCalledWith('#ff000080', expect.anything());
  });

  it('picks from the grid, keeping the opacity, and names the preview', async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker variant="inline" defaultValue="#ffffffcc" onChange={onChange} locale="en" />);
    const pick = colorSwatchGrid()[4]![4]!;
    const grid = inline(container).querySelector<HTMLElement>('[data-part="views"] [role="listbox"]')!;
    const options = within(grid).getAllByRole('option');
    await userEvent.click(options[4 * 12 + 4]!);
    expect(onChange).toHaveBeenLastCalledWith(`${pick}cc`, expect.anything());
    const preview = inline(container).querySelector('[data-part="preview"]')!;
    expect(preview.getAttribute('aria-label')).toMatch(/current colour$/);
  });

  it('switches views with the tabs and moves the spectrum with the keys', async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker variant="inline" defaultValue="hsb(214, 60%, 80%)" onChange={onChange} locale="en" />);
    await userEvent.click(screen.getByRole('tab', { name: 'Spectrum' }));
    const area = inline(container).querySelector('[data-ds="color-area"]')!;
    expect(area).not.toBeNull();
    expect(inline(container).querySelector('[data-part="views"] [data-ds="color-slider"]')).not.toBeNull();
    const x = area.querySelector('input')!;
    act(() => x.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(x.value).toBe('61');
    expect(onChange).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('tab', { name: 'Sliders' }));
    const sliders = inline(container).querySelectorAll('[data-part="views"] [data-ds="color-slider"]');
    expect([...sliders].map((s) => s.querySelector('[data-part="label"]')!.textContent)).toEqual(['Red', 'Green', 'Blue']);
    expect(inline(container).querySelector('[data-part="views"] [data-ds="color-field"]')).not.toBeNull();
  });

  it('keeps the hue of a grey while the spectrum moves to no saturation', async () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker variant="inline" defaultValue="hsb(214, 1%, 80%)" defaultView="spectrum" onChange={onChange} locale="en" />);
    const x = inline(container).querySelector<HTMLInputElement>('[data-ds="color-area"] input')!;
    act(() => x.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(x.value).toBe('0');
    const hue = inline(container).querySelector<HTMLInputElement>('[data-part="views"] [data-ds="color-slider"] input')!;
    expect(hue.value).toBe('214');
  });

  it('saves the colour now to the saved row, once', async () => {
    const onSaved = vi.fn();
    render(<ColorPicker variant="inline" defaultValue="#7a5af8" defaultSavedColors={['#12b76a']} onSavedColorsChange={onSaved} locale="en" />);
    const save = screen.getByRole('button', { name: 'Save colour' });
    await userEvent.click(save);
    expect(onSaved).toHaveBeenLastCalledWith(['#12b76a', '#7a5af8']);
    await userEvent.click(save);
    expect(onSaved).toHaveBeenCalledTimes(1);
    const saved = screen.getByRole('listbox', { name: 'Saved colours' });
    expect(within(saved).getAllByRole('option').length).toBe(2);
  });

  it('compact on web: a swatch button named by the label and the colour opens a popover', async () => {
    render(
      <Theme platform="web">
        <ColorPicker label="Note colour" defaultValue="#2e90fa" defaultView="spectrum" locale="en" />
      </Theme>,
    );
    const trigger = screen.getByRole('button', { name: /^Note colour, Blue/ });
    expect(trigger.getAttribute('data-part')).toBe('trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const pop = document.querySelector('[data-ds="popover"]')!;
    expect(pop).not.toBeNull();
    expect(pop.querySelector('[data-ds="color-picker"][data-variant="inline"]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('compact on ios: the panel opens in a sheet', async () => {
    render(
      <Theme platform="ios">
        <ColorPicker label="Note colour" defaultValue="#2e90fa" defaultView="spectrum" locale="en" />
      </Theme>,
    );
    await userEvent.click(screen.getByRole('button', { name: /^Note colour/ }));
    const sheet = document.querySelector('[data-ds="sheet"]')!;
    expect(sheet).not.toBeNull();
    expect(sheet.querySelector('[data-ds="color-picker"][data-variant="inline"]')).not.toBeNull();
  });

  it('uses Arabic words with Western digits under ar-SA', () => {
    const { container } = render(<ColorPicker variant="inline" defaultValue="#d92d20" defaultView="spectrum" locale="ar-SA" />);
    const el = inline(container);
    expect(el.getAttribute('aria-label')).toBe('اللون');
    expect(within(el).getAllByRole('tab').map((t) => t.textContent)).toEqual(['شبكة', 'طيف', 'المنزلقات']);
    expect(within(el).getByRole('button', { name: 'حفظ اللون' })).toBeTruthy();
    expect(ARABIC_INDIC.test(el.textContent ?? '')).toBe(false);
    for (const input of el.querySelectorAll('input')) expect(ARABIC_INDIC.test(input.getAttribute('aria-valuetext') ?? '')).toBe(false);
  });

  it('disables every control and stamps data-disabled', () => {
    const { container } = render(<ColorPicker variant="inline" defaultView="spectrum" disabled locale="en" />);
    const el = inline(container);
    expect(el.hasAttribute('data-disabled')).toBe(true);
    for (const input of el.querySelectorAll('input')) expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it('renders every demo case', () => {
    const { container } = render(<ColorPickerDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']);
    const sizes = [...container.querySelectorAll('[data-demo-case="variants"] [data-ds="color-picker"]')].map((n) => n.getAttribute('data-size'));
    expect(sizes).toEqual(['sm', 'md', 'lg']);
  });
});
