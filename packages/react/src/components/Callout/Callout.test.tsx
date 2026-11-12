import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Icon } from '@the-system/icons/react';
import { Theme } from '../../theme/Theme';
import CalloutDemo from './Callout.demo';
import { Callout } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="callout"]');
  if (!el) throw new Error('no callout rendered');
  return el;
}

describe('Callout', () => {
  it('renders a note with the anatomy and the default axes', () => {
    const { container } = render(<Callout title="Works offline">Edits sync when you connect.</Callout>);
    const el = root(container);
    expect(el.tagName).toBe('DIV');
    expect(el.getAttribute('role')).toBe('note');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.hasAttribute('data-size')).toBe(false);
    expect(el.querySelector('[data-part="title"]')?.textContent).toBe('Works offline');
    expect(el.querySelector('[data-part="body"]')?.textContent).toBe('Edits sync when you connect.');
  });

  it('is named by the tone word and the title', () => {
    render(
      <Callout tone="accent" title="Move faster">
        Press slash.
      </Callout>,
    );
    expect(screen.getByRole('note', { name: 'Tip Move faster' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Tip' })).toBeTruthy();
  });

  it('is named by the tone word alone without a title', () => {
    const { container } = render(<Callout tone="danger">Move the boards first.</Callout>);
    expect(screen.getByRole('note', { name: 'Caution' })).toBeTruthy();
    expect(container.querySelector('[data-part="title"]')).toBeNull();
  });

  it('sets the emphasis and renders an aside landmark', () => {
    render(
      <Callout as="aside" emphasis="outline" tone="info" title="Related">
        Share a board.
      </Callout>,
    );
    const el = screen.getByRole('complementary', { name: 'Information Related' });
    expect(el.tagName).toBe('ASIDE');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttribute('data-emphasis')).toBe('outline');
  });

  it('says the tone word in Arabic under a Theme in Arabic, and takes a custom word', () => {
    const { rerender } = render(
      <Theme lang="ar">
        <Callout tone="warning">نص</Callout>
      </Theme>,
    );
    expect(screen.getByRole('note', { name: 'تنبيه' })).toBeTruthy();
    rerender(<Callout toneLabel="Heads up">Text</Callout>);
    expect(screen.getByRole('note', { name: 'Heads up' })).toBeTruthy();
  });

  it('keeps the tone word when a node replaces the icon', () => {
    render(<Callout tone="success" icon={<Icon name="check" />}>Synced.</Callout>);
    expect(screen.getByRole('note', { name: 'Success' })).toBeTruthy();
  });

  it('has no live role and an aria-label wins over the generated name', () => {
    const { container } = render(<Callout aria-label="Export steps">Open the menu.</Callout>);
    const el = root(container);
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(el.hasAttribute('aria-live')).toBe(false);
  });

  it('passes ref and rest props to the root', () => {
    const ref = createRef<HTMLElement>();
    render(<Callout ref={ref} id="tip" className="x">Text</Callout>);
    expect(ref.current?.id).toBe('tip');
    expect(ref.current?.className).toBe('x');
    expect(ref.current?.getAttribute('aria-labelledby')).toBe('tip-icon');
  });

  it('renders the demo with every case it applies to', () => {
    const { container } = render(<CalloutDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((el) => el.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
