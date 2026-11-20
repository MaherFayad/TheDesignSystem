// Drawer: the Angular twin of
// packages/react/src/components/Drawer/Drawer.test.tsx. WCAG 2.2 covered
// here: 2.1.1 Keyboard (Escape, Tab kept inside while modal), 2.1.2 No
// keyboard trap (non modal leaves the page reachable), 2.4.3 Focus order
// (focus opens on the first field and returns to the trigger; non modal
// keeps focus on the page), 2.5.7 Dragging movements (the swipe has the
// close control and Escape as paths with no drag), 4.1.2 Name, role, value.
import { Component, signal, type Type } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import DrawerDemo from './drawer.demo';
import { DS_DRAWER, type DrawerSide, type DrawerSize } from './drawer';

@Component({
  imports: [DS_DRAWER, DsButton, DsTheme],
  template: `
    <div dsTheme [lang]="lang()" [dir]="dir()" [platform]="platform()">
      <button dsButton id="page-action">Page action</button>
      <input id="page-field" aria-label="Page field" />
      <ng-container dsDrawer [(open)]="open" [modal]="modal()" [dismissible]="dismissible()" [size]="size()" [side]="side()">
        <button dsButton dsDrawerTrigger>Filter boards</button>
        <ng-template dsDrawerContent title="Filters" description="Boards that match every filter.">
          <div dsDrawerBody><input id="owner" aria-label="Owner" value="Sara" /></div>
          <div dsDrawerFooter><button dsButton dsDrawerClose>Discard changes</button></div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Basic {
  readonly open = signal(false);
  readonly modal = signal(true);
  readonly dismissible = signal(true);
  readonly size = signal<DrawerSize>('md');
  readonly side = signal<DrawerSide>('end');
  readonly lang = signal<'en' | 'ar'>('en');
  readonly dir = signal<'ltr' | 'rtl'>('ltr');
  readonly platform = signal<'web' | 'ios'>('web');
}

async function mount<T>(type: Type<T>, set?: (host: T) => void): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(type);
  set?.(fixture.componentInstance);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  return fixture;
}

const rootEl = () => document.body.querySelector<HTMLElement>('[data-ds="drawer"]');
const part = (name: string) => rootEl()?.querySelector<HTMLElement>(`[data-part="${name}"]`) ?? null;
const trigger = () => Array.from(document.querySelectorAll<HTMLElement>('button')).find((b) => b.textContent?.trim() === 'Filter boards')!;
const tick = () => new Promise((r) => setTimeout(r, 0));

async function settle(f: ComponentFixture<unknown>) {
  await f.whenStable();
  await tick();
  await f.whenStable();
}

async function openDrawer(f: ComponentFixture<Basic>) {
  trigger().click();
  await settle(f);
}

function press(key: string): KeyboardEvent {
  const target = (document.activeElement ?? document.body) as HTMLElement;
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

afterEach(() => {
  TestBed.resetTestingModule();
  document.body.replaceChildren();
});

describe('Drawer', () => {
  it('renders the root, backdrop and panel in a themed portal, with the header parts', async () => {
    const f = await mount(Basic);
    expect(rootEl()).toBeNull();
    await openDrawer(f);
    const layer = document.querySelector<HTMLElement>('[data-dialog-layer]')!;
    expect(layer.getAttribute('data-ds')).toBe('theme');
    expect(rootEl()!.parentElement).toBe(layer);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    expect(rootEl()!.getAttribute('data-size')).toBe('md');
    expect(rootEl()!.getAttribute('data-side')).toBe('end');
    expect(Array.from(rootEl()!.children).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    const panel = part('panel')!;
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('aria-modal')).toBe('true');
    expect(Array.from(panel.children).map((c) => c.getAttribute('data-part'))).toEqual(['handle', 'header', 'body', 'footer']);
    expect(part('handle')!.getAttribute('aria-hidden')).toBe('true');
    expect(part('handle')!.firstElementChild?.getAttribute('data-part')).toBe('handle-bar');
    expect(Array.from(part('header')!.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'description', 'close']);
    expect(panel.getAttribute('aria-labelledby')).toBe(part('title')!.id);
    expect(panel.getAttribute('aria-describedby')).toBe(part('description')!.id);
    expect(part('close')!.getAttribute('aria-label')).toBe('Close drawer');
    expect(part('body')!.getAttributeNames()).not.toContain('dsdrawerbody');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel.id);
  });

  it('takes size and side', async () => {
    const f = await mount(Basic, (h) => {
      h.size.set('xl');
      h.side.set('start');
    });
    await openDrawer(f);
    expect(rootEl()!.getAttribute('data-size')).toBe('xl');
    expect(rootEl()!.getAttribute('data-side')).toBe('start');
  });

  it('opens with focus on the first field and returns it to the trigger on Escape', async () => {
    const f = await mount(Basic);
    await openDrawer(f);
    expect(document.activeElement?.id).toBe('owner');
    press('Escape');
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('keeps Tab inside while modal and hides the page', async () => {
    const f = await mount(Basic);
    await openDrawer(f);
    expect((f.nativeElement as HTMLElement).getAttribute('aria-hidden')).toBe('true');
    part('close')!.focus();
    const close = Array.from(rootEl()!.querySelectorAll<HTMLElement>('button')).at(-1)!;
    close.focus();
    expect(press('Tab').defaultPrevented).toBe(true);
    expect(rootEl()!.contains(document.activeElement)).toBe(true);
  });

  it('closes with the close control, dsDrawerClose and a backdrop press', async () => {
    const f = await mount(Basic);
    await openDrawer(f);
    part('close')!.click();
    await settle(f);
    expect(rootEl()).toBeNull();
    await openDrawer(f);
    Array.from(rootEl()!.querySelectorAll<HTMLElement>('[data-dialog-cancel]'))[0]!.click();
    await settle(f);
    expect(rootEl()).toBeNull();
    await openDrawer(f);
    const backdrop = part('backdrop')!;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    backdrop.click();
    await settle(f);
    expect(rootEl()).toBeNull();
  });

  it('non modal: no backdrop, the page stays reachable and a press on it keeps the drawer open', async () => {
    const f = await mount(Basic, (h) => h.modal.set(false));
    await openDrawer(f);
    expect(part('backdrop')).toBeNull();
    expect(part('panel')!.hasAttribute('aria-modal')).toBe(false);
    expect((f.nativeElement as HTMLElement).hasAttribute('aria-hidden')).toBe(false);
    const page = document.getElementById('page-action')!;
    page.focus();
    page.click();
    await settle(f);
    expect(document.activeElement).toBe(page);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
  });

  it('non modal: an Escape in a page field keeps it open, and focus stays on the page when it closes', async () => {
    const f = await mount(Basic, (h) => h.modal.set(false));
    await openDrawer(f);
    const field = document.getElementById('page-field')!;
    field.focus();
    press('Escape');
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    f.componentInstance.open.set(false);
    await settle(f);
    expect(rootEl()).toBeNull();
    expect(document.activeElement).toBe(field);
  });

  it('with dismissible false, Escape and the backdrop do nothing and the close control is disabled', async () => {
    const f = await mount(Basic, (h) => h.dismissible.set(false));
    await openDrawer(f);
    press('Escape');
    const backdrop = part('backdrop')!;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    backdrop.click();
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    expect(part('close')!.getAttribute('aria-disabled')).toBe('true');
  });

  it('labels the close control in Arabic under lang ar', async () => {
    const f = await mount(Basic, (h) => h.lang.set('ar'));
    await openDrawer(f);
    expect(part('close')!.getAttribute('aria-label')).toBe('إغلاق الشريط الجانبي');
    expect(document.querySelector('[data-dialog-layer]')!.getAttribute('lang')).toBe('ar');
  });

  it('renders the demo with a trigger per case', async () => {
    const f = await mount(DrawerDemo);
    const c = f.nativeElement as HTMLElement;
    const ids = Array.from(c.querySelectorAll('[data-demo-case]')).map((s) => s.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error', 'disabled']);
    for (const id of ids) expect(c.querySelector(`[data-demo-case="${id}"] [data-demo-trigger]`)).not.toBeNull();
    expect(c.querySelectorAll('[data-demo-case="variants"] [data-demo-trigger]')).toHaveLength(8);
  });
});

describe('Drawer swipe to dismiss', () => {
  function swipe(dx: number, dy: number, ms: number) {
    const panel = part('panel')!;
    panel.getBoundingClientRect = () => new DOMRect(0, 0, 400, 600);
    const handle = part('handle')!;
    const at = (type: string, x: number, y: number, t: number) => {
      const event = new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, clientX: x, clientY: y });
      Object.defineProperty(event, 'timeStamp', { value: t });
      handle.dispatchEvent(event);
    };
    at('pointerdown', 100, 100, 1);
    at('pointermove', 100 + dx, 100 + dy, 1 + ms / 2);
    const drawn = { x: panel.style.getPropertyValue('--_dialog-drag-x'), y: panel.style.getPropertyValue('--_dialog-drag-y') };
    at('pointerup', 100 + dx, 100 + dy, 1 + ms);
    return drawn;
  }

  it('follows toward its edge, marks dragging and closes past a quarter of its width', async () => {
    const f = await mount(Basic);
    await openDrawer(f);
    const handle = part('handle')!;
    handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerId: 2 }));
    await f.whenStable();
    expect(rootEl()!.hasAttribute('data-dragging')).toBe(true);
    handle.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 2 }));
    await f.whenStable();
    expect(rootEl()!.hasAttribute('data-dragging')).toBe(false);
    expect(swipe(150, 0, 1000).x).toBe('150px');
    await settle(f);
    expect(rootEl()).toBeNull();
  });

  it('springs back on a short slow swipe and gives a rubber band against its edge', async () => {
    const f = await mount(Basic);
    await openDrawer(f);
    swipe(40, 0, 1000);
    await f.whenStable();
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
    expect(part('panel')!.style.getPropertyValue('--_dialog-drag-x')).toBe('');
    const against = swipe(-200, 0, 1000);
    expect(Number.parseFloat(against.x)).toBeGreaterThan(-48);
    expect(Number.parseFloat(against.x)).toBeLessThan(0);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
  });

  it('goes left in Arabic, down on ios, and never closes with dismissible false', async () => {
    let f = await mount(Basic, (h) => {
      h.dir.set('rtl');
      h.lang.set('ar');
    });
    await openDrawer(f);
    expect(swipe(-150, 0, 1000).x).toBe('-150px');
    await settle(f);
    expect(rootEl()).toBeNull();
    f.destroy();
    document.body.replaceChildren();
    f = await mount(Basic, (h) => h.platform.set('ios'));
    await openDrawer(f);
    expect(swipe(0, 200, 1000).y).toBe('200px');
    await settle(f);
    expect(rootEl()).toBeNull();
    f.destroy();
    document.body.replaceChildren();
    f = await mount(Basic, (h) => h.dismissible.set(false));
    await openDrawer(f);
    swipe(300, 0, 1000);
    await settle(f);
    expect(rootEl()!.getAttribute('data-state')).toBe('open');
  });
});
