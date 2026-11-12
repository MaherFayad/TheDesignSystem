// Smoke test of the Next consumer, run against the production build by
// scripts/smoke.mjs. It proves Gate 0 for this app: the five wave 0
// components render from the packages, themed on the server, in both
// locales, with no console errors, no hydration warnings, no sideways scroll
// at 320px and a clean axe run.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const SHOTS = join(import.meta.dirname, '../../../docs/reports/shots/consumers');

type Style = 'studio' | 'desk';
type Scheme = 'dark' | 'light';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3000';

/** The style and scheme live in cookies, so the server renders them. */
async function setTheme(context: BrowserContext, style: Style, scheme: Scheme) {
  await context.addCookies([
    { name: 'boards-style', value: style, url: BASE },
    { name: 'boards-scheme', value: scheme, url: BASE },
  ]);
}

/** Collects console errors, page errors and hydration warnings for the whole test. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || /hydrat/i.test(text)) problems.push(`${msg.type()}: ${text}`);
  });
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
  return problems;
}

async function open(page: Page, path: string) {
  await page.goto(path);
  // The client screen is hydrated once the switch reacts; wait for the list.
  await expect(page.locator('main.screen')).toBeVisible();
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
  expect(problems, 'console errors or hydration warnings').toEqual([]);
});

test('Studio renders the components from the packages, themed on the server', async ({ page, context }) => {
  await setTheme(context, 'studio', 'dark');
  await open(page, '/en');
  await expectHtml(page, { 'data-ds': 'theme', 'data-style': 'studio', 'data-scheme': 'dark', lang: 'en', dir: 'ltr' });
  const root = page.locator('body > .app-root[data-ds="theme"]');
  await expect(root).toHaveAttribute('data-style', 'studio');
  for (const ds of ['button', 'icon-button', 'field', 'input']) {
    await expect(page.locator(`[data-ds="${ds}"]`).first()).toBeVisible();
  }
  // Studio shows the list in a plain panel, not a Window.
  await expect(page.locator('[data-ds="window"]')).toHaveCount(0);
});

test('Desk renders the list in a Window with a title bar and lights', async ({ page, context }) => {
  await setTheme(context, 'desk', 'dark');
  await open(page, '/en');
  await expectHtml(page, { 'data-style': 'desk', 'data-scheme': 'dark' });
  const win = page.locator('[data-ds="window"]');
  await expect(win).toBeVisible();
  await expect(win.locator('[data-ds="title-bar"]')).toBeVisible();
  await expect(win.locator('[data-ds="window-controls"]')).toBeVisible();
  await expect(win.locator('[data-ds="input"]')).toBeVisible();
});

test('the create dialog opens, validates, closes and returns focus', async ({ page, context }) => {
  await setTheme(context, 'studio', 'dark');
  await open(page, '/en');
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
  await expect(page.locator('.board-name').first()).toHaveText('Roadmap');
  await expect(page.locator('[data-ds="toast"]').filter({ hasText: 'Board created' })).toBeVisible();
});

test('delete asks in a danger dialog and the toast undoes it', async ({ page, context }) => {
  await setTheme(context, 'desk', 'dark');
  await open(page, '/en');
  await page.locator('[data-delete="spring"]').click();
  const dialog = page.locator('[data-ds="dialog"]');
  await expect(dialog).toHaveAttribute('data-tone', 'danger');
  await expect(dialog.getByRole('button', { name: 'Keep board' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Delete board' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('.board-name', { hasText: 'Spring launch' })).toHaveCount(0);
  const toast = page.locator('[data-ds="toast"]').filter({ hasText: 'Board deleted' });
  await expect(toast).toBeVisible();
  const undo = toast.locator('[data-part="action"]');
  await expect(undo).toHaveText('Undo delete');
  await undo.click();
  await expect(page.locator('.board-name', { hasText: 'Spring launch' })).toHaveCount(1);
});

test('the switch changes style, scheme and language', async ({ page, context }) => {
  await setTheme(context, 'studio', 'dark');
  await open(page, '/en');
  await page.locator('[data-choice="style-desk"]').click();
  await expectHtml(page, { 'data-style': 'desk' });
  await expect(page.locator('body > .app-root[data-ds="theme"]')).toHaveAttribute('data-style', 'desk');
  await expect(page.locator('[data-ds="window"]')).toBeVisible();
  await page.locator('[data-choice="scheme-light"]').click();
  await expectHtml(page, { 'data-scheme': 'light' });
  await page.locator('[data-choice="lang-ar"]').click();
  await expect(page).toHaveURL(/\/ar$/);
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
  await expect(page.locator('h1')).toHaveText('اللوحات');
  // A reload renders the same theme on the server.
  await page.reload();
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
});

for (const style of ['studio', 'desk'] as const) {
  for (const locale of ['en', 'ar'] as const) {
    test(`${style} ${locale}: no sideways scroll at 320px and axe is clean`, async ({ page, context }) => {
      await setTheme(context, style, 'dark');
      await page.setViewportSize({ width: 320, height: 720 });
      await open(page, `/${locale}`);
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

const shots: { name: string; style: Style; scheme: Scheme; locale: 'en' | 'ar' }[] = [
  { name: 'next-studio-dark-en', style: 'studio', scheme: 'dark', locale: 'en' },
  { name: 'next-desk-dark-en', style: 'desk', scheme: 'dark', locale: 'en' },
  { name: 'next-desk-light-en', style: 'desk', scheme: 'light', locale: 'en' },
  { name: 'next-desk-dark-ar', style: 'desk', scheme: 'dark', locale: 'ar' },
];

test('screenshots', async ({ page, context }) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const shot of shots) {
    await setTheme(context, shot.style, shot.scheme);
    await open(page, `/${shot.locale}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.screenshot({ path: join(SHOTS, `${shot.name}.png`), fullPage: true });
  }
  // One with the delete dialog and the toast above it.
  await setTheme(context, 'desk', 'dark');
  await open(page, '/en');
  await page.locator('[data-delete="brand"]').click();
  await page.getByRole('button', { name: 'Delete board', exact: true }).click();
  await page.locator('[data-delete="spring"]').click();
  await expect(page.locator('[data-ds="dialog"]')).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(SHOTS, 'next-desk-dark-en-dialog-toast.png') });
});
