// The confirmation of CopyButton (interactions copy-swap and copy-bubble,
// round 3), as React's CopyButton.test.tsx checks it: the stacked glyphs and
// words, the fixed accessible name, one polite status with a new text node
// per copy, the roll back after delay.feedback and the bubble of the icon
// only form. The motion itself is CSS, driven by data-state and data-roll.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DsCopyButton } from './copy-button';

@Component({
  imports: [DsCopyButton],
  template: `
    <button id="text" dsCopyButton value="abc" label="Copy link" style="--ds-delay-feedback: 2000ms"></button>
    <button id="icon" dsCopyButton value="abc" iconOnly label="Copy command" style="--ds-delay-feedback: 2000ms"></button>
  `,
})
class Host {}

function mockClipboard(ok: boolean) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => (ok ? Promise.resolve() : Promise.reject(new Error('denied'))) },
    configurable: true,
  });
  if (!ok) Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  /** Clicks and lets the copy resolve. */
  const click = async (el: HTMLElement) => {
    el.click();
    for (let i = 0; i < 10; i += 1) await Promise.resolve();
    await fixture.whenStable();
  };
  /** Moves the fake clock and renders. */
  const advance = async (ms: number) => {
    vi.advanceTimersByTime(ms);
    await fixture.whenStable();
  };
  return { q, click, advance };
}

describe('DsCopyButton confirmation (copy-swap, copy-bubble, round 3)', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, 'clipboard');
    Reflect.deleteProperty(document, 'execCommand');
  });

  it('rolls the label to Copied and back, keeping the accessible name and the three words', async () => {
    mockClipboard(true);
    const { q, click, advance } = await setup();
    const el = q('text');
    const word = (s: string) => el.querySelector(`[data-copy-label="${s}"]`);
    await click(el);
    expect(el.getAttribute('data-state')).toBe('copied');
    expect(word('copied')?.hasAttribute('data-roll')).toBe(true);
    expect(word('idle')?.hasAttribute('data-roll')).toBe(false);
    expect(el.getAttribute('aria-label')).toBe('Copy link');
    expect(el.querySelectorAll('[data-part="label"] > [data-copy-label]')).toHaveLength(3);
    await advance(5000);
    expect(el.getAttribute('data-state')).toBe('idle');
    // Back at idle, the idle word rolls in again.
    expect(word('idle')?.hasAttribute('data-roll')).toBe(true);
    expect(word('copied')?.hasAttribute('data-roll')).toBe(false);
  });

  it('writes the status once per copy and restarts cleanly on a second copy', async () => {
    mockClipboard(true);
    const { q, click, advance } = await setup();
    const el = q('text');
    const statuses = () => el.querySelectorAll('[role="status"]');
    await click(el);
    expect(statuses()).toHaveLength(1);
    const first = statuses()[0]?.firstElementChild;
    const check = el.querySelector('[data-copy-glyph="copied"]');
    expect(first?.textContent).toBe('Copied');
    await advance(500);
    await click(el);
    // A new text node in the one live region, so the second copy is heard too; the check renders again.
    const second = statuses()[0]?.firstElementChild;
    expect(statuses()).toHaveLength(1);
    expect(second?.textContent).toBe('Copied');
    expect(second).not.toBe(first);
    expect(el.querySelector('[data-copy-glyph="copied"]')).not.toBe(check);
    // The idle glyph is kept: only the result glyphs are keyed by the count.
    expect(el.querySelector('[data-part="icon"]')?.children).toHaveLength(3);
    // The hold restarted: 1.9s after the second copy it still shows.
    await advance(1900);
    expect(el.getAttribute('data-state')).toBe('copied');
    await advance(5000);
    expect(el.getAttribute('data-state')).toBe('idle');
    expect(statuses()[0]?.textContent).toBe('');
  });

  it('rolls to Could not copy after a failure', async () => {
    mockClipboard(false);
    const { q, click } = await setup();
    const el = q('text');
    await click(el);
    expect(el.getAttribute('data-state')).toBe('failed');
    expect(el.querySelector('[data-copy-label="failed"]')?.hasAttribute('data-roll')).toBe(true);
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Could not copy');
  });

  it('shows a decorative bubble with the result word in the icon only form', async () => {
    mockClipboard(false);
    const { q, click } = await setup();
    const el = q('icon');
    expect(el.querySelector('[data-part="label"]')).toBeNull();
    const bubble = () => el.querySelector('[data-part="bubble"]');
    expect(bubble()?.getAttribute('aria-hidden')).toBe('true');
    expect(bubble()?.textContent).toBe('Copied');
    const before = bubble();
    await click(el);
    expect(bubble()?.textContent).toBe('Could not copy');
    // Keyed by the count, so the rise replays.
    expect(bubble()).not.toBe(before);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'bubble', 'status', 'hit']);
  });
});
