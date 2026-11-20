// Order C5 (item 5): the large title may wrap to two lines on a narrow shell
// (WCAG 2.2 1.4.10), so the collapse measures the heading instead of
// assuming one line. The wrap itself is the platform CSS.
import { fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Theme } from '../../theme';
import { PageShell } from '../PageShell';
import { Navbar } from './index';

/** A ResizeObserver jsdom lacks, that the test can fire by hand. */
const observers: { cb: ResizeObserverCallback; els: Element[] }[] = [];
class FakeResizeObserver {
  private entry: { cb: ResizeObserverCallback; els: Element[] };
  constructor(cb: ResizeObserverCallback) {
    this.entry = { cb, els: [] };
    observers.push(this.entry);
  }
  observe(el: Element) {
    this.entry.els.push(el);
  }
  unobserve() {}
  disconnect() {
    this.entry.els = [];
  }
}

const restore: (() => void)[] = [];
afterEach(() => {
  while (restore.length) restore.pop()?.();
  observers.length = 0;
});

/** The heading reports this height, scroll timelines exist, and ResizeObserver is the fake one. */
function setup(height: { value: number }) {
  const supports = CSS.supports;
  CSS.supports = ((q: string) => q === 'animation-timeline: scroll()' || supports.call(CSS, q)) as typeof CSS.supports;
  const desc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return this.getAttribute('data-part') === 'heading' ? height.value : 0;
    },
  });
  const had = window.ResizeObserver;
  window.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
  restore.push(() => {
    CSS.supports = supports;
    if (desc) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', desc);
    window.ResizeObserver = had;
  });
}

function shell(platform: 'ios' | 'web' = 'ios', title = 'Songs from the long night drive') {
  return (
    <Theme platform={platform}>
      <PageShell embedded header={<Navbar label="Songs" items={[]} heading={title} />}>
        <a href="#one">One</a>
      </PageShell>
    </Theme>
  );
}

const shellOf = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="page-shell"]')!;
const mainOf = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="page-shell"] > [data-part="main"]')!;
const barOf = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-ds="navbar"]')!;

describe('Navbar two line title (order C5)', () => {
  it('writes the measured heading height on the shell, and again when the heading wraps', () => {
    const height = { value: 49 };
    setup(height);
    const { container } = render(shell());
    expect(shellOf(container).style.getPropertyValue('--_navbar-heading-size')).toBe('49px');
    // The shell narrows below 360 and the title wraps to two lines.
    height.value = 90;
    for (const o of observers) o.cb([], o as unknown as ResizeObserver);
    expect(shellOf(container).style.getPropertyValue('--_navbar-heading-size')).toBe('90px');
  });

  it('collapses at the measured height of a two line title, not at one line', async () => {
    const height = { value: 90 };
    setup(height);
    const { container } = render(shell());
    fireEvent.scroll(Object.assign(mainOf(container), { scrollTop: 60 }));
    await new Promise((done) => requestAnimationFrame(() => done(null)));
    await new Promise((done) => setTimeout(done, 20));
    expect(barOf(container).hasAttribute('data-collapsed')).toBe(false);
    fireEvent.scroll(Object.assign(mainOf(container), { scrollTop: 90 }));
    await waitFor(() => expect(barOf(container).getAttribute('data-collapsed')).toBe(''));
  });

  it('a wrap while scrolled moves the collapse point at once', async () => {
    const height = { value: 49 };
    setup(height);
    const { container } = render(shell());
    fireEvent.scroll(Object.assign(mainOf(container), { scrollTop: 60 }));
    await waitFor(() => expect(barOf(container).getAttribute('data-collapsed')).toBe(''));
    height.value = 90;
    for (const o of observers) o.cb([], o as unknown as ResizeObserver);
    await waitFor(() => expect(barOf(container).hasAttribute('data-collapsed')).toBe(false));
  });

  it('removes the height when the bar leaves, and writes none on web', () => {
    setup({ value: 49 });
    const ios = render(shell());
    const el = shellOf(ios.container);
    expect(el.style.getPropertyValue('--_navbar-heading-size')).toBe('49px');
    ios.rerender(
      <Theme platform="ios">
        <PageShell embedded header={<Navbar label="Songs" items={[]} />}>
          <a href="#one">One</a>
        </PageShell>
      </Theme>,
    );
    expect(el.style.getPropertyValue('--_navbar-heading-size')).toBe('');
    ios.unmount();
    const web = render(shell('web'));
    expect(shellOf(web.container).style.getPropertyValue('--_navbar-heading-size')).toBe('');
  });

  it('measures an Arabic title the same way', () => {
    setup({ value: 96 });
    const { container } = render(
      <Theme platform="ios" lang="ar" dir="rtl">
        <PageShell embedded header={<Navbar label="الأغاني" items={[]} heading="أغاني رحلة الليل الطويلة على الطريق" />}>
          <a href="#one">واحد</a>
        </PageShell>
      </Theme>,
    );
    expect(shellOf(container).style.getPropertyValue('--_navbar-heading-size')).toBe('96px');
  });
});
