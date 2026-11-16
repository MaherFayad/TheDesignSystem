// The reflow scan in a real browser, on a fixture that fits 320px and one
// that does not (order R0.5: each gate has a passing and a failing fixture).
// The contract suite runs the same scan on every style and platform.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from '@playwright/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { appliedAxes, reflowAndTitles } from './page';

// The fixtures sit with the lint fixtures, which no gate reads: they break the rules on purpose.
const fixtures = join(dirname(fileURLToPath(import.meta.url)), '../../lint/fixtures/reflow');
let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

async function scan(name: string) {
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  try {
    await page.setContent(readFileSync(join(fixtures, name), 'utf8'));
    return { ...(await page.evaluate(reflowAndTitles)), applied: await page.evaluate(appliedAxes) };
  } finally {
    await page.close();
  }
}

describe('reflow at 320px: the scan the contract suite runs', () => {
  it('passes on the fixture that fits', async () => {
    const r = await scan('fits.html');
    expect(r.overflow).toBeLessThanOrEqual(1);
    expect(r.wide).toEqual([]);
    expect(r.titles).toEqual([]);
    expect(r.applied).toEqual({ style: 'studio', platform: 'ios' });
  }, 30_000);

  it('fails on the fixture that scrolls sideways, names the case and the part, and finds the title', async () => {
    const r = await scan('overflows.html');
    expect(r.overflow).toBe(80);
    expect(r.wide).toEqual([expect.stringMatching(/^case range alone scrolls sideways by 80px: span\[data-part=track\] in \[data-ds=slider\] is 400px wide/)]);
    expect(r.titles).toEqual(['button title="Native hint"']);
    expect(r.applied).toEqual({ style: 'desk', platform: 'android' });
  }, 30_000);
});
