// Order 1.22 motion of RadioGroup (radio-pop) and RadioCard (radio-card-lift), with the review fixes B1 and B2.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadioCard, RadioCardItem } from '../RadioCard';

const read = (name: string) => readFileSync(join(process.cwd(), `packages/css/src/components/${name}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('radio-pop and radio-card-lift (order 1.22)', () => {
  it('RadioGroup: the fill closes in, the dot lands on the bouncy spring from the old option, the ring shows at once (order 1.23)', () => {
    const css = read('RadioGroup');
    expect(css).toMatch(/scale\(var\(--_radio-group-dot-from\)\);/);
    expect(css).toMatch(/transform calc\(var\(--ds-duration-spring-bouncy\) \* var\(--_radio-group-motion\)\) var\(--_radio-group-dot-ease\)/);
    expect(css).toMatch(/--_radio-group-dot-ease: var\(--ds-ease-spring-bouncy\);/);
    expect(css).toMatch(/box-shadow: inset 0 0 0 var\(--_radio-group-fill-now\) var\(--_radio-group-bg-checked\);/);
    // The travel: hidden dots lean toward the checked option, by sibling selectors.
    expect(css).toMatch(/\[data-part='item'\]:has\(~ \[data-part='item'\]\[data-state='checked'\]\) \{\s*--_radio-group-side: 1;/);
    expect(css).toMatch(/\[data-part='item'\]\[data-state='checked'\] ~ \[data-part='item'\] \{\s*--_radio-group-side: -1;/);
    const ring = css.slice(css.indexOf("[data-ds='radio-group'] [data-part='control']::before {"));
    expect(ring.slice(0, ring.indexOf('}'))).not.toMatch(/transition/);
    expect(css).toMatch(/:root\[data-motion='reduce'\] \[data-ds='radio-group'\] \{\s*--_radio-group-press-scale: 1;/);
  });

  it('RadioCard: the chosen card lifts, its badge check is a decorative drawn stroke, the reduced form holds under the page setting', () => {
    const css = read('RadioCard');
    expect(css).toMatch(/--_radio-card-lift-now: var\(--_radio-card-lift\);/);
    expect(css).toMatch(/:root\[data-motion='reduce'\] \[data-ds='radio-card'\] \{\s*--_radio-card-lift: 0px;/);
    const ring = css.slice(css.indexOf("[data-ds='radio-card'] > [data-part='item']::before {"));
    expect(ring.slice(0, ring.indexOf('}'))).not.toMatch(/transition/);
    const { container } = render(
      <RadioCard aria-label="Plan" defaultValue="a">
        <RadioCardItem value="a" title="Solo" />
      </RadioCard>,
    );
    const badge = container.querySelector("[data-part='indicator'] > [data-part='badge']");
    expect(badge?.getAttribute('aria-hidden')).toBe('true');
    expect(badge?.querySelector('path')?.getAttribute('pathLength')).toBe('1');
    expect(css).toMatch(/stroke-dashoffset: var\(--_radio-card-check-cut\);/);
    expect(css).toMatch(/:root\[data-motion='reduce'\] \[data-ds='radio-card'\] \{[^}]*--_radio-card-motion: 0;/);
  });
});
