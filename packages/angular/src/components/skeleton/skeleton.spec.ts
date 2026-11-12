import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import SkeletonDemo from './skeleton.demo';
import { DsSkeleton } from './skeleton';

@Component({
  imports: [DsSkeleton],
  template: `
    <span id="plain" dsSkeleton></span>
    <span id="circle" dsSkeleton variant="circle" [width]="48" [height]="10"></span>
    <span id="rect" dsSkeleton variant="rect" width="50%" [height]="96"></span>
    <span id="text" dsSkeleton size="lg" [height]="20" style="margin: 0px;"></span>
    <span id="shown" dsSkeleton aria-hidden="false"></span>
  `,
})
class Host {}

async function setup() {
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  return (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement;
}

describe('DsSkeleton', () => {
  it('renders a hidden text line with the default size', async () => {
    const el = (await setup())('plain');
    expect(el.getAttribute('data-ds')).toBe('skeleton');
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-variant')).toBe('text');
    expect(el.getAttribute('data-size')).toBe('md');
    expect(el.children.length).toBe(0);
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('drops data-size for circle and rect, and a circle ignores height', async () => {
    const q = await setup();
    expect(q('circle').hasAttribute('data-size')).toBe(false);
    expect(q('rect').hasAttribute('data-size')).toBe(false);
    expect(q('circle').style.getPropertyValue('--_skeleton-width')).toBe('48px');
    expect(q('circle').style.getPropertyValue('--_skeleton-height')).toBe('');
  });

  it('turns width and height into private properties, numbers as px', async () => {
    const el = (await setup())('rect');
    expect(el.style.getPropertyValue('--_skeleton-width')).toBe('50%');
    expect(el.style.getPropertyValue('--_skeleton-height')).toBe('96px');
    for (const name of ['dsskeleton', 'variant', 'width', 'height']) expect(el.hasAttribute(name)).toBe(false);
  });

  it('ignores height on a text line and keeps a caller style', async () => {
    const el = (await setup())('text');
    expect(el.getAttribute('data-size')).toBe('lg');
    expect(el.style.getPropertyValue('--_skeleton-height')).toBe('');
    expect(el.style.margin).toBe('0px');
  });

  it('stays hidden even when a caller passes aria-hidden false', async () => {
    expect((await setup())('shown').getAttribute('aria-hidden')).toBe('true');
  });

  it('demo wraps its skeletons in busy containers with a status line outside', async () => {
    const fixture = TestBed.createComponent(SkeletonDemo);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const ids = [...root.querySelectorAll('[data-demo-case]')].map((c) => c.getAttribute('data-demo-case'));
    expect(ids).toEqual(['variants', 'one', 'many', 'too-many', 'long-text', 'long-arabic', 'loading']);
    root.querySelectorAll('[data-ds="skeleton"]').forEach((s) => expect(s.closest('[aria-busy="true"]')).not.toBeNull());
    root.querySelectorAll('[aria-busy="true"]').forEach((b) => {
      const status = b.parentElement?.querySelector(':scope > [role="status"]');
      expect(status?.textContent?.length).toBeGreaterThan(0);
    });
  });
});
