import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import ErrorStateDemo from './ErrorState.demo';
import { Button } from '../Button';
import { Theme } from '../../theme';
import { ErrorState } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="error-state"]');
  if (!el) throw new Error('no error state rendered');
  return el;
}

describe('ErrorState', () => {
  it('renders the anatomy and the defaults: no live role, a group named by its title', () => {
    const { container } = render(<ErrorState title="Could not load members" body="Retry in a moment." />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('group');
    expect(el.hasAttribute('aria-atomic')).toBe(false);
    expect(el.getAttribute('aria-labelledby')).toBe(el.querySelector('[data-part="title"]')?.id);
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-state')).toBe('error');
    expect(el.querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H2');
    expect(title?.textContent).toBe('Could not load members');
    expect(el.querySelector('[data-part="body"]')?.textContent).toBe('Retry in a moment.');
    expect(el.querySelector('[data-part="actions"]')).toBeNull();
    expect(el.querySelector('[data-part="details"]')).toBeNull();
  });

  it('without live it is a labelled group with no live role', () => {
    const { container } = render(<ErrorState live={false} title="Could not load" headingLevel={3} icon={false} />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('group');
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H3');
    expect(el.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(el.querySelector('[data-part="icon"]')).toBeNull();
  });

  it('puts the retry Button first in the actions and calls onRetry', () => {
    const onRetry = vi.fn();
    const { container } = render(<ErrorState title="Could not load" onRetry={onRetry} actions={<Button>Open boards</Button>} />);
    const actions = root(container).querySelector('[data-part="actions"]');
    const first = actions?.firstElementChild;
    expect(first?.getAttribute('data-ds')).toBe('button');
    expect(first?.getAttribute('data-part')).toBe('retry');
    expect(first?.textContent).toContain('Retry loading');
    fireEvent.click(screen.getByRole('button', { name: /Retry loading/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('retrying sets the state and loads the retry Button', () => {
    const { container } = render(<ErrorState title="Could not load" onRetry={() => undefined} retrying />);
    const el = root(container);
    expect(el.getAttribute('data-state')).toBe('retrying');
    const retry = el.querySelector('[data-part="retry"]');
    expect(retry?.hasAttribute('data-loading')).toBe(true);
    expect(retry?.textContent).toContain('Retrying');
  });

  it('shows the code inside a closed details disclosure', () => {
    const { container } = render(<ErrorState title="Could not load" code="ERR_TIMEOUT 504" details="Request id 7f3a" />);
    const details = root(container).querySelector<HTMLDetailsElement>('[data-part="details"]');
    expect(details?.tagName).toBe('DETAILS');
    expect(details?.open).toBe(false);
    expect(details?.querySelector('[data-part="summary"]')?.textContent).toBe('Error details');
    expect(details?.querySelector('[data-part="code"]')?.textContent).toBe('Error code: ERR_TIMEOUT 504');
    expect(details?.textContent).toContain('Request id 7f3a');
  });

  it('speaks Arabic under lang ar and takes a ref', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<ErrorState ref={ref} lang="ar" title="تعذر التحميل" onRetry={() => undefined} code="E1" />);
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.getAttribute('lang')).toBe('ar');
    expect(el.querySelector('[data-part="retry"]')?.textContent).toContain('إعادة التحميل');
    expect(el.querySelector('[data-part="summary"]')?.textContent).toBe('تفاصيل الخطأ');
  });

  it('demo renders its cases in order', () => {
    const { container } = render(<ErrorStateDemo />);
    const ids = [...container.querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});

describe('ErrorState live role and language', () => {
  // role alert is atomic by default: the retry Button's hidden status would
  // read the whole error again on every retry.
  it('with live it is an alert with aria-atomic false and no name override', () => {
    const { container } = render(<ErrorState live title="Could not load members" onRetry={() => undefined} retrying />);
    const el = root(container);
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-atomic')).toBe('false');
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('takes the default words from the Theme language and sets no dir of its own', () => {
    const { container } = render(
      <Theme lang="ar">
        <ErrorState title="ما قدرنا نحمل الأعضاء" onRetry={() => undefined} code="ERR_TIMEOUT" />
      </Theme>,
    );
    const el = root(container);
    expect(el.querySelector('[data-part="retry"]')?.textContent).toContain('إعادة التحميل');
    expect(el.querySelector('[data-part="summary"]')?.textContent).toContain('تفاصيل الخطأ');
    expect(el.hasAttribute('dir')).toBe(false);
    expect(el.hasAttribute('lang')).toBe(false);
  });

  it('the lang prop wins over the Theme and sets lang and dir', () => {
    const { container } = render(
      <Theme lang="ar">
        <ErrorState lang="en" title="Could not load members" onRetry={() => undefined} />
      </Theme>,
    );
    const el = root(container);
    expect(el.querySelector('[data-part="retry"]')?.textContent).toContain('Retry loading');
    expect(el.getAttribute('dir')).toBe('ltr');
  });

  it('renders the body as a block, so a list or a second paragraph is valid', () => {
    const { container } = render(<ErrorState title="Could not load" body={<p>Check your connection.</p>} />);
    const body = root(container).querySelector('[data-part="body"]');
    expect(body?.tagName).toBe('DIV');
    expect(body?.querySelector('p')).not.toBeNull();
  });
});
