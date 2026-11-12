// Order 1.22 motion of Checkbox and the review fixes B1, B2 and N10 of order 1.21.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(join(process.cwd(), 'packages/css/src/components/Checkbox.css'), 'utf8');
const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
/** The declarations of the first rule whose selector is exactly `selector`. */
const rule = (selector: string) => {
  const at = code.indexOf(`${selector} {`);
  return at === -1 ? '' : code.slice(at, code.indexOf('}', at));
};

describe('Checkbox motion (order 1.22)', () => {
  it('B1: the focus ring layer has no transition, so the ring shows at once', () => {
    expect(rule("[data-ds='checkbox'] > [data-part='control']::before")).not.toMatch(/transition/);
  });

  it('B2: the reduced form applies under the page setting too', () => {
    expect(code).toMatch(/:root\[data-motion='reduce'\] \[data-ds='checkbox'\] \{\s*--_checkbox-press-scale: 1;\s*--_checkbox-mark-scale: 1;/);
    expect(code).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ds='checkbox'\] \{\s*--_checkbox-press-scale: 1;/);
  });

  it('N10: no raw 0s in the motion', () => {
    expect(code).not.toMatch(/\b0s\b/);
  });

  it('check-draw: the box dips while pressed, and the mark lands on the bouncy spring from scale.morph', () => {
    expect(code).toMatch(/--_checkbox-press-scale: var\(--ds-scale-anticipate\);/);
    expect(code).toMatch(/--_checkbox-duration: var\(--ds-duration-spring-bouncy\);/);
    expect(code).toMatch(/--_checkbox-ease: var\(--ds-ease-spring-bouncy\);/);
    expect(code).toMatch(/--_checkbox-mark-scale: var\(--ds-scale-morph\);/);
    expect(code).toMatch(/:active\)\) > \[data-part='control'\] > \[data-part='indicator'\] \{\s*transform: scale\(var\(--_checkbox-press-scale\)\);/);
    // The select all cascade waits the box's step.
    expect(code).toMatch(/calc\(var\(--ds-delay-stagger\) \* var\(--_checkbox-step\)\)/);
  });
});
