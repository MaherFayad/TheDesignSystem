// Order M9.1 on Angular: Input variant plain, the clear part (clearable) and
// data-empty. The twin of packages/react/src/components/Input/Input.clear.test.tsx.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DS_DIALOG } from '../dialog/dialog';
import { DsInput, inputClearLabels } from './input';

@Component({
  imports: [DsInput, DsTheme, ...DS_DIALOG],
  template: `
    <div dsTheme [lang]="'en'">
      <div data-t="plain" dsInput variant="plain" aria-label="Name"></div>
      <div data-t="empty" dsInput aria-label="City"></div>
      <div data-t="clear" dsInput clearable aria-label="Team" [(value)]="team" (input)="heard.set(heard() + 1)"></div>
      <div data-t="readonly" dsInput clearable readOnly value="Sara" aria-label="Owner"></div>
      <div data-t="label" dsInput clearable clearLabel="Clear email" value="a@b.co" aria-label="Email"></div>
      <ng-container dsDialog [(open)]="dialogOpen">
        <ng-template dsDialogContent title="Rename">
          <div data-t="dialog" dsInput clearable value="Spring" aria-label="Board"></div>
        </ng-template>
      </ng-container>
    </div>
    <div dsTheme [lang]="'ar'">
      <div data-t="arabic" dsInput clearable value="سارة" aria-label="الاسم"></div>
    </div>
  `,
})
class Host {
  readonly team = signal<string | undefined>('Design');
  readonly heard = signal(0);
  readonly dialogOpen = signal(false);
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement);
  await fixture.whenStable();
  const box = (id: string) => document.querySelector(`[data-t="${id}"]`) as HTMLElement;
  const native = (id: string) => box(id).querySelector('input') as HTMLInputElement;
  const clearOf = (id: string) => box(id).querySelector<HTMLElement>(':scope > [data-part="clear"]');
  const settle = async () => {
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
  };
  const focus = async (el: HTMLElement) => {
    el.focus();
    await settle();
  };
  const key = async (el: HTMLElement, k: string) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    await settle();
    return event;
  };
  return { fixture, host: fixture.componentInstance, box, native, clearOf, settle, focus, key };
}

describe('DsInput plain and clearable (order M9.1)', () => {
  afterEach(() => {
    for (const el of Array.from(document.body.children)) el.remove();
  });

  it('stamps variant plain and data-empty while the value is empty', async () => {
    const { box, native, settle } = await setup();
    expect(box('plain').getAttribute('data-variant')).toBe('plain');
    expect(box('empty').hasAttribute('data-empty')).toBe(true);
    expect(box('clear').hasAttribute('data-empty')).toBe(false);
    const input = native('empty');
    input.value = 'Riyadh';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(box('empty').hasAttribute('data-empty')).toBe(false);
    expect(box('clear').hasAttribute('clearable')).toBe(false);
  });

  it('follows a value set from outside', async () => {
    const { fixture, box, host } = await setup();
    host.team.set('');
    await fixture.whenStable();
    expect(box('clear').hasAttribute('data-empty')).toBe(true);
    host.team.set('Design');
    await fixture.whenStable();
    expect(box('clear').hasAttribute('data-empty')).toBe(false);
  });

  it('shows the clear button only while the box has focus and a value, after the input', async () => {
    const { native, clearOf, focus, settle } = await setup();
    expect(clearOf('clear')).toBeNull();
    await focus(native('clear'));
    const button = clearOf('clear') as HTMLElement;
    expect(button).not.toBeNull();
    expect(button.tagName).toBe('BUTTON');
    expect(button.getAttribute('data-ds')).toBe('close-button');
    expect(button.getAttribute('aria-label')).toBe(inputClearLabels.en);
    expect(button.getAttribute('data-size')).toBe('xs');
    expect(button.getAttribute('data-shape')).toBe('pill');
    expect(button.previousElementSibling).toBe(native('clear'));
    // Focus moving to the button keeps it.
    button.focus();
    await settle();
    expect(clearOf('clear')).toBe(button);
    // Focus leaving the box hides it.
    (document.activeElement as HTMLElement).blur();
    await settle();
    expect(clearOf('clear')).toBeNull();
  });

  it('clears the value with an input event and moves focus back to the input', async () => {
    const { host, box, native, clearOf, focus, settle } = await setup();
    const input = native('clear');
    await focus(input);
    const button = clearOf('clear') as HTMLElement;
    // A pointer press does not move focus off the input.
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    button.dispatchEvent(down);
    expect(down.defaultPrevented).toBe(true);
    button.focus();
    button.click();
    await settle();
    expect(input.value).toBe('');
    expect(host.team()).toBe('');
    expect(host.heard()).toBe(1);
    expect(document.activeElement).toBe(input);
    expect(box('clear').hasAttribute('data-empty')).toBe(true);
    expect(clearOf('clear')).toBeNull();
  });

  it('clears on Escape outside a dialog, and leaves Escape to a dialog', async () => {
    const { fixture, host, native, focus, key } = await setup();
    const input = native('clear');
    await focus(input);
    const escape = await key(input, 'Escape');
    expect(escape.defaultPrevented).toBe(true);
    expect(input.value).toBe('');

    host.dialogOpen.set(true);
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const inDialog = (document.querySelector('[data-t="dialog"]') as HTMLElement).querySelector('input') as HTMLInputElement;
    await focus(inDialog);
    const second = await key(inDialog, 'Escape');
    expect(second.type).toBe('keydown');
    expect(inDialog.value).toBe('Spring');
    // The dialog took the key and closed.
    expect(host.dialogOpen()).toBe(false);
  });

  it('draws no clear button when read only', async () => {
    const { native, clearOf, focus } = await setup();
    await focus(native('readonly'));
    expect(clearOf('readonly')).toBeNull();
  });

  it('names the clear button in Arabic under an Arabic theme, and takes clearLabel', async () => {
    const { native, clearOf, focus } = await setup();
    await focus(native('arabic'));
    expect(clearOf('arabic')?.getAttribute('aria-label')).toBe(inputClearLabels.ar);
    await focus(native('label'));
    expect(clearOf('label')?.getAttribute('aria-label')).toBe('Clear email');
  });
});
