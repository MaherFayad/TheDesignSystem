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
  valuedStates,
  DENSITIES,
  defaultStyle,
  demoPath,
  discoverStyles,
  formatAxe,
  kebabCase,
  keyCheckFor,
  loadManifests,
  moveDistance,
  moveFinding,
  opensAndCloses,
  optionalParts,
  readyComponents,
  shiftMovesFurther,
  splitKeys,
  stateFindings,
  trapsFocus,
  triggerSelector,
  openedKebab,
  hasOpenChecks,
  variantFindings,
  type Axes,
  type AxeViolation,
  type Box,
  type KeyHint,
  type Manifest,
} from './lib';
import {
  axeOwners,
  clickCount,
  focusState,
  keySnapshot,
  markClosing,
  closingDone,
  markFocusedRoot,
  movingRootBox,
  listenClicks,
  markTarget,
  freshOpen,
  markSeen,
  openRoots,
  staticDataState,
  targetModal,
  targetStops,
  probeFocused,
  probePoint,
  reflowAndTitles,
  scanAnatomy,
  scanDisabled,
  scanStates,
  scanVariants,
  undersizedTargets,
  finiteAnimationsDone,
  type TargetProbe,
} from './page';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const framework = process.env.DS_FRAMEWORK ?? 'react';
const only = (process.env.DS_COMPONENT ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const manifests = loadManifests(repo);
// DS_STYLES (comma list) narrows the per style loops; DS_STYLE sets the style
// of the checks that run once (variants, states, keys, reflow); DS_PLATFORM
// (web, ios, android) is added to every URL. run.ts sets them from --styles,
// --style and --platform.
const onlyStyles = (process.env.DS_STYLES ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const allStyles = discoverStyles(repo);
const styles = onlyStyles.length ? allStyles.filter((s) => onlyStyles.includes(s.id)) : allStyles;
const base = (process.env.DS_STYLE ? allStyles.find((s) => s.id === process.env.DS_STYLE) : undefined) ?? defaultStyle(manifests, styles);
const platform = process.env.DS_PLATFORM || undefined;
/** The minimum target size in CSS px. 24 is WCAG 2.5.8; DS_TARGET_MIN raises it for a platform pass (44 ios, 48 android). */
const targetMin = Number(process.env.DS_TARGET_MIN || 24);
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
  const path = demoPath(kebab, { ...axes, platform: axes.platform ?? platform });
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

/** True when the component opens and closes and the demo has a trigger for it. */
async function overlayMode(page: Page, m: Manifest): Promise<boolean> {
  return !m.contract?.opens && opensAndCloses(m) && (await page.locator(triggerSelector(m)).count()) > 0;
}

/** True when the open checks can run: the component opens a root (its own or contract.opens) and the demo has a trigger. */
async function openMode(page: Page, m: Manifest): Promise<boolean> {
  return hasOpenChecks(m) && (await page.locator(triggerSelector(m)).count()) > 0;
}

/** The triggers to walk: those in the variants case, else every trigger in the demo. */
async function triggerScope(page: Page, m: Manifest): Promise<{ selector: string; count: number; inVariants: boolean }> {
  const inVariants = `[data-demo-case="variants"] :is(${triggerSelector(m)})`;
  const n = await page.locator(inVariants).count();
  if (n > 0) return { selector: inVariants, count: n, inVariants: true };
  return { selector: triggerSelector(m), count: await page.locator(triggerSelector(m)).count(), inVariants: false };
}

/** Marks the roots on the page as seen, clicks one trigger and waits for a root it adds. */
async function openNth(page: Page, kebab: string, selector: string, i: number): Promise<boolean> {
  await page.evaluate(markSeen, kebab);
  await page.locator(selector).nth(i).click();
  return expect
    .poll(() => page.evaluate(freshOpen, kebab), { timeout: 5_000 })
    .toBeGreaterThan(0)
    .then(() => true)
    .catch(() => false);
}

/** Closes what the trigger opened with Escape; reloads the demo when Escape leaves it open. */
async function closeFresh(page: Page, kebab: string): Promise<void> {
  await page.keyboard.press('Escape');
  const closed = await expect
    .poll(() => page.evaluate(freshOpen, kebab), { timeout: 3_000 })
    .toBe(0)
    .then(() => true)
    .catch(() => false);
  if (!closed) {
    await page.goto(page.url());
    await page.locator('[data-demo-case]').first().waitFor({ state: 'attached' });
  }
}

/**
 * Opens each trigger in turn (the variants case first), runs `fn` while the
 * roots it added are open, then closes them. Returns failures for triggers
 * that open nothing.
 */
async function eachOpened(page: Page, m: Manifest, kebab: string, fn: (inVariants: boolean) => Promise<void>): Promise<string[]> {
  const scope = await triggerScope(page, m);
  const failures: string[] = [];
  for (let i = 0; i < scope.count; i += 1) {
    const label = ((await page.locator(scope.selector).nth(i).textContent()) ?? '').trim().slice(0, 40);
    if (!(await openNth(page, kebab, scope.selector, i))) {
      failures.push(`trigger ${i + 1} "${label}" adds no open [data-ds=${kebab}]`);
      await page.goto(page.url());
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached' });
      continue;
    }
    await fn(scope.inVariants);
    await closeFresh(page, kebab);
  }
  return failures;
}

/** Axe with the contract tags, minus contract.skipAxeRules. One line per failing node. */
async function runAxe(page: Page, m: Manifest): Promise<string[]> {
  const skip = m.contract?.skipAxeRules ?? [];
  if (skip.length) note(`axe rules skipped by the manifest: ${skip.join(', ')}`);
  // @axe-core/playwright types its Page against its own playwright-core copy.
  let builder = new AxeBuilder({ page }).withTags(AXE_TAGS);
  if (skip.length) builder = builder.disableRules(skip);
  const result = await builder.analyze();
  const violations = result.violations as unknown as AxeViolation[];
  const targets = violations.flatMap((v) => v.nodes.map((n) => n.target.map(String).join(' ')));
  const owners = targets.length ? await page.evaluate(axeOwners, targets) : {};
  return formatAxe(violations, owners);
}

async function checkHint(page: Page, m: Manifest, kebab: string, key: string, hint: KeyHint, failures: string[]): Promise<void> {
  const scope = hint.case ? `[data-demo-case="${hint.case}"]` : undefined;
  const openSel = hint.open ? (scope ? `${scope} ${hint.open}` : hint.open) : undefined;
  if (openSel) {
    const opener = page.locator(openSel).first();
    if ((await opener.count()) === 0) {
      failures.push(`${key}: contract.keys open selector ${openSel} matches nothing`);
      return;
    }
    await opener.evaluate((node) => node.setAttribute('data-contract-opener', ''));
    await opener.click();
    await page.waitForTimeout(150);
  }
  if (hint.expect === 'focus-returns') {
    if (!openSel) {
      failures.push(`${key}: expect focus-returns needs an open selector`);
      return;
    }
    await page.keyboard.press(key);
    const back = await expect
      .poll(() => page.evaluate(() => document.activeElement?.hasAttribute('data-contract-opener') ?? false), { timeout: 3_000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
    if (!back) failures.push(`${key}: expected focus back on ${openSel}, it is elsewhere`);
    return;
  }
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
  if (hint.expect === 'moves') {
    await checkMoves(page, m, kebab, key, failures, hint.physical ?? false);
    return;
  }
  if (hint.expect === 'click') await page.evaluate(listenClicks);
  const snapArg = { kebab, attrs: [...booleanStates(m), ...Object.keys(valuedStates(m))] };
  const before = await page.evaluate(keySnapshot, snapArg);
  const openBefore = await page.evaluate(openRoots, kebab);
  const closing = hint.expect === 'closes' ? await page.evaluate(markClosing, kebab) : false;
  await page.keyboard.press(key);
  if (hint.expect === 'closes') {
    // Closed: the root that held focus left the page, hid, or says closed; or every open root closed.
    const closed = await expect
      .poll(async () => (closing && (await page.evaluate(closingDone))) || (openBefore > 0 && (await page.evaluate(openRoots, kebab)) === 0), { timeout: 3_000 })
      .toBe(true)
      .then(() => true)
      .catch(() => false);
    if (!closed) failures.push(`${key}: expected closes, the root stays open`);
    return;
  }
  await page.waitForTimeout(100);
  const after = await page.evaluate(keySnapshot, snapArg);
  const ok =
    hint.expect === 'focus-moves'
      ? after.active !== before.active
      : hint.expect === 'value-changes'
        ? after.value !== before.value
        : hint.expect === 'state-changes'
          ? after.states !== before.states
          : (await page.evaluate(clickCount)) > 0;
  if (!ok) failures.push(`${key}: expected ${hint.expect}, nothing changed`);
}

/** Presses `key` and waits up to 1.5s for the marked root to move; returns the box after. */
async function pressAndMove(page: Page, key: string, dir: 'ltr' | 'rtl', from: Box, physical = false): Promise<Box | null> {
  await page.keyboard.press(key);
  let box: Box | null = null;
  await expect
    .poll(
      async () => {
        box = await page.evaluate(movingRootBox);
        return moveFinding(key, dir, from, box, physical);
      },
      { timeout: 1_500 },
    )
    .toBeNull()
    .catch(() => undefined);
  return box;
}

/**
 * The `moves` expectation: the root that holds focus moves at least 1px in
 * the direction the key names (inline end for ArrowRight, flipped in rtl).
 * For a Shift arrow, when the keyboard map says Shift moves further, the
 * Shift press must move further than the plain arrow from the same place.
 */
async function checkMoves(page: Page, m: Manifest, kebab: string, key: string, failures: string[], physical = false): Promise<void> {
  const start = await page.evaluate(markFocusedRoot, kebab);
  if (!start) {
    failures.push(`${key}: expected moves, but focus is not in a [data-ds=${kebab}]`);
    return;
  }
  const after = await pressAndMove(page, key, start.dir, start, physical);
  const finding = moveFinding(key, start.dir, start, after, physical);
  if (finding) {
    failures.push(finding);
    return;
  }
  if (shiftMovesFurther(m, key) && after) {
    const plain = key.slice('Shift+'.length);
    const shiftDist = moveDistance(key, start.dir, start, after, physical) ?? 0;
    const plainAfter = await pressAndMove(page, plain, start.dir, after, physical);
    const plainDist = plainAfter ? (moveDistance(plain, start.dir, after, plainAfter, physical) ?? 0) : 0;
    if (!(shiftDist > plainDist)) failures.push(`${key}: moved ${Math.round(shiftDist)}px, not further than ${plain} (${Math.round(plainDist)}px), but the keyboard map says Shift moves further`);
  }
}

/**
 * Turns undersized elements into failures. An element that is the only
 * interactive element of a root of 24px or more passes when a click in the
 * root outside the element focuses it (an input inside its box).
 */
async function targetFailures(page: Page, small: TargetProbe[]): Promise<string[]> {
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
  return failures;
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

  for (const style of styles) {
    const axes: Axes = { style: style.id, scheme: style.schemes.includes('dark') ? 'dark' : style.defaultScheme, dir: 'ltr', lang: 'en' };
    test(`${name}: anatomy, ${style.id}`, async ({ page }) => {
      await open(page, kebab, axes);
      const scan = await page.evaluate(scanAnatomy, { kebab });
      const failures: string[] = [];
      if (await overlayMode(page, m)) {
        failures.push(
          ...(await eachOpened(page, m, kebab, async () => {
            const fresh = await page.evaluate(scanAnatomy, { kebab, fresh: true });
            scan.parts.push(...fresh.parts.map((p) => ({ ...p, root: p.root + scan.roots })));
            scan.rootPart.push(...fresh.rootPart);
            scan.roots += fresh.roots;
          })),
        );
        note('anatomy read from the static examples and from every root a trigger opened');
      }
      const optional = optionalParts(m, styles, style.id);
      if (optional.length) note(`optional parts in ${style.id}: ${optional.join(', ')}`);
      failures.push(...anatomyFindings(m.anatomy ?? ['root'], optional, scan));
      expect(failures, `${name} anatomy on ${page.url()}`).toEqual([]);
    });
  }

  test(`${name}: variant attributes`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    const { roots, hasVariantsCase } = await page.evaluate(scanVariants, { kebab });
    const failures: string[] = [];
    if (await overlayMode(page, m)) {
      failures.push(
        ...(await eachOpened(page, m, kebab, async (inVariants) => {
          const fresh = await page.evaluate(scanVariants, { kebab, fresh: true, asVariants: inVariants });
          roots.push(...fresh.roots);
        })),
      );
      note('variants read from the static examples and from every root a trigger in the variants case opened');
    }
    failures.push(...variantFindings(m, roots, hasVariantsCase));
    expect(failures, `${name} variants on ${page.url()}`).toEqual([]);
  });

  test(`${name}: state attributes`, async ({ page }) => {
    await open(page, kebab, baseAxes);
    const booleans = booleanStates(m);
    const valued = Object.keys(valuedStates(m));
    const hits = await page.evaluate(scanStates, { kebab, booleans, valued });
    const failures: string[] = [];
    if (await overlayMode(page, m)) {
      // A static example has no open or closed behavior, so it stamps no data-state.
      failures.push(...(await page.evaluate(staticDataState, kebab)).map((w) => `presentational example stamps data-state: ${w}`));
      failures.push(
        ...(await eachOpened(page, m, kebab, async () => {
          hits.push(...(await page.evaluate(scanStates, { kebab, booleans, valued, fresh: true })));
        })),
      );
    }
    failures.push(...stateFindings(m, hits));
    expect(failures, `${name} states on ${page.url()}`).toEqual([]);
  });

  test(`${name}: keyboard map`, async ({ page }) => {
    const map = m.a11y?.keys ?? {};
    const keys = Object.keys(map).flatMap(splitKeys);
    await open(page, kebab, baseAxes);
    const disabled = await page.evaluate(scanDisabled, kebab);
    test.skip(keys.length === 0 && disabled.disabledRoots === 0, 'no a11y.keys in the manifest and no disabled root in the demo');
    const failures = [...disabled.failures];
    if (disabled.disabledRoots > 0) note(`${disabled.disabledRoots} disabled roots checked for focus`);
    const overlay = await overlayMode(page, m);
    if (overlay) note(`overlay: keys are pressed with the first trigger's root open; focus ${trapsFocus(m) ? 'must stay inside (the manifest says modal)' : 'stays inside only when the open root has aria-modal'}`);

    for (const key of keys) {
      const check = keyCheckFor(key, m);
      await page.goto(page.url());
      await page.locator('[data-demo-case]').first().waitFor({ state: 'attached' });

      if ((check === 'tab' || check === 'shift-tab') && overlay) {
        const scope = await triggerScope(page, m);
        if (!(await openNth(page, kebab, scope.selector, 0))) {
          failures.push(`${key}: the first trigger adds no open [data-ds=${kebab}]`);
          continue;
        }
        const target = await page.evaluate(markTarget, { kebab, button: false, fresh: true });
        if (!target) {
          failures.push(`${key}: the open root holds no tab stop`);
          continue;
        }
        const modal = trapsFocus(m) || (await page.evaluate(targetModal));
        if (modal && !(await page.evaluate(focusState)).inTarget) failures.push(`${key}: focus is not inside the open root after it opens (${(await page.evaluate(focusState)).active})`);
        const before = await page.evaluate(keySnapshot, kebab);
        await page.keyboard.press(key);
        const after = await page.evaluate(keySnapshot, kebab);
        if (after.active === before.active) failures.push(`${key}: focus does not move with the root open`);
        if (modal) {
          const presses = (await page.evaluate(targetStops)) + 2;
          for (let i = 0; i < presses; i += 1) {
            const s = await page.evaluate(focusState);
            if (!s.inTarget) {
              failures.push(`${key}: focus leaves the open modal root after ${i + 1} presses (on ${s.active})`);
              break;
            }
            await page.keyboard.press(key);
          }
        }
        continue;
      }

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
        if (!overlay) {
          failures.push(`Escape: no contract.trigger and no [data-demo-trigger] in the demo to open ${name}`);
          continue;
        }
        const scope = await triggerScope(page, m);
        if (!(await openNth(page, kebab, scope.selector, 0))) {
          failures.push(`Escape: the first trigger adds no open [data-ds=${kebab}]`);
          continue;
        }
        // Escape acts where focus is: move it into the opened root when the open did not.
        if (await page.evaluate(markTarget, { kebab, button: false, fresh: true })) {
          if (!(await page.evaluate(focusState)).inTarget) {
            note('Escape: focus was moved into the opened root before the key press');
            await page.locator('[data-contract-stop]').first().focus();
          }
        }
        await page.keyboard.press('Escape');
        const closed = await expect
          .poll(() => page.evaluate(freshOpen, kebab), { timeout: 5_000 })
          .toBe(0)
          .then(() => true)
          .catch(() => false);
        if (!closed) failures.push('Escape: the root the trigger opened stays open');
        continue;
      }

      const hint = m.contract?.keys?.[key];
      if (check === 'hint' && hint) {
        await checkHint(page, m, kebab, key, hint, failures);
        continue;
      }
      note(`${key}: not checked, no generic check fits and no contract.keys hint`);
    }
    expect(failures, `${name} keyboard map on ${page.url()}`).toEqual([]);
  });

  // Target size (WCAG 2.5.8, 24 by 24 on the web): every style, every
  // density, dark, en ltr. Size does not change with the scheme or the
  // direction, so those are not repeated. Platform ios (44pt) and android
  // (48dp) passes are wave 2 work.
  for (const style of styles) {
    for (const density of DENSITIES) {
      const axes: Axes = { style: style.id, scheme: style.schemes.includes('dark') ? 'dark' : style.defaultScheme, density, dir: 'ltr', lang: 'en' };
      test(`${name}: target size, ${style.id} ${density}`, async ({ page }) => {
        await open(page, kebab, axes);
        await page.evaluate(finiteAnimationsDone);
        const failures = await targetFailures(page, await page.evaluate(undersizedTargets, { min: targetMin }));
        expect(failures, `${name} target size on ${page.url()}`).toEqual([]);
      });
    }
    if (hasOpenChecks(m)) {
      const axes: Axes = { style: style.id, scheme: style.schemes.includes('dark') ? 'dark' : style.defaultScheme, dir: 'ltr', lang: 'en' };
      const target = openedKebab(m, kebab);
      test(`${name}: target size open, ${style.id}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, kebab, axes);
        test.skip(!(await openMode(page, m)), 'no contract.trigger and no [data-demo-trigger] in the demo');
        const failures: string[] = [];
        let opened = 0;
        failures.push(
          ...(await eachOpened(page, m, target, async () => {
            opened += 1;
            await page.evaluate(finiteAnimationsDone);
            const small = await page.evaluate(undersizedTargets, { scope: `[data-ds="${target}"]:not([data-contract-seen])`, min: targetMin });
            failures.push(...(await targetFailures(page, small)).map((f) => `opened by trigger ${opened}: ${f}`));
          })),
        );
        note(`${opened} roots opened and measured`);
        expect(failures, `${name} target size with each trigger's root open on ${page.url()}`).toEqual([]);
      });
    }
  }

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
      expect(await runAxe(page, m), `${name} axe on ${page.url()}`).toEqual([]);
    });
    if (hasOpenChecks(m)) {
      const target = openedKebab(m, kebab);
      test(`${name}: axe open, ${axes.style} ${axes.scheme} ${axes.lang} ${axes.dir}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await open(page, kebab, axes);
        test.skip(!(await openMode(page, m)), 'no contract.trigger and no [data-demo-trigger] in the demo');
        const scope = await triggerScope(page, m);
        expect(await openNth(page, target, scope.selector, 0), `the first trigger opens a [data-ds=${target}]`).toBe(true);
        await page.waitForTimeout(300);
        expect(await runAxe(page, m), `${name} axe with the first trigger's root open on ${page.url()}`).toEqual([]);
      });
    }
  }
}
