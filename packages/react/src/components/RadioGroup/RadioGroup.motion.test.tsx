// Order 1.22 motion of RadioGroup (radio-pop) and RadioCard (radio-card-lift), with the review fixes B1 and B2.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RadioCard, RadioCardItem } from '../RadioCard';

const read = (name: string) => readFileSync(join(process.cwd(), `packages/css/src/components/${name}.css`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('radio-pop and radio-card-lift (order 1.22)', () => {
  it('RadioGroup: the dot lands on the bouncy spring, the circle dips, the ring shows at once', () => {
    const css = read('RadioGroup');
    expect(css).toMatch(/transform: scale\(var\(--_radio-group-dot-from\)\);/);
    expect(css).toMatch(/transform var\(--ds-duration-spring-bouncy\) var\(--ds-ease-spring-bouncy\)/);
    const ring = css.slice(css.indexOf("[data-ds='radio-group'] [data-part='control']::before {"));
    expect(ring.slice(0, ring.indexOf('}'))).not.toMatch(/transition/);
    expect(css).toMatch(/:root\[data-motion='reduce'\] \[data-ds='radio-group'\] \{\s*--_radio-group-press-scale: 1;/);
  });

  it('RadioCard: the chosen card lifts, its dot is a decorative layer, the reduced form holds under the page setting', () => {
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
    const dot = container.querySelector("[data-part='indicator'] > span");
    expect(dot?.getAttribute('aria-hidden')).toBe('true');
    expect(dot?.hasAttribute('data-part')).toBe(false);
  });
});
