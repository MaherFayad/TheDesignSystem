import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsButton } from './button';

@Component({
  imports: [DsButton],
  template: `
    <button id="plain" dsButton>Save draft</button>
    <button id="primary" dsButton tone="accent" emphasis="solid" size="lg" shape="pill" start="plus" end="arrow-forward" fullWidth wrap>Publish page</button>
    <button id="disabled" dsButton disabled (click)="clicks.set(clicks() + 1)">Delete project</button>
    <button id="loading" dsButton [loading]="loading()" loadingLabel="Saving name" (click)="clicks.set(clicks() + 1)">Rename board</button>
    <a id="link" dsButton href="#docs" [disabled]="linkDisabled()">Read the guide</a>
    <form (submit)="submits.set(submits() + 1); $event.preventDefault()">
      <button id="submit" dsButton type="submit" [disabled]="true">Send form</button>
    </form>
  `,
})
class Host {
  readonly clicks = signal(0);
  readonly submits = signal(0);
  readonly loading = signal(false);
  readonly linkDisabled = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsButton', () => {
  it('stamps the root attributes with the React defaults', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('button');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('data-shape')).toBe('default');
    for (const absent of ['data-loading', 'data-disabled', 'aria-disabled', 'aria-busy', 'data-full-width', 'data-wrap']) {
      expect(el.hasAttribute(absent)).toBe(false);
    }
  });

  it('maps every input to its attribute and renders the parts in order', async () => {
    const { q } = await setup();
    const el = q('primary');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-shape')).toBe('pill');
    expect(el.getAttribute('data-full-width')).toBe('');
    expect(el.getAttribute('data-wrap')).toBe('');
    const parts = Array.from(el.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'label', 'end']);
    expect(el.querySelector('[data-part="start"] > svg')?.getAttribute('data-icon')).toBe('plus');
  });

  it('leaves no input attribute or selector marker on the host', async () => {
    const { q } = await setup();
    const el = q('primary');
    for (const name of ['dsbutton', 'tone', 'emphasis', 'size', 'shape', 'start', 'end', 'fullwidth', 'wrap']) {
      expect(el.hasAttribute(name)).toBe(false);
    }
    // A static disabled must not become the native attribute: the button stays focusable.
    expect(q('disabled').hasAttribute('disabled')).toBe(false);
  });

  it('disabled: aria-disabled, data-disabled, and a click does nothing', async () => {
    const { q, host } = await setup();
    const el = q('disabled');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('data-disabled')).toBe('');
    el.click();
    expect(host.clicks()).toBe(0);
  });

  it('a disabled submit button does not submit its form', async () => {
    const { q, host } = await setup();
    q('submit').click();
    expect(host.submits()).toBe(0);
  });

  it('loading: spinner and status parts, aria-busy, and clicks are blocked', async () => {
    const { q, host, fixture } = await setup();
    const el = q('loading');
    el.click();
    expect(host.clicks()).toBe(1);
    host.loading.set(true);
    await fixture.whenStable();
    expect(el.getAttribute('data-loading')).toBe('');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label', 'spinner', 'status']);
    expect(el.querySelector('[data-part="status"]')?.textContent).toBe('Saving name');
    el.click();
    expect(host.clicks()).toBe(1);
  });

  it('a link button has no type, and loses its href while inert', async () => {
    const { q, host, fixture } = await setup();
    const el = q('link');
    expect(el.hasAttribute('type')).toBe(false);
    expect(el.getAttribute('href')).toBe('#docs');
    host.linkDisabled.set(true);
    await fixture.whenStable();
    expect(el.hasAttribute('href')).toBe(false);
    expect(el.getAttribute('role')).toBe('link');
  });
});
