import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsIconButton } from '../icon-button/icon-button';
import { DsInput } from '../input/input';
import { DS_INPUT_GROUP } from './input-group';

@Component({
  imports: [DS_INPUT_GROUP, DsButton, DsIconButton, DsInput, DsField],
  template: `
    <div id="group" dsInputGroup size="sm" shape="pill">
      <span dsInputGroupAddon>https://</span>
      <div dsInput aria-label="Address" aria-describedby="own"></div>
      <span dsInputGroupAddon id="suffix">.example.com</span>
      <button dsIconButton icon="copy" label="Copy address"></button>
    </div>
    <div id="own-size" dsInputGroup size="lg">
      <div dsInput size="xs"></div>
    </div>
    <div dsField label="Address" [disabled]="disabled()" readOnly>
      <div id="in-field" dsInputGroup>
        <div dsInput></div>
        <button data-t="act" dsIconButton icon="copy" label="Copy" (click)="clicks = clicks + 1"></button>
        @if (showAddon()) {
          <span dsInputGroupAddon>px</span>
        }
      </div>
    </div>
    <button id="outside" dsButton data-part="close">Close panel</button>
  `,
})
class Host {
  readonly disabled = signal(true);
  readonly showAddon = signal(true);
  clicks = 0;
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsInputGroup', () => {
  it('is a group that stamps the parts on its children', async () => {
    const { q } = await setup();
    const group = q('#group');
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('data-ds')).toBe('input-group');
    expect(group.getAttribute('data-size')).toBe('sm');
    expect(group.getAttribute('data-shape')).toBe('pill');
    const parts = Array.from(group.children).map((c) => c.getAttribute('data-part'));
    expect(parts).toEqual(['addon', 'control', 'addon', 'action']);
    const input = group.querySelector('[data-ds="input"]') as HTMLElement;
    expect(input.getAttribute('data-size')).toBe('sm');
    expect(input.getAttribute('data-shape')).toBe('pill');
  });

  it('links the add ons to the control, in order, before its own description', async () => {
    const { q } = await setup();
    const group = q('#group');
    const [first, second] = Array.from(group.querySelectorAll('[data-part="addon"]'));
    expect(second?.id).toBe('suffix');
    expect(group.querySelector('input')?.getAttribute('aria-describedby')).toBe(`${first?.id} suffix own`);
  });

  it('lets a control keep its own size', async () => {
    const { q } = await setup();
    expect(q('#own-size [data-ds="input"]').getAttribute('data-size')).toBe('xs');
  });

  it('follows the field state and drops a removed add on', async () => {
    const { fixture, host, q } = await setup();
    const group = q('#in-field');
    expect(group.getAttribute('data-disabled')).toBe('');
    expect(group.getAttribute('aria-disabled')).toBe('true');
    expect(group.getAttribute('data-readonly')).toBe('');
    const input = group.querySelector('input') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(input.getAttribute('aria-describedby')).toBe(group.querySelector('[data-part="addon"]')?.id);
    host.showAddon.set(false);
    host.disabled.set(false);
    await fixture.whenStable();
    expect(input.hasAttribute('aria-describedby')).toBe(false);
    expect(group.hasAttribute('aria-disabled')).toBe(false);
  });

  it('leaves a button outside a group alone', async () => {
    const { q } = await setup();
    expect(q('#outside').getAttribute('data-part')).toBe('close');
  });

  it('disables an action with the group, and enables it again', async () => {
    const { fixture, host, q } = await setup();
    const act = q('[data-t="act"]');
    expect(act.getAttribute('data-part')).toBe('action');
    expect(act.getAttribute('aria-disabled')).toBe('true');
    expect(act.hasAttribute('data-disabled')).toBe(true);
    act.click();
    expect(host.clicks).toBe(0);
    host.disabled.set(false);
    await fixture.whenStable();
    expect(act.hasAttribute('aria-disabled')).toBe(false);
    act.click();
    expect(host.clicks).toBe(1);
  });
});
