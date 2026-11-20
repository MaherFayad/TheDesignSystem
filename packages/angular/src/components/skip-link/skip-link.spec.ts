// SkipLink: the Angular twin of
// packages/react/src/components/SkipLink/SkipLink.test.tsx. WCAG 2.2
// covered here: 2.4.1 Bypass blocks (Enter moves focus to the target),
// 2.4.3 Focus order (the first tab stop; the target takes focus, with
// tabindex -1 only when it needs one), 4.1.2 Name, role, value (a link
// named by its text, in the theme's language).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import SkipLinkDemo from './skip-link.demo';
import { DsSkipLink } from './skip-link';

@Component({
  imports: [DsSkipLink, DsTheme],
  template: `
    <div dsTheme [lang]="lang()">
      <a dsSkipLink class="x" [href]="href()" (click)="clicked($event)"></a>
      <a href="#x">Boards</a>
      <main id="main">Content</main>
      <input id="search" aria-label="Search" />
      <section id="region" tabindex="-1">Region</section>
      <a id="anchor">Anchor</a>
      <main id="محتوى">Arabic content</main>
    </div>
  `,
})
class Host {
  readonly href = signal('#main');
  readonly lang = signal<'en' | 'ar'>('en');
  stop = false;
  calls = 0;
  clicked(event: MouseEvent) {
    this.calls += 1;
    if (this.stop) event.preventDefault();
  }
}

@Component({
  imports: [DsSkipLink],
  template: `<a dsSkipLink href="#boards">Skip to the board list</a>`,
})
class Custom {}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const link = () => document.querySelector<HTMLAnchorElement>('[data-ds="skip-link"]')!;
const click = (init: MouseEventInit = {}) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
  link().dispatchEvent(event);
  return event;
};

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
  history.replaceState(null, '', window.location.pathname + window.location.search);
});

describe('SkipLink', () => {
  it('renders an anchor to #main with the default English label', async () => {
    await mount(Host);
    expect(link().getAttribute('href')).toBe('#main');
    expect(link().textContent?.trim()).toBe('Skip to main content');
    expect(link().getAttributeNames().sort()).toEqual(['class', 'data-ds', 'href']);
  });

  it('uses the Arabic default label inside an Arabic theme, and projected text over the default', async () => {
    const f = await mount(Host, (h) => h.lang.set('ar'));
    expect(link().textContent?.trim()).toBe('الانتقال للمحتوى الرئيسي');
    f.destroy();
    document.body.replaceChildren();
    await mount(Custom);
    expect(link().textContent?.trim()).toBe('Skip to the board list');
    expect(link().getAttribute('href')).toBe('#boards');
  });

  it('is the first focusable element when placed first', async () => {
    await mount(Host);
    const first = document.querySelector<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])');
    expect(first).toBe(link());
  });

  it('moves focus to a target that was not focusable, adding tabindex -1, and sets the hash', async () => {
    await mount(Host);
    const main = document.getElementById('main')!;
    expect(main.hasAttribute('tabindex')).toBe(false);
    link().focus();
    const event = click();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(main);
    expect(main.getAttribute('tabindex')).toBe('-1');
    expect(window.location.hash).toBe('#main');
  });

  it('leaves a focusable target as it is and keeps an existing tabindex', async () => {
    const f = await mount(Host, (h) => h.href.set('#search'));
    click();
    const input = document.getElementById('search')!;
    expect(document.activeElement).toBe(input);
    expect(input.hasAttribute('tabindex')).toBe(false);
    f.componentInstance.href.set('#region');
    await f.whenStable();
    click();
    expect(document.activeElement?.id).toBe('region');
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
  });

  it('adds tabindex -1 to an anchor with no href', async () => {
    await mount(Host, (h) => h.href.set('#anchor'));
    click();
    expect(document.activeElement?.id).toBe('anchor');
    expect(document.activeElement?.getAttribute('tabindex')).toBe('-1');
  });

  it('decodes an encoded fragment', async () => {
    await mount(Host, (h) => h.href.set('#%D9%85%D8%AD%D8%AA%D9%88%D9%89'));
    click();
    expect(document.activeElement?.id).toBe('محتوى');
  });

  it('leaves a modifier click, a middle click and a missing target to the browser', async () => {
    const f = await mount(Host);
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }]) {
      expect(click(init).defaultPrevented).toBe(false);
    }
    expect(document.activeElement).not.toBe(document.getElementById('main'));
    f.componentInstance.href.set('#nowhere');
    await f.whenStable();
    expect(click().defaultPrevented).toBe(false);
  });

  it("runs the caller's (click) first and respects preventDefault", async () => {
    const f = await mount(Host);
    f.componentInstance.stop = true;
    click();
    expect(f.componentInstance.calls).toBe(1);
    expect(document.activeElement).not.toBe(document.getElementById('main'));
  });

  it('renders every demo case', async () => {
    const f = await mount(SkipLinkDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic']);
    const ar = c.querySelector('[data-demo-case="variants"] [data-demo="content"] [data-ds="skip-link"]')!;
    expect(ar.textContent?.trim()).toBe('الانتقال للمحتوى الرئيسي');
    for (const page of Array.from(c.querySelectorAll('[data-demo-case] > div:not([data-demo]), [data-demo="content"] > div'))) {
      expect(page.firstElementChild?.getAttribute('data-ds')).toBe('skip-link');
    }
  });
});
