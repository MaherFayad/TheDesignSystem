// The safe area and the axes in every portal (orders S1, C5 item 2, C6 items
// 1 and 5): each layer copies the inset tokens of the dsTheme the overlay
// comes from, as React's LayerTheme does.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { createToastStore } from '@the-system/shared';
import { DsTheme } from './theme';
import { readSafeArea } from './layer-theme';
import { DsButton } from '../components/button/button';
import { DS_DIALOG } from '../components/dialog/dialog';
import { DS_DRAWER } from '../components/drawer/drawer';
import { DS_ACTION_SHEET } from '../components/action-sheet/action-sheet';
import { DS_DROPDOWN_MENU } from '../components/dropdown-menu/dropdown-menu';
import { DsToaster } from '../components/toast/toaster';

const frame = { '--ds-inset-safe-top': '47px', '--ds-inset-safe-bottom': '34px', '--ds-inset-safe-start': '0px', '--ds-inset-safe-end': '62px' };

@Component({
  imports: [DsTheme, DsButton, DS_DIALOG, DS_DRAWER, DS_ACTION_SHEET, DS_DROPDOWN_MENU, DsToaster],
  template: `
    <div dsTheme="liquid" platform="ios" scheme="dark" dir="rtl" lang="ar" [css]="css()" id="theme">
      <ng-container dsToaster [store]="store" position="auto" />
      <ng-container dsDialog [(open)]="dialog">
        <ng-template dsDialogContent title="Rename board">
          <ng-container dsDropdownMenu [(open)]="menu">
            <button id="menu-trigger" dsButton dsDropdownMenuTrigger>Board actions</button>
            <ng-template dsDropdownMenuContent><div dsDropdownMenuItem>Rename board</div></ng-template>
          </ng-container>
        </ng-template>
      </ng-container>
      <ng-container dsDrawer [(open)]="drawer">
        <ng-template dsDrawerContent title="Filters"><p>Boards</p></ng-template>
      </ng-container>
      <ng-container dsActionSheet [(open)]="sheet">
        <ng-template dsActionSheetContent title="Spring launch"><button dsActionSheetAction>Duplicate board</button></ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly css = signal<Record<string, string> | undefined>(undefined);
  readonly store = createToastStore();
  readonly dialog = signal(false);
  readonly menu = signal(false);
  readonly drawer = signal(false);
  readonly sheet = signal(false);
}

let fixture: ComponentFixture<Host> | null = null;

async function setup(css: Record<string, string> | null = frame): Promise<ComponentFixture<Host>> {
  fixture = TestBed.createComponent(Host);
  fixture.componentInstance.css.set(css ?? undefined);
  document.body.appendChild(fixture.nativeElement);
  await settle(fixture);
  return fixture;
}

async function settle(f: ComponentFixture<Host>): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await f.whenStable();
}

const layers = (marker: string) => Array.from(document.body.querySelectorAll<HTMLElement>(`body > [data-ds='theme'][${marker}]`));

/** The one open layer with this marker. */
function layerOf(marker: string): HTMLElement {
  const el = layers(marker)[0];
  if (!el) throw new Error(`no ${marker}`);
  return el;
}

afterEach(() => {
  fixture?.destroy();
  fixture?.nativeElement.remove();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer], [data-menu-layer], [data-toaster-layer]'))) el.remove();
});

describe('DsLayerTheme', () => {
  it('reads the four inset tokens of an element, and nothing outside any dsTheme', async () => {
    const f = await setup();
    const theme = f.nativeElement.querySelector('#theme') as HTMLElement;
    expect(readSafeArea(theme)).toEqual(frame);
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    expect(readSafeArea(probe)).toBeUndefined();
    probe.remove();
  });

  it('renders the toaster anchor in place, hidden, and copies its tokens onto the toaster portal (order S1)', async () => {
    const f = await setup();
    const anchor = f.nativeElement.querySelector('[data-toaster-anchor]') as HTMLElement;
    expect(anchor).not.toBeNull();
    expect(anchor.hidden).toBe(true);
    expect(anchor.parentElement?.id).toBe('theme');
    const layer = layerOf('data-toaster-layer');
    expect(layer.style.getPropertyValue('--ds-inset-safe-top')).toBe('47px');
    expect(layer.style.getPropertyValue('--ds-inset-safe-bottom')).toBe('34px');
    expect(layer.getAttribute('dir')).toBe('rtl');
    expect(layer.getAttribute('lang')).toBe('ar');
  });

  it('carries every axis, dir, lang and the safe area into the dialog, drawer and action sheet portals', async () => {
    const f = await setup();
    for (const open of ['dialog', 'drawer', 'sheet'] as const) {
      f.componentInstance[open].set(true);
      await settle(f);
      const layer = layerOf('data-dialog-layer');
      expect(layer.getAttribute('data-style')).toBe('liquid');
      expect(layer.getAttribute('data-platform')).toBe('ios');
      expect(layer.getAttribute('data-scheme')).toBe('dark');
      expect(layer.getAttribute('dir')).toBe('rtl');
      expect(layer.getAttribute('lang')).toBe('ar');
      expect(layer.style.getPropertyValue('--ds-inset-safe-end')).toBe('62px');
      expect(layer.style.getPropertyValue('--ds-inset-safe-top')).toBe('47px');
      f.componentInstance[open].set(false);
      await settle(f);
      for (const el of layers('data-dialog-layer')) el.remove();
    }
  });

  it('a menu opened in a dialog reads the dialog layer, which carries the copied tokens', async () => {
    const f = await setup();
    f.componentInstance.dialog.set(true);
    await settle(f);
    f.componentInstance.menu.set(true);
    await settle(f);
    const menu = layerOf('data-menu-layer');
    expect(menu.getAttribute('dir')).toBe('rtl');
    expect(menu.style.getPropertyValue('--ds-inset-safe-bottom')).toBe('34px');
  });

  it('follows a change of the source inline style (a turn of a drawn device)', async () => {
    const f = await setup();
    f.componentInstance.drawer.set(true);
    await settle(f);
    f.componentInstance.css.set({ ...frame, '--ds-inset-safe-end': '0px', '--ds-inset-safe-start': '62px' });
    await settle(f);
    const layer = layerOf('data-dialog-layer');
    expect(layer.style.getPropertyValue('--ds-inset-safe-start')).toBe('62px');
    expect(layer.style.getPropertyValue('--ds-inset-safe-end')).toBe('0px');
  });

  it('writes no inline style where the dsTheme has no inset tokens (a test DOM, the server)', async () => {
    const f = await setup(null);
    f.componentInstance.dialog.set(true);
    await settle(f);
    expect(layerOf('data-dialog-layer').getAttribute('style')).toBeNull();
    expect(layerOf('data-toaster-layer').getAttribute('style')).toBeNull();
  });
});
