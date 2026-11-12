// Smoke test of the Vite consumer, run against the production build by
// scripts/smoke.mjs. It proves Gate 0 for this app: the five wave 0
// components render from the packages, themed, in both languages, with no
// console errors, no sideways scroll at 320px and a clean axe run. It also
// checks the layering rule: an unlayered CSS Module class beats the system.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const SHOTS = join(import.meta.dirname, '../../../docs/reports/shots/consumers');

type Style = 'studio' | 'desk';
type Scheme = 'dark' | 'light';
type Lang = 'en' | 'ar';

const path = (style: Style, scheme: Scheme, lang: Lang) => `/?style=${style}&scheme=${scheme}&lang=${lang}`;

/** Collects console errors, page errors and React warnings for the whole test. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') problems.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

async function open(page: Page, url: string) {
  await page.goto(url);
  await expect(page.locator('main')).toBeVisible();
  await page.waitForLoadState('networkidle');
}

async function expectHtml(page: Page, attrs: Record<string, string>) {
  const html = page.locator('html');
  for (const [name, value] of Object.entries(attrs)) await expect(html).toHaveAttribute(name, value);
}

/** axe for the page: the violations as `id: targets` lines. */
async function axe(page: Page): Promise<string[]> {
  const builder = new AxeBuilder({ page });
  const results = await builder.analyze();
  return results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

let problems: string[] = [];

test.beforeEach(async ({ page }) => {
  problems = watchConsole(page);
});

test.afterEach(() => {
  expect(problems, 'console errors or warnings').toEqual([]);
});

test('Studio renders the components from the packages, themed', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  await expectHtml(page, { 'data-ds': 'theme', 'data-style': 'studio', 'data-scheme': 'dark', lang: 'en', dir: 'ltr' });
  await expect(page.locator('#root > [data-ds="theme"]')).toHaveAttribute('data-style', 'studio');
  for (const ds of ['button', 'icon-button', 'field', 'input']) {
    await expect(page.locator(`[data-ds="${ds}"]`).first()).toBeVisible();
  }
  await expect(page.locator('[data-ds="window"]')).toHaveCount(0);
});

test('Desk renders the list in a Window with a title bar and lights', async ({ page }) => {
  await open(page, path('desk', 'dark', 'en'));
  await expectHtml(page, { 'data-style': 'desk', 'data-scheme': 'dark' });
  const win = page.locator('[data-ds="window"]');
  await expect(win).toBeVisible();
  await expect(win.locator('[data-ds="title-bar"]')).toBeVisible();
  await expect(win.locator('[data-ds="window-controls"]')).toBeVisible();
  await expect(win.locator('[data-ds="input"]')).toBeVisible();
});

test('an unlayered CSS Module class wins over the system layers', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  const radius = (selector: string) =>
    page.locator(selector).first().evaluate((el) => getComputedStyle(el).borderStartStartRadius);
  const create = await radius('[data-create-trigger]');
  const other = await radius('[data-choice="style-studio"]');
  const small = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.borderRadius = 'var(--ds-radius-sm)';
    document.querySelector('main')?.append(probe);
    const value = getComputedStyle(probe).borderStartStartRadius;
    probe.remove();
    return value;
  });
  expect(create).toBe(small);
  expect(other).not.toBe(small);
});

test('the create dialog opens, validates, closes and returns focus', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  const trigger = page.locator('[data-create-trigger]');
  await trigger.click();
  const dialog = page.locator('[data-ds="dialog"]');
  await expect(dialog).toBeVisible();
  const input = dialog.locator('[data-ds="input"] input');
  await expect(input).toBeFocused();
  await dialog.getByRole('button', { name: 'Create board' }).click();
  await expect(dialog.locator('[data-ds="field"] [data-part="error"]')).toContainText('Add a name for the board');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toBeFocused();
  await input.fill('Roadmap');
  await input.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('[data-board-name]').first()).toHaveText('Roadmap');
  await expect(page.locator('[data-ds="toast"]').filter({ hasText: 'Board created' })).toBeVisible();
});

test('delete asks in a danger dialog and the toast undoes it', async ({ page }) => {
  await open(page, path('desk', 'dark', 'en'));
  await page.locator('[data-delete="spring"]').click();
  const dialog = page.locator('[data-ds="dialog"]');
  await expect(dialog).toHaveAttribute('data-tone', 'danger');
  await expect(dialog.getByRole('button', { name: 'Keep board' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete board' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('[data-board-name]', { hasText: 'Spring launch' })).toHaveCount(0);
  const toast = page.locator('[data-ds="toast"]').filter({ hasText: 'Board deleted' });
  await expect(toast).toBeVisible();
  const undo = toast.locator('[data-part="action"]');
  await expect(undo).toHaveText('Undo delete');
  await undo.click();
  await expect(page.locator('[data-board-name]', { hasText: 'Spring launch' })).toHaveCount(1);
});

test('the switch changes style, scheme and language', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  await page.locator('[data-choice="style-desk"]').click();
  await expectHtml(page, { 'data-style': 'desk' });
  await expect(page.locator('#root > [data-ds="theme"]')).toHaveAttribute('data-style', 'desk');
  await expect(page.locator('[data-ds="window"]')).toBeVisible();
  await page.locator('[data-choice="scheme-light"]').click();
  await expectHtml(page, { 'data-scheme': 'light' });
  await page.locator('[data-choice="lang-ar"]').click();
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
  await expect(page.locator('h1')).toHaveText('اللوحات');
  await expect(page).toHaveURL(/style=desk&scheme=light&lang=ar/);
  // A reload opens the same screen from the URL.
  await page.reload();
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
});

for (const style of ['studio', 'desk'] as const) {
  for (const lang of ['en', 'ar'] as const) {
    test(`${style} ${lang}: no sideways scroll at 320px and axe is clean`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 });
      await open(page, path(style, 'dark', lang));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.setViewportSize({ width: 1280, height: 800 });
      expect(await axe(page)).toEqual([]);
      // Again with the create dialog open.
      await page.locator('[data-create-trigger]').click();
      await expect(page.locator('[data-ds="dialog"]')).toBeVisible();
      await page.waitForTimeout(400);
      expect(await axe(page)).toEqual([]);
    });
  }
}

const shots: { name: string; style: Style; scheme: Scheme; lang: Lang }[] = [
  { name: 'vite-studio-dark-en', style: 'studio', scheme: 'dark', lang: 'en' },
  { name: 'vite-desk-dark-en', style: 'desk', scheme: 'dark', lang: 'en' },
  { name: 'vite-desk-light-en', style: 'desk', scheme: 'light', lang: 'en' },
  { name: 'vite-desk-dark-ar', style: 'desk', scheme: 'dark', lang: 'ar' },
];

test('screenshots', async ({ page }) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const shot of shots) {
    await open(page, path(shot.style, shot.scheme, shot.lang));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SHOTS, `${shot.name}.png`), fullPage: true });
  }
  // Arabic at 320px, with the create dialog showing its error.
  await page.setViewportSize({ width: 320, height: 720 });
  await open(page, path('desk', 'dark', 'ar'));
  await page.locator('[data-create-trigger]').click();
  await page.locator('[data-ds="dialog"] [type="submit"]').click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, 'vite-desk-dark-ar-320-dialog-error.png') });
});
