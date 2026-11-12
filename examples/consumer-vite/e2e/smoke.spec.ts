// Smoke test of the Vite consumer, run against the production build by
// scripts/smoke.mjs. It proves gate 0 and gate 1 for this app: the system
// components render from the packages, themed, in both languages, with no
// console errors, no sideways scroll at 320px and a clean axe run. Wave 1
// parts: Tooltip on every IconButton, a DropdownMenu of row actions, the
// create dialog on Form, Field, Label and FieldError, SegmentedControl and
// LanguageSwitch for the switches, and the Window's own Arabic labels. It
// also checks the layering rule: an unlayered CSS Module class beats the
// system.
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
  for (const ds of ['button', 'icon-button', 'field', 'input', 'segmented-control', 'language-switch']) {
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
  // The same Button with no class: the submit button of the create dialog.
  await page.locator('[data-create-trigger]').click();
  const other = await radius('[data-ds="dialog"] [type="submit"]');
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
  await expect(dialog.locator('[data-ds="form"]')).toBeVisible();
  await expect(dialog.locator('[data-ds="field"] [data-ds="label"]')).toHaveText(/Board name/);
  await expect(dialog.locator('[data-ds="field"] [data-ds="field-error"]')).toContainText('Add a name for the board');
  await expect(dialog.locator('[data-ds="form"] [data-part="summary"]')).toBeVisible();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(input).toBeFocused();
  await input.fill('Roadmap');
  await expect(dialog.locator('[data-ds="field-error"]')).toHaveCount(0);
  await input.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('[data-board-name]').first()).toHaveText('Roadmap');
  await expect(page.locator('[data-ds="toast"]').filter({ hasText: 'Board created' })).toBeVisible();
});

test('delete asks in a danger dialog and the toast undoes it', async ({ page }) => {
  await open(page, path('desk', 'dark', 'en'));
  await page.locator('[data-row-actions="spring"]').click();
  await expect(page.locator('[data-ds="dropdown-menu"]')).toBeVisible();
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
  await page.locator('[data-ds="language-switch"]').getByRole('link', { name: 'العربية' }).click();
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
  await expect(page.locator('h1')).toHaveText('اللوحات');
  await expect(page).toHaveURL(/style=desk&scheme=light&lang=ar/);
  // A reload opens the same screen from the URL.
  await page.reload();
  await expectHtml(page, { lang: 'ar', dir: 'rtl', 'data-style': 'desk', 'data-scheme': 'light' });
});

test('every IconButton shows its label in a Tooltip on focus', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  const buttons = page.locator('[data-ds="icon-button"]');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(1);
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    const label = await button.getAttribute('aria-label');
    await button.focus();
    expect(label).toBeTruthy();
    await expect(page.locator('[data-ds="tooltip"]').filter({ hasText: label ?? '' })).toBeVisible();
    await page.keyboard.press('Escape');
  }
});

test('the sort IconButton sorts by name and the row menu duplicates a board', async ({ page }) => {
  await open(page, path('studio', 'dark', 'en'));
  const sort = page.locator('[data-sort]');
  await sort.click();
  await expect(sort).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-board-name]').first()).toHaveText('Brand refresh');
  await page.locator('[data-row-actions="checkout"]').press('Enter');
  const menu = page.locator('[data-ds="dropdown-menu"]');
  await expect(menu.getByRole('menuitem').first()).toBeFocused();
  await menu.getByRole('menuitem', { name: 'Duplicate board' }).click();
  await expect(page.locator('[data-board-name]', { hasText: 'Checkout flow copy' })).toHaveCount(1);
  await expect(page.locator('[data-ds="toast"]').filter({ hasText: 'Board duplicated' })).toBeVisible();
});

test('the Window takes its Arabic labels from its own defaults', async ({ page }) => {
  await open(page, path('desk', 'dark', 'ar'));
  const win = page.locator('[data-ds="window"]');
  await expect(win.getByRole('button', { name: 'إغلاق النافذة' })).toBeVisible();
  await expect(win.getByRole('button', { name: 'Close window' })).toHaveCount(0);
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
