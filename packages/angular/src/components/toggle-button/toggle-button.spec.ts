import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';
import { DsToggleButton } from './toggle-button';

@Component({
  imports: [DsToggleButton],
  template: `
    <button id="plain" dsToggleButton>Grid view</button>
    <button id="first" dsToggleButton defaultPressed start="grid" end="check" tone="accent" emphasis="outline">Grid view</button>
    <button id="bound" dsToggleButton [(pressed)]="bold">Bold</button>
    <button id="icon" dsToggleButton icon="eye" label="Show guides"></button>
    <button id="guard" dsToggleButton (click)="$event.preventDefault()">Strict mode</button>
    <button id="named" dsToggleButton aria-label="Bold text">B</button>
    <button id="attr" dsToggleButton [attr.aria-label]="'Italic text'">I</button>
    <button id="disabled" dsToggleButton disabled (pressedChange)="changes.set(changes() + 1)">Lock layer</button>
  `,
})
class Host {
  readonly bold = signal<boolean | undefined>(true);
  readonly changes = signal(0);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsToggleButton', () => {
  it('renders the React DOM: off, soft, no marker or input attributes', async () => {
    const { q } = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('toggle-button');
    expect(el.getAttribute('aria-pressed')).toBe('false');
    expect(el.getAttribute('data-state')).toBe('off');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.getAttribute('type')).toBe('button');
    expect(el.hasAttribute('dstogglebutton')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['label']);
  });

  it('starts pressed with defaultPressed and renders start, label, end', async () => {
    const { q } = await setup();
    const el = q('first');
    expect(el.getAttribute('aria-pressed')).toBe('true');
    expect(el.getAttribute('data-state')).toBe('on');
    expect(el.hasAttribute('defaultpressed')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'label', 'end']);
  });

  it('toggles on click and writes back through [(pressed)]', async () => {
    const { fixture, host, q } = await setup();
    const el = q('bound');
    expect(el.getAttribute('data-state')).toBe('on');
    el.click();
    await fixture.whenStable();
    expect(host.bold()).toBe(false);
    expect(el.getAttribute('aria-pressed')).toBe('false');
    host.bold.set(true);
    await fixture.whenStable();
    expect(el.getAttribute('data-state')).toBe('on');
  });

  it('the icon form takes label as aria-label and renders only the icon part', async () => {
    const { q } = await setup();
    const el = q('icon');
    expect(el.getAttribute('aria-label')).toBe('Show guides');
    expect(el.hasAttribute('label')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon']);
  });

  it('keeps a caller aria-label on the text form', async () => {
    const { q } = await setup();
    expect(q('named').getAttribute('aria-label')).toBe('Bold text');
    expect(q('plain').hasAttribute('aria-label')).toBe(false);
    expect(q('attr').getAttribute('aria-label')).toBe('Italic text');
  });

  it('decides inside the click, after the caller listener, with no microtask wait', async () => {
    const { fixture, q } = await setup();
    const toggle = fixture.debugElement.query(By.css('#guard')).injector.get(DsToggleButton);
    q('guard').click();
    expect(toggle.on()).toBe(false);
    const plain = fixture.debugElement.query(By.css('#plain')).injector.get(DsToggleButton);
    q('plain').click();
    expect(plain.on()).toBe(true);
  });

  it('a caller click that prevents the default keeps the state', async () => {
    const { fixture, q } = await setup();
    q('guard').click();
    await fixture.whenStable();
    expect(q('guard').getAttribute('data-state')).toBe('off');
  });

  it('disabled stays focusable and does not toggle', async () => {
    const { fixture, host, q } = await setup();
    const el = q('disabled');
    expect(el.hasAttribute('disabled')).toBe(false);
    expect(el.getAttribute('aria-disabled')).toBe('true');
    el.click();
    await fixture.whenStable();
    expect(el.getAttribute('data-state')).toBe('off');
    expect(host.changes()).toBe(0);
  });
});
