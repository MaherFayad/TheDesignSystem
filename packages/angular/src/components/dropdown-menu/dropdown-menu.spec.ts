import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DIALOG } from '../dialog/dialog';
import { DS_DROPDOWN_MENU, type DropdownMenuChecked } from './dropdown-menu';

@Component({
  imports: [DsButton, DsTheme, ...DS_DROPDOWN_MENU, ...DS_DIALOG],
  template: `
    <div dsTheme="desk" [lang]="'en'">
      <ng-container dsDropdownMenu [(open)]="open" size="sm">
        <button id="trigger" dsButton dsDropdownMenuTrigger end="chevron-down">Board actions</button>
        <ng-template dsDropdownMenuContent>
          <div dsDropdownMenuLabel>Board</div>
          <div id="rename" dsDropdownMenuItem start="edit" shortcut="F2" (select)="chosen.set('rename')">Rename board</div>
          <div id="duplicate" dsDropdownMenuItem (select)="keepOpen($event)">Duplicate board</div>
          <div id="import" dsDropdownMenuItem disabled>Import file</div>
          <ng-container dsDropdownMenuSub>
            <div id="share" dsDropdownMenuSubTrigger start="link">Share board</div>
            <ng-template dsDropdownMenuSubContent>
              <div id="copy-link" dsDropdownMenuItem>Copy link</div>
              <div id="invite" dsDropdownMenuItem>Invite people</div>
            </ng-template>
          </ng-container>
          <div dsDropdownMenuSeparator></div>
          <div dsDropdownMenuGroup>
            <div id="grid" dsDropdownMenuCheckboxItem [(checked)]="grid">Show grid</div>
          </div>
          <div dsDropdownMenuRadioGroup [(value)]="sort">
            <div id="by-name" dsDropdownMenuRadioItem value="name">Name</div>
            <div id="by-date" dsDropdownMenuRadioItem value="edited">Date edited</div>
          </div>
          <div id="delete" dsDropdownMenuItem tone="danger">Delete board</div>
        </ng-template>
      </ng-container>
      <ng-container dsDialog [(open)]="dialogOpen">
        <ng-template dsDialogContent title="Board settings">
          <ng-container dsDropdownMenu [(open)]="innerOpen">
            <button id="inner" dsButton dsDropdownMenuTrigger>More actions</button>
            <ng-template dsDropdownMenuContent><div id="inner-item" dsDropdownMenuItem>Copy link</div></ng-template>
          </ng-container>
        </ng-template>
      </ng-container>
      <ng-container dsDropdownMenu>
        <button id="off" dsButton dsDropdownMenuTrigger disabled>Share board</button>
        <ng-template dsDropdownMenuContent><div dsDropdownMenuItem>Copy link</div></ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly open = signal<boolean | undefined>(undefined);
  readonly grid = signal<DropdownMenuChecked>('indeterminate');
  readonly sort = signal<string | undefined>('edited');
  readonly chosen = signal<string | null>(null);
  readonly dialogOpen = signal(false);
  readonly innerOpen = signal<boolean | undefined>(undefined);
  keepOpen(event: Event): void {
    event.preventDefault();
    this.chosen.set('duplicate');
  }
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const byId = (id: string) => document.getElementById(id) as HTMLElement;
  const press = async (key: string, target: Element | null = document.activeElement) => {
    target?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  const layers = () => Array.from(document.querySelectorAll('[data-menu-layer]'));
  const menus = () => Array.from(document.querySelectorAll<HTMLElement>('[data-ds="dropdown-menu"]'));
  return { fixture, host: fixture.componentInstance, byId, press, layers, menus };
}

describe('DsDropdownMenu', () => {
  afterEach(() => {
    for (const el of Array.from(document.body.children)) el.remove();
  });

  it('renders the closed trigger as React does and nothing in body', async () => {
    const { byId, layers } = await setup();
    const t = byId('trigger');
    expect(t.getAttribute('aria-haspopup')).toBe('menu');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.getAttribute('data-state')).toBe('closed');
    expect(t.hasAttribute('aria-controls')).toBe(false);
    expect(t.hasAttribute('dsdropdownmenutrigger')).toBe(false);
    expect(t.id).not.toBe('');
    expect(layers()).toHaveLength(0);
  });

  it('Enter opens a themed layer with the menu named by the trigger, focus on the first item', async () => {
    const { byId, press, layers, menus, host } = await setup();
    const t = byId('trigger');
    t.focus();
    await press('Enter');
    expect(host.open()).toBe(true);
    const [layer] = layers();
    expect(layer?.getAttribute('data-ds')).toBe('theme');
    expect(layer?.getAttribute('data-menu-layer')).toBe('');
    expect(layer?.getAttribute('data-style')).toBe('desk');
    const wrapper = layer?.firstElementChild as HTMLElement;
    expect(wrapper.hasAttribute('data-radix-popper-content-wrapper')).toBe(true);
    expect(wrapper.style.position).toBe('fixed');
    const [menu] = menus();
    expect(menu?.getAttribute('role')).toBe('menu');
    expect(menu?.getAttribute('aria-labelledby')).toBe(t.id);
    expect(menu?.getAttribute('data-size')).toBe('sm');
    expect(menu?.getAttribute('data-state')).toBe('open');
    expect(t.getAttribute('aria-expanded')).toBe('true');
    expect(t.getAttribute('aria-controls')).toBe(menu?.id);
    const first = byId('rename');
    expect(document.activeElement).toBe(first);
    expect(first.getAttribute('tabindex')).toBe('0');
    expect(first.getAttribute('data-highlighted')).toBe('');
    expect(Array.from(first.children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'text', 'shortcut']);
  });

  it('the arrows skip disabled items and do not wrap; Home and End jump', async () => {
    const { byId, press } = await setup();
    byId('trigger').focus();
    await press('Enter');
    await press('ArrowDown');
    expect(document.activeElement?.id).toBe('duplicate');
    await press('ArrowDown');
    expect(document.activeElement?.id).toBe('share');
    expect(byId('import').getAttribute('aria-disabled')).toBe('true');
    expect(byId('import').getAttribute('data-disabled')).toBe('');
    await press('End');
    expect(document.activeElement?.id).toBe('delete');
    await press('ArrowDown');
    expect(document.activeElement?.id).toBe('delete');
    await press('Home');
    expect(document.activeElement?.id).toBe('rename');
    await press('ArrowUp');
    expect(document.activeElement?.id).toBe('rename');
  });

  it('ArrowUp on the trigger opens with focus on the last item', async () => {
    const { byId, press } = await setup();
    byId('trigger').focus();
    await press('ArrowUp');
    expect(document.activeElement?.id).toBe('delete');
  });

  it('selecting an item emits select, closes and returns focus; preventDefault keeps it open', async () => {
    const { byId, press, host, fixture } = await setup();
    byId('trigger').focus();
    await press('Enter');
    await press('ArrowDown');
    await press('Enter');
    expect(host.chosen()).toBe('duplicate');
    expect(host.open()).toBe(true);
    await press('ArrowUp');
    await press('Enter');
    expect(host.chosen()).toBe('rename');
    expect(host.open()).toBe(false);
    await fixture.whenStable();
    expect(document.activeElement?.id).toBe('trigger');
  });

  it('a checkbox item toggles and shows its state; a radio item sets the group value', async () => {
    const { byId, press, host } = await setup();
    byId('trigger').focus();
    await press('Enter');
    const grid = byId('grid');
    expect(grid.getAttribute('role')).toBe('menuitemcheckbox');
    expect(grid.getAttribute('aria-checked')).toBe('mixed');
    expect(grid.querySelector('[data-part="indicator"] > span')?.getAttribute('data-state')).toBe('indeterminate');
    grid.click();
    await press('Shift', grid);
    expect(host.grid()).toBe(true);
    expect(host.open()).toBe(false);
    byId('trigger').focus();
    await press('Enter');
    expect(byId('by-date').getAttribute('aria-checked')).toBe('true');
    expect(byId('by-name').querySelector('[data-part="indicator"]')?.children).toHaveLength(0);
    byId('by-name').click();
    await press('Shift', byId('by-name'));
    expect(host.sort()).toBe('name');
  });

  it('Escape closes the menu and returns focus to the trigger', async () => {
    const { byId, press, host, layers } = await setup();
    byId('trigger').focus();
    await press('Enter');
    await press('Escape');
    expect(host.open()).toBe(false);
    expect(document.activeElement?.id).toBe('trigger');
    expect(layers()).toHaveLength(0);
  });

  it('a submenu opens with ArrowRight, closes with ArrowLeft, and Escape inside it closes everything', async () => {
    const { byId, press, host, menus } = await setup();
    byId('trigger').focus();
    await press('Enter');
    byId('share').focus();
    await press('ArrowRight');
    const share = byId('share');
    expect(share.getAttribute('aria-expanded')).toBe('true');
    expect(share.getAttribute('data-state')).toBe('open');
    const sub = menus().find((m) => m.getAttribute('data-part') === 'sub-content');
    expect(sub?.getAttribute('aria-labelledby')).toBe(share.id);
    expect(share.getAttribute('aria-controls')).toBe(sub?.id);
    expect(document.activeElement?.id).toBe('copy-link');
    await press('ArrowLeft');
    expect(share.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement?.id).toBe('share');
    await press('Enter');
    expect(document.activeElement?.id).toBe('copy-link');
    await press('Escape');
    expect(host.open()).toBe(false);
    expect(document.activeElement?.id).toBe('trigger');
  });

  it('typeahead moves to the next item that starts with the letters', async () => {
    const { byId, press } = await setup();
    byId('trigger').focus();
    await press('Enter');
    await press('d');
    await new Promise((r) => setTimeout(r, 10));
    expect(document.activeElement?.id).toBe('duplicate');
  });

  it('Tab stays in the open menu', async () => {
    const { byId, fixture } = await setup();
    byId('trigger').focus();
    byId('trigger').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.activeElement?.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
  });

  it('a menu inside a dialog stays open and takes focus', async () => {
    const { byId, press, host, fixture } = await setup();
    host.dialogOpen.set(true);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    byId('inner').focus();
    await press('Enter');
    expect(host.innerOpen()).toBe(true);
    expect(document.activeElement?.id).toBe('inner-item');
    await press('Escape');
    expect(host.innerOpen()).toBe(false);
    expect(host.dialogOpen()).toBe(true);
    expect(document.activeElement?.id).toBe('inner');
  });

  it('the keyboard enters a submenu the pointer already opened', async () => {
    const { byId, press } = await setup();
    byId('trigger').focus();
    await press('Enter');
    byId('share').click();
    await press('Shift', byId('share'));
    expect(byId('share').getAttribute('data-state')).toBe('open');
    byId('share').focus();
    await press('ArrowRight');
    expect(document.activeElement?.id).toBe('copy-link');
  });

  it('a disabled trigger does not open', async () => {
    const { byId, press, layers } = await setup();
    const off = byId('off');
    expect(off.getAttribute('aria-disabled')).toBe('true');
    expect(off.getAttribute('data-disabled')).toBe('');
    off.focus();
    await press('Enter');
    expect(layers()).toHaveLength(0);
  });
});
