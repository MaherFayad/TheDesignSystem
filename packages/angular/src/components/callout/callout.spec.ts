import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsTheme } from '../../theme/theme';
import CalloutDemo from './callout.demo';
import { DsCallout } from './callout';

@Component({
  imports: [DsCallout, DsTheme],
  template: `
    <div id="plain" dsCallout title="Boards keep their history">Every change is kept.</div>
    <div id="bare" dsCallout tone="accent">Press the slash key.</div>
    <aside id="aside" dsCallout emphasis="outline" title="Related"></aside>
    <div dsTheme [lang]="'ar'"><div id="ar" dsCallout tone="danger">نص</div></div>
    <div id="word" dsCallout toneLabel="Heads up">Text</div>
    <ng-template #mark><span>!</span></ng-template>
    <div id="node" dsCallout tone="warning" [icon]="mark">Text</div>
    <div id="named" dsCallout aria-label="Keyboard tip" title="Tip">Text</div>
    <div dsCallout [id]="'tip'" title="Tip">Text</div>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
}
const parts = (el: Element) => Array.from(el.children).map((c) => c.getAttribute('data-part'));

describe('DsCallout', () => {
  it('renders a note with the anatomy and the default axes', async () => {
    const el = (await setup())('plain');
    expect(el.getAttribute('data-ds')).toBe('callout');
    expect(el.getAttribute('role')).toBe('note');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-emphasis')).toBe('soft');
    expect(el.hasAttribute('title')).toBe(false);
    expect(parts(el)).toEqual(['icon', 'title', 'body']);
  });

  it('is named by the tone word and the title, or the tone word alone', async () => {
    const q = await setup();
    const el = q('plain');
    const [iconId, titleId] = (el.getAttribute('aria-labelledby') ?? '').split(' ');
    expect(el.querySelector(`[id="${iconId}"]`)?.getAttribute('aria-label')).toBe('Note');
    expect(el.querySelector(`[id="${titleId}"]`)?.textContent).toBe('Boards keep their history');
    const bare = q('bare');
    expect(parts(bare)).toEqual(['icon', 'body']);
    const only = bare.getAttribute('aria-labelledby') ?? '';
    expect(only.split(' ').length).toBe(1);
    expect(bare.querySelector(`[id="${only}"]`)?.getAttribute('aria-label')).toBe('Tip');
  });

  it('renders an aside landmark with no role, and leaves out an empty body', async () => {
    const el = (await setup())('aside');
    expect(el.tagName).toBe('ASIDE');
    expect(el.hasAttribute('role')).toBe(false);
    expect(el.getAttribute('data-emphasis')).toBe('outline');
    expect(parts(el)).toEqual(['icon', 'title']);
  });

  it('says the tone word in Arabic, takes a custom word, and keeps it on a template icon', async () => {
    const q = await setup();
    expect(q('ar').querySelector('svg')?.getAttribute('aria-label')).toBe('تحذير');
    expect(q('word').querySelector('svg')?.getAttribute('aria-label')).toBe('Heads up');
    const part = q('node').querySelector('[data-part="icon"]');
    expect(part?.getAttribute('role')).toBe('img');
    expect(part?.getAttribute('aria-label')).toBe('Warning');
  });

  it('an aria-label wins over the generated name, and a given id names the parts', async () => {
    const q = await setup();
    expect(q('named').hasAttribute('aria-labelledby')).toBe(false);
    expect(q('named').getAttribute('aria-label')).toBe('Keyboard tip');
    const fixed = q('tip');
    expect(fixed.getAttribute('id')).toBe('tip');
    expect(fixed.getAttribute('aria-labelledby')).toBe('tip-icon tip-title');
  });

  it('renders the demo with every case it applies to', async () => {
    const fixture = TestBed.createComponent(CalloutDemo);
    await fixture.whenStable();
    const ids = [...(fixture.nativeElement as HTMLElement).querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'empty', 'one', 'many', 'too-many', 'long-text', 'long-arabic']);
  });
});
