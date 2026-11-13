// Orders 1.22 and 1.23 motion of RadioCard: radio-card-lift is CSS
// (RadioCard.css). Since order 1.23 the indicator holds the badge part, an
// aria-hidden svg check drawn with stroke-dashoffset, as in React; without it
// the indicator falls back to the radial dot.
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { DsRadioCard, DsRadioCardItem } from './radio-card';

@Component({
  imports: [DsRadioCard, DsRadioCardItem],
  template: `
    <div dsRadioCard aria-label="Plan" defaultValue="team">
      <button dsRadioCardItem value="solo" title="Solo" description="One seat" end="$12"></button>
      <button dsRadioCardItem value="team" title="Team" description="Five seats" end="$48"></button>
    </div>
  `,
})
class Host {}

describe('radio card motion, order 1.22', () => {
  it('radio-card-lift: each indicator holds the badge svg, aria-hidden, with one check stroke', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const indicators = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("[data-part='indicator']"));
    expect(indicators).toHaveLength(2);
    for (const indicator of indicators) {
      expect(indicator.children).toHaveLength(1);
      const badge = indicator.firstElementChild;
      expect(badge?.tagName.toLowerCase()).toBe('svg');
      expect(badge?.getAttribute('data-part')).toBe('badge');
      expect(badge?.getAttribute('aria-hidden')).toBe('true');
      expect(badge?.getAttribute('focusable')).toBe('false');
      expect(badge?.getAttribute('viewBox')).toBe('0 0 16 16');
      const paths = badge?.querySelectorAll('path') ?? [];
      expect(paths).toHaveLength(1);
      expect(paths[0]?.getAttribute('d')).toBe('M4.5 8.25 7 10.75 11.5 5.5');
      expect(paths[0]?.getAttribute('pathLength')).toBe('1');
    }
  });
});
