// Unit tests of the compare harness (order R0.7): the tolerance profiles and
// comparisons, the pixel probe, the pair files, the page probe in a real
// Chromium on a fixture, and the rules that keep the source repos untouched.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from '@playwright/test';
import { PNG } from 'pngjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { checkPair, COMPARE_DIR, loadPair, pairIds } from './pairs';
import { diffPixels } from './pixels';
import { maskRects, probeRegion, settle } from './probe';
import { iconExportName, scratchRoot, sourceRoots } from './sources';
import { classify, compareValue, deltaE, DEFAULT_TOLERANCE, easingPoints, parseShadow, resolveTolerance, statusOf, summarize, type Ctx } from './tolerance';
import type { PairFile } from './types';

const ctx: Ctx = { tol: DEFAULT_TOLERANCE, kind: 'control' };

describe('tolerance profiles', () => {
  it('the default profile is the table of plan section 3', () => {
    expect(resolveTolerance({ profile: 'default' })).toMatchObject({ controlBox: 1, regionBox: 2, deltaE: 2, lineHeight: 1, letterSpacingEm: 0.01, durationMs: 10, durationRatio: 0.1, travel: 1, scale: 0.01, easing: 0.02, pixelShare: 0.03, pixelThreshold: 0.1 });
  });
  it('a pair may tighten a value', () => {
    expect(resolveTolerance({ profile: 'default', tighten: { deltaE: 1 } }).deltaE).toBe(1);
  });
  it('a pair may not loosen a value', () => {
    expect(() => resolveTolerance({ profile: 'default', tighten: { deltaE: 3 } })).toThrow(/only tighten/);
    expect(() => resolveTolerance({ profile: 'default', tighten: { wobble: 1 } as never })).toThrow(/Unknown tolerance/);
  });
});

describe('comparing one value', () => {
  it('sorts properties into the right comparison', () => {
    expect(classify('height')).toBe('box');
    expect(classify('padding-inline-start')).toBe('box');
    expect(classify('border-top-left-radius')).toBe('radius');
    expect(classify('border-width')).toBe('length');
    expect(classify('background-color')).toBe('color');
    expect(classify('box-shadow')).toBe('shadow');
    expect(classify('transition-duration')).toBe('duration');
    expect(classify('animation-timing-function')).toBe('easing');
    expect(classify('backdrop-filter')).toBe('string');
  });

  it('a control box passes within 1px and a screen region within 2px', () => {
    expect(compareValue('height', '28px', '28.9px', ctx).pass).toBe(true);
    expect(compareValue('height', '28px', '35.984px', ctx)).toMatchObject({ pass: false, difference: '+7.98px', tolerance: '1px' });
    expect(compareValue('width', '400px', '401.5px', { ...ctx, kind: 'region' }).pass).toBe(true);
    expect(compareValue('width', '400px', '401.5px', ctx).pass).toBe(false);
  });

  it('radius, border width and font size must be equal, within float noise', () => {
    expect(compareValue('border-radius', '11.997px', '12px', ctx).pass).toBe(true);
    expect(compareValue('border-radius', '16px', '0px', ctx)).toMatchObject({ pass: false, difference: '-16px' });
    expect(compareValue('font-size', '12px', '13px', ctx).pass).toBe(false);
    expect(compareValue('border-radius', '12px', '12px 0px 0px 0px', ctx).pass).toBe(false);
  });

  it('letter spacing is compared in em: normal against -0.52px at 13px fails by 0.04em', () => {
    const v = compareValue('letter-spacing', 'normal', '-0.52px', { ...ctx, sourceFontSize: 12, systemFontSize: 13 });
    expect(v).toMatchObject({ pass: false, difference: '-0.04em' });
    expect(compareValue('letter-spacing', 'normal', '0.1px', { ...ctx, systemFontSize: 13 }).pass).toBe(true);
  });

  it('line height passes within 1px', () => {
    expect(compareValue('line-height', '16px', '16.8px', ctx).pass).toBe(true);
    expect(compareValue('line-height', '16px', 'normal', ctx).pass).toBe(false);
  });

  it('colour uses Delta E 2000 on black and on white, so alpha counts', () => {
    expect(deltaE('rgb(27, 27, 27)', '#1b1b1b')).toBe(0);
    expect(compareValue('color', 'rgb(237, 237, 237)', 'rgb(236, 236, 236)', ctx).pass).toBe(true);
    expect(compareValue('background-color', 'rgb(27, 27, 27)', 'rgba(33, 33, 33, 0.9)', ctx).pass).toBe(false);
    expect(compareValue('background-color', 'rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.5)', ctx).pass).toBe(false);
    expect(compareValue('background-color', 'transparent', 'rgba(0, 0, 0, 0)', ctx).pass).toBe(true);
  });

  it('shadows compare layer by layer', () => {
    expect(parseShadow('none')).toEqual([]);
    expect(parseShadow('rgba(0, 0, 0, 0.5) 0px 12px 28px 0px, rgba(255, 255, 255, 0.1) 0px 1px 0px 0px inset')).toEqual([
      { inset: false, color: 'rgba(0, 0, 0, 0.5)', lengths: [0, 12, 28, 0] },
      { inset: true, color: 'rgba(255, 255, 255, 0.1)', lengths: [0, 1, 0, 0] },
    ]);
    expect(compareValue('box-shadow', 'rgba(0, 0, 0, 0.5) 0px 12px 28px 0px', 'none', ctx)).toMatchObject({ pass: false, difference: '1 against 0 layers' });
    expect(compareValue('box-shadow', 'rgba(0, 0, 0, 0.5) 0px 12px 28px 0px', 'rgba(0, 0, 0, 0.5) 0px 12px 28.5px 0px', ctx).pass).toBe(true);
  });

  it('durations pass within 10ms or 10 percent, the larger', () => {
    expect(compareValue('transition-duration', '0.15s', '160ms', ctx).pass).toBe(true);
    expect(compareValue('transition-duration', '0.3s', '0.33s', ctx).pass).toBe(true);
    expect(compareValue('transition-duration', '0.15s, 0.15s', '0.38s', ctx)).toMatchObject({ pass: false, difference: '+230ms' });
  });

  it('easing passes when each control point is within 0.02', () => {
    expect(easingPoints('ease')).toEqual([0.25, 0.1, 0.25, 1]);
    expect(compareValue('animation-timing-function', 'ease', 'cubic-bezier(0.25, 0.1, 0.26, 1)', ctx).pass).toBe(true);
    expect(compareValue('animation-timing-function', 'cubic-bezier(0.16, 1, 0.3, 1)', 'steps(2)', ctx).pass).toBe(false);
  });

  it('transform compares travel and scale', () => {
    expect(compareValue('transform', 'none', 'matrix(1, 0, 0, 1, 0, 0.5)', ctx).pass).toBe(true);
    expect(compareValue('transform', 'none', 'matrix(0.97, 0, 0, 0.97, 0, 0)', ctx).pass).toBe(false);
  });

  it('counts, absent parts and missing elements', () => {
    expect(compareValue('count', 'absent', '1', ctx)).toMatchObject({ pass: false, difference: '+1' });
    expect(compareValue('count', 'absent', '0', ctx).pass).toBe(true);
    expect(compareValue('background-color', 'absent', 'rgb(0, 0, 0)', ctx)).toMatchObject({ pass: false, difference: 'source has no such part' });
    expect(compareValue('height', '(not found)', '28px', ctx)).toMatchObject({ pass: false, difference: 'element not found' });
  });

  it('a failing value listed as allowed reads "allowed" with its reason', () => {
    const allowed = [{ region: 'button', probe: 'outline-width', reason: 'the 2px focus ring of PLAN.md section 12' }];
    expect(statusOf(false, 'button', 'outline-width', allowed)).toEqual({ status: 'allowed', note: 'the 2px focus ring of PLAN.md section 12' });
    expect(statusOf(false, 'button', 'height', allowed)).toEqual({ status: 'fail' });
    expect(statusOf(true, 'button', 'outline-width', allowed).status).toBe('pass');
    const rows = [statusOf(true, 'a', 'b', []), statusOf(false, 'a', 'b', [])].map((s) => ({ region: 'a', probe: 'b', property: 'b', source: '', system: '', difference: '', tolerance: '', ...s }));
    expect(summarize(rows)).toEqual({ pass: 1, fail: 1, allowed: 0 });
  });
});

describe('the pixel probe', () => {
  const solid = (w: number, h: number, rgb: [number, number, number]) => {
    const png = new PNG({ width: w, height: h });
    for (let i = 0; i < w * h; i += 1) png.data.set([...rgb, 255], i * 4);
    return png;
  };
  const opts = { threshold: 0.1, sizeSlack: 2 };

  it('counts no difference between equal crops', () => {
    expect(diffPixels(solid(20, 10, [10, 10, 10]), solid(20, 10, [10, 10, 10]), opts).share).toBe(0);
  });
  it('counts every differing pixel, and masks hide a box on both sides', () => {
    const a = solid(20, 10, [10, 10, 10]);
    const b = solid(20, 10, [10, 10, 10]);
    for (let y = 0; y < 5; y += 1) for (let x = 0; x < 4; x += 1) b.data.set([250, 250, 250, 255], (y * 20 + x) * 4);
    expect(diffPixels(a, b, opts).differing).toBe(20);
    expect(diffPixels(a, b, { ...opts, masks: { source: [], system: [{ x: 0, y: 0, width: 4, height: 5 }] } }).differing).toBe(0);
    // The masks paint copies, never the caller's image.
    expect(a.data[0]).toBe(10);
  });
  it('does not compare crops whose sizes differ by more than the slack', () => {
    expect(diffPixels(solid(20, 10, [0, 0, 0]), solid(30, 10, [0, 0, 0]), opts).share).toBeNull();
    expect(diffPixels(solid(20, 10, [0, 0, 0]), solid(21, 11, [0, 0, 0]), opts).share).toBe(0);
  });
});

describe('pair files', () => {
  it('the three sample pairs exist and are valid', () => {
    expect(pairIds()).toEqual(expect.arrayContaining(['fk2-menu-studio', 'gb-button-desk', 'gb-dialog-desk']));
    for (const id of pairIds()) expect(checkPair(JSON.parse(readFileSync(join(COMPARE_DIR, 'pairs', `${id}.json`), 'utf8')), id)).toEqual([]);
  });

  it('each sample pair probes the values its audit names', () => {
    const props = (id: string, region: string) =>
      loadPair(id)
        .regions.find((r) => r.id === region)
        ?.probes.map((p) => (typeof p === 'string' ? p : p.id));
    expect(props('gb-button-desk', 'secondary')).toEqual(expect.arrayContaining(['height', 'letter-spacing']));
    expect(props('fk2-menu-studio', 'menu')).toEqual(expect.arrayContaining(['border-radius']));
    expect(props('gb-dialog-desk', 'panel')).toEqual(expect.arrayContaining(['window lights', 'header fill', 'backdrop-filter']));
  });

  it('catches what the schema cannot', () => {
    const base = loadPair('gb-button-desk');
    const bad: PairFile = {
      ...base,
      tolerance: { profile: 'default', tighten: { controlBox: 4 } },
      regions: [base.regions[0], base.regions[0]] as PairFile['regions'],
      allowed: [{ region: 'nowhere', probe: 'height', reason: 'none' }],
    };
    const errors = checkPair(bad, 'gb-button-desk').join('\n');
    expect(errors).toMatch(/only tighten/);
    expect(errors).toMatch(/appears twice/);
    expect(errors).toMatch(/names no region/);
    expect(checkPair({ id: 'x' })).not.toEqual([]);
    expect(checkPair({ ...base, id: 'fk2-button-desk' }, 'fk2-button-desk').join('\n')).toMatch(/must start with the source repo/);
  });
});

describe('the source repos stay untouched', () => {
  const harnessFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? harnessFiles(full) : [full];
    });

  it('no harness file names a path in the FK2 vendor folder or the third party package', () => {
    // The patterns are built from parts so this file does not match itself.
    const pathPattern = new RegExp(['vendor', '/'].join(''));
    const pkgPattern = new RegExp(['alm', 'design', 'system'].join('-'));
    const hits = harnessFiles(COMPARE_DIR).filter((f) => {
      const text = readFileSync(f, 'utf8');
      return pathPattern.test(text) || pkgPattern.test(text);
    });
    expect(hits).toEqual([]);
  });

  it('refuses a scratch folder inside this repo or a source repo', () => {
    const before = process.env.DS_COMPARE_SCRATCH;
    try {
      for (const dir of [COMPARE_DIR, join(sourceRoots().gb, 'tmp'), join(sourceRoots().fk2, 'tmp')]) {
        process.env.DS_COMPARE_SCRATCH = dir;
        expect(() => scratchRoot()).toThrow(/lies inside/);
      }
    } finally {
      if (before === undefined) delete process.env.DS_COMPARE_SCRATCH;
      else process.env.DS_COMPARE_SCRATCH = before;
    }
  });

  it('names stub icons the way FK2 imports them', () => {
    expect(iconExportName('pixel-art-icons/icons/chevron-right')).toBe('ChevronRightIcon');
    expect(iconExportName('pixel-art-icons/icons/check')).toBe('CheckIcon');
  });
});

describe('the page probe in Chromium', () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch();
  }, 60_000);
  afterAll(async () => {
    await browser?.close();
  });

  const fixture = `<!doctype html><html><body style="margin:0">
    <button class="b" hidden>Hidden</button>
    <button class="b" style="all:unset;display:inline-block;height:28px;width:80px;font-size:12px;letter-spacing:normal;border-radius:999px;background:rgb(10,20,30);padding:0 8px;box-sizing:border-box">
      <span class="t">Copy link</span><svg width="12" height="12"></svg></button>
    <div class="d" style="width:200px;height:100px;margin:20px;border-radius:12px;border:1px solid red"><p class="h" style="margin:0;height:30px;background:rgb(40,40,40)">Title</p></div>
  </body></html>`;

  it('reads box, radius (clamped to a pill), colour, sub parts, counts and absent parts', async () => {
    const page = await browser.newPage({ viewport: { width: 400, height: 300 } });
    try {
      await page.setContent(fixture);
      await page.evaluate('window.__name = (f) => f');
      const b = await page.evaluate(probeRegion, {
        root: '.b',
        probes: [
          { key: 'h', property: 'height' },
          { key: 'r', property: 'border-radius' },
          { key: 'bg', property: 'background-color' },
          { key: 'ls', property: 'letter-spacing' },
          { key: 'pad', property: 'padding' },
          { key: 'svg', property: 'count', sub: 'svg' },
          { key: 'lights', property: 'count', sub: null },
        ],
      });
      expect(b.found).toBe(true);
      expect(b.values).toMatchObject({ h: '28px', r: '14px', bg: 'rgb(10, 20, 30)', ls: 'normal', pad: '0px 8px 0px 8px', svg: '1', lights: 'absent', 'h@fs': '12px' });
      const d = await page.evaluate(probeRegion, {
        root: '.d',
        probes: [
          { key: 'y', property: 'y' },
          { key: 'hy', property: 'y', sub: '.h' },
          { key: 'hfill', property: 'background-color', sub: '.h' },
          { key: 'missing', property: 'height', sub: '.nope' },
          { key: 'bw', property: 'border-width' },
        ],
      });
      expect(d.values).toMatchObject({ hy: '1px', hfill: 'rgb(40, 40, 40)', missing: '(not found)', bw: '1px' });
      expect(parseFloat(d.values.y ?? '')).toBeGreaterThan(20);
      expect((await page.evaluate(probeRegion, { root: '.none', probes: [] })).found).toBe(false);
      const masks = await page.evaluate(maskRects, { root: '.b', text: true, extra: [] });
      expect(masks.length).toBe(2);
      expect(await page.evaluate(settle, 200)).toBe(0);
    } finally {
      await page.close();
    }
  }, 30_000);
});
