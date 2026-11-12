import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Directionality } from '@angular/cdk/bidi';
import { describe, expect, it } from 'vitest';
import { DsTheme, DsThemeService } from './theme';
import { resolveTheme, themeAttributes } from './resolve';

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
