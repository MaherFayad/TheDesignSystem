import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { motionCss, motionCssPath, styleIds } from './motion-css';

describe('generated motion.css', () => {
  for (const id of styleIds()) {
    it(`${id}/motion.css matches motion.ts (run npx tsx packages/styles/motion-css.ts)`, async () => {
      expect(existsSync(motionCssPath(id))).toBe(true);
      expect(readFileSync(motionCssPath(id), 'utf8')).toBe(await motionCss(id));
    });
    it(`${id} loads motion.css through recipes/Motion.css`, () => {
      expect(readFileSync(join(import.meta.dirname, id, 'recipes', 'Motion.css'), 'utf8')).toContain("@import '../motion.css';");
    });
  }
});
