import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasNonLatinDigits } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import { Field } from '../Field';
import DatePickerDemo from './DatePicker.demo';
import { DatePicker, formatChipDate, splitDateTime } from './index';

type Platform = 'web' | 'ios' | 'android';
const on = (platform: Platform, node: ReactNode, lang: 'en' | 'ar' = 'en') =>
  render(
    <Theme platform={platform} lang={lang}>
      {node}
    </Theme>,
  );
const picker = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="date-picker"]')!;
const part = (c: HTMLElement, name: string) => c.querySelector<HTMLElement>(`[data-ds="date-picker"] [data-part="${name}"]`)!;
const openDay = (text: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-part="day"]')).find((d) => d.textContent === text && !d.hasAttribute('data-outside-month'))!;

describe('value helpers', { timeout: 20_000 }, () => {
  it('splits a value into the ISO date and the HH:mm time', () => {
    expect(splitDateTime('2026-11-17')).toEqual({ date: '2026-11-17', time: null });
    expect(splitDateTime('2026-11-17T09:41')).toEqual({ date: '2026-11-17', time: '09:41' });
    expect(splitDateTime('2026-11-17T09:41:30')).toEqual({ date: '2026-11-17', time: '09:41' });
    expect(splitDateTime('2026-02-30')).toEqual({ date: null, time: null });
    expect(splitDateTime(null)).toEqual({ date: null, time: null });
  });

  it('writes the chip date from Intl in both calendars with Western digits', () => {
    expect(formatChipDate('2026-06-18', 'en-GB', 'gregory')).toBe('18 Jun 2026');
    expect(formatChipDate('2026-11-17', 'ar-SA', 'gregory')).toBe('17 نوفمبر 2026');
    const hijri = formatChipDate('2026-11-17', 'ar-SA', 'islamic-umalqura');
    expect(hijri).toMatch(/^7 جمادى الآخرة 1448/);
    expect(hasNonLatinDigits(hijri)).toBe(false);
  });
});

describe('DatePicker, compact', { timeout: 20_000 }, () => {
  it('renders the label and two chips named by word and value on ios', () => {
    const { container } = on('ios', <DatePicker label="Starts" locale="en-GB" granularity="minute" defaultValue="2026-06-18T09:41" />);
    const root = picker(container);
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('data-variant')).toBe('compact');
    expect(screen.getByRole('group', { name: 'Starts' })).toBe(root);
    const date = part(container, 'date');
    expect(date.getAttribute('data-ds')).toBe('button');
    expect(date.getAttribute('aria-label')).toBe('Date, 18 Jun 2026');
    expect(date.textContent).toBe('18 Jun 2026');
    expect(date.getAttribute('aria-haspopup')).toBe('dialog');
    const time = part(container, 'time');
    expect(time.getAttribute('data-ds')).toBe('button');
    expect(time.getAttribute('aria-label')).toBe('Time, 09:41');
  });

  it('draws the time as TimeField segments on web', () => {
    const { container } = on('web', <DatePicker label="Starts" locale="en-US" granularity="minute" defaultValue="2026-06-18T21:05" />);
    const time = part(container, 'time');
    expect(time.getAttribute('data-ds')).toBe('time-field');
    expect(Array.from(time.querySelectorAll('[data-part="segment"]')).map((s) => s.textContent)).toEqual(['9', '05', 'PM']);
  });

  it('shows Add date and Add time while empty, with the placeholder state', () => {
    const { container } = on('ios', <DatePicker label="Reminder" locale="en-GB" granularity="minute" />);
    expect(part(container, 'date').textContent).toBe('Add date');
    expect(part(container, 'date').getAttribute('data-placeholder')).toBe('');
    expect(part(container, 'time').getAttribute('aria-label')).toBe('Add time');
  });

  it('opens the Calendar in a popover on the picked day; a pick closes it and focus goes back to the chip', async () => {
    const onChange = vi.fn();
    const { container } = on('ios', <DatePicker label="Date" locale="en-GB" defaultValue="2026-11-17" onChange={onChange} />);
    const chip = part(container, 'date');
    await userEvent.click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    const popover = document.querySelector('[data-ds="popover"]')!;
    expect(popover.getAttribute('aria-label')).toBe('Date');
    expect(document.activeElement?.getAttribute('data-part')).toBe('day');
    expect(document.activeElement?.textContent).toBe('17');
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-11-18');
    await waitFor(() => expect(document.querySelector('[data-ds="popover"]')).toBeNull());
    expect(document.activeElement).toBe(chip);
    expect(chip.getAttribute('aria-label')).toBe('Date, 18 Nov 2026');
  });

  it('closes on Escape and returns focus to the chip, the value kept', async () => {
    const { container } = on('web', <DatePicker label="Date" locale="en-GB" defaultValue="2026-11-17" />);
    const chip = part(container, 'date');
    act(() => chip.focus());
    await userEvent.keyboard('{Enter}');
    expect(document.querySelector('[data-ds="popover"]')).not.toBeNull();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[data-ds="popover"]')).toBeNull());
    expect(document.activeElement).toBe(chip);
    expect(chip.textContent).toBe('17 Nov 2026');
  });

  it('opens the wheel for the time on ios; a step keeps the date (no asking twice)', async () => {
    const onChange = vi.fn();
    const { container } = on('ios', <DatePicker label="Starts" locale="en-US" granularity="minute" defaultValue="2026-06-18T21:05" onChange={onChange} />);
    await userEvent.click(part(container, 'time'));
    const wheel = document.querySelector('[data-ds="popover"] [data-ds="wheel-picker"]')!;
    expect(wheel).not.toBeNull();
    expect(document.activeElement?.getAttribute('role')).toBe('spinbutton');
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Hours');
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-18T22:05');
    expect(part(container, 'time').getAttribute('aria-label')).toBe('Time, 10:05 PM');
    expect(part(container, 'date').textContent).toBe('Jun 18, 2026');
  });

  it('uses dialogs on android: the Calendar, and a TimeField with no dial', async () => {
    const onChange = vi.fn();
    const { container } = on('android', <DatePicker label="Starts" locale="en-GB" granularity="minute" defaultValue="2026-06-18T09:41" onChange={onChange} />);
    await userEvent.click(part(container, 'date'));
    const dialog = document.querySelector('[data-ds="dialog"]')!;
    expect(dialog.querySelector('[data-ds="calendar"]')).not.toBeNull();
    expect(screen.getByRole('dialog', { name: 'Date' })).toBeTruthy();
    await userEvent.click(openDay('20'));
    expect(onChange).toHaveBeenLastCalledWith('2026-06-20T09:41');
    await waitFor(() => expect(document.querySelector('[data-ds="dialog"]')).toBeNull());
    await userEvent.click(part(container, 'time'));
    const timeDialog = document.querySelector('[data-ds="dialog"]')!;
    expect(timeDialog.querySelector('[data-ds="time-field"]')).not.toBeNull();
    expect(timeDialog.querySelector('[data-ds="wheel-picker"]')).toBeNull();
    expect(document.activeElement?.getAttribute('data-type')).toBe('hour');
    await userEvent.keyboard('{ArrowUp}');
    expect(onChange).toHaveBeenLastCalledWith('2026-06-20T10:41');
  });

  it('fills the missing half from today and placeholderTime when one half is picked first', async () => {
    const onChange = vi.fn();
    const { container } = on('ios', <DatePicker label="Reminder" locale="en-GB" granularity="minute" placeholderTime="18:00" defaultValue={null} onChange={onChange} />);
    await userEvent.click(part(container, 'date'));
    await userEvent.keyboard('{Enter}');
    const [value] = onChange.mock.calls.at(-1)!;
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T18:00$/);
  });

  it('passes bounds and unavailable days to the Calendar', async () => {
    const onChange = vi.fn();
    const { container } = on(
      'web',
      <DatePicker
        label="Date"
        locale="en-GB"
        defaultValue="2026-11-17"
        minValue="2026-11-05"
        maxValue="2026-11-25"
        isDateUnavailable={(iso) => iso === '2026-11-20'}
        onChange={onChange}
      />,
    );
    await userEvent.click(part(container, 'date'));
    expect(openDay('3').getAttribute('data-disabled')).toBe('');
    expect(openDay('20').getAttribute('data-unavailable')).toBe('');
    await userEvent.click(openDay('20'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is controlled', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('2026-11-17');
      return (
        <>
          <DatePicker label="Date" locale="en-GB" value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const { container } = on('web', <Controlled />);
    await userEvent.click(part(container, 'date'));
    await userEvent.click(openDay('21'));
    expect(screen.getByRole('status').textContent).toBe('2026-11-21');
  });

  it('disabled chips open nothing; read only chips show the value and open nothing', async () => {
    const off = on('ios', <DatePicker label="Starts" locale="en-GB" granularity="minute" disabled defaultValue="2026-06-18T09:41" />).container;
    expect(picker(off).getAttribute('data-disabled')).toBe('');
    expect(part(off, 'date').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(part(off, 'date'));
    expect(document.querySelector('[data-ds="popover"]')).toBeNull();
    const ro = on('ios', <DatePicker label="Starts" locale="en-GB" granularity="minute" readOnly defaultValue="2026-06-18T09:41" />).container;
    expect(picker(ro).getAttribute('data-readonly')).toBe('');
    expect(part(ro, 'date').hasAttribute('aria-haspopup')).toBe(false);
    await userEvent.click(part(ro, 'date'));
    await userEvent.click(part(ro, 'time'));
    expect(document.querySelector('[data-ds="popover"]')).toBeNull();
  });

  it('reads its name and invalid state from a Field, and carries the value in a hidden input', () => {
    const { container } = on(
      'web',
      <Field label="Return date" error="Pick a later date.">
        <DatePicker locale="en-GB" defaultValue="2026-11-10" name="return" />
      </Field>,
    );
    expect(screen.getByRole('group', { name: 'Return date' })).toBe(picker(container));
    expect(picker(container).getAttribute('data-invalid')).toBe('');
    expect(part(container, 'date').getAttribute('data-invalid')).toBe('');
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"][name="return"]')!.value).toBe('2026-11-10');
  });

  it('puts the chips in reading order in Arabic: the date first, so at the right', () => {
    const { container } = on('ios', <DatePicker label="موعد الحجز" locale="ar-SA" granularity="minute" defaultValue="2026-11-17T21:05" />, 'ar');
    const parts = Array.from(picker(container).children).map((n) => n.getAttribute('data-part'));
    expect(parts).toEqual(['label', 'date', 'time']);
    expect(part(container, 'date').getAttribute('aria-label')).toBe('التاريخ، 17 نوفمبر 2026');
    expect(part(container, 'time').getAttribute('aria-label')).toMatch(/^الوقت، 9:05\s?م$/);
  });
});

describe('DatePicker, inline', { timeout: 20_000 }, () => {
  it('draws the Calendar and a time row; a day keeps the time', async () => {
    const onChange = vi.fn();
    const { container } = on('ios', <DatePicker variant="inline" aria-label="Pickup" locale="en-GB" granularity="minute" defaultValue="2026-06-18T09:41" onChange={onChange} />);
    const root = picker(container);
    expect(root.getAttribute('data-variant')).toBe('inline');
    const calendar = part(container, 'calendar');
    expect(calendar.getAttribute('data-ds')).toBe('calendar');
    expect(part(container, 'time-label').textContent).toBe('Time');
    expect(part(container, 'time-row').querySelector('[data-part="time"]')!.getAttribute('aria-label')).toBe('Time, 09:41');
    await userEvent.click(openDay('20'));
    expect(onChange).toHaveBeenLastCalledWith('2026-06-20T09:41');
  });

  it('a date only inline picker has no time row', () => {
    const { container } = on('web', <DatePicker variant="inline" aria-label="Delivery date" locale="en-GB" defaultValue="2026-06-18" />);
    expect(container.querySelector('[data-part="time-row"]')).toBeNull();
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = on('ios', <DatePickerDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'empty', 'one', 'long-text', 'long-arabic', 'error', 'disabled', 'readonly']);
  });
});

describe('DatePicker digits stay Latin in ar-SA', { timeout: 20_000 }, () => {
  it('the check itself flags Arabic Indic digits (-u-nu-arab)', () => {
    const arab = new Intl.DateTimeFormat('ar-SA-u-nu-arab-ca-islamic-umalqura', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2026, 10, 17)),
    );
    expect(hasNonLatinDigits(arab)).toBe(true);
  });

  for (const calendar of ['gregory', 'islamic-umalqura'] as const) {
    for (const platform of ['ios', 'android', 'web'] as const) {
      it(`chips, names, calendar, wheel, segments, headings and announcements, ${calendar} on ${platform}`, async () => {
        document.body.innerHTML = '';
        const texts: string[] = [];
        const collect = () => {
          texts.push(document.body.textContent ?? '');
          for (const node of document.body.querySelectorAll('[aria-label], [aria-valuetext]')) {
            texts.push(node.getAttribute('aria-label') ?? '', node.getAttribute('aria-valuetext') ?? '');
          }
        };
        const { container } = on(
          platform,
          <>
            <DatePicker label="موعد الحجز" locale="ar-SA" calendar={calendar} granularity="minute" defaultValue="2026-11-17T21:05" />
            <DatePicker variant="inline" aria-label="تاريخ التوصيل" locale="ar-SA" calendar={calendar} granularity="minute" defaultValue="2026-11-17T21:05" />
            <DatePicker label="التذكير" locale="ar-SA" calendar={calendar} granularity="minute" />
          </>,
          'ar',
        );
        collect();
        // Open the date chip, move a day and pick it: React Aria announces the pick.
        await userEvent.click(part(container, 'date'));
        collect();
        await userEvent.keyboard('{ArrowLeft}{Enter}');
        collect();
        // Open the time control and step it (wheel on ios, segments in a dialog on android, in place on web).
        const time = part(container, 'time');
        if (time.getAttribute('data-ds') === 'button') await userEvent.click(time);
        else act(() => time.querySelector<HTMLElement>('[data-part="segment"]')!.focus());
        collect();
        await userEvent.keyboard('{ArrowUp}');
        collect();
        const all = texts.join(' | ');
        expect(all).toMatch(/[0-9]/);
        expect(hasNonLatinDigits(all), all.slice(0, 600)).toBe(false);
        // No Arabic name joins its words with a Latin comma: the chips, the segments and the calendars inside.
        const latinComma = Array.from(document.querySelectorAll('[aria-label]'))
          .map((n) => n.getAttribute('aria-label') ?? '')
          .filter((l) => /[\u0600-\u06ff]/.test(l) && l.includes(', '));
        expect(latinComma).toEqual([]);
        const headings = Array.from(document.querySelectorAll('h2')).map((h) => h.textContent ?? '');
        expect(headings.filter((h) => h.includes(', '))).toEqual([]);
      });
    }
  }
});
