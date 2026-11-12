import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import StatusDotDemo from './status-dot.demo';
import { DsStatusDot } from './status-dot';

@Component({
  imports: [DsStatusDot],
  template: `
    <span id="plain" dsStatusDot label="Online"></span>
    <span id="full" dsStatusDot label="Syncing" tone="info" size="sm" pulse hideLabel></span>
    <span id="spread" dsStatusDot label="Online" role="status"></span>
    <ng-template #rich><strong>Away</strong></ng-template>
    <span id="tpl" dsStatusDot [label]="rich"></span>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
}

describe('DsStatusDot', () => {
  it('renders the anatomy and the default axes', async () => {
    const el = (await setup())('plain');
    expect(el.getAttribute('data-ds')).toBe('status-dot');
    expect(el.getAttribute('data-tone')).toBe('neutral');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.hasAttribute('data-pulse')).toBe(false);
    expect(el.hasAttribute('data-hide-label')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['dot', 'label']);
    expect(el.querySelector('[data-part="dot"]')?.getAttribute('aria-hidden')).toBe('true');
    expect(el.textContent).toBe('Online');
  });

  it('sets tone, size, pulse and hidden label, and leaves no input attribute', async () => {
    const el = (await setup())('full');
    expect(el.getAttribute('data-tone')).toBe('info');
    expect(el.getAttribute('data-size')).toBe('sm');
    expect(el.getAttribute('data-pulse')).toBe('');
    expect(el.getAttribute('data-hide-label')).toBe('');
    for (const name of ['dsstatusdot', 'label', 'tone', 'size', 'pulse', 'hidelabel']) expect(el.hasAttribute(name)).toBe(false);
  });

  it('keeps other attributes and takes a template label', async () => {
    const q = await setup();
    expect(q('spread').getAttribute('role')).toBe('status');
    expect(q('tpl').querySelector('[data-part="label"] strong')?.textContent).toBe('Away');
  });

  it('demo renders its cases with a label on every dot', async () => {
    const fixture = TestBed.createComponent(StatusDotDemo);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const dots = root.querySelectorAll('[data-ds="status-dot"]');
    expect(dots.length).toBeGreaterThan(10);
    dots.forEach((d) => expect(d.querySelector('[data-part="label"]')?.textContent?.length).toBeGreaterThan(0));
    const ids = [...root.querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading', 'error']);
  });
});
