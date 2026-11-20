// A List row as the trigger of an overlay (order C5 item 4, C6 item 5): the
// trigger's aria, id, data-state and ref go to the title, not to the li.
// The twin of packages/react/src/components/List/List.trigger.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DS_ACTION_SHEET } from '../action-sheet/action-sheet';
import { DS_DIALOG } from '../dialog/dialog';
import { DS_DRAWER } from '../drawer/drawer';
import { DS_DROPDOWN_MENU } from '../dropdown-menu/dropdown-menu';
import { DsList, DsListItem } from './list';

@Component({
  imports: [DsTheme, DsList, DsListItem, DS_ACTION_SHEET, DS_DIALOG, DS_DRAWER, DS_DROPDOWN_MENU],
  template: `
    <div dsTheme [lang]="lang()">
      <ul dsList variant="inset" aria-label="Pass">
        <ng-container dsActionSheet [(open)]="sheet">
          <li id="remove" dsListItem dsActionSheetTrigger start="trash" [title]="lang() === 'ar' ? 'إزالة البطاقة' : 'Remove pass'" tone="danger" [disabled]="disabled()"></li>
          <ng-template dsActionSheetContent title="Remove this pass?">
            <button dsActionSheetAction tone="danger" (click)="removed.set(true)">Remove pass</button>
          </ng-template>
        </ng-container>
        <ng-container dsDropdownMenu [(open)]="menu">
          <li id="sort" dsListItem dsDropdownMenuTrigger title="Sort passes"></li>
          <ng-template dsDropdownMenuContent><div dsDropdownMenuItem>By date</div></ng-template>
        </ng-container>
        <ng-container dsDialog [(open)]="dialog">
          <li id="rename" dsListItem dsDialogTrigger title="Rename pass" [onSelect]="onSelect"></li>
          <ng-template dsDialogContent title="Rename pass"><p>Name</p></ng-template>
        </ng-container>
        <ng-container dsDrawer [(open)]="drawer">
          <li id="filters" dsListItem dsDrawerTrigger title="Filter passes"></li>
          <ng-template dsDrawerContent title="Filters"><p>Filters</p></ng-template>
        </ng-container>
        <li id="plain" dsListItem title="Boarding at 09:40"></li>
        <li id="linked" dsListItem href="#seat" title="Seat 14A"></li>
      </ul>
    </div>
  `,
})
class Host {
  readonly lang = signal<'en' | 'ar'>('en');
  readonly sheet = signal(false);
  readonly menu = signal(false);
  readonly dialog = signal(false);
  readonly drawer = signal(false);
  readonly disabled = signal(false);
  readonly removed = signal(false);
  selected = 0;
  readonly onSelect = () => {
    this.selected += 1;
  };
}

let fixture: ComponentFixture<Host> | null = null;

async function setup(): Promise<ComponentFixture<Host>> {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  return fixture;
}

async function settle(f: ComponentFixture<Host>): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await f.whenStable();
}

const row = (id: string) => document.getElementById(id) as HTMLElement;
const title = (id: string) => row(id).querySelector<HTMLElement>(':scope > [data-part="title"]') as HTMLElement;
const key = (el: HTMLElement, type: 'keydown' | 'keyup', k: string) =>
  el.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true }));

afterEach(() => {
  fixture?.destroy();
  fixture?.nativeElement.remove();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer], [data-menu-layer]'))) el.remove();
});

describe('DsListItem as a trigger (order C5 item 4)', () => {
  it('puts the trigger attributes on the title, not on the li: an action row with tone danger', async () => {
    await setup();
    const li = row('remove');
    for (const name of ['aria-haspopup', 'aria-expanded', 'aria-controls', 'data-state', 'role', 'tabindex']) {
      expect(li.hasAttribute(name)).toBe(false);
    }
    expect(li.hasAttribute('data-action')).toBe(true);
    expect(li.getAttribute('data-tone')).toBe('danger');
    const t = title('remove');
    expect(t.tagName).toBe('SPAN');
    expect(t.getAttribute('role')).toBe('button');
    expect(t.getAttribute('tabindex')).toBe('0');
    expect(t.getAttribute('aria-haspopup')).toBe('dialog');
    expect(t.getAttribute('aria-expanded')).toBe('false');
    expect(t.getAttribute('data-state')).toBe('closed');
    expect(t.hasAttribute('aria-controls')).toBe(false);
  });

  it('opens the action sheet on a press, points aria-controls at the panel, and returns focus to the title', async () => {
    const f = await setup();
    const t = title('remove');
    t.focus();
    t.click();
    await settle(f);
    expect(f.componentInstance.sheet()).toBe(true);
    expect(t.getAttribute('aria-expanded')).toBe('true');
    expect(t.getAttribute('data-state')).toBe('open');
    const panel = document.body.querySelector('[data-ds="action-sheet"] [data-part="panel"]') as HTMLElement;
    expect(t.getAttribute('aria-controls')).toBe(panel.id);
    f.componentInstance.sheet.set(false);
    await settle(f);
    await new Promise((r) => setTimeout(r, 20));
    expect(document.activeElement).toBe(t);
  });

  it('opens on Enter and on Space, as a native button', async () => {
    const f = await setup();
    const t = title('remove');
    key(t, 'keydown', 'Enter');
    await settle(f);
    expect(f.componentInstance.sheet()).toBe(true);
    f.componentInstance.sheet.set(false);
    await settle(f);
    key(t, 'keydown', ' ');
    expect(f.componentInstance.sheet()).toBe(false);
    key(t, 'keyup', ' ');
    await settle(f);
    expect(f.componentInstance.sheet()).toBe(true);
  });

  it('a disabled trigger row stays focusable and opens nothing', async () => {
    const f = await setup();
    f.componentInstance.disabled.set(true);
    await settle(f);
    const t = title('remove');
    expect(t.getAttribute('tabindex')).toBe('0');
    expect(t.getAttribute('aria-disabled')).toBe('true');
    t.click();
    key(t, 'keydown', 'Enter');
    await settle(f);
    expect(f.componentInstance.sheet()).toBe(false);
  });

  it('opens a menu with ArrowDown; the title carries the trigger id that names the menu', async () => {
    const f = await setup();
    const li = row('sort');
    const t = title('sort');
    expect(li.id).toBe('sort');
    expect(t.getAttribute('aria-haspopup')).toBe('menu');
    expect(t.id).not.toBe('');
    key(t, 'keydown', 'ArrowDown');
    await settle(f);
    expect(f.componentInstance.menu()).toBe(true);
    const menu = document.body.querySelector('[data-ds="dropdown-menu"]') as HTMLElement;
    expect(menu.getAttribute('aria-labelledby')).toBe(t.id);
    expect(t.getAttribute('aria-controls')).toBe(menu.id);
    expect(li.hasAttribute('aria-expanded')).toBe(false);
  });

  it('opens a dialog and keeps the caller onSelect', async () => {
    const f = await setup();
    title('rename').click();
    await settle(f);
    expect(f.componentInstance.dialog()).toBe(true);
    expect(f.componentInstance.selected).toBe(1);
  });

  it('toggles a drawer from its title', async () => {
    const f = await setup();
    title('filters').click();
    await settle(f);
    expect(f.componentInstance.drawer()).toBe(true);
    expect(title('filters').getAttribute('aria-expanded')).toBe('true');
    expect(row('filters').hasAttribute('aria-expanded')).toBe(false);
  });

  it('names the row in Arabic and keeps the same parts', async () => {
    const f = await setup();
    f.componentInstance.lang.set('ar');
    await settle(f);
    expect(title('remove').textContent?.trim()).toBe('إزالة البطاقة');
    expect(title('remove').getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('a plain row and a linked row are not action rows', async () => {
    await setup();
    expect(row('plain').hasAttribute('data-action')).toBe(false);
    expect(title('plain').hasAttribute('role')).toBe(false);
    expect(title('linked').tagName).toBe('A');
  });
});
