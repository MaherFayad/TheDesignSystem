import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsButton } from '../button/button';
import { DS_DIALOG } from './dialog';

@Component({
  imports: [DS_DIALOG, DsButton, DsTheme],
  template: `
    <div dsTheme [style]="style()" lang="ar" id="theme">
      <ng-container dsDialog size="sm" [tone]="tone()" [dismissible]="dismissible()" [(open)]="open">
        <button id="trigger" dsButton dsDialogTrigger>Delete project</button>
        <ng-template dsDialogContent title="Delete the project?" description="Its boards go to the trash.">
          <div dsDialogFooter>
            <button id="cancel" dsButton dsDialogClose>Keep project</button>
            <button id="destroy" dsButton tone="danger" emphasis="solid">Delete project</button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
})
class Host {
  readonly style = signal('studio');
  readonly tone = signal<'neutral' | 'danger'>('neutral');
  readonly dismissible = signal(true);
  readonly open = signal(false);
}

const layer = () => document.body.querySelector('[data-dialog-layer]') as HTMLElement | null;
const panel = () => document.body.querySelector('[data-ds="dialog"] > [data-part="panel"]') as HTMLElement | null;

async function setup(): Promise<{ fixture: ComponentFixture<Host>; host: Host; trigger: HTMLElement }> {
  const fixture = TestBed.createComponent(Host);
  document.body.appendChild(fixture.nativeElement);
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLElement;
  return { fixture, host: fixture.componentInstance, trigger };
}

async function settle(fixture: ComponentFixture<Host>): Promise<void> {
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await fixture.whenStable();
}

afterEach(() => {
  for (const el of Array.from(document.body.querySelectorAll('[data-dialog-layer]'))) el.remove();
});

describe('DsDialog', () => {
  it('renders nothing until opened, and stamps the trigger', async () => {
    const { trigger } = await setup();
    expect(layer()).toBeNull();
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('data-state')).toBe('closed');
    expect(trigger.hasAttribute('dsdialogtrigger')).toBe(false);
  });

  it('opens the React DOM in a themed portal at the end of body', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await settle(fixture);
    const wrap = layer();
    expect(wrap?.parentElement).toBe(document.body);
    expect(wrap?.getAttribute('data-ds')).toBe('theme');
    // Every axis copied from the opening theme.
    expect(wrap?.getAttribute('lang')).toBe('ar');
    expect(wrap?.getAttribute('dir')).toBe('rtl');
    expect(wrap?.getAttribute('data-style')).toBe('studio');
    const root = wrap?.firstElementChild as HTMLElement;
    expect(root.getAttribute('data-ds')).toBe('dialog');
    expect(root.getAttribute('data-size')).toBe('sm');
    expect(root.getAttribute('data-state')).toBe('open');
    expect(Array.from(root.children).map((c) => c.getAttribute('data-part'))).toEqual(['backdrop', 'panel']);
    const p = panel() as HTMLElement;
    expect(p.getAttribute('role')).toBe('dialog');
    expect(p.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(p.getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Delete the project?');
    expect(document.getElementById(p.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Its boards go to the trash.');
    expect(Array.from(p.children).map((c) => c.getAttribute('data-part'))).toEqual(['title', 'close', 'description', 'footer']);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(p.id);
  });

  it('Desk turns on the title bar and the lights through the optional parts', async () => {
    const { fixture, host, trigger } = await setup();
    host.style.set('desk');
    await fixture.whenStable();
    trigger.click();
    await settle(fixture);
    const p = panel() as HTMLElement;
    const bar = p.firstElementChild as HTMLElement;
    expect(bar.getAttribute('data-part')).toBe('titlebar');
    expect(bar.getAttribute('data-ds')).toBe('title-bar');
    expect(bar.querySelector('[data-part="controls"] > [data-ds="window-controls"]')).not.toBeNull();
    expect(p.querySelector(':scope > [data-part="close"]')).toBeNull();
    const titleId = p.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(titleId)?.hasAttribute('data-dialog-title')).toBe(true);
  });

  it('focus rule: the first footer action; in a danger dialog the Cancel action', async () => {
    const first = await setup();
    first.trigger.click();
    await settle(first.fixture);
    expect(document.activeElement?.id).toBe('cancel');
    first.fixture.destroy();

    const { fixture, host, trigger } = await setup();
    host.tone.set('danger');
    await fixture.whenStable();
    trigger.click();
    await settle(fixture);
    expect(document.activeElement?.id).toBe('cancel');
  });

  it('Escape closes and focus returns to the trigger', async () => {
    const { fixture, host, trigger } = await setup();
    trigger.focus();
    trigger.click();
    await settle(fixture);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle(fixture);
    expect(host.open()).toBe(false);
    expect(layer()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('dsDialogClose and a backdrop click close; not while dismissible is false', async () => {
    const { fixture, host, trigger } = await setup();
    trigger.click();
    await settle(fixture);
    (document.getElementById('cancel') as HTMLElement).click();
    await settle(fixture);
    expect(host.open()).toBe(false);

    host.dismissible.set(false);
    host.open.set(true);
    await settle(fixture);
    const backdrop = document.body.querySelector('[data-part="backdrop"]') as HTMLElement;
    backdrop.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    backdrop.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle(fixture);
    expect(host.open()).toBe(true);
    expect(panel()?.querySelector('[data-part="close"]')?.getAttribute('aria-disabled')).toBe('true');

    host.dismissible.set(true);
    await settle(fixture);
    const again = document.body.querySelector('[data-part="backdrop"]') as HTMLElement;
    again.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    again.click();
    await settle(fixture);
    expect(host.open()).toBe(false);
  });

  it('Tab wraps inside the panel', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    await settle(fixture);
    const destroy = document.getElementById('destroy') as HTMLElement;
    destroy.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    // The first tab stop: the close control.
    expect(document.activeElement?.getAttribute('data-part')).toBe('close');
  });
});
