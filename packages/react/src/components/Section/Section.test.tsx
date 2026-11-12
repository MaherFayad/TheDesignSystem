import { fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import SectionDemo from './Section.demo';
import { Section } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="section"]');
  if (!el) throw new Error('no section rendered');
  return el;
}

const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('Section', () => {
  it('renders a static section: a section element, the heading at the given level, the body, size md', () => {
    const el = root(render(<Section level={2} title="Account">Body</Section>).container);
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-state')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(parts(el)).toEqual(['header', 'body']);
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H2');
    expect(title?.textContent).toBe('Account');
    expect(el.querySelector('[data-part="toggle"]')).toBeNull();
  });

  it('places title, actions and description in the header, and a landmark is named by the title', () => {
    const el = root(
      render(
        <Section level={4} size="sm" title="Fill" description="One line" actions={<span>Add</span>} landmark className="x">
          Body
        </Section>,
      ).container,
    );
    const header = el.querySelector('[data-part="header"]');
    expect(header && parts(header)).toEqual(['title', 'actions', 'description']);
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H4');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.className).toBe('x');
    const titleId = el.querySelector('[data-part="title"]')?.id ?? '';
    expect(el.getAttribute('aria-labelledby')).toBe(titleId);
  });

  it('collapsible: the title holds a Button toggle that opens and closes the body', () => {
    const onOpenChange = vi.fn();
    const el = root(
      render(
        <Section level={3} title="Billing" description="Invoices" collapsible onOpenChange={onOpenChange}>
          Body
        </Section>,
      ).container,
    );
    const toggle = el.querySelector<HTMLButtonElement>('[data-part="title"] > [data-part="toggle"]');
    expect(toggle?.getAttribute('data-ds')).toBe('button');
    expect(toggle?.textContent).toBe('Billing');
    expect(el.getAttribute('data-state')).toBe('open');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    const body = el.querySelector('[data-part="body"]');
    expect(toggle?.getAttribute('aria-controls')).toBe(body?.id);
    const describedBy = toggle?.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)?.textContent).toBe('Invoices');

    fireEvent.click(toggle!);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(el.getAttribute('data-state')).toBe('closed');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    // Radix keeps the closed body as an empty hidden element, so aria-controls still points at it.
    const closedBody = el.querySelector<HTMLElement>('[data-part="body"]');
    expect(closedBody?.hidden).toBe(true);
    expect(closedBody?.textContent).toBe('');
  });

  it('collapsible with defaultOpen false starts closed, and a controlled open state wins', () => {
    const closed = root(render(<Section level={3} title="A" collapsible defaultOpen={false}>Body</Section>).container);
    expect(closed.getAttribute('data-state')).toBe('closed');

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Section level={3} title="B" collapsible open={open} onOpenChange={setOpen}>
          Body
        </Section>
      );
    }
    const el = root(render(<Controlled />).container);
    expect(el.getAttribute('data-state')).toBe('closed');
    fireEvent.click(el.querySelector('[data-part="toggle"]')!);
    expect(el.getAttribute('data-state')).toBe('open');
  });

  it('collapsible with no children draws the header alone: no toggle, no state, no body', () => {
    const el = root(render(<Section level={4} title="Effects" collapsible actions={<span>Add</span>} />).container);
    expect(el.hasAttribute('data-state')).toBe(false);
    expect(el.querySelector('[data-part="toggle"]')).toBeNull();
    expect(parts(el)).toEqual(['header']);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('Effects');
  });

  it('renders every demo case', () => {
    const { container } = render(<SectionDemo />);
    for (const id of ['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});
