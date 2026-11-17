import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import ColorAreaDemo from './ColorArea.demo';
import { colorAreaValueText } from '@the-system/shared';
import { ColorArea } from './index';
import { parseColor } from 'react-aria-components';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="color-area"]')!;
const ARABIC_INDIC = /[٠-٩۰-۹]/;
const plain = (s: string | null) => (s ?? '').replace(/[‎‏]/g, '');

describe('ColorArea', () => {
  it('renders the anatomy with no React Aria classes or data attributes', () => {
    const { container } = render(<ColorArea defaultValue="hsb(214, 60%, 80%)" locale="en" />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Saturation and brightness');
    expect(el.querySelector('[data-part="thumb"]')).not.toBeNull();
    expect(el.querySelectorAll('input[type="range"]').length).toBe(2);
    expect(el.querySelector('[class]')).toBeNull();
    expect(el.querySelector('[data-rac]')).toBeNull();
    expect(el.hasAttribute('data-disabled')).toBe(false);
  });

  it('names each input by its channel with the system words, never React Aria words', () => {
    render(<ColorArea defaultValue="hsb(214, 60%, 80%)" locale="en" />);
    const [x, y] = [...document.querySelectorAll<HTMLInputElement>('[data-ds="color-area"] input')];
    expect(x!.getAttribute('aria-label')).toBe('Saturation');
    expect(y!.getAttribute('aria-label')).toBe('Brightness');
    expect(x!.getAttribute('aria-roledescription')).toBe('2D slider');
    expect(x!.getAttribute('aria-valuetext')).toBe('Saturation 60%, Brightness 80%, Blue');
    expect(y!.getAttribute('aria-valuetext')).toBe('Brightness 80%, Saturation 60%, Blue');
  });

  it('gives the gradient and the thumb colour as custom properties', () => {
    const { container } = render(<ColorArea defaultValue="hsb(214, 60%, 80%)" locale="en" />);
    const el = root(container);
    const thumb = el.querySelector<HTMLElement>('[data-part="thumb"]')!;
    expect(el.style.getPropertyValue('--_color-area-fill')).toMatch(/linear-gradient\(to right/);
    expect(el.style.getPropertyValue('--_color-area-blend')).toBe('normal');
    expect(el.style.background).toBe('');
    expect(thumb.style.getPropertyValue('--_color-area-thumb-bg')).not.toBe('');
    expect(thumb.style.backgroundColor).toBe('');
  });

  it('keeps Arabic words and order with Western digits in ar-SA, and runs from the right', () => {
    const { container } = render(<ColorArea defaultValue="hsb(214, 60%, 80%)" locale="ar-SA" />);
    const el = root(container);
    expect(el.getAttribute('aria-label')).toBe('التشبع والسطوع');
    const [x] = screen.getAllByRole('slider');
    expect(x!.getAttribute('aria-label')).toBe('التشبع');
    expect(x!.getAttribute('aria-roledescription')).toBe('منزلق ثنائي الاتجاه');
    expect(plain(x!.getAttribute('aria-valuetext'))).toBe('التشبع 60%، السطوع 80%، أزرق');
    expect(ARABIC_INDIC.test(x!.getAttribute('aria-valuetext') ?? '')).toBe(false);
    expect(el.style.getPropertyValue('--_color-area-fill')).toMatch(/to left/);
  });

  it('moves both channels with the keys, the path that needs no drag', async () => {
    const onChange = vi.fn();
    render(<ColorArea defaultValue="hsb(214, 60%, 80%)" locale="en" onChange={onChange} />);
    const [x, y] = [...document.querySelectorAll<HTMLInputElement>('[data-ds="color-area"] input')];
    act(() => x!.focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(x!.value).toBe('61');
    await userEvent.keyboard('{ArrowUp}');
    expect(y!.value).toBe('81');
    await userEvent.keyboard('{PageDown}');
    expect(y!.value).toBe('71');
    await userEvent.keyboard('{End}');
    expect(Number(x!.value)).toBeGreaterThan(61);
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.lastCall![0]).toMatch(/^hsb\(214, /);
    expect(x!.getAttribute('aria-valuetext')).toMatch(/^Saturation \d+%, Brightness 71%, /);
  });

  it('mirrors the channel across in right to left: ArrowLeft goes up, ArrowRight down', async () => {
    render(
      <Theme lang="ar">
        <ColorArea defaultValue="hsb(214, 60%, 80%)" />
      </Theme>,
    );
    const [x] = screen.getAllByRole('slider') as HTMLInputElement[];
    act(() => x!.focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(x!.value).toBe('61');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(x!.value).toBe('59');
  });

  it('takes a name and the rgb space, and stamps disabled', () => {
    const { container } = render(
      <ColorArea defaultValue="rgb(200, 60, 120)" colorSpace="rgb" xChannel="red" yChannel="green" aria-label="Red and green" disabled locale="en" />,
    );
    const el = root(container);
    expect(el.getAttribute('aria-label')).toBe('Red and green');
    expect(el.hasAttribute('data-disabled')).toBe(true);
    expect(el.style.getPropertyValue('--_color-area-blend')).toBe('screen');
    const [x] = screen.getAllByRole('slider');
    expect(x!.getAttribute('aria-label')).toBe('Red');
    expect((x as HTMLInputElement).disabled).toBe(true);
  });

  it('writes the value text from any Color', () => {
    const c = parseColor('hsb(0, 100%, 100%)');
    expect(colorAreaValueText(c, 'saturation', 'brightness', 'en-u-nu-latn')).toBe('Saturation 100%, Brightness 100%, Red');
  });

  it('renders every demo case', () => {
    const { container } = render(<ColorAreaDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'long-text', 'long-arabic', 'disabled']);
    expect(ARABIC_INDIC.test(container.textContent ?? '')).toBe(false);
  });
});
