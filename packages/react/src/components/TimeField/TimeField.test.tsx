import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasNonLatinDigits } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import TimeFieldDemo from './TimeField.demo';
import { TimeField, formatTime, fromAriaTime, isTimeText, parseTimeText, timeText, toAriaTime } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="time-field"]')!;
const segments = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-part="segment"]'));
const segment = (c: HTMLElement, type: string) => c.querySelector<HTMLElement>(`[data-part="segment"][data-type="${type}"]`)!;

describe('time helpers', () => {
  it('reads and writes 24 hour HH:mm', () => {
    expect(isTimeText('09:41')).toBe(true);
    expect(isTimeText('9:41')).toBe(false);
    expect(isTimeText('24:00')).toBe(false);
    expect(parseTimeText('21:05')).toEqual({ hour: 21, minute: 5 });
    expect(parseTimeText('nope')).toBeNull();
    expect(timeText({ hour: 7, minute: 3 })).toBe('07:03');
    expect(toAriaTime(undefined)).toBeUndefined();
    expect(toAriaTime(null)).toBeNull();
    expect(fromAriaTime(toAriaTime('21:05'))).toBe('21:05');
  });

  it('writes a time in the locale words with Western digits and no marks', () => {
    expect(formatTime({ hour: 21, minute: 5 }, 'en-US', 12)).toBe('9:05 PM');
    expect(formatTime({ hour: 21, minute: 5 }, 'en-GB', 24)).toBe('21:05');
    const ar = formatTime({ hour: 21, minute: 5 }, 'ar-SA', 12);
    expect(ar).toMatch(/^9:05\s?م$/);
    expect(hasNonLatinDigits(ar)).toBe(false);
  });
});

describe('TimeField', () => {
  it('renders the anatomy: hour, minute and the day period in a 12 hour locale', () => {
    const { container } = render(<TimeField aria-label="Start" locale="en-US" defaultValue="21:05" />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(segments(container).map((s) => s.getAttribute('data-type'))).toEqual(['hour', 'minute', 'dayPeriod']);
    expect(segments(container).map((s) => s.textContent)).toEqual(['9', '05', 'PM']);
    expect(el.querySelector('[class*="react-aria"]')).toBeNull();
    expect(segment(container, 'hour').getAttribute('aria-label')).toBe('hour, Start');
  });

  it('takes the hour cycle from the locale, and from hourCycle', () => {
    const gb = render(<TimeField aria-label="t" locale="en-GB" defaultValue="21:05" />).container;
    expect(segments(gb).map((s) => s.textContent)).toEqual(['21', '05']);
    const ar = render(<TimeField aria-label="t" locale="ar-SA" defaultValue="21:05" />).container;
    expect(segments(ar).map((s) => s.textContent)).toEqual(['9', '05', 'م']);
    const ar24 = render(<TimeField aria-label="t" locale="ar-SA" hourCycle={24} defaultValue="21:05" />).container;
    expect(segments(ar24).map((s) => s.textContent)).toEqual(['21', '05']);
  });

  it('reports 24 hour HH:mm from a 12 hour field', async () => {
    const onChange = vi.fn();
    const { container } = render(<TimeField aria-label="t" locale="en-US" defaultValue="11:30" onChange={onChange} />);
    act(() => segment(container, 'hour').focus());
    // The hour wraps inside its day period, as React Aria does: 11 AM up is 12 AM.
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('00:30');
    act(() => segment(container, 'dayPeriod').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('12:30');
  });

  it('is controlled, typed in parts, Arabic Indic digits included', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>(null);
      return (
        <>
          <TimeField aria-label="t" locale="en-GB" value={value} onChange={setValue} />
          <output>{value ?? 'none'}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    act(() => segment(container, 'hour').focus());
    await userEvent.keyboard('٢١٠٥');
    expect(screen.getByRole('status').textContent).toBe('21:05');
  });

  it('marks a time out of bounds invalid and reads a Field', () => {
    const late = render(<TimeField aria-label="t" locale="en-GB" defaultValue="23:30" maxValue="23:00" />).container;
    expect(root(late).getAttribute('data-invalid')).toBe('');
    render(
      <Field label="Pickup time" description="Between 8 and 22">
        <TimeField locale="en-GB" />
      </Field>,
    );
    expect(screen.getByRole('group', { name: 'Pickup time' })).toBeTruthy();
  });

  it('stamps sizes, disabled and read only', async () => {
    const onChange = vi.fn();
    const ro = render(<TimeField aria-label="t" locale="en-GB" size="sm" readOnly defaultValue="09:41" onChange={onChange} />).container;
    expect(root(ro).getAttribute('data-size')).toBe('sm');
    expect(root(ro).getAttribute('data-readonly')).toBe('');
    act(() => segment(ro, 'hour').focus());
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).not.toHaveBeenCalled();
    const off = render(<TimeField aria-label="t" locale="en-GB" disabled defaultValue="09:41" />).container;
    expect(root(off).getAttribute('data-disabled')).toBe('');
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<TimeFieldDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});

describe('TimeField digits stay Latin in ar-SA', () => {
  it('the check itself flags Arabic Indic digits (-u-nu-arab)', () => {
    const arab = new Intl.DateTimeFormat('ar-SA-u-nu-arab', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1, 21, 5)));
    expect(hasNonLatinDigits(arab)).toBe(true);
  });

  it('segments, placeholders, names, value texts, descriptions and announcements', async () => {
    document.body.innerHTML = '';
    const { container } = render(
      <Theme lang="ar">
        <TimeField aria-label="وقت الاستلام" locale="ar-SA" defaultValue="21:05" />
        <TimeField aria-label="وقت البدء" locale="ar-SA" />
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
    act(() => segment(container, 'hour').focus());
    await userEvent.keyboard('{ArrowUp}{ArrowLeft}{ArrowUp}');
    collect();
    texts.push(document.body.textContent ?? '');
    const all = texts.join(' | ');
    expect(all).toMatch(/[0-9]/);
    expect(all).toMatch(/م/);
    expect(hasNonLatinDigits(all), all.slice(0, 400)).toBe(false);
    const labels = segments(container).map((s) => s.getAttribute('aria-label') ?? '');
    expect(labels.every((l) => l.includes('، ') && !l.includes(', '))).toBe(true);
  });
});
