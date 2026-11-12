import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import SkipLinkDemo from './SkipLink.demo';
import { SkipLink } from './index';

afterEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('SkipLink', () => {
  it('renders an anchor to #main with the default English label', () => {
    render(<SkipLink />);
    const el = screen.getByRole('link', { name: 'Skip to main content' });
    expect(el.getAttribute('data-ds')).toBe('skip-link');
    expect(el.getAttribute('href')).toBe('#main');
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('title')).toBe(false);
  });

  it('uses the Arabic default label inside an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <SkipLink />
      </Theme>,
    );
    expect(screen.getByRole('link', { name: 'الانتقال للمحتوى الرئيسي' })).not.toBeNull();
  });

  it('is the first tab stop when placed first', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <a href="#x">Boards</a>
        <main id="main">Content</main>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Skip to main content' }));
  });

  it('Enter moves focus to a target that was not focusable, adding tabindex -1', async () => {
    const user = userEvent.setup();
    render(
      <>
        <SkipLink />
        <main id="main">Content</main>
      </>,
    );
    const target = screen.getByRole('main');
    expect(target.hasAttribute('tabindex')).toBe(false);
    screen.getByRole('link').focus();
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(target);
    expect(target.getAttribute('tabindex')).toBe('-1');
    expect(window.location.hash).toBe('#main');
  });

  it('leaves a focusable target as it is', () => {
    render(
      <>
        <SkipLink href="#search" />
        <input id="search" aria-label="Search" />
        <div id="region" tabIndex={0}>
          Region
        </div>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    const input = screen.getByRole('textbox');
    expect(document.activeElement).toBe(input);
    expect(input.hasAttribute('tabindex')).toBe(false);
  });

  it('keeps an existing tabindex on the target', () => {
    render(
      <>
        <SkipLink href="#region" />
        <section id="region" tabIndex={-1}>
          Region
        </section>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(document.activeElement?.id).toBe('region');
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
  });

  it('decodes an encoded fragment', () => {
    render(
      <>
        <SkipLink href="#%D9%85%D8%AD%D8%AA%D9%88%D9%89" />
        <main id="محتوى">Content</main>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(document.activeElement?.id).toBe('محتوى');
  });

  it('falls back to the browser when the target is missing', () => {
    render(<SkipLink href="#nowhere" />);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    screen.getByRole('link').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('calls onClick first and respects preventDefault', () => {
    const onClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <>
        <SkipLink onClick={onClick} />
        <main id="main">Content</main>
      </>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(screen.getByRole('main'));
  });

  it('takes ref as a prop and passes other props through', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<SkipLink ref={ref} className="x" data-testid="s" />);
    const el = screen.getByTestId('s');
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
  });

  it('renders every demo case', () => {
    const { container } = render(<SkipLinkDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"] [data-ds="skip-link"]')).not.toBeNull();
    for (const link of container.querySelectorAll<HTMLAnchorElement>('[data-ds="skip-link"]')) {
      expect(container.querySelector(link.getAttribute('href') ?? '')).not.toBeNull();
    }
  });
});
