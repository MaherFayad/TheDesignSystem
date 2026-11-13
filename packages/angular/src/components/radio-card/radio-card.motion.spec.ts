// Order 1.22 motion of RadioCard: radio-card-lift is CSS (RadioCard.css). The
// dot that pops in is an unnamed aria-hidden span inside the indicator, as in
// React; without it the dot falls back to the round 1 look.
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
  it('radio-card-lift: each indicator holds the dot span, unnamed and aria-hidden', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const indicators = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll("[data-part='indicator']"));
    expect(indicators).toHaveLength(2);
    for (const indicator of indicators) {
      expect(indicator.children).toHaveLength(1);
      expect(indicator.firstElementChild?.tagName).toBe('SPAN');
      expect(indicator.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
      expect(indicator.firstElementChild?.hasAttribute('data-part')).toBe(false);
    }
  });
});
