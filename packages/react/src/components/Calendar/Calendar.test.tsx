import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { hasNonLatinDigits, todayIso } from '@the-system/shared';
import { Theme } from '../../theme/Theme';
import CalendarDemo from './Calendar.demo';
import { Calendar } from './index';

const root = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="calendar"]')!;
const days = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-part="day"]'));
const day = (c: HTMLElement, text: string) => days(c).find((d) => d.textContent === text && !d.hasAttribute('data-outside-month'))!;

describe('Calendar', () => {
  it('renders the anatomy with the system parts and no React Aria classes', () => {
    const { container } = render(<Calendar aria-label="Delivery date" locale="en-SA" defaultValue="2026-11-17" />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('application');
    expect(el.getAttribute('data-size')).toBe('md');
    for (const part of ['header', 'title', 'previous', 'next', 'grid', 'weekday', 'cell', 'day']) {
      expect(el.querySelector(`[data-part="${part}"]`), part).not.toBeNull();
    }
    expect(el.querySelector('[class*="react-aria"]')).toBeNull();
    // Only the two system month buttons: React Aria's hidden native button is dropped.
    expect(Array.from(el.querySelectorAll('button')).map((b) => b.getAttribute('data-part'))).toEqual(['previous', 'next']);
    expect(el.querySelector('[data-rac]')).toBeNull();
    expect(el.querySelector('[data-part="title"]')!.textContent).toBe('November 2026');
    expect(el.querySelector('[data-part="title"]')!.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('grid').getAttribute('aria-label')).toContain('November 2026');
  });

  it('stamps states present and empty: selected, outside month', () => {
    const { container } = render(<Calendar aria-label="Date" locale="en-SA" defaultValue="2026-11-17" />);
    const picked = day(container, '17');
    expect(picked.getAttribute('data-selected')).toBe('');
    expect(picked.getAttribute('aria-label')).toMatch(/Tuesday, November 17, 2026/);
    // November 2026 starts on a Sunday, so the last row ends with days of December.
    const outside = days(container).filter((d) => d.hasAttribute('data-outside-month'));
    expect(outside.length).toBeGreaterThan(0);
    expect(outside.every((d) => d.getAttribute('data-outside-month') === '')).toBe(true);
    expect(days(container).some((d) => d.getAttribute('data-selected') === 'true')).toBe(false);
  });

  it('marks today', () => {
    const { container } = render(<Calendar aria-label="Date" locale="en-SA" />);
    const today = days(container).filter((d) => d.hasAttribute('data-today'));
    expect(today).toHaveLength(1);
    expect(today[0]!.getAttribute('data-today')).toBe('');
    expect(Number(today[0]!.textContent)).toBe(Number(todayIso().slice(8)));
  });

  it('marks unavailable days and days outside min and max, and refuses to pick them', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        aria-label="Date"
        locale="en-SA"
        defaultFocusedValue="2026-11-10"
        minValue="2026-11-05"
        maxValue="2026-11-25"
        isDateUnavailable={(iso) => iso === '2026-11-12'}
        onChange={onChange}
      />,
    );
    expect(day(container, '12').getAttribute('data-unavailable')).toBe('');
    expect(day(container, '3').getAttribute('data-disabled')).toBe('');
    expect(day(container, '28').getAttribute('data-disabled')).toBe('');
    await userEvent.click(day(container, '12'));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(day(container, '13'));
    expect(onChange).toHaveBeenCalledWith('2026-11-13', expect.objectContaining({ year: 2026, month: 11, day: 13 }));
  });

  it('is controlled with ISO values', async () => {
    function Controlled() {
      const [value, setValue] = useState<string | null>('2026-11-17');
      return (
        <>
          <Calendar aria-label="Date" locale="en-SA" value={value} onChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    const { container } = render(<Controlled />);
    await userEvent.click(day(container, '20'));
    expect(screen.getByRole('status').textContent).toBe('2026-11-20');
    expect(day(container, '20').hasAttribute('data-selected')).toBe(true);
  });

  it('round trips an Umm al-Qura pick to the same ISO Gregorian date', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar aria-label="التاريخ" locale="ar-SA" calendar="islamic-umalqura" defaultFocusedValue="2026-11-17" onChange={onChange} />,
    );
    expect(container.querySelector('[data-part="title"]')!.textContent).toMatch(/^جمادى الآخرة 1448/);
    // 7 Jumada II 1448 is 17 November 2026.
    await userEvent.click(day(container, '7'));
    const [iso, date] = onChange.mock.calls[0]!;
    expect(iso).toBe('2026-11-17');
    expect(date.calendar.identifier).toBe('islamic-umalqura');
    expect([date.year, date.month, date.day]).toEqual([1448, 6, 7]);
  });

  it('starts the week from the locale: Sunday in ar-SA and en-SA, Monday in en-GB, or firstDayOfWeek', () => {
    const first = (c: HTMLElement) => c.querySelector('[data-part="weekday"]')!.textContent;
    expect(first(render(<Calendar aria-label="d" locale="en-SA" defaultFocusedValue="2026-11-17" />).container)).toBe('Sun');
    expect(first(render(<Calendar aria-label="d" locale="ar-SA" defaultFocusedValue="2026-11-17" />).container)).toBe('الأحد');
    expect(first(render(<Calendar aria-label="d" locale="en-GB" defaultFocusedValue="2026-11-17" />).container)).toBe('Mon');
    expect(first(render(<Calendar aria-label="d" locale="en-SA" firstDayOfWeek="sat" defaultFocusedValue="2026-11-17" />).container)).toBe('Sat');
  });

  it('names the month buttons in nouns, from the locale, and moves the month', async () => {
    const { container } = render(<Calendar aria-label="التاريخ" locale="ar-SA" defaultFocusedValue="2026-11-17" />);
    expect(screen.getByRole('button', { name: 'الشهر السابق' }).getAttribute('data-part')).toBe('previous');
    await userEvent.click(screen.getByRole('button', { name: 'الشهر التالي' }));
    expect(container.querySelector('[data-part="title"]')!.textContent).toBe('ديسمبر 2026');
    render(<Calendar aria-label="Date" locale="en-SA" previousLabel="Earlier" />);
    expect(screen.getByRole('button', { name: 'Earlier' })).toBeTruthy();
  });

  it('runs the grid keyboard: arrows, PageDown for months, Shift PageDown for years, Home and End for the month', async () => {
    const { container } = render(<Calendar aria-label="Date" locale="en-SA" defaultValue="2026-11-17" />);
    act(() => day(container, '17').focus());
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/November 18, 2026/);
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/November 25, 2026/);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/Sunday, November 1, 2026/);
    await userEvent.keyboard('{End}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/Monday, November 30, 2026/);
    await userEvent.keyboard('{PageDown}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/December 30, 2026/);
    expect(container.querySelector('[data-part="title"]')!.textContent).toBe('December 2026');
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(document.activeElement?.getAttribute('aria-label')).toMatch(/December 30, 2027/);
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement?.hasAttribute('data-selected')).toBe(true);
  });

  it('mirrors the arrows in right to left: ArrowLeft goes to the next day', async () => {
    const { container } = render(
      <Theme lang="ar">
        <Calendar aria-label="التاريخ" locale="ar-SA" defaultValue="2026-11-17" />
      </Theme>,
    );
    act(() => day(container, '17').focus());
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement?.textContent).toBe('18');
  });

  it('takes sizes and stamps disabled and read only', async () => {
    const onChange = vi.fn();
    const { container } = render(<Calendar aria-label="d" locale="en-SA" size="lg" readOnly defaultFocusedValue="2026-11-17" onChange={onChange} />);
    expect(root(container).getAttribute('data-size')).toBe('lg');
    expect(root(container).getAttribute('data-readonly')).toBe('');
    await userEvent.click(day(container, '20'));
    expect(onChange).not.toHaveBeenCalled();
    const off = render(<Calendar aria-label="d" locale="en-SA" disabled />).container;
    expect(root(off).getAttribute('data-disabled')).toBe('');
    expect(screen.getAllByRole('button', { name: 'Next month' }).at(-1)!.getAttribute('aria-disabled')).toBe('true');
  });

  it('joins the name and the month with the Arabic comma in Arabic, on the root and the hidden heading', async () => {
    const user = userEvent.setup();
    const ar = render(
      <Theme lang="ar" dir="rtl">
        <Calendar aria-label="تاريخ الحجز" defaultValue="2026-11-17" />
      </Theme>,
    ).container;
    const root = ar.querySelector('[data-ds="calendar"]')!;
    expect(root.getAttribute('aria-label')).toBe('تاريخ الحجز، نوفمبر 2026');
    expect(root.querySelector(':scope > div > h2')?.textContent).toBe('تاريخ الحجز، نوفمبر 2026');
    // It follows the month.
    await user.click(screen.getByRole('button', { name: 'الشهر التالي' }));
    expect(root.getAttribute('aria-label')).toBe('تاريخ الحجز، ديسمبر 2026');
    const en = render(<Calendar aria-label="Booking date" locale="en-US" defaultValue="2026-11-17" />).container;
    expect(en.querySelector('[data-ds="calendar"]')!.getAttribute('aria-label')).toBe('Booking date, November 2026');
  });

  it('defaults the locale to the nearest Theme language', () => {
    const { container } = render(
      <Theme lang="ar">
        <Calendar aria-label="التاريخ" defaultFocusedValue="2026-11-17" />
      </Theme>,
    );
    expect(container.querySelector('[data-part="title"]')!.textContent).toBe('نوفمبر 2026');
    expect(screen.getByRole('button', { name: 'الشهر التالي' })).toBeTruthy();
  });

  it('renders every demo case, with long-arabic', () => {
    const { container } = render(<CalendarDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(cases).toContain('variants');
    expect(cases).toContain('long-arabic');
  });
});

describe('Calendar digits stay Latin in ar-SA (every React Aria formatter)', () => {
  for (const calendar of ['gregory', 'islamic-umalqura'] as const) {
    it(`title, day numbers, cell names, grid name, headings and announcements, ${calendar}`, async () => {
      const { container } = render(
        <Calendar aria-label="موعد التوصيل" locale="ar-SA" calendar={calendar} defaultValue="2026-11-17" minValue="2026-11-02" />,
      );
      const texts: string[] = [];
      const collect = () => {
        const el = root(container);
        texts.push(el.textContent ?? '');
        for (const node of el.querySelectorAll('[aria-label]')) texts.push(node.getAttribute('aria-label') ?? '');
        texts.push(el.getAttribute('aria-label') ?? '');
      };
      collect();
      // A pick and a month change make React Aria announce; the announcer is a live region in the body.
      await userEvent.click(days(container).find((d) => d.textContent === '20' && !d.hasAttribute('data-outside-month'))!);
      await userEvent.click(screen.getByRole('button', { name: 'الشهر التالي' }));
      collect();
      texts.push(document.body.textContent ?? '');
      const all = texts.join(' | ');
      expect(all).toMatch(/[0-9]/);
      expect(hasNonLatinDigits(all), all.slice(0, 400)).toBe(false);
      // React Aria's own words ran: the selected day and the minimum date carry its Arabic strings.
      expect(all).toMatch(/محدد/);
    });
  }
});
