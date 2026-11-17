// Order M9.4 on Angular: the quick action row. The twin of the "quick
// actions" block of packages/react/src/components/DropdownMenu/DropdownMenu.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DROPDOWN_MENU } from './dropdown-menu';

@Component({
  imports: [DsButton, DsTheme, ...DS_DROPDOWN_MENU],
  template: `
    <div dsTheme="desk" [lang]="lang()" [dir]="dir()">
      <ng-container dsDropdownMenu [(open)]="open">
        <button id="trigger" dsButton dsDropdownMenuTrigger end="chevron-down">Board actions</button>
        <ng-template dsDropdownMenuContent>
          <div dsDropdownMenuQuickActions label="Quick actions">
            <div dsDropdownMenuQuickAction icon="link" (select)="chosen.set('copy')">Copy link</div>
            <div dsDropdownMenuQuickAction icon="star">Star board</div>
            @if (four()) {
              <div dsDropdownMenuQuickAction icon="download" disabled>Download</div>
            }
            <div dsDropdownMenuQuickAction icon="trash" tone="danger">Delete board</div>
          </div>
          <div dsDropdownMenuItem start="edit">Rename board</div>
          <ng-container dsDropdownMenuSub>
            <div id="share" dsDropdownMenuSubTrigger start="link">Share board</div>
            <ng-template dsDropdownMenuSubContent>
              <div dsDropdownMenuQuickActions label="Share quickly">
                <div dsDropdownMenuQuickAction icon="link">Copy link</div>
                <div dsDropdownMenuQuickAction icon="mail">Send email</div>
              </div>
              <div dsDropdownMenuItem>Invite people</div>
            </ng-template>
          </ng-container>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly open = signal<boolean | undefined>(undefined);
  readonly four = signal(false);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly chosen = signal<string | null>(null);
}

async function setup(options: { four?: boolean; rtl?: boolean } = {}) {
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  host.four.set(options.four ?? false);
  if (options.rtl) {
    host.lang.set('ar');
    host.dir.set('rtl');
  }
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const settle = async () => {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  const press = async (key: string, target: Element | null = document.activeElement) => {
    target?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await settle();
  };
  const name = () => document.activeElement?.querySelector('[data-part="text"]')?.textContent?.trim();
  // Opened with the keyboard: focus moves to the first item, the first quick action.
  (document.getElementById('trigger') as HTMLElement).focus();
  await press('Enter');
  const menu = () => document.querySelector<HTMLElement>('[data-ds="dropdown-menu"]');
  return { fixture, host, press, name, menu, settle };
}

describe('DsDropdownMenu quick actions (order M9.4)', () => {
  afterEach(() => {
    for (const el of Array.from(document.body.children)) el.remove();
  });

  it('stamps the row and its actions: a named group of menuitems, an icon above a label, the danger tone', async () => {
    const { menu } = await setup();
    const root = menu() as HTMLElement;
    const row = root.firstElementChild as HTMLElement;
    expect(row.getAttribute('data-part')).toBe('quick-actions');
    expect(row.getAttribute('role')).toBe('group');
    expect(row.getAttribute('aria-label')).toBe('Quick actions');
    expect(row.hasAttribute('label')).toBe(false);
    const actions = Array.from(row.querySelectorAll<HTMLElement>(':scope > [data-part="quick-action"]'));
    expect(actions).toHaveLength(3);
    for (const a of actions) {
      expect(a.getAttribute('role')).toBe('menuitem');
      expect(Array.from(a.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'text']);
      expect(a.querySelector('[data-part="start"]')?.getAttribute('aria-hidden')).toBe('true');
      expect(a.querySelector('[data-part="start"] svg')).not.toBeNull();
      expect(a.hasAttribute('icon')).toBe(false);
    }
    expect(actions[0]?.querySelector('[data-part="text"]')?.textContent?.trim()).toBe('Copy link');
    expect(actions[0]?.hasAttribute('data-tone')).toBe(false);
    expect(actions[2]?.getAttribute('data-tone')).toBe('danger');
  });

  it('ArrowDown and ArrowUp walk every item in order, the quick actions first', async () => {
    const { press, name } = await setup();
    expect(name()).toBe('Copy link');
    await press('ArrowDown');
    expect(name()).toBe('Star board');
    await press('ArrowDown');
    expect(name()).toBe('Delete board');
    await press('ArrowDown');
    expect(name()).toBe('Rename board');
    await press('ArrowUp');
    expect(name()).toBe('Delete board');
  });

  it('ArrowRight and ArrowLeft move inside the row, wrap at the ends and skip a disabled action', async () => {
    const { press, name } = await setup({ four: true });
    expect(name()).toBe('Copy link');
    await press('ArrowRight');
    expect(name()).toBe('Star board');
    await press('ArrowRight');
    expect(name()).toBe('Delete board');
    await press('ArrowRight');
    expect(name()).toBe('Copy link');
    await press('ArrowLeft');
    expect(name()).toBe('Delete board');
    expect(document.activeElement?.hasAttribute('data-highlighted')).toBe(true);
    // Outside the row the arrows keep their menu meaning: nothing moves on a plain item.
    await press('ArrowDown');
    expect(name()).toBe('Rename board');
    await press('ArrowRight');
    expect(name()).toBe('Rename board');
  });

  it('in RTL the row reads right to left: ArrowLeft goes to the next action', async () => {
    const { press, name } = await setup({ rtl: true });
    await press('ArrowLeft');
    expect(name()).toBe('Star board');
    await press('ArrowRight');
    expect(name()).toBe('Copy link');
  });

  it('Left and Right inside a row in a submenu move in the row and do not close the submenu', async () => {
    const { press, name } = await setup();
    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowDown');
    expect(name()).toBe('Share board');
    await press('ArrowRight');
    expect(document.querySelectorAll('[data-ds="dropdown-menu"]')).toHaveLength(2);
    expect(name()).toBe('Copy link');
    await press('ArrowRight');
    expect(name()).toBe('Send email');
    await press('ArrowLeft');
    expect(name()).toBe('Copy link');
    expect(document.querySelectorAll('[data-ds="dropdown-menu"]')).toHaveLength(2);
    // On a plain item of the submenu ArrowLeft still closes it.
    await press('ArrowDown');
    await press('ArrowDown');
    expect(name()).toBe('Invite people');
    await press('ArrowLeft');
    expect(document.querySelectorAll('[data-ds="dropdown-menu"]')).toHaveLength(1);
    expect(name()).toBe('Share board');
  });

  it('a quick action selects like an item: select runs and the menu closes', async () => {
    const { host, press, settle } = await setup();
    await press('Enter');
    await settle();
    expect(host.chosen()).toBe('copy');
    expect(host.open()).toBe(false);
  });
});
