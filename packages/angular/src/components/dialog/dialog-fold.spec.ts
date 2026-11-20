// data-segment on the dialog root on a folded screen (order DU5, C6 item 5).
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DS_DIALOG } from './dialog';

@Component({
  imports: [DS_DIALOG],
  template: `
    <ng-container dsDialog [(open)]="open">
      <ng-template dsDialogContent title="Rename board"><p>Text</p></ng-template>
    </ng-container>
  `,
})
class Host {
  readonly open = signal(false);
}

type Segments = { x: number; y: number; width: number; height: number }[] | undefined;

function setSegments(segments: Segments): void {
  Object.defineProperty(window, 'viewport', { configurable: true, value: segments ? { segments } : undefined });
}

let fixture: ComponentFixture<Host> | null = null;

async function settle(f: ComponentFixture<Host>): Promise<void> {
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await f.whenStable();
}

async function openDialog(): Promise<HTMLElement> {
  fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  fixture.componentInstance.open.set(true);
  await settle(fixture);
  return document.body.querySelector('[data-dialog-layer] > [data-ds="dialog"]') as HTMLElement;
}

afterEach(() => {
  setSegments(undefined);
  fixture?.destroy();
  fixture?.nativeElement.remove();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer]'))) el.remove();
});

describe('DsDialog on a folded screen', () => {
  it('has no data-segment without a fold', async () => {
    const root = await openDialog();
    expect(root.hasAttribute('data-segment')).toBe(false);
  });

  it('is start when the segments sit side by side', async () => {
    setSegments([
      { x: 0, y: 0, width: 400, height: 800 },
      { x: 420, y: 0, width: 400, height: 800 },
    ]);
    const root = await openDialog();
    expect(root.getAttribute('data-segment')).toBe('start');
  });

  it('is bottom when the segments are stacked, and follows a resize', async () => {
    const root = await openDialog();
    expect(root.hasAttribute('data-segment')).toBe(false);
    setSegments([
      { x: 0, y: 0, width: 800, height: 400 },
      { x: 0, y: 420, width: 800, height: 400 },
    ]);
    window.dispatchEvent(new Event('resize'));
    await settle(fixture!);
    expect(root.getAttribute('data-segment')).toBe('bottom');
  });
});
