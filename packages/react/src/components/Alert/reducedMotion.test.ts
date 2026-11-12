// Review note B2 (round 1): the reduced form of a CSS interaction must apply
// under the page's own setting (data-motion="reduce" on the root) as well as
// under the media query. For every component CSS file of the feedback family
// of order 1.22: each selector inside a prefers-reduced-motion block has a
// twin rule scoped by :root[data-motion='reduce'].
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const family = [
  'Accordion', 'Alert', 'Avatar', 'AvatarGroup', 'Badge', 'Banner', 'Callout', 'Card', 'DescriptionList', 'EmptyState', 'ErrorState', 'Kbd', 'Meter',
  'NotificationCenter', 'ProgressBar', 'ProgressCircle', 'ResizablePanels', 'ScrollArea', 'Skeleton', 'Spinner', 'SplitView', 'Stat', 'StatusDot', 'Tile', 'Toast',
];

const dir = new URL('../../../../css/src/components/', import.meta.url);

/** The body of each `@media (prefers-reduced-motion: reduce)` block. */
function mediaBlocks(css: string): string[] {
  const out: string[] = [];
  let at = css.indexOf('@media (prefers-reduced-motion: reduce)');
  while (at >= 0) {
    let i = css.indexOf('{', at) + 1;
    let depth = 1;
    const start = i;
    while (depth > 0 && i < css.length) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') depth -= 1;
      i += 1;
    }
    out.push(css.slice(start, i - 1));
    at = css.indexOf('@media (prefers-reduced-motion: reduce)', i);
  }
  return out;
}

/** The declarations each media block sets, as property: value pairs. */
function declarations(block: string): string[] {
  return [...block.matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map((m) => `${m[1]}: ${m[2]?.trim()}`);
}

describe('reduced motion applies under the media query and under data-motion="reduce" (review note B2)', () => {
  for (const name of family) {
    const css = readFileSync(new URL(`${name}.css`, dir), 'utf8');
    const blocks = mediaBlocks(css);
    if (blocks.length === 0) continue;
    it(`${name}.css`, () => {
      const attr = css.slice(css.indexOf(":root[data-motion='reduce']"));
      expect(css.includes(":root[data-motion='reduce']"), `${name} has a data-motion rule`).toBe(true);
      for (const decl of blocks.flatMap(declarations)) expect(attr, `${name}: ${decl}`).toContain(decl);
    });
  }
});

// The lead's rule of order 1.22 (after axe found List text below contrast mid
// stagger): a staggered part is at full opacity by 30% of its run, and no CSS
// stagger delay passes duration.base (120ms).
describe('staggered parts are readable early', () => {
  const staggered: Record<string, string[]> = {
    Alert: ['ds-alert-in', 'ds-alert-icon-in', 'ds-alert-text-in'],
    Banner: ['ds-banner-in', 'ds-banner-icon-in', 'ds-banner-text-in'],
    Callout: ['ds-callout-in', 'ds-callout-icon-in', 'ds-callout-text-in'],
    Toast: ['ds-toast-in', 'ds-toast-icon-in'],
    EmptyState: ['ds-empty-state-art', 'ds-empty-state-text'],
    ErrorState: ['ds-error-state-in', 'ds-error-state-art', 'ds-error-state-text'],
    Accordion: ['ds-accordion-child'],
  };
  for (const [name, frames] of Object.entries(staggered)) {
    it(`${name}.css`, () => {
      const css = readFileSync(new URL(`${name}.css`, dir), 'utf8');
      for (const f of frames) expect(css, `${name} ${f}`).toMatch(new RegExp(`@keyframes ${f} \\{[^@]*?30% \\{\\s*opacity: 1;`));
      for (const m of css.matchAll(/animation-delay: ([^;]+);/g)) expect(m[1], `${name} delay`).toMatch(/^min\(.*var\(--ds-duration-base\)\)$/);
    });
  }
});
