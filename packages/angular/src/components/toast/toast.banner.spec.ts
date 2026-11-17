// Order M9.8 on Angular: the notification banner. start and meta parts, the
// closable bus rule through toastClosable(item, platform), Escape on a
// focused toast. The twin of the "notification banner" block of
// packages/react/src/components/Toast/Toast.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createToastStore, type ToastStore } from '@the-system/shared';
import { DsTheme } from '../../theme/theme';
import { DsToast } from './toast';
import { DsToaster } from './toaster';

@Component({
  imports: [DsToaster, DsTheme],
  template: `
    <div dsTheme="neutral" [platform]="platform()" [lang]="'en'">
      <ng-container dsToaster [store]="store" />
    </div>
  `,
})
class ToasterHost {
  store!: ToastStore;
  readonly platform = signal<'ios' | 'web' | 'android'>('ios');
}

@Component({
  imports: [DsToast, DsTheme],
  template: `
    <div dsTheme [lang]="'en'">
      <div data-t="icon" dsToast start="mail" title="Invoice sent" meta="Yesterday"></div>
      <div data-t="person" dsToast [start]="person" title="Sara Haddad" [meta]="now" [onClose]="noop"></div>
      <div data-t="text" dsToast start="SH" title="Sara Haddad"></div>
      <div data-t="template" dsToast [start]="mark" title="Sara Haddad"></div>
      <ng-template #mark><b>S</b></ng-template>
      <div data-t="arabic" dsToast lang="ar" title="سارة الحداد" [meta]="fiveMinutesAgo"></div>
      <div data-t="plain" dsToast title="Board duplicated"></div>
    </div>
  `,
})
class StaticHost {
  readonly person = { avatar: { name: 'Sara Haddad' } };
  readonly now = new Date();
  readonly fiveMinutesAgo = new Date(Date.now() - 5 * 60_000);
  readonly noop = () => undefined;
}

let fixture: ComponentFixture<ToasterHost> | null = null;

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await fixture?.whenStable();
    await Promise.resolve();
  }
}

async function mount(platform: 'ios' | 'web' | 'android', exitTimeout?: number): Promise<ToastStore> {
  const store = createToastStore({ max: 5, exitTimeout });
  fixture = TestBed.createComponent(ToasterHost);
  fixture.componentInstance.store = store;
  fixture.componentInstance.platform.set(platform);
  fixture.detectChanges();
  await settle();
  return store;
}

const toasts = () => Array.from(document.body.querySelectorAll('[data-ds="toaster"] > [data-ds="toast"]')) as HTMLElement[];
const closeOf = (el: HTMLElement | undefined) => el?.querySelector(':scope > [data-part="close"]') ?? null;

afterEach(() => {
  fixture?.destroy();
  fixture = null;
  for (const el of Array.from(document.body.querySelectorAll('[data-toaster-layer]'))) el.remove();
});

describe('the notification banner (order M9.8)', () => {
  it('on ios a timed toast has no close button; danger, an action and closable true keep it', async () => {
    const store = await mount('ios');
    store.add('Board duplicated');
    store.add({ tone: 'danger', title: 'Could not publish page' });
    store.add({ title: 'Card moved', action: { label: 'Undo move', onAction: () => undefined } });
    store.add({ title: 'Link copied', closable: true });
    await settle();
    const [timed, danger, action, asked] = toasts();
    expect(closeOf(timed)).toBeNull();
    expect(closeOf(danger)).not.toBeNull();
    expect(closeOf(action)).not.toBeNull();
    expect(closeOf(asked)).not.toBeNull();
  });

  it('on web and android the close button shows by default, and closable false drops it on a timed toast', async () => {
    for (const platform of ['web', 'android'] as const) {
      const store = await mount(platform);
      store.add('Board duplicated');
      store.add({ title: 'Invoice sent', closable: false });
      await settle();
      const [plain, quiet] = toasts();
      expect(closeOf(plain)).not.toBeNull();
      expect(closeOf(quiet)).toBeNull();
      fixture?.destroy();
      fixture = null;
    }
  });

  it('refuses closable false on a danger toast, which keeps its close button and warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const store = await mount('ios');
    store.add({ tone: 'danger', title: 'Could not send reply', closable: false });
    await settle();
    expect(closeOf(toasts()[0])).not.toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('a banner without a close button closes with Escape once focused', async () => {
    const store = await mount('ios', 50);
    store.add('Board duplicated');
    await settle();
    const [el] = toasts();
    expect(closeOf(el)).toBeNull();
    expect(el?.tabIndex).toBe(0);
    el?.focus();
    el?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle();
    expect(store.getSnapshot().visible.filter((t) => t.state === 'open')).toHaveLength(0);
  });

  it('renders start in place of the icon and meta after the description, in that DOM order', async () => {
    const store = await mount('ios');
    const at = new Date();
    store.add({
      title: 'Sara Haddad',
      description: 'The new floor plan is in the shared folder.',
      start: { avatar: { name: 'Sara Haddad' } },
      meta: at,
      action: { label: 'Open plan', onAction: () => undefined },
    });
    await settle();
    const [el] = toasts();
    const parts = Array.from(el?.querySelectorAll(':scope > [data-part]') ?? []).map((p) => p.getAttribute('data-part'));
    expect(parts).toEqual(['start', 'title', 'description', 'meta', 'action', 'close']);
    const avatar = el?.querySelector('[data-part="start"] > [data-ds="avatar"]');
    expect(avatar).not.toBeNull();
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(avatar?.getAttribute('data-size')).toBe('md');
    expect(avatar?.getAttribute('data-shape')).toBe('default');
    expect(avatar?.hasAttribute('data-state')).toBe(false);
    expect((avatar as HTMLElement).style.getPropertyValue('--_avatar-hue')).toMatch(/^var\(--ds-color-accent-\d+\)$/);
    expect(avatar?.querySelector(':scope > [data-part="fallback"]')?.textContent).toBe('SH');
    expect(el?.querySelector('[data-part="start"]')?.hasAttribute('aria-hidden')).toBe(false);
    const meta = el?.querySelector('[data-part="meta"]');
    expect(meta?.tagName).toBe('TIME');
    expect(meta?.getAttribute('datetime')).toBe(at.toISOString());
    expect(meta?.textContent).toBe('now');
  });

  it('announces meta after the description, once', async () => {
    const store = await mount('ios');
    store.add({ title: 'Sara Haddad', description: 'Sent the floor plan', meta: 'now' });
    await settle();
    await new Promise((r) => setTimeout(r, 150));
    await settle();
    const polite = document.body.querySelector('[data-toaster-announce="polite"]');
    expect(polite?.textContent).toBe('Notification. Sara Haddad. Sent the floor plan. now.');
  });
});

describe('dsToast start and meta (order M9.8)', () => {
  async function render() {
    const view = TestBed.createComponent(StaticHost);
    await view.whenStable();
    return (id: string) => view.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
  }

  it('an icon name in start draws the icon, hidden from assistive tech, and a text meta is a span', async () => {
    const q = await render();
    const start = q('icon').querySelector(':scope > [data-part="start"]');
    expect(start?.getAttribute('aria-hidden')).toBe('true');
    expect(start?.querySelector('[data-ds="icon"]')?.getAttribute('data-icon')).toBe('mail');
    expect(q('icon').querySelector(':scope > [data-part="icon"]')).toBeNull();
    const meta = q('icon').querySelector(':scope > [data-part="meta"]');
    expect(meta?.tagName).toBe('SPAN');
    expect(meta?.textContent).toBe('Yesterday');
    expect(q('icon').hasAttribute('start')).toBe(false);
    expect(q('icon').hasAttribute('meta')).toBe(false);
  });

  it('draws a person as a decorative avatar, a text and a template as given, and the tone icon with no start', async () => {
    const q = await render();
    expect(q('person').querySelector(':scope > [data-part="start"] > [data-ds="avatar"]')).not.toBeNull();
    expect(q('person').querySelector(':scope > [data-part="meta"]')?.tagName).toBe('TIME');
    expect(Array.from(q('person').children).map((c) => c.getAttribute('data-part'))).toEqual(['start', 'title', 'meta', 'close']);
    const text = q('text').querySelector(':scope > [data-part="start"]');
    expect(text?.textContent).toBe('SH');
    expect(text?.hasAttribute('aria-hidden')).toBe(false);
    expect(q('template').querySelector(':scope > [data-part="start"] > b')?.textContent).toBe('S');
    expect(q('plain').querySelector(':scope > [data-part="icon"]')).not.toBeNull();
    expect(q('plain').querySelector(':scope > [data-part="start"]')).toBeNull();
  });

  it('writes an Arabic meta in Arabic with Western digits', async () => {
    const q = await render();
    const text = q('arabic').querySelector('[data-part="meta"]')?.textContent ?? '';
    expect(text).toContain('5');
    expect(text).not.toMatch(/[٠-٩]/);
  });
});
