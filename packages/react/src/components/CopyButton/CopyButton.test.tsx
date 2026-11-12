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

describe('CopyButton result morph (interaction copy-swap)', () => {
  interface Call {
    el: Element;
    frames: Keyframe[];
    finish: () => void;
  }

  /** A stand in for Element.animate: records each call and lets the test finish it. */
  function mockAnimate() {
    const calls: Call[] = [];
    const animate = vi.fn(function (this: Element, frames: Keyframe[]) {
      let finish = () => {};
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      calls.push({ el: this, frames, finish: () => finish() });
      return { id: '', playState: 'running', finished, cancel: vi.fn(), effect: { target: this } } as unknown as Animation;
    });
    Object.defineProperty(Element.prototype, 'animate', { configurable: true, value: animate });
    return { calls, restore: () => Reflect.deleteProperty(Element.prototype, 'animate') };
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    mockClipboard(undefined);
  });

  it('morphs the copy icon into the check and swells once, without holding back the state or the status', async () => {
    const { calls, restore } = mockAnimate();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    try {
      render(<CopyButton value="abc" iconOnly label="Copy command" />);
      const el = screen.getByRole('button', { name: 'Copy command' });
      await click(el);
      expect(el.getAttribute('data-state')).toBe('copied');
      expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Copied');
      const part = el.querySelector('[data-part="icon"]');
      const icons = part?.querySelectorAll('[data-ds="icon"]');
      expect(Array.from(icons ?? []).map((i) => i.getAttribute('data-icon'))).toEqual(['check', 'copy']);
      const leaving = part?.lastElementChild;
      expect(leaving?.tagName).toBe('SPAN');
      expect(leaving?.getAttribute('aria-hidden')).toBe('true');
      expect(leaving?.hasAttribute('data-part')).toBe(false);
      // The copy icon rolls up and out; the check turns in; the button swells.
      const out = calls.find((c) => c.el === leaving);
      expect(JSON.stringify(out?.frames)).toContain('translateY');
      const inn = calls.find((c) => c.el === part?.firstElementChild);
      expect(JSON.stringify(inn?.frames)).toContain('rotate(-45deg)');
      const swell = calls.find((c) => c.el === el);
      expect(JSON.stringify(swell?.frames)).toContain('--ds-scale-pop');
      // The leaving copy goes once its exit settles.
      await act(async () => {
        for (const c of calls) c.finish();
        for (let i = 0; i < 5; i += 1) await Promise.resolve();
      });
      expect(part?.querySelectorAll('[data-ds="icon"]')).toHaveLength(1);
      // The return to idle rolls the copy icon back in from above.
      calls.length = 0;
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(el.getAttribute('data-state')).toBe('idle');
      expect(Array.from(part?.querySelectorAll('[data-ds="icon"]') ?? []).map((i) => i.getAttribute('data-icon'))).toEqual(['copy', 'check']);
      const back = calls.find((c) => c.el === part?.firstElementChild);
      expect(JSON.stringify(back?.frames)).toContain('translateY(calc(-1 *');
    } finally {
      restore();
    }
  });

  it('shakes once after a failure', async () => {
    const { calls, restore } = mockAnimate();
    mockClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    try {
      render(<CopyButton value="abc" />);
      const el = screen.getByRole('button');
      await click(el);
      expect(el.getAttribute('data-state')).toBe('failed');
      const shake = calls.find((c) => c.el === el);
      expect(JSON.stringify(shake?.frames)).toContain('translateX');
    } finally {
      restore();
    }
  });

  it('fades under reduced motion', async () => {
    const { calls, restore } = mockAnimate();
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }));
    try {
      render(<CopyButton value="abc" />);
      await click(screen.getByRole('button'));
      const swaps = calls.filter((c) => JSON.stringify(c.frames).includes('opacity'));
      expect(swaps).toHaveLength(2);
      for (const c of swaps) expect(JSON.stringify(c.frames)).not.toContain('transform');
    } finally {
      restore();
    }
  });

  it('adds no leaving copy without the Web Animations API', async () => {
    mockClipboard(vi.fn().mockResolvedValue(undefined));
    render(<CopyButton value="abc" />);
    const el = screen.getByRole('button');
    await click(el);
    expect(el.querySelector('[data-part="icon"]')?.children).toHaveLength(1);
  });
});
