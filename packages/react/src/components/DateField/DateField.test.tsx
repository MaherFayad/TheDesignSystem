import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasNonLatinDigits } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import DateFieldDemo from './DateField.demo';
import { DateField } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="date-field"]')!;
const segments = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-part="segment"]'));
const segment = (c: HTMLElement, type: string) => c.querySelector<HTMLElement>(`[data-part="segment"][data-type="${type}"]`)!;

describe('DateField', { timeout: 20_000 }, () => {
  it('renders the anatomy with the system parts and no React Aria classes or "true" data attributes', () => {
    const { container } = render(<DateField aria-label="Birth date" locale="en-GB" defaultValue="2026-11-17" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.querySelector('[data-part="input"]')!.getAttribute('role')).toBe('group');
    expect(segments(container).map((s) => s.getAttribute('data-type'))).toEqual(['day', 'month', 'year']);
    expect(segments(container).map((s) => s.textContent)).toEqual(['17', '11', '2026']);
    expect(el.querySelectorAll('[data-part="literal"]').length).toBe(2);
    expect(el.querySelector('[class*="react-aria"]')).toBeNull();
    expect(el.querySelector('[data-rac]:not(input)')).toBeNull();
    expect(Array.from(el.querySelectorAll('*')).some((n) => Array.from(n.attributes).some((a) => a.name.startsWith('data-') && a.value === 'true'))).toBe(false);
    expect(segment(container, 'day').getAttribute('aria-label')).toBe('day, Birth date');
  });

  it('takes the segment order and separators from Intl', () => {
    const us = render(<DateField aria-label="d" locale="en-US" defaultValue="2026-11-17" />).container;
    expect(segments(us).map((s) => s.getAttribute('data-type'))).toEqual(['month', 'day', 'year']);
    const ar = render(<DateField aria-label="d" locale="ar-SA" defaultValue="2026-11-17" />).container;
    expect(segments(ar).map((s) => s.getAttribute('data-type'))).toEqual(['day', 'month', 'year']);
    expect(ar.querySelector('[data-part="literal"]')!.textContent).toContain('/');
  });

  it('marks empty segments with data-placeholder', () => {
    const { container } = render(<DateField aria-label="Expiry date" locale="en-GB" />);
    expect(segments(container).every((s) => s.getAttribute('data-placeholder') === '')).toBe(true);
    expect(segment(container, 'day').textContent).toBe('dd');
  });

  it('steps a segment with the arrow keys and reports ISO dates', async () => {
    const onChange = vi.fn();
    const { container } = render(<DateField aria-label="Date" locale="en-GB" defaultValue="2026-11-17" onChange={onChange} />);
    act(() => segment(container, 'day').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-18');
    await userEvent.keyboard('{ArrowRight}{ArrowDown}');
    expect(onChange).toHaveBeenLastCalledWith('2026-10-18');
  });

  it('is controlled with ISO values, typed in parts', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <DateField aria-label="Date" locale="en-GB" value={value} onChange={setValue} />
          <output>{value ?? 'none'}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    act(() => segment(container, 'day').focus());
    await userEvent.keyboard('18062026');
    expect(screen.getByRole('status').textContent).toBe('2026-06-18');
  });

  it('reads digits typed on an Arabic keyboard as Western digits', async () => {
    const onChange = vi.fn();
    const { container } = render(<DateField aria-label="التاريخ" locale="ar-SA" onChange={onChange} />);
    act(() => segment(container, 'day').focus());
    await userEvent.keyboard('١٨٠٦٢٠٢٦');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-18');
  });

  it('round trips Umm al-Qura to the same ISO Gregorian date, with the era segment', async () => {
    const onChange = vi.fn();
    const { container } = render(<DateField aria-label="التاريخ" locale="ar-SA" calendar="islamic-umalqura" defaultValue="2026-11-17" onChange={onChange} />);
    // 7 Jumada II 1448 is 17 November 2026.
    expect(segments(container).map((s) => s.textContent)).toEqual(['7', '6', '1448', 'هـ']);
    act(() => segment(container, 'day').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-18');
  });

  it('marks a date out of bounds or unavailable invalid', () => {
    const late = render(<DateField aria-label="d" locale="en-GB" defaultValue="2027-01-14" maxValue="2026-12-31" />).container;
    expect(root(late).getAttribute('data-invalid')).toBe('');
    const off = render(<DateField aria-label="d" locale="en-GB" defaultValue="2026-11-13" isDateUnavailable={(iso) => iso === '2026-11-13'} />).container;
    expect(root(off).getAttribute('data-invalid')).toBe('');
    const ok = render(<DateField aria-label="d" locale="en-GB" defaultValue="2026-11-17" maxValue="2026-12-31" />).container;
    expect(root(ok).hasAttribute('data-invalid')).toBe(false);
  });

  it('reads its name, description and error from a Field', () => {
    render(
      <Field label="Appointment date" description="Within the next month" error="Pick a later date.">
        <DateField locale="en-GB" />
      </Field>,
    );
    const group = screen.getByRole('group', { name: 'Appointment date' });
    expect(group.getAttribute('aria-describedby')).toBeTruthy();
    const described = group.getAttribute('aria-describedby')!.split(' ').map((id) => document.getElementById(id)?.textContent).join(' ');
    expect(described).toContain('Within the next month');
    expect(described).toContain('Pick a later date.');
    expect(group.closest('[data-ds="date-field"]')!.getAttribute('data-invalid')).toBe('');
  });

  it('stamps sizes, disabled and read only', async () => {
    const onChange = vi.fn();
    const ro = render(<DateField aria-label="d" locale="en-GB" size="lg" readOnly defaultValue="2026-11-17" onChange={onChange} />).container;
    expect(root(ro).getAttribute('data-size')).toBe('lg');
    expect(root(ro).getAttribute('data-readonly')).toBe('');
    act(() => segment(ro, 'day').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
    const off = render(<DateField aria-label="d" locale="en-GB" disabled defaultValue="2026-11-17" />).container;
    expect(root(off).getAttribute('data-disabled')).toBe('');
    expect(segment(off, 'day').getAttribute('aria-disabled')).toBe('true');
  });

  it('carries the ISO date in a hidden input named by name', () => {
    const { container } = render(<DateField aria-label="d" locale="en-GB" defaultValue="2026-11-17" name="birth" />);
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"][name="birth"]')!.value).toBe('2026-11-17');
  });

  it('defaults the locale to the nearest Theme language', () => {
    const { container } = render(
      <Theme lang="ar">
        <DateField aria-label="التاريخ" defaultValue="2026-11-17" />
      </Theme>,
    );
    expect(segment(container, 'month').getAttribute('aria-label')).toBe('الشهر، التاريخ');
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<DateFieldDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});

describe('DateField digits stay Latin in ar-SA', { timeout: 20_000 }, () => {
  it('the check itself flags Arabic Indic digits (-u-nu-arab)', () => {
    const arab = new Intl.DateTimeFormat('ar-SA-u-nu-arab', { day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 10, 17)));
    expect(hasNonLatinDigits(arab)).toBe(true);
  });

  for (const calendar of ['gregory', 'islamic-umalqura'] as const) {
    it(`segments, placeholders, names, value texts, descriptions and announcements, ${calendar}`, async () => {
      document.body.innerHTML = '';
      const { container } = render(
        <Theme lang="ar">
          <DateField aria-label="تاريخ الميلاد" locale="ar-SA" calendar={calendar} defaultValue="2026-11-17" />
          <DateField aria-label="تاريخ الانتهاء" locale="ar-SA" calendar={calendar} />
        </Theme>,
      );
      const texts: string[] = [];
      const collect = () => {
        texts.push(container.textContent ?? '');
        for (const node of container.querySelectorAll('[aria-label], [aria-valuetext]')) {
          texts.push(node.getAttribute('aria-label') ?? '', node.getAttribute('aria-valuetext') ?? '');
        }
      };
      collect();
      // A step makes React Aria describe the new date in a hidden description.
      act(() => segment(container, 'day').focus());
      await userEvent.keyboard('{ArrowUp}{ArrowRight}{ArrowUp}');
      collect();
      texts.push(document.body.textContent ?? '');
      const all = texts.join(' | ');
      expect(all).toMatch(/[0-9]/);
      expect(hasNonLatinDigits(all), all.slice(0, 400)).toBe(false);
      // The Arabic comma, never a Latin one, between a segment name and the field name.
      const labels = Array.from(container.querySelectorAll('[data-part="segment"]')).map((s) => s.getAttribute('aria-label') ?? '');
      expect(labels.every((l) => l.includes('، ') && !l.includes(', '))).toBe(true);
      // No dash in any value text.
      expect(Array.from(container.querySelectorAll('[aria-valuetext]')).some((s) => /\s\p{Pd}\s/u.test(s.getAttribute('aria-valuetext') ?? ''))).toBe(false);
    });
  }
});
