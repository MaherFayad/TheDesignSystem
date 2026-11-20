// ActionSheet: the Angular twin of
// packages/react/src/components/ActionSheet/ActionSheet.test.tsx. WCAG 2.2
// covered here: 2.1.1 Keyboard (Up, Down, Home, End wrap; Escape cancels),
// 2.1.2 No keyboard trap (Escape and Cancel always leave), 2.4.3 Focus order
// (focus opens on Cancel when an action is danger, else on the first
// action; it returns to the trigger), 4.1.2 Name, role, value (dialog or
// alertdialog, named by the title or the label; the trigger's
// aria-expanded and aria-controls).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import ActionSheetDemo from './action-sheet.demo';
import {
  DS_ACTION_SHEET,
  resolveActionSheetPlacement,
  type ActionSheetActionTone,
  type ActionSheetPlacementChoice,
} from './action-sheet';

@Component({
  imports: [DS_ACTION_SHEET, DsIconButton, DsTheme],
  template: `
    <div dsTheme [platform]="platform()" [lang]="lang()">
      <ng-container dsActionSheet [(open)]="open" [placement]="placement()" [dismissible]="dismissible()">
        <button dsIconButton dsActionSheetTrigger icon="more" label="More options for Spring launch"></button>
        <ng-template dsActionSheetContent [title]="title()" [label]="label()" description="The board is shared with 4 people.">
          <button dsActionSheetAction (click)="ran('duplicate', $event)">Duplicate board</button>
          <button dsActionSheetAction [disabled]="disabled()" (click)="ran('move', $event)">Move to folder</button>
          <button dsActionSheetAction [tone]="tone()" (click)="ran('delete', $event)">Delete board</button>
          @if (ownCancel()) {
            <button dsActionSheetCancel>Keep board</button>
          }
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly open = signal(false);
  readonly placement = signal<ActionSheetPlacementChoice>('center');
  readonly dismissible = signal(true);
  readonly platform = signal<'web' | 'ios' | 'android'>('web');
  readonly lang = signal<'en' | 'ar'>('en');
  readonly title = signal<string | undefined>('Spring launch');
  readonly label = signal<string | undefined>(undefined);
  readonly tone = signal<ActionSheetActionTone>('danger');
  readonly disabled = signal(false);
  readonly ownCancel = signal(false);
  readonly runs: string[] = [];
  keep = false;
  ran(name: string, event: MouseEvent) {
    this.runs.push(name);
    if (this.keep) event.preventDefault();
  }
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const trigger = () => document.querySelector<HTMLElement>('[data-ds="icon-button"][aria-haspopup="dialog"]')!;
const root = () => document.querySelector<HTMLElement>('[data-ds="action-sheet"]');
const panel = () => document.querySelector<HTMLElement>('[data-ds="action-sheet"] [data-part="panel"]')!;
const items = () => Array.from(panel().querySelectorAll<HTMLElement>('[data-part="actions"] > *'));

async function openSheet(f: ComponentFixture<Host>) {
  trigger().click();
  await f.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await f.whenStable();
}

function press(key: string): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(async () => {
  vi.restoreAllMocks();
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('ActionSheet', () => {
  it('renders the parts in order, with Cancel added as the last item', async () => {
    const f = await mount(Host);
    expect(root()).toBeNull();
    await openSheet(f);
    const layer = document.querySelector<HTMLElement>('[data-dialog-layer]')!;
    expect(layer.getAttribute('data-ds')).toBe('theme');
    expect(root()!.parentElement).toBe(layer);
    expect(root()!.getAttribute('data-state')).toBe('open');
    expect(root()!.getAttribute('data-placement')).toBe('center');
    expect(Array.from(root()!.children).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    expect(Array.from(panel().children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'actions']);
    expect(items().map((b) => b.getAttribute('data-part'))).toEqual(['action', 'action', 'action', 'cancel']);
    const cancel = items()[3]!;
    expect(cancel.textContent?.trim()).toBe('Cancel');
    expect(cancel.getAttribute('data-dialog-cancel')).toBe('');
    expect(cancel.getAttribute('data-emphasis')).toBe('ghost');
    const action = items()[0]!;
    expect(action.getAttribute('data-ds')).toBe('button');
    expect(action.getAttribute('data-size')).toBe('lg');
    expect(action.getAttribute('data-emphasis')).toBe('soft');
    expect(action.getAttribute('data-full-width')).toBe('');
    expect(action.getAttribute('data-wrap')).toBe('');
    expect(action.getAttribute('type')).toBe('button');
    expect(action.getAttributeNames()).not.toContain('dsactionsheetaction');
    expect(panel().getAttribute('aria-labelledby')).toBe(panel().querySelector('[data-part="title"]')!.id);
    expect(panel().getAttribute('aria-describedby')).toBe(panel().querySelector('[data-part="description"]')!.id);
  });

  it('is an alertdialog that opens on Cancel when an action is danger', async () => {
    const f = await mount(Host);
    await openSheet(f);
    expect(panel().getAttribute('role')).toBe('alertdialog');
    expect(document.activeElement).toBe(items()[3]);
  });

  it('is a dialog that opens on the first action with no danger action', async () => {
    const f = await mount(Host, (h) => h.tone.set('neutral'));
    await openSheet(f);
    expect(panel().getAttribute('role')).toBe('dialog');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('moves with Up, Down, Home and End, and wraps', async () => {
    const f = await mount(Host, (h) => h.tone.set('neutral'));
    await openSheet(f);
    press('ArrowUp');
    expect(document.activeElement).toBe(items()[3]);
    press('ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
    press('ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    press('End');
    expect(document.activeElement).toBe(items()[3]);
    press('Home');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('keeps Tab inside the sheet', async () => {
    const f = await mount(Host, (h) => h.tone.set('neutral'));
    await openSheet(f);
    items()[3]!.focus();
    const event = press('Tab');
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(items()[0]);
  });

  it('runs an action, closes and returns focus to the trigger', async () => {
    const f = await mount(Host);
    await openSheet(f);
    items()[0]!.click();
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await f.whenStable();
    expect(f.componentInstance.runs).toEqual(['duplicate']);
    expect(f.componentInstance.open()).toBe(false);
    expect(root()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('keeps open when the action calls preventDefault', async () => {
    const f = await mount(Host);
    f.componentInstance.keep = true;
    await openSheet(f);
    items()[0]!.click();
    await f.whenStable();
    expect(f.componentInstance.runs).toEqual(['duplicate']);
    expect(f.componentInstance.open()).toBe(true);
  });

  it('cancels with Escape and with a press on the backdrop', async () => {
    const f = await mount(Host);
    await openSheet(f);
    press('Escape');
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(false);
    await new Promise((r) => setTimeout(r, 0));
    await openSheet(f);
    const backdrop = root()!.querySelector<HTMLElement>('[data-part="backdrop"]')!;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    backdrop.click();
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(false);
    expect(f.componentInstance.runs).toEqual([]);
  });

  it('keeps open while not dismissible', async () => {
    const f = await mount(Host, (h) => h.dismissible.set(false));
    await openSheet(f);
    press('Escape');
    const backdrop = root()!.querySelector<HTMLElement>('[data-part="backdrop"]')!;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    backdrop.click();
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(true);
  });

  it('marks the trigger', async () => {
    const f = await mount(Host);
    expect(trigger().getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().hasAttribute('aria-controls')).toBe(false);
    expect(trigger().getAttribute('data-state')).toBe('closed');
    await openSheet(f);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel().id);
    expect(trigger().getAttribute('data-state')).toBe('open');
  });

  it('stamps the placement by platform', async () => {
    const f = await mount(Host, (h) => {
      h.placement.set('auto');
      h.platform.set('android');
    });
    await openSheet(f);
    expect(root()!.getAttribute('data-placement')).toBe('bottom');
    expect(items()[0]!.getAttribute('data-emphasis')).toBe('ghost');
    press('Escape');
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.platform.set('ios');
    await f.whenStable();
    await openSheet(f);
    expect(root()!.getAttribute('data-placement')).toBe('anchored');
    const wrapper = root()!.querySelector<HTMLElement>('[data-radix-popper-content-wrapper]')!;
    expect(wrapper).not.toBeNull();
    expect(wrapper.firstElementChild).toBe(panel());
    expect(wrapper.style.position).toBe('fixed');
    expect(panel().getAttribute('data-side')).toBeTruthy();
    expect(panel().getAttribute('style')).toContain('--radix-popover-content-available-width');
  });

  it('uses the Arabic Cancel word, a given Cancel, and a hidden title from the label', async () => {
    const f = await mount(Host, (h) => {
      h.lang.set('ar');
      h.title.set(undefined);
      h.label.set('Actions for Spring launch');
    });
    await openSheet(f);
    expect(items()[3]!.textContent?.trim()).toBe('إلغاء');
    const title = panel().querySelector('[data-part="title"]')!;
    expect(title.getAttribute('data-visually-hidden')).toBe('');
    expect(title.textContent).toBe('Actions for Spring launch');
    press('Escape');
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    f.componentInstance.ownCancel.set(true);
    await f.whenStable();
    await openSheet(f);
    expect(items().map((b) => b.getAttribute('data-part'))).toEqual(['action', 'action', 'action', 'cancel']);
    expect(items()[3]!.textContent?.trim()).toBe('Keep board');
  });

  it('does not run or close on a disabled action', async () => {
    const f = await mount(Host, (h) => {
      h.disabled.set(true);
      h.tone.set('neutral');
    });
    await openSheet(f);
    const move = items()[1]!;
    expect(move.getAttribute('aria-disabled')).toBe('true');
    move.click();
    await f.whenStable();
    expect(f.componentInstance.runs).toEqual([]);
    expect(f.componentInstance.open()).toBe(true);
  });

  it('resolves the placement from the platform and the room', () => {
    expect(resolveActionSheetPlacement('auto', 'android', null).placement).toBe('bottom');
    expect(resolveActionSheetPlacement('auto', 'ios', null).placement).toBe('center');
    const el = document.createElement('button');
    document.body.appendChild(el);
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(new DOMRect(900, 10, 44, 44));
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1000);
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
    expect(resolveActionSheetPlacement('auto', 'ios', el)).toEqual({ placement: 'anchored', offset: -44, align: 'end' });
    expect(resolveActionSheetPlacement('auto', 'web', el)).toEqual({ placement: 'anchored', offset: 8, align: 'end' });
    expect(resolveActionSheetPlacement('auto', 'web', el, 'rtl').align).toBe('start');
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(320);
    expect(resolveActionSheetPlacement('auto', 'web', el).placement).toBe('center');
  });

  it('renders the demo with a trigger for every case', async () => {
    const f = await mount(ActionSheetDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'long-text', 'long-arabic', 'loading', 'disabled']);
    for (const id of ids) expect(c.querySelector(`[data-demo-case="${id}"] [data-demo-trigger]`)).not.toBeNull();
  });
});

// The trigger as a text Button keeps the Button's own DOM.
@Component({
  imports: [DS_ACTION_SHEET, DsButton],
  template: `
    <ng-container dsActionSheet>
      <button dsButton dsActionSheetTrigger>Open actions</button>
      <ng-template dsActionSheetContent label="Actions"><button dsActionSheetAction>Copy link</button></ng-template>
    </ng-container>
  `,
})
class TextTrigger {}

describe('ActionSheet trigger', () => {
  it('leaves no marker attribute on a text Button trigger', async () => {
    const f = await mount(TextTrigger);
    const button = (f.nativeElement as HTMLElement).querySelector('button')!;
    expect(button.getAttributeNames().sort()).toEqual(
      ['aria-expanded', 'aria-haspopup', 'data-emphasis', 'data-ds', 'data-shape', 'data-size', 'data-state', 'data-tone', 'type'].sort(),
    );
  });
});
