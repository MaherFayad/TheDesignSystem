// OTPField on a phone at 320px (order R0.20). The platform token layer sets
// size.target-min to the touch target on ios (44px) and android (48px). The
// cells keep that height but narrow in width, so six or eight cells fit a
// 320px screen in every style. Laid out in Chromium with the built tokens and
// the shared OTPField CSS; the markup is the React component's own.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Browser } from '@playwright/test';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OTPField } from './index';

const repo = process.cwd();
const tokens = readFileSync(join(repo, 'packages/tokens/dist/css/tokens.css'), 'utf8');
const otp = readFileSync(join(repo, 'packages/css/src/components/OTPField.css'), 'utf8');

const STYLES = ['desk', 'liquid', 'neutral', 'studio'] as const;
const PHONES = { ios: 44, android: 48 } as const;

// The demo's hardest rows: the largest size, two groups, eight characters in
// two groups, and a row inside a flex item that keeps its automatic minimum
// (the Arabic row of the variants case).
const rows: ReactElement[] = [
  createElement(OTPField, { size: 'lg', defaultValue: '48', 'aria-label': 'lg' }),
  createElement(OTPField, { groups: [3, 3], defaultValue: '482913', 'aria-label': 'groups' }),
  createElement(OTPField, { length: 8, groups: [4, 4], charset: 'alphanumeric', defaultValue: 'K7QD', 'aria-label': 'eight' }),
  createElement(
    'div',
    { 'data-row': '', style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
    createElement('span', { style: { minInlineSize: '120px' } }, 'label'),
    createElement('div', { lang: 'ar', dir: 'rtl' }, createElement(OTPField, { groups: [3, 3], defaultValue: '1234', 'aria-label': 'ar' })),
  ),
];

let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch();
}, 60_000);

afterAll(async () => {
  await browser?.close();
});

interface Measure {
  overflow: number;
  fields: { label: string; width: number; height: number; cellHeights: number[]; cellWidths: number[]; inputHeight: number }[];
}

async function layout(style: string, platform: string): Promise<Measure> {
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  try {
    const body = rows.map((row) => `<div class="case">${renderToStaticMarkup(row)}</div>`).join('');
    await page.setContent(
      `<!doctype html><html data-style="${style}" data-scheme="dark" data-platform="${platform}" data-density="default"><head><style>${tokens}\n${otp}\nbody{margin:0;padding:0 16px}.case{margin-block:8px}</style></head><body>${body}</body></html>`,
    );
    return await page.evaluate(() => {
      const de = document.documentElement;
      const fields = [...document.querySelectorAll<HTMLElement>('[data-ds="otp-field"]')].map((f) => {
        const box = f.getBoundingClientRect();
        const cells = [...f.querySelectorAll(':scope > [data-part="cell"]')].map((c) => c.getBoundingClientRect());
        const input = f.querySelector('[data-part="control"]')?.getBoundingClientRect();
        return {
          label: f.querySelector('input')?.getAttribute('aria-label') ?? '',
          width: box.width,
          height: box.height,
          cellHeights: cells.map((c) => c.height),
          cellWidths: cells.map((c) => c.width),
          inputHeight: input?.height ?? 0,
        };
      });
      return { overflow: Math.max(de.scrollWidth, document.body.scrollWidth) - de.clientWidth, fields };
    });
  } finally {
    await page.close();
  }
}

describe('OTPField at 320px on a phone (order R0.20)', () => {
  for (const [platform, target] of Object.entries(PHONES)) {
    it(`fits 320px on ${platform} in every style, cells ${target}px tall, one row`, async () => {
      for (const style of STYLES) {
        const m = await layout(style, platform);
        expect(m.overflow, `${style} ${platform} scrolls sideways`).toBeLessThanOrEqual(1);
        expect(m.fields).toHaveLength(rows.length);
        for (const f of m.fields) {
          const where = `${style} ${platform} ${f.label}`;
          // The row is the target: as tall as the platform touch target, and wider than 24px (WCAG 2.5.8).
          expect(f.inputHeight, where).toBeGreaterThanOrEqual(target);
          expect(f.width, where).toBeGreaterThanOrEqual(24);
          // Every cell keeps the touch target height and the row stays on one line.
          for (const h of f.cellHeights) expect(h, where).toBeGreaterThanOrEqual(target);
          expect(f.height, `${where} wrapped`).toBeLessThan(target * 2);
          // Every cell still holds a digit: at least 24px wide.
          for (const w of f.cellWidths) expect(w, where).toBeGreaterThanOrEqual(24);
        }
      }
    }, 60_000);
  }

  it('keeps the square cells on the web, where they fit', async () => {
    const m = await layout('studio', 'web');
    expect(m.overflow).toBeLessThanOrEqual(1);
    const groups = m.fields.find((f) => f.label === 'groups');
    // md on the web: 32px cells, as wide as they are tall.
    expect(groups?.cellWidths.every((w, i) => Math.abs(w - (groups?.cellHeights[i] ?? 0)) < 0.5)).toBe(true);
  }, 60_000);
});
