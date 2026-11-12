// The Angular twins of the React tests for toasts above a dialog
// (packages/react/src/components/Dialog/Dialog.test.tsx): the toaster sits
// above dialogs, stays readable, and focus and clicks may reach it.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { createToastStore, type ToastStore } from '@the-system/shared';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsToaster } from '../toast/toaster';
import { DS_DIALOG } from './dialog';

@Component({
  imports: [DS_DIALOG, DsButton, DsTheme, DsToaster],
  template: `
    <div dsTheme>
      <ng-container dsToaster [store]="store" />
      <ng-container dsDialog [(open)]="open">
        <button id="trigger" dsButton dsDialogTrigger>Share board</button>
        <ng-template dsDialogContent title="Share board?">
          <div dsDialogFooter>
            <button id="keep" dsButton dsDialogClose>Keep board</button>
            <ng-container dsDialog size="sm" [(open)]="inner">
              <button id="reset" dsButton dsDialogTrigger>Reset link</button>
              <ng-template dsDialogContent title="Reset the link?">
                <div dsDialogFooter><button dsButton dsDialogClose>Keep link</button></div>
              </ng-template>
            </ng-container>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  store: ToastStore = createToastStore();
  readonly open = signal(true);
  readonly inner = signal(false);
}

let fixture: ComponentFixture<Host> | null = null;

async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await fixture?.whenStable();
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function setup(): Promise<Host> {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await settle();
  return fixture.componentInstance;
}

const dialogs = () => Array.from(document.body.querySelectorAll('[data-ds="dialog"]'));
const panelOf = (title: string) =>
  Array.from(document.body.querySelectorAll('[data-ds="dialog"] > [data-part="panel"]')).find((p) => p.textContent?.includes(title)) as
    | HTMLElement
    | undefined;
const layer = () => document.body.querySelector('[data-toaster-layer]') as HTMLElement | null;
const key = (target: EventTarget, k: string) => {
  const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
  target.dispatchEvent(e);
  return e;
};

afterEach(() => {
  fixture?.destroy();
  fixture?.nativeElement.remove();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer], [data-toaster-layer]'))) el.remove();
});

describe('DsDialog with toasts above it', () => {
  it('keeps toasts readable and clickable above the dialog, and focus may move into them', async () => {
    const host = await setup();
    const panel = panelOf('Share board?') as HTMLElement;
    expect(panel.contains(document.activeElement)).toBe(true);
    let retried = 0;
    host.store.add({ tone: 'danger', title: 'Could not delete project', action: { label: 'Retry delete', onAction: () => (retried += 1) } });
    host.store.add('Draft saved');
    await settle();
    expect(layer()?.closest('[aria-hidden="true"]')).toBeNull();
    for (const region of Array.from(document.body.querySelectorAll('[aria-live]'))) {
      if (region.closest('[data-toaster-layer]')) expect(region.closest('[aria-hidden="true"]')).toBeNull();
    }
    const action = Array.from(layer()?.querySelectorAll('button') ?? []).find((b) => b.textContent?.includes('Retry delete')) as HTMLElement;
    // Focus that moves into a toast (F8, Tab inside the list) stays there.
    action.focus();
    await settle();
    expect(document.activeElement).toBe(action);
    action.click();
    await settle();
    expect(retried).toBe(1);
    expect(dialogs()).toHaveLength(1);
    expect(host.open()).toBe(true);
  });

  it('closes on Escape from inside the dialog while a danger toast shows, and the toast stays', async () => {
    const host = await setup();
    host.store.add({ tone: 'danger', title: 'Could not delete project' });
    await settle();
    key(document.activeElement as HTMLElement, 'Escape');
    await settle();
    expect(host.open()).toBe(false);
    expect(host.store.getSnapshot().visible.map((t) => t.state)).toEqual(['open']);
  });

  it('with a toast above nested dialogs, Escape closes only the top dialog', async () => {
    const host = await setup();
    host.store.add({ tone: 'danger', title: 'Could not delete project' });
    (document.getElementById('reset') as HTMLElement).click();
    await settle();
    expect(dialogs()).toHaveLength(2);
    key(document.activeElement as HTMLElement, 'Escape');
    await settle();
    expect(host.inner()).toBe(false);
    expect(host.open()).toBe(true);
    expect(host.store.getSnapshot().visible.map((t) => t.state)).toEqual(['open']);
  });
});
