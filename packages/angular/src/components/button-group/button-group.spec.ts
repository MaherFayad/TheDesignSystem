import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsButton } from '../button/button';
import { DsIconButton } from '../icon-button/icon-button';
import { DsButtonGroup } from './button-group';

@Component({
  imports: [DsButtonGroup, DsButton, DsIconButton],
  template: `
    <div id="group" dsButtonGroup attached [size]="size()" emphasis="outline" shape="pill" aria-label="Page actions">
      <button id="child" dsButton>Save draft</button>
      <span><button id="wrapped" dsButton>Preview page</button></span>
      <button id="own" dsButton size="xs" emphasis="solid" shape="square">Share board</button>
      <button id="icon" dsIconButton icon="more" label="Open more actions"></button>
    </div>
    <div id="plain" dsButtonGroup aria-labelledby="heading"><button id="alone" dsButton>Copy link</button></div>
    <button id="outside" dsButton>Export kit</button>
  `,
})
class Host {
  readonly size = signal<'sm' | 'lg'>('sm');
}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const q = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
  return { fixture, host: fixture.componentInstance, q };
}

describe('DsButtonGroup', () => {
  it('renders role group with the data attributes and keeps the native name', async () => {
    const { q } = await setup();
    const el = q('group');
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('data-ds')).toBe('button-group');
    expect(el.getAttribute('data-attached')).toBe('');
    expect(el.getAttribute('data-orientation')).toBe('horizontal');
    expect(el.getAttribute('aria-label')).toBe('Page actions');
    expect(el.hasAttribute('dsbuttongroup')).toBe(false);
    const plain = q('plain');
    expect(plain.getAttribute('data-size')).toBe('md');
    expect(plain.hasAttribute('data-emphasis')).toBe(false);
    expect(plain.hasAttribute('data-attached')).toBe(false);
  });

  it('passes size, emphasis and shape to children, also through a wrapper', async () => {
    const { q } = await setup();
    for (const id of ['child', 'wrapped']) {
      expect(q(id).getAttribute('data-size')).toBe('sm');
      expect(q(id).getAttribute('data-emphasis')).toBe('outline');
      expect(q(id).getAttribute('data-shape')).toBe('pill');
    }
    expect(q('icon').getAttribute('data-emphasis')).toBe('outline');
  });

  it("a child's own input wins, and nothing leaks outside the group", async () => {
    const { q } = await setup();
    expect(q('own').getAttribute('data-size')).toBe('xs');
    expect(q('own').getAttribute('data-emphasis')).toBe('solid');
    expect(q('own').getAttribute('data-shape')).toBe('square');
    expect(q('alone').getAttribute('data-emphasis')).toBe('soft');
    expect(q('outside').getAttribute('data-size')).toBe('md');
  });

  it('follows a change of the group axes', async () => {
    const { fixture, host, q } = await setup();
    host.size.set('lg');
    await fixture.whenStable();
    expect(q('child').getAttribute('data-size')).toBe('lg');
  });
});
