import type { CSSProperties } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Theme } from '../../theme';
import CopyButtonDemo from './CopyButton.demo';
import { copyWithCommand } from './copy';
import { CopyButton } from './index';

function mockClipboard(writeText: ((text: string) => Promise<void>) | undefined) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText ? { writeText } : undefined });
}

async function click(el: HTMLElement) {
  // The copy resolves in a few microtasks; fake timers hold the return to idle until a test advances them.
  await act(async () => {
    fireEvent.click(el);
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
  });
}

describe('CopyButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    mockClipboard(undefined);
  });

  it('renders idle with the copy icon, the label and an empty status', () => {
    render(<CopyButton value="abc" />);
    const el = screen.getByRole('button', { name: 'Copy' });
    expect(el.getAttribute('data-ds')).toBe('copy-button');
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(el.getAttribute('data-emphasis')).toBe('ghost');
    const glyphs = Array.from(el.querySelectorAll('[data-part="icon"] [data-copy-glyph]'));
    expect(glyphs.map((g) => g.getAttribute('data-copy-glyph'))).toEqual(['idle', 'copied', 'failed']);
    expect(glyphs.map((g) => g.querySelector('[data-ds="icon"]')?.getAttribute('data-icon'))).toEqual(['copy', 'check', 'warning']);
    // Every word sits in the label, so the width is the widest; only the idle word is read.
    const words = Array.from(el.querySelectorAll('[data-part="label"] > [data-copy-label]'));
    expect(words.map((w) => w.textContent)).toEqual(['Copy', 'Copied', 'Could not copy']);
    expect(words.map((w) => w.getAttribute('aria-hidden'))).toEqual([null, 'true', 'true']);
    expect(words.some((w) => w.hasAttribute('data-roll'))).toBe(false);
    expect(el.querySelector('[data-part="bubble"]')).toBeNull();
    const status = el.querySelector('[data-part="status"]');
    expect(status?.getAttribute('role')).toBe('status');
    expect(status?.textContent).toBe('');
  });

  it('copies through the Clipboard API, says Copied once and returns to idle', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    const onCopied = vi.fn();
    render(<CopyButton value="npx the-system" iconOnly label="Copy command" onCopied={onCopied} />);
    const el = screen.getByRole('button', { name: 'Copy command' });
    await click(el);
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('npx the-system');
    expect(onCopied).toHaveBeenCalledWith('npx the-system');
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Copied');
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('');
  });

  it('falls back to the copy command when the API is missing', async () => {
    mockClipboard(undefined);
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: exec });
    render(<CopyButton value="abc" />);
    const el = screen.getByRole('button');
    await click(el);
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(exec).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('a failure says Could not copy and selects the target text', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn().mockReturnValue(false) });
    const onCopyFailed = vi.fn();
    render(
      <>
        <code id="cmd">npx the-system</code>
        <CopyButton value="npx the-system" target="cmd" onCopyFailed={onCopyFailed} />
      </>,
    );
    const el = screen.getByRole('button');
    await click(el);
    expect(el.getAttribute('data-state')).toBe('failed');
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Could not copy');
    expect(el.querySelector('[data-copy-label="failed"]')?.hasAttribute('data-roll')).toBe(true);
    expect(onCopyFailed).toHaveBeenCalled();
    expect(window.getSelection()?.toString()).toBe('npx the-system');
  });

  it('does not copy while disabled', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<CopyButton value="abc" disabled />);
    await click(screen.getByRole('button'));
    expect(writeText).not.toHaveBeenCalled();
  });

  it('uses the Arabic words under an Arabic Theme', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(
      <Theme lang="ar">
        <CopyButton value="abc" />
      </Theme>,
    );
    const el = screen.getByRole('button', { name: 'نسخ' });
    await click(el);
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('تم النسخ');
  });

  it('copyWithCommand reports false when the command is missing', () => {
    Object.defineProperty(document, 'execCommand', { configurable: true, value: undefined });
    expect(copyWithCommand('abc')).toBe(false);
  });

  it('renders every demo case', () => {
    const { container } = render(<CopyButtonDemo />);
    for (const id of ['variants', 'one', 'many', 'long-text', 'long-arabic', 'disabled']) {
      expect(container.querySelector(`[data-demo-case="${id}"]`)).not.toBeNull();
    }
  });
});

describe('CopyButton confirmation (interaction copy-swap, round 3)', () => {
  /** The hold time token, set on the button so jsdom reads it. */
  const hold = { '--ds-delay-feedback': '2000ms' } as CSSProperties;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    mockClipboard(undefined);
  });

  it('rolls the label to Copied and back, keeping the accessible name and the width', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton value="abc" label="Copy link" style={hold} />);
    const el = screen.getByRole('button', { name: 'Copy link' });
    const word = (s: string) => el.querySelector(`[data-copy-label="${s}"]`);
    await click(el);
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(word('copied')?.hasAttribute('data-roll')).toBe(true);
    expect(word('idle')?.hasAttribute('data-roll')).toBe(false);
    // The accessible name does not change: the status says the result.
    expect(screen.getByRole('button', { name: 'Copy link' })).toBe(el);
    expect(el.querySelectorAll('[data-part="label"] > [data-copy-label]')).toHaveLength(3);
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(el.getAttribute('data-state')).toBe('idle');
    // Back at idle, the idle word rolls in again.
    expect(word('idle')?.hasAttribute('data-roll')).toBe(true);
    expect(word('copied')?.hasAttribute('data-roll')).toBe(false);
  });

  it('writes the status once per copy and restarts cleanly on a second copy', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton value="abc" style={hold} />);
    const el = screen.getByRole('button');
    const statuses = () => el.querySelectorAll('[role="status"]');
    await click(el);
    expect(statuses()).toHaveLength(1);
    const first = statuses()[0]?.firstElementChild;
    const check = el.querySelector('[data-copy-glyph="copied"]');
    expect(first?.textContent).toBe('Copied');
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    await click(el);
    // A new text node in the one live region, so the second copy is heard too; the check is drawn again.
    const second = statuses()[0]?.firstElementChild;
    expect(statuses()).toHaveLength(1);
    expect(second?.textContent).toBe('Copied');
    expect(second).not.toBe(first);
    expect(el.querySelector('[data-copy-glyph="copied"]')).not.toBe(check);
    // The hold restarted: 1.9s after the second copy (2.4s after the first) it still shows.
    await act(async () => {
      vi.advanceTimersByTime(1900);
    });
    expect(el.getAttribute('data-state')).toBe('copied');
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(statuses()[0]?.textContent).toBe('');
  });

  it('shows a decorative bubble with the result word in the icon only form', async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn().mockReturnValue(false) });
    render(<CopyButton value="abc" iconOnly label="Copy command" />);
    const el = screen.getByRole('button', { name: 'Copy command' });
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    const bubble = () => el.querySelector('[data-part="bubble"]');
    expect(bubble()?.getAttribute('aria-hidden')).toBe('true');
    await click(el);
    expect(el.getAttribute('data-state')).toBe('failed');
    expect(bubble()?.textContent).toBe('Could not copy');
    // The bubble keeps its word while it fades out after the hold.
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(bubble()?.textContent).toBe('Could not copy');
  });

  it('plays from the CSS alone, so it needs no Web Animations API', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    const animate = vi.fn();
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    try {
      render(<CopyButton value="abc" />);
      await click(screen.getByRole('button'));
      expect(animate).not.toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(Element.prototype, 'animate');
    }
  });
});
