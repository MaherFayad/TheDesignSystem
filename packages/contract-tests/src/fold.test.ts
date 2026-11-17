// The self test of the folding iPhone profiles (order DU4): each profile sets
// the viewport, the safe areas and, where it has one, the fold and the posture
// in Chromium, read back from the page through matchMedia, env() and the
// token chain (--ds-inset-safe-*), in ltr and rtl. It also records which
// protocol commands the bundled Chromium honours, and proves the stand in for
// engines without the protocol.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser, type Page } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyDuo, deviceNames, DUO_ALIASES, DUO_PROFILES, duoContextOptions, duoFindings, duoProfile, expectedSegments, parseDevices, probeEmulation, readDuo, standInDuo, type DuoProfile } from './fold';

const repo = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const tokensCss = join(repo, 'packages/tokens/dist/css/liquid.css');
// The real token build when it exists (npm run check builds it first), so the
// test proves the chain env() to --ds-inset-safe-start and -end in both directions.
const css = existsSync(tokensCss) ? readFileSync(tokensCss, 'utf8') : '[data-style]{--ds-inset-safe-top:env(safe-area-inset-top,0px);--ds-inset-safe-bottom:env(safe-area-inset-bottom,0px);--ds-inset-safe-start:env(safe-area-inset-left,0px);--ds-inset-safe-end:env(safe-area-inset-right,0px)}[data-style]:dir(rtl){--ds-inset-safe-start:env(safe-area-inset-right,0px);--ds-inset-safe-end:env(safe-area-inset-left,0px)}';
const page = (dir: 'ltr' | 'rtl') =>
  `<!doctype html><html lang="${dir === 'rtl' ? 'ar' : 'en'}" dir="${dir}"><head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>${css}</style></head><body style="margin:0"><div data-style="liquid" data-platform="ios">x</div></body></html>`;

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

/** A page at the profile's size on a secure origin (the posture API needs one). */
async function openAt(p: DuoProfile, dir: 'ltr' | 'rtl' = 'ltr'): Promise<Page> {
  const context = await browser.newContext(duoContextOptions(p));
  await context.route('https://duo.test/**', (r) => r.fulfill({ contentType: 'text/html', body: page(r.request().url().endsWith('rtl') ? 'rtl' : 'ltr') }));
  const pg = await context.newPage();
  await pg.goto(`https://duo.test/${dir}`);
  return pg;
}

describe('profile names', () => {
  it('has the eleven profiles and resolves the aliases', () => {
    expect(Object.keys(DUO_PROFILES)).toHaveLength(11);
    for (const [alias, name] of Object.entries(DUO_ALIASES)) expect(duoProfile(alias)?.name).toBe(name);
    expect(duoProfile('duo-outer')?.viewport).toEqual({ width: 382, height: 580 });
    expect(deviceNames()).toContain('duo-inner-landscape-folded');
  });

  it('parses a list, expands duo, drops repeats and names the known ones on a typo', () => {
    expect(parseDevices('duo-outer,duo-outer-portrait-safari').map((p) => p.name)).toEqual(['duo-outer-portrait-safari']);
    expect(parseDevices('duo')).toHaveLength(11);
    expect(() => parseDevices('duo-middle')).toThrow(/Unknown device duo-middle.*duo-outer/);
  });

  it('has the sizes of the plan facts table', () => {
    const size = (n: string) => DUO_PROFILES[n]?.viewport;
    expect(size('duo-outer-portrait-safari')).toEqual({ width: 382, height: 580 });
    expect(size('duo-outer-landscape-safari')).toEqual({ width: 594, height: 368 });
    expect(size('duo-inner-portrait-safari')).toEqual({ width: 669, height: 867 });
    expect(size('duo-inner-landscape-safari')).toEqual({ width: 951, height: 585 });
    expect(size('duo-inner-split-safari')).toEqual({ width: 385, height: 571 });
    expect(size('duo-outer-portrait-full')).toEqual({ width: 466, height: 678 });
    expect(size('duo-outer-landscape-full')).toEqual({ width: 678, height: 466 });
    expect(size('duo-inner-portrait-full')).toEqual({ width: 669, height: 951 });
    expect(size('duo-inner-landscape-full')).toEqual({ width: 951, height: 669 });
  });

  it('splits the inner screen at the 40 point band', () => {
    expect(expectedSegments(DUO_PROFILES['duo-inner-landscape-folded'] as DuoProfile)).toEqual([[0, 0, 455, 669], [495, 0, 456, 669]]);
    expect(expectedSegments(DUO_PROFILES['duo-inner-portrait-folded'] as DuoProfile)).toEqual([[0, 0, 669, 455], [0, 495, 669, 456]]);
    expect(expectedSegments(DUO_PROFILES['duo-outer-portrait-full'] as DuoProfile)).toEqual([[0, 0, 466, 678]]);
  });

  it('gives an iPhone user agent with touch, so auto detects ios', () => {
    const o = duoContextOptions(DUO_PROFILES['duo-outer-portrait-safari'] as DuoProfile);
    expect(o.userAgent).toMatch(/iPhone/);
    expect(o.hasTouch).toBe(true);
    expect(o.isMobile).toBe(true);
    expect(o.deviceScaleFactor).toBe(3);
  });
});

describe('Chromium emulation, each profile', () => {
  for (const p of Object.values(DUO_PROFILES)) {
    it(`${p.name}: size, safe areas${p.fold ? ', fold and posture' : ''} take effect, also after a navigation`, async () => {
      const pg = await openAt(p);
      try {
        const applied = await applyDuo(pg, p);
        expect(applied.method).toBe('cdp');
        expect(applied.commands.filter((c) => !c.ok)).toEqual([]);
        expect(duoFindings(p, await pg.evaluate(readDuo))).toEqual([]);
        // The posture API resets on navigation, so the helper runs again after each one.
        await pg.goto('https://duo.test/ltr');
        await applyDuo(pg, p);
        expect(duoFindings(p, await pg.evaluate(readDuo))).toEqual([]);
      } finally {
        await pg.context().close();
      }
    }, 30_000);
  }

  it('maps the asymmetric column to the token chain: end in ltr, start in rtl', async () => {
    const p = DUO_PROFILES['duo-outer-portrait-full'] as DuoProfile;
    for (const dir of ['ltr', 'rtl'] as const) {
      const pg = await openAt(p, dir);
      try {
        await applyDuo(pg, p);
        const r = await pg.evaluate(readDuo);
        expect(r.tokens?.dir).toBe(dir);
        expect(parseFloat(r.tokens?.end ?? 'NaN')).toBe(dir === 'ltr' ? 84 : 0);
        expect(parseFloat(r.tokens?.start ?? 'NaN')).toBe(dir === 'ltr' ? 0 : 84);
      } finally {
        await pg.context().close();
      }
    }
  }, 30_000);

  it('leaves the fold out when the page is not at the profile size, and says why', async () => {
    const p = DUO_PROFILES['duo-inner-landscape-folded'] as DuoProfile;
    const pg = await openAt(p);
    try {
      await pg.setViewportSize({ width: 320, height: 800 });
      const applied = await applyDuo(pg, p);
      expect(applied.foldSkipped).toMatch(/320 by 800/);
      const r = await pg.evaluate(readDuo);
      expect(r.horizontalSegments).toBe(1);
      expect(r.safeArea.right).toBe(84);
    } finally {
      await pg.context().close();
    }
  }, 30_000);

  it('records which protocol commands the bundled Chromium honours', async () => {
    const p = DUO_PROFILES['duo-inner-landscape-folded'] as DuoProfile;
    const pg = await openAt(p);
    try {
      const lines = await probeEmulation(pg, p);
      const by = (c: string) => lines.find((l) => l.command === c);
      // Kept in the run log, for docs/reports/lanes/reset-DU4.md.
      console.log(`Chromium ${browser.version()}\n${lines.map((l) => `${l.command}: ${l.accepted ? (l.effect ? 'works' : 'accepted, no effect') : 'missing'} (${l.detail})`).join('\n')}`);
      // The paths applyDuo relies on must work. setDisplayFeaturesOverride is
      // only recorded: in Chromium 153 it is accepted and has no effect.
      expect(by('Emulation.setSafeAreaInsetsOverride')?.effect).toBe(true);
      expect(by('Emulation.setDevicePostureOverride')?.effect).toBe(true);
      expect(by('Emulation.setDeviceMetricsOverride')?.effect).toBe(true);
      expect(by('Emulation.setDisplayFeaturesOverride')?.accepted).toBe(true);
    } finally {
      await pg.context().close();
    }
  }, 30_000);
});

describe('the stand in (engines without the protocol)', () => {
  for (const name of ['duo-outer-portrait-full', 'duo-inner-portrait-folded', 'duo-inner-landscape-folded']) {
    it(`${name}: sets the test attributes and the inset tokens, and leaves env() alone`, async () => {
      const p = DUO_PROFILES[name] as DuoProfile;
      for (const dir of ['ltr', 'rtl'] as const) {
        const pg = await openAt(p, dir);
        try {
          const applied = await standInDuo(pg, p);
          expect(applied.method).toBe('stand-in');
          const r = await pg.evaluate(readDuo);
          expect(duoFindings(p, r, { standIn: true })).toEqual([]);
          // A stand in is not emulation: the media features and env() do not move.
          expect(r.horizontalSegments).toBe(1);
          expect(r.safeArea).toEqual({ top: 0, right: 0, bottom: 0, left: 0 });
        } finally {
          await pg.context().close();
        }
      }
    }, 30_000);
  }
});
