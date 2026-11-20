// The known fault (order C6 follow up): an ActionSheet or a Drawer opened
// over an Angular Dialog fought the dialog for focus. Each family kept its
// own stack of open layers, so the dialog still thought it was on top and
// its focusin guard pulled focus back out of the sheet, whose guard pulled
// it back in. One stack of modal layers for every family fixes it.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsButton } from '../components/button/button';
import { DS_DIALOG } from '../components/dialog/dialog';
import { DS_DRAWER } from '../components/drawer/drawer';
import { DS_ACTION_SHEET } from '../components/action-sheet/action-sheet';

@Component({
  imports: [DsButton, DS_DIALOG, DS_DRAWER, DS_ACTION_SHEET],
  template: `
    <ng-container dsDialog [(open)]="dialog">
      <ng-template dsDialogContent title="Edit board">
        <button id="in-dialog" dsButton>Rename board</button>
        <ng-container dsActionSheet [(open)]="sheet">
          <button id="sheet-trigger" dsButton dsActionSheetTrigger>More actions</button>
          <ng-template dsActionSheetContent title="Spring launch">
            <button id="in-sheet" dsActionSheetAction>Duplicate board</button>
          </ng-template>
        </ng-container>
        <ng-container dsDrawer [(open)]="drawer">
          <button id="drawer-trigger" dsButton dsDrawerTrigger>Filter boards</button>
          <ng-template dsDrawerContent title="Filters">
            <input id="in-drawer" aria-label="Owner" />
          </ng-template>
        </ng-container>
      </ng-template>
    </ng-container>
  `,
})
class Host {
  readonly dialog = signal(false);
  readonly sheet = signal(false);
  readonly drawer = signal(false);
}

let fixture: ComponentFixture<Host> | null = null;

async function settle(f: ComponentFixture<Host>): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await f.whenStable();
}

async function openDialog(): Promise<ComponentFixture<Host>> {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  fixture.componentInstance.dialog.set(true);
  await settle(fixture);
  return fixture;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const panelOf = (id: string) => byId(id).closest<HTMLElement>("[data-part='panel']") as HTMLElement;
const tab = (shift = false) =>
  (document.activeElement ?? document.body).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true }));

afterEach(() => {
  fixture?.destroy();
  fixture?.nativeElement.remove();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer]'))) el.remove();
});

describe('one stack of modal layers', () => {
  it('an action sheet over a dialog keeps focus, and Tab stays in the sheet', async () => {
    const f = await openDialog();
    byId('sheet-trigger').click();
    await settle(f);
    expect(f.componentInstance.sheet()).toBe(true);
    const sheet = panelOf('in-sheet');
    expect(sheet.contains(document.activeElement)).toBe(true);
    byId('in-sheet').focus();
    tab();
    expect(sheet.contains(document.activeElement)).toBe(true);
    // Focus sent to the dialog under the sheet comes back to the sheet, and stays there.
    byId('in-dialog').focus();
    expect(sheet.contains(document.activeElement)).toBe(true);
  });

  it('a drawer over a dialog keeps focus, and the dialog takes it back once the drawer closes', async () => {
    const f = await openDialog();
    byId('drawer-trigger').click();
    await settle(f);
    expect(f.componentInstance.drawer()).toBe(true);
    const drawer = panelOf('in-drawer');
    byId('in-drawer').focus();
    expect(document.activeElement?.id).toBe('in-drawer');
    byId('in-dialog').focus();
    expect(drawer.contains(document.activeElement)).toBe(true);
    // Escape closes the drawer only; the dialog stays open and holds focus again.
    byId('in-drawer').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle(f);
    await new Promise((r) => setTimeout(r, 20));
    expect(f.componentInstance.drawer()).toBe(false);
    expect(f.componentInstance.dialog()).toBe(true);
    const dialog = panelOf('in-dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    byId('in-dialog').focus();
    expect(document.activeElement?.id).toBe('in-dialog');
  });
});
