import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsFloatingActionButton } from './floating-action-button';

@Component({
  imports: [DsFloatingActionButton],
  template: `
    <button id="plain" dsFloatingActionButton icon="plus" label="Create board"></button>
    <button id="extended" dsFloatingActionButton icon="plus" label="Create board" extended size="md" position="absolute" tone="danger"></button>
    <button id="loading" dsFloatingActionButton icon="send" label="Send message" loading></button>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
}

describe('DsFloatingActionButton', () => {
  it('defaults: lg, accent, solid, fixed, icon only with aria-label', async () => {
    const q = await setup();
    const el = q('plain');
    expect(el.getAttribute('data-ds')).toBe('floating-action-button');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.getAttribute('data-tone')).toBe('accent');
    expect(el.getAttribute('data-emphasis')).toBe('solid');
    expect(el.getAttribute('data-position')).toBe('fixed');
    expect(el.getAttribute('aria-label')).toBe('Create board');
    expect(el.hasAttribute('data-extended')).toBe(false);
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon']);
  });

  it('extended shows the label and drops aria-label', async () => {
    const q = await setup();
    const el = q('extended');
    expect(el.getAttribute('data-extended')).toBe('');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.getAttribute('data-position')).toBe('absolute');
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.hasAttribute('aria-label')).toBe(false);
    expect(el.querySelector('[data-part="label"]')?.textContent).toBe('Create board');
  });

  it('loading renders the spinner and the status', async () => {
    const q = await setup();
    const el = q('loading');
    expect(el.getAttribute('aria-busy')).toBe('true');
    expect(Array.from(el.children).map((c) => c.getAttribute('data-part'))).toEqual(['icon', 'spinner', 'status']);
  });
});
