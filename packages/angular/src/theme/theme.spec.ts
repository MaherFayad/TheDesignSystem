import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Directionality } from '@angular/cdk/bidi';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsDevicePlatform, DsTheme, DsThemeService } from './theme';
import { applyDocumentTheme, resolveTheme, themeAttributes } from './resolve';
import type { PlatformInput } from './types';

@Component({
  selector: 'probe-dir',
  template: '{{ dir.value }} {{ theme.value().lang }} {{ titlebar() }}',
})
class Probe {
  readonly dir = inject(Directionality);
  readonly theme = inject(DsThemeService);
  readonly titlebar = this.theme.optionalPart('dialog', 'titlebar');
}

@Component({
  imports: [DsTheme, Probe],
  template: `
    <div id="root" dsTheme [style]="style()" scheme="light">
      <section id="inner" dsTheme lang="ar"><probe-dir /></section>
      <div id="bound" dsTheme [style]="'desk'"></div>
      <div id="alias" dsTheme="desk"></div>
    </div>
  `,
})
class Host {
  readonly style = signal('studio');
}

describe('resolveTheme', () => {
  it('uses the root defaults from style.json', () => {
    expect(themeAttributes()).toEqual({
      'data-ds': 'theme',
      'data-style': 'studio',
      'data-scheme': 'dark',
      'data-density': 'default',
      'data-contrast': 'default',
      'data-platform': 'web',
      'data-glass': 'regular',
      dir: 'ltr',
      lang: 'en',
    });
  });

  it('lang alone sets dir, and a parent passes the rest down', () => {
    const parent = resolveTheme({ style: 'desk', scheme: 'light' });
    const child = resolveTheme({ lang: 'ar' }, parent);
    expect(child.style).toBe('desk');
    expect(child.scheme).toBe('light');
    expect(child.dir).toBe('rtl');
  });
});

describe('DsTheme', () => {
  it('stamps every axis and resolves from the nearest parent', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const root = fixture.nativeElement.querySelector('#root') as HTMLElement;
    const inner = fixture.nativeElement.querySelector('#inner') as HTMLElement;
    expect(root.getAttribute('data-ds')).toBe('theme');
    expect(root.getAttribute('data-scheme')).toBe('light');
    expect(root.hasAttribute('scheme')).toBe(false);
    expect(root.hasAttribute('dstheme')).toBe(false);
    expect(inner.getAttribute('data-style')).toBe('studio');
    expect(inner.getAttribute('data-scheme')).toBe('light');
    expect(inner.getAttribute('lang')).toBe('ar');
    expect(inner.getAttribute('dir')).toBe('rtl');

    fixture.componentInstance.style.set('desk');
    await fixture.whenStable();
    expect(inner.getAttribute('data-style')).toBe('desk');
  });

  it('takes the style from a [style] binding and from the selector attribute', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#bound').getAttribute('data-style')).toBe('desk');
    expect(fixture.nativeElement.querySelector('#alias').getAttribute('data-style')).toBe('desk');
  });

  it('provides the CDK Directionality, the theme service and optional parts', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const probe = fixture.nativeElement.querySelector('probe-dir') as HTMLElement;
    expect(probe.textContent?.trim()).toBe('rtl ar false');
    fixture.componentInstance.style.set('desk');
    await fixture.whenStable();
    expect(probe.textContent?.trim()).toBe('rtl ar true');
  });
});

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const PIXEL = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36';

/** Makes the test browser report another agent for one test. */
function agent(userAgent: string): () => void {
  const spy = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent);
  return () => spy.mockRestore();
}

@Component({
  imports: [DsTheme],
  template: `
    <div id="root" dsTheme [platform]="platform()">
      <section id="child" dsTheme></section>
      <section id="auto" dsTheme platform="auto"></section>
      <section id="web" dsTheme platform="web"></section>
    </div>
  `,
})
class PlatformHost {
  readonly platform = signal<PlatformInput | undefined>(undefined);
}

describe('DsTheme platform', () => {
  let restore: (() => void) | undefined;
  afterEach(() => {
    restore?.();
    restore = undefined;
    TestBed.resetTestingModule();
  });

  const read = (fixture: { nativeElement: HTMLElement }, id: string) => fixture.nativeElement.querySelector(`#${id}`)?.getAttribute('data-platform');

  it('a root with no platform is auto and stamps the device', async () => {
    restore = agent(IPHONE);
    const fixture = TestBed.createComponent(PlatformHost);
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('ios');
    expect(read(fixture, 'child')).toBe('ios');
    expect(read(fixture, 'auto')).toBe('ios');
    expect(read(fixture, 'web')).toBe('web');
  });

  it('auto on an Android agent stamps android, and auto is never stamped', async () => {
    restore = agent(PIXEL);
    const fixture = TestBed.createComponent(PlatformHost);
    fixture.componentInstance.platform.set('auto');
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('android');
    expect(fixture.nativeElement.querySelector('[data-platform="auto"]')).toBeNull();
  });

  it('an explicit value wins over the device; a nested auto still asks the device', async () => {
    restore = agent(IPHONE);
    const fixture = TestBed.createComponent(PlatformHost);
    fixture.componentInstance.platform.set('web');
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('web');
    expect(read(fixture, 'child')).toBe('web');
    expect(read(fixture, 'auto')).toBe('ios');
    fixture.componentInstance.platform.set('macos');
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('macos');
    expect(read(fixture, 'child')).toBe('macos');
  });

  it('a desktop agent resolves auto to web, never macos', async () => {
    restore = agent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15');
    const fixture = TestBed.createComponent(PlatformHost);
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('web');
  });

  it('under server rendering the device is web and navigator is not read', async () => {
    const spy = vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE);
    restore = () => spy.mockRestore();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    expect(TestBed.inject(DsDevicePlatform).value()).toBe('web');
    expect(spy).not.toHaveBeenCalled();
    const fixture = TestBed.createComponent(PlatformHost);
    await fixture.whenStable();
    expect(read(fixture, 'root')).toBe('web');
    expect(read(fixture, 'auto')).toBe('web');
  });

  it('applyDocumentTheme takes the device as the root default', () => {
    const el = document.createElement('div');
    expect(applyDocumentTheme({ platform: 'auto' }, el, { platform: 'android' })['data-platform']).toBe('android');
    expect(applyDocumentTheme({}, el, { platform: 'ios' })['data-platform']).toBe('ios');
    expect(applyDocumentTheme({ platform: 'web' }, el, { platform: 'ios' })['data-platform']).toBe('web');
    expect(el.getAttribute('data-platform')).toBe('web');
  });
});
