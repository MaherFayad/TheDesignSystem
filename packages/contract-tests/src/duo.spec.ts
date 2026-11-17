// The folding iPhone checks of the contract suite (order DU4 of
// docs/plan/reset-duo.md). They run only with run.ts --device, once per device
// profile (one Playwright project each, src/fold.ts); a run without --device
// defines no test here.
//
// - The profile took effect on the gallery page: size, safe areas, posture
//   and fold, read from matchMedia and env().
// - Reflow (WCAG 1.4.10) at the profile's size: no sideways scroll, every
//   style, en ltr and ar rtl. With --device duo-outer this is the outer
//   screen's Safari width, 382 by 580.
// - The side column checks are skipped by name: DU2 builds the column now and
//   switches them on.
import { expect, test, type Page } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyAndCheck, duoProfile, readDuo, type DuoProfile } from './fold';
import { demoPath, discoverStyles, kebabCase, loadManifests, readyComponents, reflowMatrix, type Axes } from './lib';
import { appliedAxes, reflowAndTitles } from './page';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const framework = process.env.DS_FRAMEWORK ?? 'react';
const only = (process.env.DS_COMPONENT ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const onlyStyles = (process.env.DS_STYLES ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const allStyles = discoverStyles(repo);
const styles = onlyStyles.length ? allStyles.filter((s) => onlyStyles.includes(s.id)) : allStyles;
// The device is an iPhone: the reflow runs on ios unless --platform names another.
const platform = process.env.DS_PLATFORM || 'ios';
const routes = process.env.DS_ROUTES ? (JSON.parse(process.env.DS_ROUTES) as Record<string, boolean>) : undefined;
const components = process.env.DS_DEVICE ? readyComponents(loadManifests(repo), framework, only).filter((m) => !routes || routes[kebabCase(m.name)] !== false) : [];

/** The profile of the running project. Fails when the project is not a device profile. */
function profile(): DuoProfile {
  const p = duoProfile(test.info().project.name);
  if (!p) throw new Error(`project "${test.info().project.name}" is not a device profile`);
  return p;
}

/** Opens a demo, applies the profile and fails when it did not take effect. */
async function openOn(page: Page, kebab: string, axes: Axes, p: DuoProfile): Promise<void> {
  const path = demoPath(kebab, axes);
  await page.goto(path);
  const found = await page
    .locator('[data-demo-case]')
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!found, `no [data-demo-case] at ${path}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  const { findings } = await applyAndCheck(page, p);
  expect(findings, `device profile ${p.name} on ${path}`).toEqual([]);
}

test.describe.configure({ mode: 'parallel' });

const first = components[0];
if (first) {
  test(`duo profile: size, safe areas, posture and fold take effect on the gallery page`, async ({ page }) => {
    const p = profile();
    await openOn(page, kebabCase(first.name), { platform, dir: 'ltr', lang: 'en' }, p);
    const r = await page.evaluate(readDuo);
    test.info().annotations.push({ type: 'note', description: `${p.name}: ${r.width} by ${r.height} at ${r.dpr}x, safe area ${JSON.stringify(r.safeArea)}, segments ${JSON.stringify(r.segments)}, posture ${r.postureMedia}` });
    const applied = await page.evaluate(appliedAxes);
    expect(applied.platform, 'the page applies ios on the device profile').toBe(platform);
  });
}

for (const m of components) {
  const kebab = kebabCase(m.name);
  const name = m.name;

  for (const axes of reflowMatrix(styles, [platform])) {
    test(`${name}: no sideways scroll at the device size, ${axes.style} ${axes.platform} ${axes.lang} ${axes.dir}`, async ({ page }) => {
      const p = profile();
      await openOn(page, kebab, axes, p);
      const r = await page.evaluate(reflowAndTitles);
      const failures = r.overflow > 1 ? [`page scrolls sideways by ${r.overflow}px at ${p.viewport.width} by ${p.viewport.height} (${p.name})`, ...r.wide] : [];
      expect(failures, `${name} reflow on ${p.name} at ${page.url()}`).toEqual([]);
    });
  }
}

// DU2 switches these on once the side column is in ios.css (plan section 5).
// Each title says what it will assert. They stay skipped until then.
const du2: Record<string, string[]> = {
  TabBar: [
    'takes the side column at the inline end on the side profiles (outer full screen, outer landscape Safari, inner landscape) (DU2 switches this on)',
    'stays a bottom capsule on duo-outer-portrait-safari, duo-inner-portrait-safari and duo-inner-split-safari (DU2 switches this on)',
    'column items are 48 by 48 and keep clear of the safe area at the inline end (DU2 switches this on)',
  ],
  Navbar: ['actions join the side column, title stays at the top of the content (DU2 switches this on)'],
  PageShell: ['content and scroll padding at the inline end equal the column, nothing runs under it (DU2 switches this on)'],
  Sheet: ['sits 8 in from the screen edges on the device sizes (DU2 switches this on)'],
};
for (const m of components) {
  for (const title of du2[m.name] ?? []) {
    test.skip(`${m.name}: duo ${title}`, async () => {
      // Intentionally empty until DU2 lands.
    });
  }
}
