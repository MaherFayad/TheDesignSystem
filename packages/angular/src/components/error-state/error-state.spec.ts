import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import ErrorStateDemo from './error-state.demo';
import { DsErrorState } from './error-state';

@Component({
  imports: [DsButton, DsErrorState, DsTheme],
  template: `
    <div id="plain" dsErrorState title="Could not load members"></div>
    <ng-template #more><button dsButton>Open boards</button></ng-template>
    <div id="full" dsErrorState title="Could not load" body="Retry." [onRetry]="retry" [retrying]="busy()" [actions]="more" code="ERR_TIMEOUT 504" size="lg" [headingLevel]="3"></div>
    <div id="live" dsErrorState live title="Could not load" [icon]="false"></div>
    <div dsTheme [lang]="'ar'">
      <div id="theme-ar" dsErrorState title="تعذر" [onRetry]="retry" code="E1"></div>
      <div id="prop-en" dsErrorState lang="en" title="Could not load" [onRetry]="retry"></div>
    </div>
    <div id="prop-ar" dsErrorState lang="ar" title="تعذر"></div>
    <div id="body" dsErrorState title="Could not load" [body]="list"></div>
    <ng-template #list><ul><li>One</li></ul><p>Two</p></ng-template>
  `,
})
class Host {
  readonly retries = signal(0);
  readonly busy = signal(false);
  readonly retry = () => this.retries.update((n) => n + 1);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}
const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('DsErrorState', () => {
  it('renders the anatomy and the defaults: a group named by its title, no live role', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('error-state');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-state')).toBe('error');
    expect(el.getAttribute('role')).toBe('group');
    expect(el.hasAttribute('title')).toBe(false);
    expect(el.hasAttribute('dir')).toBe(false);
    expect(parts(el)).toEqual(['icon', 'title']);
    const title = el.querySelector('[data-part="title"]');
    expect(title?.tagName).toBe('H2');
    expect(el.getAttribute('aria-labelledby')).toBe(title?.id);
    expect(el.querySelector('[data-part="icon"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('svg')?.getAttribute('data-icon')).toBe('alert-circle');
  });

  it('puts the retry Button first in the actions, calls onRetry, and shows the code in closed details', async () => {
    const { q, host, fixture } = await setup();
    const el = q('full');
    expect(parts(el)).toEqual(['icon', 'title', 'body', 'actions', 'details']);
    expect(el.querySelector('[data-part="title"]')?.tagName).toBe('H3');
    expect(el.querySelector('svg')?.getAttribute('data-size')).toBe('lg');
    const actions = el.querySelector('[data-part="actions"]');
    const retry = actions?.firstElementChild as HTMLElement;
    expect(retry.getAttribute('data-part')).toBe('retry');
    expect(retry.getAttribute('data-tone')).toBe('accent');
    expect(retry.textContent).toContain('Retry loading');
    expect(actions?.children.length).toBe(2);
    retry.click();
    expect(host.retries()).toBe(1);
    const details = el.querySelector('details');
    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelector('[data-part="code"]')?.textContent).toBe('Error code: ERR_TIMEOUT 504');
    expect(details?.querySelector('code')?.getAttribute('dir')).toBe('ltr');
    host.busy.set(true);
    await fixture.whenStable();
    expect(el.getAttribute('data-state')).toBe('retrying');
    expect(retry.getAttribute('data-loading')).toBe('');
    expect(retry.querySelector('[data-part="status"]')?.textContent).toBe('Retrying');
  });

  it('with live it is an alert with aria-atomic false and no name override', async () => {
    const { q } = await setup();
    const el = q('live');
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.getAttribute('aria-atomic')).toBe('false');
    expect(el.hasAttribute('aria-labelledby')).toBe(false);
    expect(parts(el)).toEqual(['title']);
  });

  it('takes the words from the theme, and the lang input wins and sets lang and dir', async () => {
    const { q } = await setup();
    const ar = q('theme-ar');
    expect(ar.hasAttribute('lang')).toBe(false);
    expect(ar.hasAttribute('dir')).toBe(false);
    expect(ar.querySelector('[data-part="retry"]')?.textContent).toContain('إعادة التحميل');
    expect(ar.querySelector('summary')?.textContent).toBe('تفاصيل الخطأ');
    const en = q('prop-en');
    expect(en.getAttribute('lang')).toBe('en');
    expect(en.getAttribute('dir')).toBe('ltr');
    expect(en.querySelector('[data-part="retry"]')?.textContent).toContain('Retry loading');
    expect(q('prop-ar').getAttribute('dir')).toBe('rtl');
  });

  it('renders the body as a block, so a list or a second paragraph is valid', async () => {
    const { q } = await setup();
    const body = q('body').querySelector('[data-part="body"]');
    expect(body?.tagName).toBe('DIV');
    expect(body?.querySelector('ul')).not.toBeNull();
  });

  it('demo renders its cases in order', async () => {
    const fixture = TestBed.createComponent(ErrorStateDemo);
    await fixture.whenStable();
    const ids = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});
