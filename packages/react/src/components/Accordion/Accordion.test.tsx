import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getInteraction } from '@the-system/motion';
import { describe, expect, it } from 'vitest';
import AccordionDemo from './Accordion.demo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionProps } from './index';

function Three(props: Partial<AccordionProps>) {
  return (
    <Accordion {...(props as AccordionProps)}>
      {['Billing', 'Members', 'Security'].map((t, i) => (
        <AccordionItem key={t} value={t} disabled={i === 2 && props.size === 'sm'}>
          <AccordionTrigger>{t}</AccordionTrigger>
          <AccordionContent>{`${t} body`}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="accordion"]');
  if (!el) throw new Error('no accordion rendered');
  return el;
}

describe('Accordion', () => {
  it('renders the root with the default axes and the parts', () => {
    const { container } = render(<Three />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-variant')).toBe('divided');
    expect(el.getAttribute('data-orientation')).toBe('vertical');
    expect(el.hasAttribute('data-part')).toBe(false);
    const item = el.querySelector('[data-part="item"]');
    expect(item?.getAttribute('data-state')).toBe('closed');
    const header = item?.querySelector('[data-part="header"]');
    expect(header?.tagName).toBe('H3');
    const trigger = header?.querySelector('[data-part="trigger"]');
    expect(trigger?.getAttribute('data-ds')).toBe('button');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    expect(trigger?.querySelector('[data-icon="chevron-down"]')).not.toBeNull();
  });

  it('sets size, variant and heading level', () => {
    const { container } = render(<Three size="sm" variant="card" headingLevel={2} />);
    const el = root(container);
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-variant')).toBe('card');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
    expect(el.querySelector('[data-part="trigger"]')?.getAttribute('data-size')).toBe('sm');
  });

  it('opens one section at a time and can close it again', async () => {
    const user = userEvent.setup();
    render(<Three />);
    const billing = screen.getByRole('button', { name: 'Billing' });
    const members = screen.getByRole('button', { name: 'Members' });
    await user.click(billing);
    expect(billing.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'Billing' }).getAttribute('data-part')).toBe('content');
    await user.click(members);
    expect(billing.getAttribute('aria-expanded')).toBe('false');
    expect(members.getAttribute('aria-expanded')).toBe('true');
    await user.click(members);
    expect(members.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps several open with type multiple', async () => {
    const user = userEvent.setup();
    render(<Three type="multiple" />);
    await user.click(screen.getByRole('button', { name: 'Billing' }));
    await user.click(screen.getByRole('button', { name: 'Members' }));
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('moves focus with the arrow keys, Home and End, and toggles with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<Three />);
    const [billing, members, security] = screen.getAllByRole('button');
    billing!.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(members);
    await user.keyboard('{End}');
    expect(document.activeElement).toBe(security);
    await user.keyboard('{Home}');
    expect(document.activeElement).toBe(billing);
    await user.keyboard('{ArrowUp}');
    expect(document.activeElement).toBe(security);
    await user.keyboard('{Enter}');
    expect(security!.getAttribute('aria-expanded')).toBe('true');
    await user.keyboard(' ');
    expect(security!.getAttribute('aria-expanded')).toBe('false');
  });

  it('keeps a disabled trigger focusable and closed', async () => {
    const user = userEvent.setup();
    render(<Three size="sm" />);
    const security = screen.getByRole('button', { name: 'Security' });
    expect(security.getAttribute('aria-disabled')).toBe('true');
    expect(security.hasAttribute('disabled')).toBe(false);
    await user.click(security);
    expect(security.getAttribute('aria-expanded')).toBe('false');
    // Radix handles the arrow keys on the root, so they still leave a disabled trigger.
    security.focus();
    await user.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Billing' }));
    security.focus();
    await user.keyboard('{Enter}');
    expect(security.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders the demo cases', () => {
    const { container } = render(<AccordionDemo />);
    const cases = Array.from(container.querySelectorAll('[data-demo-case]')).map((c) => c.getAttribute('data-demo-case'));
    expect(cases).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'open', 'disabled']);
  });

  it('has a demo trigger that adds an accordion with a section open, for the contract suite (review note N12)', () => {
    const { container } = render(<AccordionDemo />);
    const trigger = container.querySelector<HTMLElement>('[data-demo-trigger]');
    expect(trigger).not.toBeNull();
    const before = container.querySelectorAll('[data-ds="accordion"]').length;
    act(() => trigger?.click());
    expect(container.querySelectorAll('[data-ds="accordion"]').length).toBe(before + 1);
    expect(container.querySelector('[data-demo-case="open"] [data-ds="accordion"] [data-part="content"][data-state="open"]')).not.toBeNull();
  });

  it('turns the chevron off with the rest of accordion-reveal (review note N6)', () => {
    const off = getInteraction('accordion-reveal')?.off?.["[data-ds='accordion']"] ?? {};
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Accordion.css'), 'utf8');
    // The chevron's transition reads a property the off row sets to 0s.
    const chevron = /\[data-part='trigger'\] \[data-ds='icon'\] \{[^}]*transition:\s+transform var\((--_accordion-[\w-]+)\)/.exec(css);
    expect(chevron?.[1]).toBeDefined();
    expect(off[chevron?.[1] as `--_${string}`]).toBe('0s');
    // So do the content slide and the child stagger.
    expect(off['--_accordion-duration']).toBe('0s');
    expect(off['--_accordion-stagger']).toBe('0s');
  });

  it('reveals the content with clip-path and never animates the height (round 3)', () => {
    const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Accordion.css'), 'utf8');
    const reveal = /@keyframes ds-accordion-reveal \{([\s\S]*?)\n {2}\}/.exec(css)?.[1] ?? '';
    expect(reveal).toContain('clip-path: var(--_accordion-reveal)');
    expect(reveal).toContain('clip-path: inset(0)');
    expect(reveal).not.toMatch(/height|block-size/);
    // The chevron leans on hover, and not under reduced motion.
    expect(css).toMatch(/:hover \[data-ds='icon'\] \{\s+--_accordion-icon-nudge-now: var\(--_accordion-icon-nudge\)/);
    expect(css).toMatch(/--_accordion-icon-nudge: 0px;/);
  });
});
