import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { motionCss, motionCssPath, styleIds } from './motion-css';

describe('generated recipes/Motion.css', () => {
  for (const id of styleIds()) {
    it(`${id}/recipes/Motion.css matches motion.ts (run npx tsx packages/styles/motion-css.ts)`, async () => {
      expect(existsSync(motionCssPath(id))).toBe(true);
      expect(readFileSync(motionCssPath(id), 'utf8')).toBe(await motionCss(id));
    });
  }
});
