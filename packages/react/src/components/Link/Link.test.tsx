import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import LinkDemo from './Link.demo';
import { Link } from './index';

function root(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[data-ds="link"]');
  if (!el) throw new Error('no link rendered');
  return el;
}

describe('Link', () => {
  it('renders an anchor with the anatomy and the default axes', () => {
    const { container } = render(<Link href="#guide">Read the guide</Link>);
    const el = root(container);
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('#guide');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    // No size: the link inherits the font size of the text around it.
    expect(el.hasAttribute('data-size')).toBe(false);
    expect(el.hasAttribute('data-part')).toBe(false);
    expect(el.hasAttribute('data-standalone')).toBe(false);
    expect(el.hasAttribute('data-disabled')).toBe(false);
    expect(el.hasAttribute('aria-disabled')).toBe(false);
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.hasAttribute('target')).toBe(false);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Read the guide');
    expect(el.querySelector('[data-part="end"]')).toBeNull();
    expect(screen.getByRole('link', { name: 'Read the guide' })).toBe(el);
  });

  it('sets the axis attributes from props', () => {
    const { container } = render(
      <Link href="#guide" tone="accent" size="lg" standalone>
        Read the guide
      </Link>,
    );
    const el = root(container);
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-standalone')).toBe('');
  });

  it('external opens a new tab, shows the mirrored icon and says so to screen readers', () => {
    const { container } = render(
      <Link href="https://example.com" external>
        Open the docs
      </Link>,
    );
    const el = root(container);
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.getAttribute('rel')).toBe('noopener noreferrer');
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['label', 'end']);
    const icon = el.querySelector('[data-part="end"] [data-ds="icon"]');
    expect(icon?.getAttribute('data-icon')).toBe('external');
    expect(icon?.hasAttribute('data-mirror')).toBe(true);
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('link', { name: 'Open the docs, opens in a new tab' })).toBe(el);
  });

  it('keeps a target and rel the caller passes, and takes a custom external label', () => {
    render(
      <Link href="https://example.com" external target="docs" rel="noopener" externalLabel="opens the docs window">
        Open the docs
      </Link>,
    );
    const el = screen.getByRole('link', { name: 'Open the docs, opens the docs window' });
    expect(el.getAttribute('target')).toBe('docs');
    expect(el.getAttribute('rel')).toBe('noopener');
  });

  it('says the external label in Arabic inside an Arabic Theme', () => {
    render(
      <Theme lang="ar">
        <Link href="https://example.com" external>
          الدليل الكامل
        </Link>
      </Theme>,
    );
    expect(screen.getByRole('link', { name: 'الدليل الكامل، يفتح في تبويب جديد' })).not.toBeNull();
  });

  it('calls onClick and follows with Enter', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    render(
      <Link href="#guide" onClick={onClick}>
        Read the guide
      </Link>,
    );
    const el = screen.getByRole('link', { name: 'Read the guide' });
    await user.click(el);
    el.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('disabled drops the href, keeps role link and focus, and blocks click and middle click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = render(
      <Link href="#export" external disabled onClick={onClick} onKeyDown={onKeyDown}>
        Download the export kit
      </Link>,
    );
    const el = root(container);
    expect(el.hasAttribute('href')).toBe(false);
    expect(el.hasAttribute('target')).toBe(false);
    expect(el.getAttribute('role')).toBe('link');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    await user.tab();
    expect(document.activeElement).toBe(el);
    await user.keyboard('{Enter}');
    expect(onKeyDown).not.toHaveBeenCalled();
    for (const type of ['click', 'auxclick']) {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: type === 'auxclick' ? 1 : 0 });
      el.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders the child element as the link with asChild', () => {
    const onClick = vi.fn();
    render(
      <Link asChild tone="accent" external onClick={onClick}>
        <a href="#projects">Open the project list</a>
      </Link>,
    );
    const el = screen.getByRole('link', { name: 'Open the project list, opens in a new tab' });
    expect(el.getAttribute('href')).toBe('#projects');
    expect(el.getAttribute('data-ds')).toBe('link');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('target')).toBe('_blank');
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Open the project list');
    fireEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('a disabled asChild link loses its href', () => {
    const { container } = render(
      <Link asChild disabled>
        <a href="#projects">Open the project list</a>
      </Link>,
    );
    const el = root(container);
    expect(el.hasAttribute('href')).toBe(false);
    expect(el.getAttribute('role')).toBe('link');
    expect(el.getAttribute('aria-disabled')).toBe('true');
  });

  it('takes ref as a prop, and passes className, style and other props through', () => {
    const ref = createRef<HTMLAnchorElement>();
    const { container } = render(
      <Link ref={ref} href="#guide" className="x" style={{ opacity: 0.5 }} data-testid="l" aria-describedby="hint">
        Read the guide
      </Link>,
    );
    const el = root(container);
    expect(ref.current).toBe(el);
    expect(el.className).toBe('x');
    expect(el.style.opacity).toBe('0.5');
    expect(el.getAttribute('data-testid')).toBe('l');
    expect(el.getAttribute('aria-describedby')).toBe('hint');
  });

  it('renders every demo case', () => {
    const { container } = render(<LinkDemo />);
    for (const id of ['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
    expect(container.querySelector('[data-demo-case="variants"] [data-ds="theme"][lang="ar"]')).not.toBeNull();
    const arabic = container.querySelector('[data-demo-case="long-arabic"] [data-ds="theme"]');
    expect(arabic?.getAttribute('dir')).toBe('rtl');
    const variants = container.querySelector('[data-demo-case="variants"]');
    for (const size of ['xs', 'sm', 'md', 'lg']) {
      expect(variants?.querySelector(`[data-ds="link"][data-size="${size}"]`)).not.toBeNull();
    }
    for (const tone of ['neutral', 'accent']) {
      expect(variants?.querySelector(`[data-ds="link"][data-tone="${tone}"]`)).not.toBeNull();
    }
  });

  it('says new tab in Arabic under a regional Arabic tag', () => {
    render(
      <Theme lang="ar-SA">
        <Link href="https://example.com" external>
          الدليل
        </Link>
      </Theme>,
    );
    expect(screen.getByRole('link').textContent).toContain('، ');
  });
});

describe('Link underline draw (interaction link-underline)', () => {
  const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Link.css'), 'utf8');

  it('draws a decorative layer of a standalone link with a clip from the inline start, flipping in right to left text (round 3)', () => {
    expect(css).toContain("[data-ds='link'][data-standalone] > [data-part='label']::after {");
    expect(css).toContain('clip-path: var(--_link-clip-now);');
    expect(css).not.toContain('scaleX(');
    const root = css.indexOf("[data-ds='link'] {");
    const rest = css.slice(root, css.indexOf('}', root));
    expect(rest).toContain('--_link-clip-start: inset(0 100% 0 0);');
    expect(rest).toContain('--_link-clip-end: inset(0 0 0 100%);');
    const rtl = css.indexOf("[data-ds='link']:dir(rtl) {");
    const flipped = css.slice(rtl, css.indexOf('}', rtl));
    expect(flipped).toContain('--_link-clip-start: inset(0 0 0 100%);');
    expect(flipped).toContain('--_link-clip-end: inset(0 100% 0 0);');
    const draw = css.indexOf('@keyframes ds-link-draw');
    expect(css.slice(draw, css.indexOf('}', draw))).toContain('clip-path: var(--_link-clip-start);');
  });

  it('draws on press too and keeps hover behind a hover capable device, so a tap leaves no hover look (round 3)', () => {
    const press = css.indexOf("[data-ds='link'][data-standalone]:is(:focus-visible, :active):not([data-disabled]) {");
    expect(css.slice(press, css.indexOf('}', press))).toContain('--_link-clip-now: inset(0);');
    const media = css.indexOf('@media (hover: hover)');
    expect(media).toBeGreaterThan(0);
    expect(css.slice(media)).toContain("[data-ds='link'][data-standalone]:hover:not([data-disabled]) {");
  });

  it('keeps the rest underline on a standalone link, so it never relies on color alone', () => {
    render(
      <Link href="/pricing" standalone>
        Read the pricing guide
      </Link>,
    );
    const link = screen.getByRole('link');
    expect(link.querySelector('[data-part="label"]')).not.toBeNull();
    expect(css).toContain('text-decoration-line: underline;');
  });

  it('turns the nudge off under data-motion reduce as under the media query (B2)', () => {
    const at = css.indexOf(":root[data-motion='reduce'] [data-ds='link'] {");
    expect(at).toBeGreaterThan(0);
    expect(css.slice(at, css.indexOf('}', at))).toContain('--_link-shift: 0px;');
  });
});
