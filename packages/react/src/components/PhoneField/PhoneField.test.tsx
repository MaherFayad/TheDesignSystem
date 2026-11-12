import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field/Field';
import PhoneFieldDemo from './PhoneField.demo';
import { PhoneField } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="phone-field"]');
  if (!el) throw new Error('no phone field root');
  return el;
}

const arabicDigits = (latin: string) => latin.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));

describe('PhoneField', () => {
  it('renders a box with the dial code, a country select and a tel input', () => {
    const { container } = render(<PhoneField aria-label="Mobile number" />);
    const box = root(container);
    expect(box.getAttribute('data-size')).toBe('md');
    expect(box.getAttribute('data-shape')).toBe('default');
    const code = box.querySelector('[data-part="code"]');
    expect(code?.textContent).toContain('+966');
    const select = screen.getByRole('combobox', { name: 'Country code' }) as HTMLSelectElement;
    expect(select.getAttribute('data-part')).toBe('country');
    expect(select.value).toBe('SA');
    const input = screen.getByRole('textbox', { name: 'Mobile number' });
    expect(input.getAttribute('data-part')).toBe('control');
    expect(input.getAttribute('type')).toBe('tel');
    expect(input.getAttribute('autocomplete')).toBe('tel-national');
    expect(input.getAttribute('inputmode')).toBe('tel');
    expect(input.getAttribute('dir')).toBe('ltr');
    expect(input.getAttribute('placeholder')).toBe('50 123 4567');
  });

  it('lists the Gulf first, then every other country', () => {
    render(<PhoneField aria-label="Mobile number" />);
    const select = screen.getByRole('combobox', { name: 'Country code' });
    const groups = select.querySelectorAll('optgroup');
    expect(groups).toHaveLength(2);
    expect(groups[0]?.getAttribute('label')).toBe('Gulf');
    expect(Array.from(groups[0]?.querySelectorAll('option') ?? []).map((o) => o.value)).toEqual(['SA', 'AE', 'KW', 'QA', 'BH', 'OM']);
    expect(groups[1]?.querySelectorAll('option').length).toBeGreaterThan(200);
    expect(groups[0]?.querySelector('option')?.textContent).toContain('Saudi Arabia');
  });

  it('names the countries and the picker in Arabic inside an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <PhoneField aria-label="رقم الجوال" />
      </Theme>,
    );
    const select = screen.getByRole('combobox', { name: 'رمز الدولة' });
    expect(select.querySelector('optgroup')?.getAttribute('label')).toBe('دول الخليج');
    expect(select.querySelector('option')?.textContent).toContain('السعودية');
  });

  it('maps size and shape, and sets the state attributes', () => {
    for (const size of ['xs', 'sm', 'md', 'lg'] as const) {
      const { container } = render(<PhoneField aria-label={size} size={size} shape="pill" />);
      expect(root(container).getAttribute('data-size')).toBe(size);
      expect(root(container).getAttribute('data-shape')).toBe('pill');
    }
    const { container } = render(<PhoneField aria-label="State" invalid disabled required />);
    const box = root(container);
    expect(box.getAttribute('data-invalid')).toBe('');
    expect(box.getAttribute('data-disabled')).toBe('');
    const input = container.querySelector('input[type="tel"]') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect((container.querySelector('select') as HTMLSelectElement).disabled).toBe(true);
  });

  it('shows no picker when read only', () => {
    const { container } = render(<PhoneField aria-label="Phone" readOnly defaultValue="+97336001234" />);
    expect(root(container).getAttribute('data-readonly')).toBe('');
    expect(container.querySelector('select')).toBeNull();
    expect(container.querySelector('[data-part="code"]')?.textContent).toBe('+973');
    expect((container.querySelector('input') as HTMLInputElement).readOnly).toBe(true);
  });

  it('reads its label and states from a Field', () => {
    render(
      <Field label="Mobile number" description="For sign in codes." invalid>
        <PhoneField />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Mobile number' });
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('formats as it types, drops the trunk 0 and gives E.164', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PhoneField aria-label="Mobile" onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('0501234567');
    expect(input.value).toBe('50 123 4567');
    expect(onValueChange).toHaveBeenLastCalledWith('+966501234567', { country: 'SA', national: '501234567', valid: true });
  });

  it('reads Arabic Indic digits', () => {
    render(<PhoneField aria-label="Mobile" />);
    const input = screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: arabicDigits('501234567') } });
    expect(input.value).toBe('50 123 4567');
  });

  it('sets the country from a pasted +number', async () => {
    const user = userEvent.setup();
    const onCountryChange = vi.fn();
    const onValueChange = vi.fn();
    render(<PhoneField aria-label="Mobile" onCountryChange={onCountryChange} onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement;
    await user.click(input);
    await user.paste('+971 50 123 4567');
    expect(onCountryChange).toHaveBeenCalledWith('AE');
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('AE');
    expect(input.value).toBe('50 123 4567');
    expect(onValueChange).toHaveBeenLastCalledWith('+971501234567', expect.objectContaining({ country: 'AE', valid: true }));
  });

  it('keeps a typed plus until a dial code matches', async () => {
    const user = userEvent.setup();
    render(<PhoneField aria-label="Mobile" />);
    const input = screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement;
    await user.click(input);
    await user.keyboard('+97');
    expect(input.value).toBe('+97');
    await user.keyboard('3');
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('BH');
    expect(input.value).toBe('');
    await user.keyboard('36001234');
    expect(input.value).toBe('3600 1234');
  });

  it('changes the country from the picker and keeps the digits', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PhoneField aria-label="Mobile" defaultValue="+966501234567" onValueChange={onValueChange} />);
    await user.selectOptions(screen.getByRole('combobox'), 'KW');
    const input = screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement;
    expect(input.value).toBe('5012 3456');
    expect(onValueChange).toHaveBeenLastCalledWith('+96550123456', expect.objectContaining({ country: 'KW' }));
    expect(root(document.body).querySelector('[data-part="code"]')?.textContent).toContain('+965');
  });

  it('posts the E.164 number through a hidden input', () => {
    const { container } = render(<PhoneField aria-label="Mobile" name="mobile" defaultValue="+966501234567" />);
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement;
    expect(hidden.name).toBe('mobile');
    expect(hidden.value).toBe('+966501234567');
    expect(screen.getByRole('textbox', { name: 'Mobile' }).getAttribute('name')).toBeNull();
  });

  it('follows a controlled value and country', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('');
      const [country, setCountry] = useState('QA');
      return (
        <>
          <PhoneField aria-label="Mobile" value={value} onValueChange={setValue} country={country} onCountryChange={setCountry} />
          <output data-testid="out">{`${country} ${value}`}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.click(screen.getByRole('textbox', { name: 'Mobile' }));
    await user.keyboard('33123456');
    expect(screen.getByTestId('out').textContent).toBe('QA +97433123456');
    expect((screen.getByRole('textbox', { name: 'Mobile' }) as HTMLInputElement).value).toBe('3312 3456');
  });

  it('sends the ref and native props to the input, className and style to the root', () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(<PhoneField ref={ref} aria-label="Mobile" className="box" rootProps={{ 'data-testid': 'root' } as never} />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Mobile' }));
    expect(root(container).className).toBe('box');
    expect(root(container).getAttribute('data-testid')).toBe('root');
  });

  it('renders the demo with every content case and no bare button', () => {
    const { container } = render(<PhoneFieldDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled', 'readonly']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('[title]')).toBeNull();
  });
});
