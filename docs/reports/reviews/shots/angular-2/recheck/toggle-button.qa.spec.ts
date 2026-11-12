// Temporary QA probe (ds-qa review angular-2, recheck of angular-1 A1 B2,
// Link B1 and N2). Copied to docs/reports/reviews/shots/angular-2/recheck/
// and removed from the package.
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsLink } from '../link/link';
import { DsButton } from '../button/button';
import { DS_TOGGLE_GROUP } from '../toggle-group/toggle-group';
import { DsToggleButton } from './toggle-button';

@Component({
  imports: [DsToggleButton, DsLink, DsButton, ...DS_TOGGLE_GROUP],
  template: `
    <button id="t2" dsToggleButton aria-label="Bold text">B</button>
    <button id="t3" dsToggleButton [attr.aria-label]="name()">B</button>
    <button id="t4" dsToggleButton icon="eye" label="Show guides" aria-label="Ignored"></button>
    <button id="t5" dsToggleButton [aria-label]="name()">B</button>
    <a id="l2" dsLink href="#a" tabindex="-1">Skip</a>
    <a id="l2d" dsLink href="#a" tabindex="-1" disabled>Skip off</a>
    <a id="l2b" dsLink href="#a" [tabIndex]="-1">Skip bound</a>
    <a id="l2c" dsLink href="#a" tabindex="-1" [tabIndex]="2">Both</a>
    <a id="l3" dsLink href="#a" aria-disabled="true">Odd</a>
    <a id="l3d" dsLink href="#a" aria-disabled="false" disabled>Off</a>
    <a id="l4" dsLink href="#a" [attr.tabindex]="-1">Bound attr tabindex</a>
    <a id="l5" dsLink href="#a" [attr.aria-disabled]="'true'">Bound attr aria-disabled</a>
    <button id="b1" dsButton [attr.aria-label]="name()">Plain button</button>
    <div id="g" dsToggleGroup type="multiple" aria-label="Style"><button id="gi" dsToggleGroupItem value="b" aria-label="Bold text">B</button><button id="gi2" dsToggleGroupItem value="i" [attr.aria-label]="name()">I</button></div>
  `,
})
class Probe {
  readonly name = signal('Bound name');
}

describe('angular-2 recheck probe', () => {
  it('prints the host attributes', async () => {
    const f = TestBed.createComponent(Probe);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    const root = f.nativeElement as HTMLElement;
    const lines: string[] = [];
    for (const id of ['t2', 't3', 't4', 't5', 'l2', 'l2d', 'l2b', 'l2c', 'l3', 'l3d', 'l4', 'l5', 'b1', 'gi', 'gi2']) {
      const el = root.querySelector(`#${id}`) as HTMLElement;
      lines.push(`${id}: ${[...el.attributes].map((a) => `${a.name}=${a.value}`).sort().join(' ')} | tabIndex=${el.tabIndex}`);
    }
    f.componentInstance.name.set('Changed name');
    f.detectChanges();
    await f.whenStable();
    lines.push(`t5 after name change: aria-label=${root.querySelector('#t5')?.getAttribute('aria-label')}`);
    expect.soft(lines.join('\n')).toBe('PRINT');
    expect(root.querySelector('#t2')?.getAttribute('aria-label')).toBe('Bold text');
    expect(root.querySelector('#l2')?.getAttribute('tabindex')).toBe('-1');
    expect(root.querySelector('#l3')?.getAttribute('aria-disabled')).toBe('true');
  });
});
