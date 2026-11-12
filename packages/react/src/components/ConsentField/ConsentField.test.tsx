import { render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Fieldset } from '../Fieldset/Fieldset';
import { Form, FormSubmit } from '../Form/Form';
import { Link } from '../Link/Link';
import ConsentFieldDemo from './ConsentField.demo';
import { ConsentField, type ConsentFieldProps } from './index';

// jsdom has no ResizeObserver, which the hidden form input of a Radix Checkbox reads.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="consent-field"]');
  if (!el) throw new Error('no consent field rendered');
  return el;
}

describe('ConsentField', () => {
  it('is never ticked in advance and has no defaultChecked', () => {
    // @ts-expect-error defaultChecked is not a prop: a consent never starts given.
    const props: ConsentFieldProps = { purpose: 'Send me offers by email.', defaultChecked: true };
    const { container } = render(<ConsentField {...props} />);
    const box = screen.getByRole('checkbox', { name: 'Send me offers by email.' });
    expect(box.getAttribute('aria-checked')).toBe('false');
    expect(root(container).getAttribute('data-state')).toBe('denied');
    expect(root(container).hasAttribute('defaultchecked')).toBe(false);
    expect(root(container).outerHTML.toLowerCase()).not.toContain('defaultchecked');
  });

  it('renders the parts: control (a Checkbox root), purpose as its label, meta, details link', () => {
    const { container } = render(<ConsentField purpose="Send me offers by email." detailsHref="/privacy" meta="Text version 2.1." />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.querySelector('[data-part="control"]')?.getAttribute('data-ds')).toBe('checkbox');
    expect(el.querySelector('[data-part="purpose"]')?.tagName).toBe('LABEL');
    const details = el.querySelector('[data-part="details"]');
    expect(details?.getAttribute('data-ds')).toBe('link');
    expect(details?.getAttribute('href')).toBe('/privacy');
    expect(details?.textContent).toBe('How we use your data');
    const box = screen.getByRole('checkbox');
    const ids = (box.getAttribute('aria-describedby') ?? '').split(' ');
    expect(document.getElementById(ids[0] ?? '')?.textContent).toBe('Text version 2.1.');
  });

  it('Space and a click on the purpose toggle it; withdrawing is the same one action', async () => {
    const onDecision = vi.fn();
    const { container } = render(<ConsentField purpose="Send me offers by email." name="offers" version="2.1" onDecision={onDecision} />);
    const box = screen.getByRole('checkbox');
    box.focus();
    await userEvent.keyboard(' ');
    expect(root(container).getAttribute('data-state')).toBe('granted');
    expect(onDecision).toHaveBeenLastCalledWith(expect.objectContaining({ name: 'offers', granted: true, version: '2.1' }));
    const at = (onDecision.mock.calls[0]?.[0] as { at: string }).at;
    expect(Number.isNaN(Date.parse(at))).toBe(false);
    await userEvent.click(screen.getByText('Send me offers by email.'));
    expect(root(container).getAttribute('data-state')).toBe('denied');
    expect(onDecision).toHaveBeenLastCalledWith(expect.objectContaining({ granted: false }));
  });

  it('switch control, controlled', async () => {
    const onCheckedChange = vi.fn();
    const { container } = render(<ConsentField control="switch" checked purpose="Use my location." onCheckedChange={onCheckedChange} />);
    expect(root(container).querySelector('[data-part="control"]')?.getAttribute('data-ds')).toBe('switch');
    expect(root(container).getAttribute('data-state')).toBe('granted');
    await userEvent.click(screen.getByRole('switch', { name: 'Use my location.' }));
    expect(onCheckedChange).toHaveBeenCalledWith(false);
    expect(root(container).getAttribute('data-state')).toBe('granted');
  });

  it('required, invalid with an error part, disabled', () => {
    const { container, rerender } = render(<ConsentField required purpose="Share my medical history." error="The booking needs this consent." />);
    const el = root(container);
    expect(el.hasAttribute('data-required')).toBe(true);
    expect(el.hasAttribute('data-invalid')).toBe(true);
    const error = el.querySelector('[data-part="error"]');
    expect(error?.getAttribute('data-ds')).toBe('field-error');
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-required')).toBe('true');
    expect(box.getAttribute('aria-invalid')).toBe('true');
    expect(box.getAttribute('aria-describedby')).toContain(error?.id ?? 'missing');
    rerender(<ConsentField disabled purpose="Send me birthday offers." />);
    expect(root(container).hasAttribute('data-disabled')).toBe(true);
    expect(screen.getByRole('checkbox').matches(':disabled')).toBe(true);
  });

  it('in a Form: a required consent left off blocks the submit and shows the Form error', async () => {
    const onSubmit = vi.fn();
    const { container } = render(
      <Form onSubmit={onSubmit} actions={<FormSubmit>Book appointment</FormSubmit>}>
        <ConsentField name="medical" required purpose="Share my medical history with the clinic." requiredError="The booking needs this consent." />
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(root(container).querySelector('[data-part="error"]')?.textContent).toBe('The booking needs this consent.');
    expect(document.activeElement).toBe(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    expect(onSubmit).toHaveBeenCalledWith({ medical: 'granted' }, expect.anything());
  });

  it('in a Form: requiredError is the message in the field and in the summary', async () => {
    const { container } = render(
      <Form actions={<FormSubmit>Book appointment</FormSubmit>}>
        <ConsentField
          name="medical"
          required
          purpose="Share my medical history with the clinic."
          detailsHref="/privacy"
          requiredError="The booking needs this consent. Tick the box, or book by phone."
        />
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    const message = 'The booking needs this consent. Tick the box, or book by phone.';
    expect(root(container).querySelector('[data-part="error"]')?.textContent).toBe(message);
    const summary = container.querySelector<HTMLElement>('[data-part="summary"]');
    if (!summary) throw new Error('no summary');
    expect(within(summary).getByRole('link').textContent).toBe(`Share my medical history with the clinic.: ${message}`);
  });

  it('in a Form without requiredError: a box left off asks to tick it, not to fill it in', async () => {
    const { container } = render(
      <Form actions={<FormSubmit>Book appointment</FormSubmit>}>
        <ConsentField name="medical" required purpose="Share my medical history with the clinic." detailsHref="/privacy" />
      </Form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Book appointment' }));
    expect(root(container).querySelector('[data-part="error"]')?.textContent).toBe('Tick this box to go on.');
    expect(container.querySelector('[data-part="summary"] a')?.textContent).toBe('Share my medical history with the clinic.: Tick this box to go on.');
  });

  it('warns in development about pre-ticking, a locked consent and a missing details link', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const said = () => warn.mock.calls.map((c) => String(c[0]));
    // @ts-expect-error defaultChecked is not a prop.
    const stray: ConsentFieldProps = { purpose: 'Send me offers by email.', detailsHref: '/privacy', defaultChecked: true };
    const first = render(<ConsentField {...stray} />);
    expect(said().some((m) => m.includes('defaultChecked is ignored'))).toBe(true);
    first.unmount();
    warn.mockClear();
    const second = render(<ConsentField purpose="Send me offers by email." detailsHref="/privacy" checked onCheckedChange={() => undefined} />);
    expect(said().some((m) => m.includes('checked starts true with no meta'))).toBe(true);
    second.unmount();
    warn.mockClear();
    const third = render(<ConsentField purpose="Send me offers by email." detailsHref="/privacy" meta="You agreed on 3 November 2026." checked disabled onCheckedChange={() => undefined} />);
    expect(said()).toEqual([expect.stringContaining('cannot be withdrawn')]);
    third.unmount();
    warn.mockClear();
    const fourth = render(<ConsentField purpose="Send me offers by email." />);
    expect(said()).toEqual([expect.stringContaining('no detailsHref')]);
    fourth.unmount();
    warn.mockClear();
    render(
      <Fieldset legend="Privacy settings" description={<Link href="/privacy">Read how we use your data</Link>}>
        <ConsentField control="switch" purpose="Send me offers by email." />
      </Fieldset>,
    );
    expect(said()).toEqual([]);
    warn.mockRestore();
  });

  it('the demo gives no warning, and each demo purpose names one use', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(<ConsentFieldDemo />);
    expect(warn.mock.calls.filter((c) => String(c[0]).startsWith('ConsentField'))).toEqual([]);
    warn.mockRestore();
    for (const purpose of container.querySelectorAll('[data-part="purpose"]')) {
      const text = purpose.textContent ?? '';
      // The use comes after "so" or "عشان": one use, never two joined with and.
      const use = text.split(/\bso they can\b|عشان/)[1] ?? '';
      expect(use).not.toMatch(/\band\b| و/);
    }
  });

  it('renders every demo case, and no consent in the demo starts given except the one on record', () => {
    const { container } = render(<ConsentFieldDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((n) => n.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'error', 'disabled']);
    expect(container.querySelectorAll('[data-ds="consent-field"][data-state="granted"]')).toHaveLength(1);
  });
});
