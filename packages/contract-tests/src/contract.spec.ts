// The contract suite. One set of tests per component manifest that is ready
// for the framework under test (DS_FRAMEWORK, default react), run against the
// gallery at DS_GALLERY_URL. It relies on the URL contract and the anatomy
// attributes only, so the React and the Angular gallery run the same file.
// README.md maps every manifest key to its check.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import {
  anatomyFindings,
  axeMatrix,
  booleanStates,
  defaultStyle,
  demoPath,
  discoverStyles,
  formatAxe,
  kebabCase,
  keyCheckFor,
  loadManifests,
  opensAndCloses,
  optionalParts,
  readyComponents,
  splitKeys,
  stateFindings,
  variantFindings,
  type Axes,
  type AxeViolation,
  type KeyHint,
  type Manifest,
} from './lib';
import {
  axeOwners,
  clickCount,
  focusState,
  keySnapshot,
  listenClicks,
  markTarget,
  openRoots,
  probeFocused,
  probePoint,
  reflowAndTitles,
  scanAnatomy,
  scanDisabled,
  scanStates,
  scanVariants,
  undersizedTargets,
} from './page';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const framework = process.env.DS_FRAMEWORK ?? 'react';
const only = (process.env.DS_COMPONENT ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const manifests = loadManifests(repo);
const styles = discoverStyles(repo);
const base = defaultStyle(manifests, styles);
const baseAxes: Axes = {
  style: base?.id,
  scheme: base ? (base.schemes.includes('dark') ? 'dark' : base.defaultScheme) : undefined,
  dir: 'ltr',
  lang: 'en',
};
/** Set by run.ts after it probed the gallery: kebab to whether /c/<kebab> renders a demo. */
const routes = process.env.DS_ROUTES ? (JSON.parse(process.env.DS_ROUTES) as Record<string, boolean>) : undefined;
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

function note(text: string): void {
  test.info().annotations.push({ type: 'note', description: text });
}

/** Opens a demo. Skips the test when the URL renders no demo case. */
async function open(page: Page, kebab: string, axes: Axes): Promise<void> {
  const path = demoPath(kebab, axes);
  await page.goto(path);
  const found = await page
    .locator('[data-demo-case]')
    .first()
    .waitFor({ state: 'attached', timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!found, `no [data-demo-case] at ${path}: no demo route, or the demo failed to render`);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

/** Opens an overlay through contract.trigger or a [data-demo-trigger] element, when there is one. */
async function openTrigger(page: Page, m: Manifest): Promise<boolean> {
  const selector = m.contract?.trigger ?? '[data-demo-trigger]';
  const trigger = page.locator(selector).first();
  if ((await trigger.count()) === 0) return false;
  await trigger.click();
  return true;
}

async function checkHint(page: Page, kebab: string, key: string, hint: KeyHint, failures: string[]): Promise<void> {
  const scope = hint.case ? `[data-demo-case="${hint.case}"]` : undefined;
  if (hint.focus) {
    const sel = scope ? `${scope} ${hint.focus}` : hint.focus;
    const el = page.locator(sel).first();
    if ((await el.count()) === 0) {
      failures.push(`${key}: contract.keys focus selector ${sel} matches nothing`);
      return;
    }
    await el.evaluate((node) => node.setAttribute('data-contract-stop', ''));
    await el.focus();
  } else {
    const target = await page.evaluate(markTarget, { kebab, button: false, within: scope });
    if (!target) {
      failures.push(`${key}: no enabled root with a tab stop to press it on`);
      return;
    }
    await page.locator('[data-contract-stop]').first().focus();
  }
  if (hint.expect === 'click') await page.evaluate(listenClicks);
  const before = await page.evaluate(keySnapshot, kebab);
  const openBefore = await page.evaluate(openRoots, kebab);
  await page.keyboard.press(key);
  await page.waitForTimeout(100);
  const after = await page.evaluate(keySnapshot, kebab);
  const ok =
    hint.expect === 'focus-moves'
      ? after.active !== before.active
      : hint.expect === 'value-changes'
        ? after.value !== before.value
        : hint.expect === 'state-changes'
          ? after.states !== before.states
          : hint.expect === 'click'
            ? (await page.evaluate(clickCount)) > 0
            : openBefore > 0 && (await page.evaluate(openRoots, kebab)) === 0;
  if (!ok) failures.push(`${key}: expected ${hint.expect}, nothing changed`);
}

const components = readyComponents(manifests, framework, only);

test.describe.configure({ mode: 'parallel' });

if (components.length === 0) {
  test(`no component is ready for ${framework}`, () => {
    test.skip(true, `no manifest has frameworks.${framework}.status ready${only.length ? ` among ${only.join(', ')}` : ''}`);
  });
}

for (const m of components) {
  const kebab = kebabCase(m.name);
  const name = m.name;

  if (routes && routes[kebab] === false) {
    test(`${name}: no gallery route`, () => {
      test.skip(true, `${name} is ready for ${framework} but /c/${kebab} renders no demo case. No contract checks ran.`);
    });
    continue;
  }

  test(`${name}: anatomy`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    if (opensAndCloses(m) || m.contract?.trigger) {
      if (await openTrigger(page, m)) await page.locator(`[data-ds="${kebab}"]`).first().waitFor({ state: 'attached', timeout: 5_000 }).catch(() => undefined);
    }
    const scan = await page.evaluate(scanAnatomy, kebab);
    const optional = optionalParts(m, styles);
    if (optional.length) note(`optional parts: ${optional.join(', ')}`);
    expect(anatomyFindings(m.anatomy ?? ['root'], optional, scan), `${name} anatomy on ${page.url()}`).toEqual([]);
  });

  test(`${name}: variant attributes`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    const { roots, hasVariantsCase } = await page.evaluate(scanVariants, kebab);
    expect(variantFindings(m, roots, hasVariantsCase), `${name} variants on ${page.url()}`).toEqual([]);
  });

  test(`${name}: state attributes`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    if (opensAndCloses(m)) await openTrigger(page, m);
    const hits = await page.evaluate(scanStates, { kebab, booleans: booleanStates(m) });
    expect(stateFindings(m, hits), `${name} states on ${page.url()}`).toEqual([]);
  });

  test(`${name}: keyboard map`, async ({ page }) => {
    const map = m.a11y?.keys ?? {};
    const keys = Object.keys(map).flatMap(splitKeys);
    await open(page, kebab, baseAxes);
    const disabled = await page.evaluate(scanDisabled, kebab);
    test.skip(keys.length === 0 && disabled.disabledRoots === 0, 'no a11y.keys in the manifest and no disabled root in the demo');
    const failures = [...disabled.failures];
    if (disabled.disabledRoots > 0) note(`${disabled.disabledRoots} disabled roots checked for focus`);

    for (const key of keys) {
      const check = keyCheckFor(key, m);
      await page.goto(page.url());
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached' });

      if (check === 'tab' || check === 'shift-tab') {
        const target = await page.evaluate(markTarget, { kebab, button: false });
        if (!target) {
          failures.push(`${key}: no enabled root holds a tab stop`);
          continue;
        }
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        let reached = false;
        let last = '';
        for (let i = 0; i < 300 && !reached; i += 1) {
          await page.keyboard.press('Tab');
          const s = await page.evaluate(focusState);
          reached = s.inTarget;
          last = s.active;
        }
        if (!reached) {
          failures.push(`Tab: never reaches ${target} (focus ended on ${last})`);
          continue;
        }
        if (check === 'shift-tab') {
          await page.keyboard.press('Shift+Tab');
          const s = await page.evaluate(focusState);
          if (s.inTarget) failures.push(`Shift+Tab: focus stays in ${target} (${s.active})`);
        }
        continue;
      }

      if (check === 'activate') {
        const target = await page.evaluate(markTarget, { kebab, button: true });
        if (!target) {
          note(`${key}: not checked, no enabled root is a button (the generic check needs a button element or role button; add contract.keys for others)`);
          continue;
        }
        await page.evaluate(listenClicks);
        await page.locator('[data-contract-stop]').first().focus();
        await page.keyboard.press(key);
        if ((await page.evaluate(clickCount)) < 1) failures.push(`${key}: no click event on ${target}`);
        continue;
      }

      if (check === 'escape') {
        if (!(await openTrigger(page, m))) {
          failures.push(`Escape: no contract.trigger and no [data-demo-trigger] in the demo to open ${name}`);
          continue;
        }
        const opened = await expect
          .poll(() => page.evaluate(openRoots, kebab), { timeout: 5_000 })
          .toBeGreaterThan(0)
          .then(() => true)
          .catch(() => false);
        if (!opened) {
          failures.push(`Escape: the trigger did not open a [data-ds=${kebab}][data-state=open]`);
          continue;
        }
        await page.keyboard.press('Escape');
        const closed = await expect
          .poll(() => page.evaluate(openRoots, kebab), { timeout: 5_000 })
          .toBe(0)
          .then(() => true)
          .catch(() => false);
        if (!closed) failures.push('Escape: the root stays data-state="open"');
        continue;
      }

      const hint = m.contract?.keys?.[key];
      if (check === 'hint' && hint) {
        await checkHint(page, kebab, key, hint, failures);
        continue;
      }
      note(`${key}: not checked, no generic check fits and no contract.keys hint`);
    }
    expect(failures, `${name} keyboard map on ${page.url()}`).toEqual([]);
  });

  test(`${name}: target size`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    const small = await page.evaluate(undersizedTargets);
    const failures: string[] = [];
    for (const t of small) {
      if (t.probeable) {
        await page.locator(`[data-contract-probe="${t.id}"]`).scrollIntoViewIfNeeded();
        const p = await page.evaluate(probePoint, t.id);
        if (p) {
          await page.mouse.click(p.x, p.y);
          if ((await page.evaluate(probeFocused, t.id)) && p.rootW >= 24 && p.rootH >= 24) {
            note(`${t.what} is ${t.w} by ${t.h} px; its root is ${p.rootW} by ${p.rootH} px and a click there focuses it`);
            continue;
          }
        }
      }
      failures.push(`${t.what} (owner ${t.owner}) is ${t.w} by ${t.h} px, under 24 by 24`);
    }
    expect(failures, `${name} target size on ${page.url()}`).toEqual([]);
  });

  for (const axes of [baseAxes, { ...baseAxes, dir: 'rtl', lang: 'ar' } satisfies Axes]) {
    test(`${name}: no sideways scroll at 320px and no title attribute, ${axes.lang} ${axes.dir}`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await open(page, kebab, axes);
      const r = await page.evaluate(reflowAndTitles);
      const failures = [
        ...(r.overflow > 1 ? [`page scrolls sideways by ${r.overflow}px at 320px`, ...r.wide] : []),
        ...r.titles.map((t) => `native title attribute: ${t}`),
      ];
      expect(failures, `${name} reflow on ${page.url()}`).toEqual([]);
    });
  }

  for (const axes of axeMatrix(styles)) {
    test(`${name}: axe, ${axes.style} ${axes.scheme} ${axes.lang} ${axes.dir}`, async ({ page }) => {
      await open(page, kebab, axes);
      const skip = m.contract?.skipAxeRules ?? [];
      if (skip.length) note(`axe rules skipped by the manifest: ${skip.join(', ')}`);
      // @axe-core/playwright types its Page against its own playwright-core copy.
      let builder = new AxeBuilder({ page } as unknown as ConstructorParameters<typeof AxeBuilder>[0]).withTags(AXE_TAGS);
      if (skip.length) builder = builder.disableRules(skip);
      const result = await builder.analyze();
      const violations = result.violations as unknown as AxeViolation[];
      const targets = violations.flatMap((v) => v.nodes.map((n) => n.target.map(String).join(' ')));
      const owners = targets.length ? await page.evaluate(axeOwners, targets) : {};
      expect(formatAxe(violations, owners), `${name} axe on ${page.url()}`).toEqual([]);
    });
  }
}
