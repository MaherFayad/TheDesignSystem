// AlertDialog: the Angular twin of
// packages/react/src/components/AlertDialog/AlertDialog.test.tsx and
// AlertDialog.body.test.tsx. WCAG 2.2 covered here: 2.1.1 Keyboard (Escape
// cancels, Return runs the default action), 2.1.2 (Tab stays inside), 2.4.3
// Focus order (Cancel first, or the first field; focus returns to the
// trigger), 4.1.2 Name, role, value (alertdialog named by its title).
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DsField } from '../field/field';
import { DsInput } from '../input/input';
import AlertDialogDemo from './alert-dialog.demo';
import { DS_ALERT_DIALOG, type AlertDialogIcon, type AlertDialogSize, type AlertDialogTone } from './alert-dialog';

@Component({
  imports: [DS_ALERT_DIALOG, DsButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [dir]="lang() === 'ar' ? 'rtl' : 'ltr'" [style]="style()">
      <ng-container dsAlertDialog [(open)]="open" [size]="size()" [tone]="tone()" [dismissible]="dismissible()">
        <button dsButton dsAlertDialogTrigger>Delete the board</button>
        <ng-template dsAlertDialogContent title="Delete the board Spring launch?" description="This cannot be undone." [icon]="icon()">
          <div dsAlertDialogFooter>
            <button dsButton dsAlertDialogCancel>Keep board</button>
            <button dsButton dsAlertDialogAction tone="danger" emphasis="solid" (click)="act($event)">Delete board</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Basic {
  readonly open = signal(false);
  readonly size = signal<AlertDialogSize>('md');
  readonly tone = signal<AlertDialogTone>('neutral');
  readonly dismissible = signal(true);
  readonly icon = signal<AlertDialogIcon | undefined>(undefined);
  readonly lang = signal<'en' | 'ar'>('en');
  readonly style = signal('studio');
  ran = 0;
  keepOpen = false;
  act(event: MouseEvent): void {
    this.ran += 1;
    if (this.keepOpen) event.preventDefault();
  }
}

@Component({
  imports: [DS_ALERT_DIALOG, DsButton, DsField, DsInput],
  template: `
    <ng-container dsAlertDialog [tone]="tone()">
      <button dsButton dsAlertDialogTrigger>New folder</button>
      <ng-template dsAlertDialogContent [icon]="false" title="New folder" description="Name the folder for these boards.">
        <fieldset dsAlertDialogBody legend="Folder details">
          <div dsField label="Name"><div dsInput variant="plain" [value]="name()"></div></div>
          @if (two()) {
            <div dsField label="Note"><div dsInput variant="plain"></div></div>
          }
        </fieldset>
        <div dsAlertDialogFooter>
          <button dsButton dsAlertDialogCancel>Cancel</button>
          @if (own()) {
            <button dsButton dsAlertDialogAction primary emphasis="soft" tone="neutral" (click)="created = created + 1">Create folder</button>
          } @else {
            <button dsButton dsAlertDialogAction primary [requiresValue]="requiresValue()" (click)="created = created + 1">Create folder</button>
          }
        </div>
      </ng-template>
    </ng-container>
  `,
})
class Folder {
  readonly tone = signal<AlertDialogTone>('neutral');
  readonly two = signal(true);
  readonly own = signal(false);
  readonly requiresValue = signal(false);
  readonly name = signal<string | undefined>(undefined);
  created = 0;
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="alert-dialog"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;
const panel = () => part('panel')!;
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name) ?? null;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function settle(f: ComponentFixture<unknown>) {
  await f.whenStable();
  await tick();
  await f.whenStable();
}

async function openAlert<T>(f: ComponentFixture<T>, name = 'Delete the board') {
  button(name)!.click();
  await settle(f);
}

function press(key: string, init: KeyboardEventInit = {}, target: Element = document.activeElement ?? document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('AlertDialog', () => {
  it('renders the root, the backdrop and the panel in a themed portal, with the parts in order', async () => {
    const f = await mount(Basic);
    expect(rootEl()).toBeNull();
    await openAlert(f);
    const root = rootEl()!;
    expect((f.nativeElement as HTMLElement).contains(root)).toBe(false);
    expect(root.parentElement?.getAttribute('data-ds')).toBe('theme');
    expect(root.getAttribute('data-size')).toBe('md');
    expect(root.getAttribute('data-tone')).toBe('neutral');
    expect(root.getAttribute('data-state')).toBe('open');
    expect(root.hasAttribute('data-segment')).toBe(false);
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    expect(panel().getAttribute('role')).toBe('alertdialog');
    expect(Array.from(panel().children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'title', 'description', 'footer']);
    expect(part('close')).toBeNull();
    expect(part('cancel')!.getAttribute('data-ds')).toBe('button');
    expect(part('cancel')!.hasAttribute('data-dialog-cancel')).toBe(true);
    expect(part('action')!.getAttribute('data-ds')).toBe('button');
    expect(part('action')!.hasAttribute('data-primary')).toBe(false);
    expect(part('icon')!.getAttribute('aria-hidden')).toBe('true');
    expect(part('icon')!.querySelector('[data-icon="info"]')).not.toBeNull();
    expect(document.body.querySelector('[dsalertdialogaction], [dsalertdialogcancel], [dsalertdialogfooter], [primary]')).toBeNull();
  });

  it('is named by its title and described by its description', async () => {
    const f = await mount(Basic);
    await openAlert(f);
    expect(document.getElementById(panel().getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Delete the board Spring launch?');
    expect(document.getElementById(panel().getAttribute('aria-describedby') ?? '')?.textContent).toBe('This cannot be undone.');
  });

  it('opens with focus on Cancel, in both tones', async () => {
    for (const tone of ['neutral', 'danger'] as const) {
      const f = await mount(Basic, (h) => h.tone.set(tone));
      await openAlert(f);
      expect(document.activeElement).toBe(button('Keep board'));
      f.destroy();
      document.body.replaceChildren();
    }
  });

  it('shows the warning icon in the danger tone, or none with false', async () => {
    const f = await mount(Basic, (h) => h.tone.set('danger'));
    await openAlert(f);
    expect(part('icon')!.querySelector('[data-icon="warning"]')).not.toBeNull();
    f.componentInstance.icon.set(false);
    await settle(f);
    expect(part('icon')).toBeNull();
  });

  it('sets data-size and data-tone', async () => {
    for (const size of ['sm', 'md'] as const) {
      const f = await mount(Basic, (h) => {
        h.size.set(size);
        h.tone.set('danger');
      });
      await openAlert(f);
      expect(rootEl()!.getAttribute('data-size')).toBe(size);
      expect(rootEl()!.getAttribute('data-tone')).toBe('danger');
      f.destroy();
      document.body.replaceChildren();
    }
  });

  it('closes with Escape, Cancel and the action, never with a backdrop click, and focus returns to the trigger', async () => {
    const f = await mount(Basic);
    const trigger = button('Delete the board')!;
    await openAlert(f);
    part('backdrop')!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    part('backdrop')!.click();
    await settle(f);
    expect(rootEl()).not.toBeNull();
    press('Escape');
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    await openAlert(f);
    button('Keep board')!.click();
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(f.componentInstance.ran).toBe(0);
    await openAlert(f);
    button('Delete board')!.click();
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(f.componentInstance.ran).toBe(1);
    expect(f.componentInstance.open()).toBe(false);
  });

  it('nudges the panel when a backdrop press is refused, and keeps focus where it was', async () => {
    const f = await mount(Basic);
    await openAlert(f);
    const animate = vi.fn(() => ({ cancel: () => undefined }) as unknown as Animation);
    panel().animate = animate as unknown as typeof HTMLElement.prototype.animate;
    const cancel = button('Keep board')!;
    const down = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 });
    part('backdrop')!.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    expect(animate).toHaveBeenCalledTimes(1);
    const calls = animate.mock.calls as unknown as [Keyframe[], KeyframeAnimationOptions][];
    expect(calls[0]?.[1].id).toBe('ds-motion:dialog-refuse');
    expect(document.activeElement).toBe(cancel);
  });

  it('traps Tab inside the panel', async () => {
    const f = await mount(Basic);
    await openAlert(f);
    const cancel = button('Keep board')!;
    const action = button('Delete board')!;
    expect(document.activeElement).toBe(cancel);
    action.focus();
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(cancel);
    expect(press('Tab', { shiftKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(action);
  });

  it('with dismissible false, Escape does nothing; preventDefault on the action keeps it open', async () => {
    const f = await mount(Basic, (h) => h.dismissible.set(false));
    await openAlert(f);
    press('Escape');
    await settle(f);
    expect(rootEl()).not.toBeNull();
    f.componentInstance.dismissible.set(true);
    f.componentInstance.keepOpen = true;
    await settle(f);
    button('Delete board')!.click();
    await settle(f);
    expect(f.componentInstance.ran).toBe(1);
    expect(rootEl()).not.toBeNull();
  });

  it('copies the theme axes into the portal, Arabic included', async () => {
    const f = await mount(Basic, (h) => {
      h.lang.set('ar');
      h.style.set('desk');
    });
    await openAlert(f);
    const layer = rootEl()!.parentElement!;
    expect(layer.getAttribute('data-style')).toBe('desk');
    expect(layer.getAttribute('lang')).toBe('ar');
    expect(layer.getAttribute('dir')).toBe('rtl');
  });

  it('Desk: the title moves into a title bar, still the name; the close light cancels', async () => {
    const f = await mount(Basic, (h) => h.style.set('desk'));
    await openAlert(f);
    const bar = part('titlebar')!;
    expect(bar.getAttribute('data-ds')).toBe('title-bar');
    expect(panel().firstElementChild).toBe(bar);
    expect(panel().querySelectorAll('[data-part="title"]')).toHaveLength(1);
    expect(bar.querySelector('[data-part="title"]')?.textContent).toBe('Delete the board Spring launch?');
    expect(document.getElementById(panel().getAttribute('aria-labelledby') ?? '')?.hasAttribute('data-dialog-title')).toBe(true);
    const lights = bar.querySelector<HTMLElement>('[data-ds="window-controls"]')!;
    expect(lights.getAttribute('aria-label')).toBe('Alert controls');
    lights.querySelector<HTMLElement>('[data-part="close"]')!.click();
    await settle(f);
    expect(rootEl()).toBeNull();
  });

  it('labels the lights in Arabic', async () => {
    const f = await mount(Basic, (h) => {
      h.style.set('desk');
      h.lang.set('ar');
    });
    await openAlert(f);
    expect(part('titlebar')!.querySelector('[data-ds="window-controls"]')?.getAttribute('aria-label')).toBe('أزرار التنبيه');
  });

  it('carries data-segment on a folded screen', async () => {
    Object.defineProperty(window, 'viewport', {
      configurable: true,
      value: { segments: [{ x: 0, y: 0, width: 400, height: 800 }, { x: 420, y: 0, width: 400, height: 800 }] },
    });
    try {
      const f = await mount(Basic);
      await openAlert(f);
      await settle(f);
      expect(rootEl()!.getAttribute('data-segment')).toBe('start');
    } finally {
      Object.defineProperty(window, 'viewport', { configurable: true, value: undefined });
    }
  });
});

describe('AlertDialog body and default action (order M9.6)', () => {
  const field = (label: string) =>
    Array.from(document.querySelectorAll<HTMLInputElement>('input')).find((i) => i.closest('[data-ds="field"]')?.textContent?.includes(label))!;

  it('renders the body as an inset Fieldset in the alert body part, between the description and the footer', async () => {
    const f = await mount(Folder);
    await openAlert(f, 'New folder');
    expect(Array.from(panel().children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'body', 'footer']);
    const body = part('body')!;
    expect(body.tagName).toBe('FIELDSET');
    expect(body.getAttribute('data-ds')).toBe('fieldset');
    expect(body.getAttribute('data-variant')).toBe('inset');
    expect(body.querySelector('legend[data-part="legend"] > [data-visually-hidden]')?.textContent).toBe('Folder details');
    expect(body.querySelector(':scope > [data-part="body"]')?.querySelectorAll('[data-ds="field"]')).toHaveLength(2);
    expect(body.hasAttribute('legend')).toBe(false);
  });

  it('opens focus on the first field, then Tab goes field, field, Cancel, action', async () => {
    const f = await mount(Folder);
    await openAlert(f, 'New folder');
    expect(document.activeElement).toBe(field('Name'));
  });

  it('marks the default action with data-primary and draws it solid in the accent tone, danger in a danger alert', async () => {
    const f = await mount(Folder);
    await openAlert(f, 'New folder');
    const action = button('Create folder')!;
    expect(action.getAttribute('data-part')).toBe('action');
    expect(action.getAttribute('data-primary')).toBe('');
    expect(action.getAttribute('data-emphasis')).toBe('solid');
    expect(action.getAttribute('data-tone')).toBe('accent');
    expect(button('Cancel')!.hasAttribute('data-primary')).toBe(false);
    f.componentInstance.tone.set('danger');
    await settle(f);
    expect(action.getAttribute('data-tone')).toBe('danger');
  });

  it('the Button own tone and emphasis win', async () => {
    const f = await mount(Folder, (h) => h.own.set(true));
    await openAlert(f, 'New folder');
    const action = button('Create folder')!;
    expect(action.getAttribute('data-emphasis')).toBe('soft');
    expect(action.getAttribute('data-tone')).toBe('neutral');
    expect(action.hasAttribute('data-primary')).toBe(true);
  });

  it('runs the primary action on Return in a field, and closes the alert', async () => {
    const f = await mount(Folder);
    await openAlert(f, 'New folder');
    const event = press('Enter', {}, field('Name'));
    expect(event.defaultPrevented).toBe(true);
    await settle(f);
    expect(f.componentInstance.created).toBe(1);
    expect(rootEl()).toBeNull();
  });

  it('does not run it on Return while an IME composition ends, or with a modifier', async () => {
    const f = await mount(Folder);
    await openAlert(f, 'New folder');
    press('Enter', { isComposing: true }, field('Name'));
    press('Enter', { shiftKey: true }, field('Name'));
    await settle(f);
    expect(f.componentInstance.created).toBe(0);
    expect(rootEl()).not.toBeNull();
  });

  it('with requiresValue: aria-disabled while the first field is empty, Return and a press do nothing', async () => {
    const f = await mount(Folder, (h) => h.requiresValue.set(true));
    await openAlert(f, 'New folder');
    const action = button('Create folder')!;
    expect(action.getAttribute('aria-disabled')).toBe('true');
    expect(action.hasAttribute('data-disabled')).toBe(true);
    action.click();
    press('Enter', {}, field('Name'));
    await settle(f);
    expect(f.componentInstance.created).toBe(0);
    expect(rootEl()).not.toBeNull();
    const input = field('Name');
    input.value = 'Spring';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle(f);
    expect(action.hasAttribute('aria-disabled')).toBe(false);
    f.componentInstance.name.set('');
    await settle(f);
    await settle(f);
    expect(action.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('AlertDialog demo', () => {
  it('renders a trigger per case, the React case ids, and no native title', async () => {
    const f = await mount(AlertDialogDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'fields', 'one', 'long-text', 'long-arabic', 'loading', 'error']);
    expect(c.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]')).toHaveLength(5);
    for (const id of ids) expect(c.querySelector(`[data-demo-case="${id}"] [data-demo-trigger]`)).not.toBeNull();
    expect(c.querySelector('[title]')).toBeNull();
  });

  it('opens the Arabic folder alert in Arabic', async () => {
    const f = await mount(AlertDialogDemo);
    (f.nativeElement as HTMLElement).querySelector<HTMLElement>('[data-demo-trigger="fields-arabic"]')!.click();
    await settle(f);
    expect(rootEl()!.parentElement!.getAttribute('lang')).toBe('ar');
    expect(button('إنشاء المجلد')).not.toBeNull();
  });
});
