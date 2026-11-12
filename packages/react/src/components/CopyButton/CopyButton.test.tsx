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
    expect(el.querySelector('[data-part="icon"] [data-ds="icon"]')?.getAttribute('data-icon')).toBe('copy');
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Copy');
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
    expect(el.querySelector('[data-ds="icon"]')?.getAttribute('data-icon')).toBe('check');
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
    expect(el.querySelector('[data-ds="icon"]')?.getAttribute('data-icon')).toBe('warning');
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
