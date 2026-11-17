// Order M9.3 on Angular: Select emphasis. outline is the default look and
// ghost the pop-up button; data-emphasis is stamped only when set.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsSelect, type SelectItem } from './select';

@Component({
  imports: [DsSelect],
  template: `
    <button data-t="unset" dsSelect aria-label="Sort by" [items]="items"></button>
    <button data-t="outline" dsSelect emphasis="outline" aria-label="Sort by" [items]="items"></button>
    <button data-t="ghost" dsSelect emphasis="ghost" aria-label="Sort by" [items]="items" defaultValue="name"></button>
  `,
})
class Host {
  readonly items: SelectItem[] = [
    { value: 'name', label: 'Name' },
    { value: 'edited', label: 'Last edited' },
  ];
}

describe('DsSelect emphasis (order M9.3)', () => {
  it('stamps data-emphasis only when passed, with the same parts', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const q = (id: string) => fixture.nativeElement.querySelector(`[data-t="${id}"]`) as HTMLElement;
    expect(q('unset').hasAttribute('data-emphasis')).toBe(false);
    expect(q('outline').getAttribute('data-emphasis')).toBe('outline');
    const ghost = q('ghost');
    expect(ghost.getAttribute('data-emphasis')).toBe('ghost');
    expect(ghost.hasAttribute('emphasis')).toBe(false);
    expect(ghost.getAttribute('role')).toBe('combobox');
    expect(Array.from(ghost.children).map((el) => el.getAttribute('data-part'))).toEqual(['value', 'icon']);
    expect(ghost.querySelector('[data-part="value"]')?.textContent).toBe('Name');
  });
});
