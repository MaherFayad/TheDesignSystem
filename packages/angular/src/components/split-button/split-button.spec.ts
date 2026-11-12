import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsButtonGroup } from '../button-group/button-group';
import { DsDropdownMenuItem } from '../dropdown-menu/dropdown-menu';
import { DsSplitButton, DsSplitButtonMenu } from './split-button';

@Component({
  imports: [DsSplitButton, DsSplitButtonMenu, DsDropdownMenuItem, DsButtonGroup],
  template: `
    <div id="split" dsSplitButton tone="accent" emphasis="solid" size="xs" start="upload" label="Publish page"
      menuLabel="More publish options" aria-label="Publish" [(open)]="open" (action)="runs.set(runs() + 1)">
      <ng-template dsSplitButtonMenu>
        <div id="schedule" dsDropdownMenuItem start="clock" (select)="chosen.set('schedule')">Schedule publish</div>
        <div dsDropdownMenuItem>Save as draft</div>
      </ng-template>
    </div>
    <div id="off" dsSplitButton disabled label="Publish page" menuLabel="More publish options" (action)="runs.set(runs() + 1)">
      <ng-template dsSplitButtonMenu><div dsDropdownMenuItem>Save as draft</div></ng-template>
    </div>
    <div dsButtonGroup attached size="lg" emphasis="outline" shape="pill" aria-label="Page actions">
      <div id="grouped" dsSplitButton label="Publish page" menuLabel="More publish options">
        <ng-template dsSplitButtonMenu><div dsDropdownMenuItem>Save as draft</div></ng-template>
      </div>
    </div>
  `,
})
class Host {
  readonly open = signal<boolean | undefined>(undefined);
  readonly runs = signal(0);
  readonly chosen = signal<string | null>(null);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const q = (sel: string) => document.querySelector(sel) as HTMLElement;
  const settle = async () => {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, q, settle };
}

describe('DsSplitButton', () => {
  afterEach(() => {
    for (const el of Array.from(document.body.children)) el.remove();
  });

  it('renders the root and both halves with the shared axes, as React does', async () => {
    const { q } = await setup();
    const root = q('#split');
    expect(root.getAttribute('data-ds')).toBe('split-button');
    expect(root.getAttribute('data-size')).toBe('xs');
    expect(root.getAttribute('data-tone')).toBe('accent');
    expect(root.getAttribute('data-emphasis')).toBe('solid');
    expect(root.getAttribute('data-shape')).toBe('default');
    expect(root.getAttribute('aria-label')).toBe('Publish');
    for (const absent of ['dssplitbutton', 'label', 'menulabel', 'tone']) expect(root.hasAttribute(absent)).toBe(false);
    const [action, trigger] = Array.from(root.children) as HTMLElement[];
    expect(action?.getAttribute('data-part')).toBe('action');
    expect(action?.getAttribute('data-ds')).toBe('button');
    expect(action?.querySelector('[data-part="label"]')?.textContent).toBe('Publish page');
    expect(trigger?.getAttribute('data-part')).toBe('trigger');
    expect(trigger?.getAttribute('data-ds')).toBe('icon-button');
    expect(trigger?.getAttribute('aria-label')).toBe('More publish options');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger?.getAttribute('data-size')).toBe('xs');
  });

  it('the action half emits action; the trigger opens the menu named menu with small rows', async () => {
    const { q, host, settle } = await setup();
    const [action, trigger] = Array.from(q('#split').children) as HTMLElement[];
    action?.click();
    expect(host.runs()).toBe(1);
    trigger?.focus();
    trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    expect(host.open()).toBe(true);
    const menu = q('[data-ds="dropdown-menu"]');
    expect(menu.getAttribute('data-part')).toBe('menu');
    expect(menu.getAttribute('data-size')).toBe('sm');
    expect(menu.getAttribute('aria-labelledby')).toBe(trigger?.id);
    expect(document.activeElement?.id).toBe('schedule');
    q('#schedule').click();
    await settle();
    expect(host.chosen()).toBe('schedule');
    expect(host.open()).toBe(false);
    expect(host.runs()).toBe(1);
  });

  it('disabled blocks both halves and keeps them focusable', async () => {
    const { q, host, settle } = await setup();
    const root = q('#off');
    expect(root.getAttribute('data-disabled')).toBe('');
    const [action, trigger] = Array.from(root.children) as HTMLElement[];
    expect(action?.getAttribute('aria-disabled')).toBe('true');
    expect(trigger?.getAttribute('aria-disabled')).toBe('true');
    action?.click();
    trigger?.focus();
    trigger?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    expect(host.runs()).toBe(0);
    expect(document.querySelector('[data-ds="dropdown-menu"]')).toBeNull();
  });

  it('takes size, emphasis and shape from a ButtonGroup', async () => {
    const { q } = await setup();
    const root = q('#grouped');
    expect(root.getAttribute('data-size')).toBe('lg');
    expect(root.getAttribute('data-emphasis')).toBe('outline');
    expect(root.getAttribute('data-shape')).toBe('pill');
    expect(root.firstElementChild?.getAttribute('data-emphasis')).toBe('outline');
  });
});
