import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import { DsRadioGroup, DsRadioGroupItem } from './radio-group';

@Component({
  imports: [DsRadioGroup, DsRadioGroupItem, DsTheme, ReactiveFormsModule, FormsModule],
  template: `
    <div data-test="plain" dsRadioGroup label="Board view" description="Applies to new boards." error="Pick a view." required size="lg" tone="accent" orientation="horizontal">
      <div dsRadioGroupItem value="grid" label="Grid"></div>
      <div dsRadioGroupItem value="list" label="List" description="One board per line."></div>
    </div>
    <div data-test="bound" dsRadioGroup label="Notify me about" [(value)]="notify">
      <div dsRadioGroupItem value="all" label="All activity"></div>
      <div dsRadioGroupItem value="mentions" label="Mentions"></div>
      <div dsRadioGroupItem value="off" label="Off" disabled></div>
      <div dsRadioGroupItem value="none" label="Nothing"></div>
    </div>
    <div dsTheme dir="rtl">
      <div data-test="rtl" dsRadioGroup label="عرض اللوحة" defaultValue="grid">
        <div dsRadioGroupItem value="grid" label="شبكة"></div>
        <div dsRadioGroupItem value="list" label="قائمة"></div>
      </div>
    </div>
    <div data-test="noloop" dsRadioGroup aria-label="Plan" [loop]="false" defaultValue="b">
      <div dsRadioGroupItem value="a" label="A"></div>
      <div dsRadioGroupItem value="b" label="B"></div>
    </div>
    <div data-test="hidden" dsRadioGroup label="Plan" error="Pick one." [invalid]="false">
      <div dsRadioGroupItem value="a" label="A"></div>
    </div>
    <div data-test="disabled" dsRadioGroup label="Role" disabled defaultValue="editor">
      <div dsRadioGroupItem value="viewer" label="Viewer"></div>
      <div dsRadioGroupItem value="editor" label="Editor"></div>
    </div>
    <div data-test="reactive" dsRadioGroup label="Region" [formControl]="region">
      <div dsRadioGroupItem value="me" label="Middle East"></div>
      <div dsRadioGroupItem value="eu" label="Europe"></div>
    </div>
    <div data-test="template" dsRadioGroup label="Period" [(ngModel)]="period">
      <div dsRadioGroupItem value="monthly" label="Monthly"></div>
      <div dsRadioGroupItem value="yearly" label="Yearly"></div>
    </div>
    <form>
      <div data-test="inform" dsRadioGroup label="Format" name="format" required defaultValue="png">
        <div dsRadioGroupItem value="png" label="PNG"></div>
        <div dsRadioGroupItem value="pdf" label="PDF"></div>
      </div>
    </form>
  `,
})
class Host {
  readonly notify = signal<string | undefined>('mentions');
  readonly region = new FormControl<string>('eu', { nonNullable: true });
  period = 'monthly';
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const root = (id: string) => fixture.nativeElement.querySelector(`[data-test="${id}"]`) as HTMLElement;
  const radios = (id: string) => Array.from(root(id).querySelectorAll<HTMLButtonElement>('[data-part="control"]'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const key = (el: HTMLElement, k: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    el.dispatchEvent(event);
    return event;
  };
  return { fixture, host: fixture.componentInstance, root, radios, settle, key };
}

describe('DsRadioGroup', () => {
  it('renders the Radix root: role radiogroup, the axes, the legend, description, items and error', async () => {
    const { root, radios } = await setup();
    const el = root('plain');
    expect(el.getAttribute('data-ds')).toBe('radio-group');
    expect(el.getAttribute('role')).toBe('radiogroup');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-required')).toBe('true');
    expect(el.getAttribute('aria-invalid')).toBe('true');
    expect(el.hasAttribute('data-invalid')).toBe(true);
    expect(el.getAttribute('dir')).toBe('ltr');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.style.outlineStyle).toBe('none');
    for (const name of ['dsradiogroup', 'label', 'description', 'error', 'required', 'size', 'tone', 'orientation']) {
      expect(el.hasAttribute(name)).toBe(false);
    }
    const legend = el.querySelector('[data-part="legend"]') as HTMLElement;
    expect(el.getAttribute('aria-labelledby')).toBe(legend.id);
    expect(legend.querySelector('[data-part="required"]')?.getAttribute('aria-hidden')).toBe('true');
    const ids = (el.getAttribute('aria-describedby') ?? '').split(' ');
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual(['Applies to new boards.', 'Pick a view.']);
    expect(el.querySelector('[data-part="error"] svg[data-icon="danger"]')).not.toBeNull();
    expect(el.querySelectorAll('[data-part="items"] > [data-part="item"]')).toHaveLength(2);
    const [grid, list] = radios('plain');
    expect(grid?.getAttribute('role')).toBe('radio');
    expect(grid?.getAttribute('type')).toBe('button');
    expect(grid?.getAttribute('aria-checked')).toBe('false');
    expect(grid?.getAttribute('value')).toBe('grid');
    expect(grid?.getAttribute('tabindex')).toBe('-1');
    expect(grid?.hasAttribute('data-radix-collection-item')).toBe(true);
    expect(grid?.querySelector('[data-part="indicator"]')?.getAttribute('data-state')).toBe('unchecked');
    expect(el.querySelector(`label[for="${grid?.id}"]`)?.textContent).toBe('Grid');
    expect(document.getElementById(list?.getAttribute('aria-describedby') ?? '')?.textContent).toBe('One board per line.');
    expect(el.querySelector('[data-part="item"]')?.hasAttribute('data-invalid')).toBe(true);
  });

  it('hides the error and the invalid state when invalid is false', async () => {
    const { root } = await setup();
    expect(root('hidden').querySelector('[data-part="error"]')).toBeNull();
    expect(root('hidden').hasAttribute('data-invalid')).toBe(false);
  });

  it('selects on click and on the label, and writes the model back', async () => {
    const { host, root, radios, settle } = await setup();
    const [all] = radios('bound');
    all?.click();
    await settle();
    expect(host.notify()).toBe('all');
    expect(all?.getAttribute('aria-checked')).toBe('true');
    expect(all?.closest('[data-part="item"]')?.getAttribute('data-state')).toBe('checked');
    (root('bound').querySelectorAll('label')[3] as HTMLLabelElement).click();
    await settle();
    expect(host.notify()).toBe('none');
    host.notify.set('mentions');
    await settle();
    expect(radios('bound')[1]?.getAttribute('aria-checked')).toBe('true');
  });

  it('keyboard focus on the root moves on to the checked item, which becomes the tab stop', async () => {
    const { root, radios, settle } = await setup();
    root('bound').focus();
    await settle();
    const mentions = radios('bound')[1];
    expect(document.activeElement).toBe(mentions);
    expect(mentions?.getAttribute('tabindex')).toBe('0');
  });

  it('arrows move and select, skip disabled items and wrap; Enter does nothing; Home moves without selecting', async () => {
    const { host, radios, settle, key } = await setup();
    const [all, mentions, , none] = radios('bound');
    mentions?.focus();
    expect(key(mentions as HTMLElement, 'ArrowDown').defaultPrevented).toBe(true);
    await settle();
    expect(document.activeElement).toBe(none);
    expect(host.notify()).toBe('none');
    key(none as HTMLElement, 'ArrowRight');
    await settle();
    expect(document.activeElement).toBe(all);
    expect(host.notify()).toBe('all');
    key(all as HTMLElement, 'ArrowUp');
    await settle();
    expect(host.notify()).toBe('none');
    key(none as HTMLElement, 'ArrowLeft');
    await settle();
    expect(host.notify()).toBe('mentions');
    expect(key(mentions as HTMLElement, 'Enter').defaultPrevented).toBe(true);
    key(mentions as HTMLElement, 'Home');
    await settle();
    expect(document.activeElement).toBe(all);
    expect(host.notify()).toBe('mentions');
    const ctrl = key(all as HTMLElement, 'ArrowDown', { ctrlKey: true });
    expect(ctrl.defaultPrevented).toBe(false);
  });

  it('follows the reading direction: ArrowLeft moves to the next item in right to left', async () => {
    const { root, radios, settle, key } = await setup();
    expect(root('rtl').getAttribute('dir')).toBe('rtl');
    const [grid, list] = radios('rtl');
    grid?.focus();
    key(grid as HTMLElement, 'ArrowLeft');
    await settle();
    expect(document.activeElement).toBe(list);
    expect(list?.getAttribute('aria-checked')).toBe('true');
  });

  it('without loop the arrows stop at the ends', async () => {
    const { radios, settle, key } = await setup();
    const [, b] = radios('noloop');
    b?.focus();
    key(b as HTMLElement, 'ArrowDown');
    await settle();
    expect(document.activeElement).toBe(b);
  });

  it('Shift+Tab takes the root out of the tab order until focus leaves', async () => {
    const { root, radios, key } = await setup();
    const [, mentions] = radios('bound');
    mentions?.focus();
    key(mentions as HTMLElement, 'Tab', { shiftKey: true });
    expect(root('bound').getAttribute('tabindex')).toBe('-1');
    mentions?.blur();
    expect(root('bound').getAttribute('tabindex')).toBe('0');
  });

  it('disabled sets native disabled on every control and takes the root out of the tab order', async () => {
    const { root, radios } = await setup();
    expect(root('disabled').hasAttribute('data-disabled')).toBe(true);
    expect(root('disabled').hasAttribute('disabled')).toBe(false);
    expect(root('disabled').getAttribute('tabindex')).toBe('-1');
    for (const radio of radios('disabled')) {
      expect(radio.disabled).toBe(true);
      expect(radio.closest('[data-part="item"]')?.hasAttribute('data-disabled')).toBe(true);
    }
    const off = radios('bound')[2];
    expect(off?.disabled).toBe(true);
    expect(radios('bound')[0]?.disabled).toBe(false);
  });

  it('works with a reactive form control, both ways, and with its disabled state', async () => {
    const { host, radios, settle } = await setup();
    expect(radios('reactive')[1]?.getAttribute('aria-checked')).toBe('true');
    radios('reactive')[0]?.click();
    await settle();
    expect(host.region.value).toBe('me');
    host.region.setValue('eu');
    await settle();
    expect(radios('reactive')[1]?.getAttribute('aria-checked')).toBe('true');
    host.region.disable();
    await settle();
    expect(radios('reactive')[0]?.disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { host, radios, settle } = await setup();
    await settle();
    expect(radios('template')[0]?.getAttribute('aria-checked')).toBe('true');
    radios('template')[1]?.click();
    await settle();
    expect(host.period).toBe('yearly');
  });

  it('inside a form, a hidden native radio after each control carries the name and value', async () => {
    const { root, radios, settle } = await setup();
    await settle();
    const inputs = Array.from(root('inform').querySelectorAll<HTMLInputElement>('input[type="radio"]'));
    expect(inputs).toHaveLength(2);
    const [png, pdf] = inputs;
    expect(png?.previousElementSibling).toBe(radios('inform')[0]);
    expect(png?.getAttribute('aria-hidden')).toBe('true');
    expect(png?.tabIndex).toBe(-1);
    expect(png?.name).toBe('format');
    expect(png?.value).toBe('png');
    expect(png?.required).toBe(true);
    expect(png?.checked).toBe(true);
    expect(png?.hasAttribute('checked')).toBe(true);
    radios('inform')[1]?.click();
    await settle();
    expect(pdf?.checked).toBe(true);
    expect(root('plain').querySelector('input')).toBeNull();
  });

  it('dispatches a click on the hidden radio after a pick, as Radix, so a form sees the change', async () => {
    const { fixture, radios, settle } = await setup();
    await settle();
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const seen: string[] = [];
    form.addEventListener('click', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.type === 'radio') seen.push(`${t.value}:${t.checked}`);
    });
    radios('inform')[1]?.click();
    await settle();
    expect(seen).toContain('pdf:true');
    expect(seen).toContain('png:false');
    seen.length = 0;
    await settle();
    expect(seen).toEqual([]);
  });
});
