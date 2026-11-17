// Device profiles for the folding iPhone (order DU4 of docs/plan/reset-duo.md)
// and the Chromium emulation of its fold, posture and asymmetric safe areas.
//
// Sizes come from the plan's facts table (section 2): the "In Safari" page
// sizes are WebKit's published numbers (S8, verified); the full screen sizes
// are the screen in points (K and S1, verified). Safe area values are not
// published for Safari (section 12): the full screen profiles take the kit's
// layout guide values (K, unverified on the device) and the Safari profiles
// take zero, because Safari keeps the page out of its own side column. The
// fold band is the kit's 40 points across the middle of the inner screen (K).
//
// What works in the bundled Chromium of Playwright 1.63 (Chromium 153), found
// by running it (the self test in fold.test.ts runs the same probe):
//
// - Emulation.setSafeAreaInsetsOverride: works; env(safe-area-inset-*) report
//   the values, and they stay after a navigation and after the session
//   detaches.
// - Emulation.setDevicePostureOverride: works; the device-posture media
//   feature and navigator.devicePosture report folded. After a navigation the
//   media feature stays folded but navigator.devicePosture.type reads
//   continuous again, and a detach clears both, so applyDuo runs again after
//   every navigation and keeps the session open.
// - Emulation.setDisplayFeaturesOverride: accepted (no error) but has no
//   effect: no viewport segments, with or without a device metrics override.
// - Emulation.setDeviceMetricsOverride with its displayFeature field (marked
//   deprecated in the protocol): works; the segment media features,
//   env(viewport-segment-*) and window.viewport.segments report two segments.
//   A detach clears it. This is the fold path applyDuo uses.
//
// WebKit has no protocol for any of this, and the Playwright WebKit build is
// not installed here. For a browser without the protocol, standInDuo writes a
// test only stand in that layout rules can read: data-ds-test-fold and
// data-ds-test-posture on the html element and inline --ds-inset-safe-*
// values on every [data-style] element. It is a stand in, never proof of
// what Safari does.
import { devices, type BrowserContextOptions, type CDPSession, type Page } from '@playwright/test';

export type DuoScreen = 'outer' | 'inner';
export type DuoOrientation = 'portrait' | 'landscape';
/** safari: the page size Safari gives; full: the whole screen; folded: the whole inner screen, partly folded; split: two Safari windows side by side. */
export type DuoMode = 'safari' | 'full' | 'folded' | 'split';

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Fold {
  /** vertical: the band runs top to bottom, two segments side by side (landscape). horizontal: one above the other (portrait). */
  orientation: 'vertical' | 'horizontal';
  /** CSS px from the start of the axis to the band. */
  offset: number;
  /** The band's size in CSS px. */
  mask: number;
}

export interface DuoProfile {
  name: string;
  screen: DuoScreen;
  orientation: DuoOrientation;
  mode: DuoMode;
  viewport: { width: number; height: number };
  /** Safari's large viewport height (toolbars hidden); the viewport above is the small one. Safari profiles only. */
  largeHeight?: number;
  deviceScaleFactor: number;
  /** Physical sides, as env(safe-area-inset-*) reports them. Opposite sides are never assumed equal. */
  safeArea: Insets;
  fold?: Fold;
  posture: 'continuous' | 'folded';
  /** Where the numbers come from, with the plan's source keys and marks. */
  source: string;
}

const NONE: Insets = { top: 0, right: 0, bottom: 0, left: 0 };
const FOLD = { offset: 455, mask: 40 } as const;
const SAFARI = 'Safari page size, small viewport height, from S8 (V). Safe area 0: Safari keeps the page out of its own column; the real values are not published (U).';
const FULL = 'Screen in points from K and S1 (V). Safe area from the kit layout guides (K), not verified in Safari.';

function profile(p: Omit<DuoProfile, 'deviceScaleFactor' | 'posture'> & { posture?: DuoProfile['posture'] }): DuoProfile {
  return { deviceScaleFactor: 3, posture: 'continuous', ...p };
}

/** The eleven profiles: outer and inner, portrait and landscape, Safari and full screen, the inner screen partly folded both ways, and the split window. */
export const DUO_PROFILES: Record<string, DuoProfile> = Object.fromEntries(
  [
    profile({ name: 'duo-outer-portrait-safari', screen: 'outer', orientation: 'portrait', mode: 'safari', viewport: { width: 382, height: 580 }, largeHeight: 618, safeArea: NONE, source: SAFARI }),
    profile({ name: 'duo-outer-landscape-safari', screen: 'outer', orientation: 'landscape', mode: 'safari', viewport: { width: 594, height: 368 }, largeHeight: 406, safeArea: NONE, source: SAFARI }),
    profile({ name: 'duo-inner-portrait-safari', screen: 'inner', orientation: 'portrait', mode: 'safari', viewport: { width: 669, height: 867 }, largeHeight: 902, safeArea: NONE, source: SAFARI }),
    profile({ name: 'duo-inner-landscape-safari', screen: 'inner', orientation: 'landscape', mode: 'safari', viewport: { width: 951, height: 585 }, largeHeight: 620, safeArea: NONE, source: SAFARI }),
    profile({ name: 'duo-inner-split-safari', screen: 'inner', orientation: 'landscape', mode: 'split', viewport: { width: 385, height: 571 }, largeHeight: 609, safeArea: NONE, source: `One of two windows side by side. ${SAFARI}` }),
    profile({ name: 'duo-outer-portrait-full', screen: 'outer', orientation: 'portrait', mode: 'full', viewport: { width: 466, height: 678 }, safeArea: { ...NONE, right: 84 }, source: `${FULL} Column of 84 at the right, full height.` }),
    profile({ name: 'duo-outer-landscape-full', screen: 'outer', orientation: 'landscape', mode: 'full', viewport: { width: 678, height: 466 }, safeArea: { ...NONE, right: 84 }, source: `${FULL} Column of 84 at the right; the other landscape (camera top left) is not shown in the kit.` }),
    profile({ name: 'duo-inner-portrait-full', screen: 'inner', orientation: 'portrait', mode: 'full', viewport: { width: 669, height: 951 }, safeArea: { ...NONE, top: 84, bottom: 95 }, source: `${FULL} Top 84 and bottom 95 from the kit's guide.` }),
    profile({ name: 'duo-inner-landscape-full', screen: 'inner', orientation: 'landscape', mode: 'full', viewport: { width: 951, height: 669 }, safeArea: { ...NONE, right: 84 }, source: `${FULL} Column of 84 at the right.` }),
    profile({ name: 'duo-inner-portrait-folded', screen: 'inner', orientation: 'portrait', mode: 'folded', viewport: { width: 669, height: 951 }, safeArea: { ...NONE, top: 84, bottom: 95 }, fold: { orientation: 'horizontal', ...FOLD }, posture: 'folded', source: `${FULL} Fold band 40 at 455 (K).` }),
    profile({ name: 'duo-inner-landscape-folded', screen: 'inner', orientation: 'landscape', mode: 'folded', viewport: { width: 951, height: 669 }, safeArea: { ...NONE, right: 84 }, fold: { orientation: 'vertical', ...FOLD }, posture: 'folded', source: `${FULL} Fold band 40 at 455 (K).` }),
  ].map((p) => [p.name, p]),
);

/** Short names: duo-outer and duo-inner are the portrait page sizes Safari gives, the default case on the device. */
export const DUO_ALIASES: Record<string, string> = {
  'duo-outer': 'duo-outer-portrait-safari',
  'duo-inner': 'duo-inner-portrait-safari',
  'duo-folded': 'duo-inner-landscape-folded',
};

/** Every name --device takes, aliases included. */
export function deviceNames(): string[] {
  return [...Object.keys(DUO_ALIASES), ...Object.keys(DUO_PROFILES)];
}

/** The profile a name or alias gives, or undefined. */
export function duoProfile(name: string | undefined): DuoProfile | undefined {
  if (!name) return undefined;
  return DUO_PROFILES[DUO_ALIASES[name] ?? name];
}

/**
 * Splits a --device value into profiles. `duo` means every profile. Throws on
 * an unknown name, listing the known ones.
 */
export function parseDevices(value: string): DuoProfile[] {
  const out: DuoProfile[] = [];
  for (const raw of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (raw === 'duo') {
      out.push(...Object.values(DUO_PROFILES));
      continue;
    }
    const p = duoProfile(raw);
    if (!p) throw new Error(`Unknown device ${raw}. Use duo (every profile) or one of: ${deviceNames().join(', ')}`);
    out.push(p);
  }
  return out.filter((p, i) => out.findIndex((q) => q.name === p.name) === i);
}

/**
 * Browser context options for a profile: the iPhone 15 Pro descriptor (user
 * agent, touch, mobile) with the profile's viewport, screen and scale, so
 * `auto` detects ios as on a phone. There is no Playwright descriptor for
 * this phone.
 */
export function duoContextOptions(p: DuoProfile, overrides: { deviceScaleFactor?: number } = {}): BrowserContextOptions {
  const { viewport: _v, defaultBrowserType: _b, ...base } = (devices['iPhone 15 Pro'] ?? {}) as (typeof devices)[string] & { screen?: unknown };
  delete base.screen;
  return { ...base, isMobile: true, hasTouch: true, viewport: { ...p.viewport }, screen: { ...p.viewport }, deviceScaleFactor: overrides.deviceScaleFactor ?? p.deviceScaleFactor };
}

/** The two segments a fold makes, as window.viewport.segments lists them: [x, y, width, height]. One segment without a fold. */
export function expectedSegments(p: DuoProfile, viewport = p.viewport): [number, number, number, number][] {
  const { width, height } = viewport;
  if (!p.fold) return [[0, 0, width, height]];
  const { offset, mask } = p.fold;
  if (p.fold.orientation === 'vertical') return [[0, 0, offset, height], [offset + mask, 0, width - offset - mask, height]];
  return [[0, 0, width, offset], [0, offset + mask, width, height - offset - mask]];
}

/** What the page reports, read by readDuo. */
export interface DuoReading {
  width: number;
  height: number;
  dpr: number;
  /** env(safe-area-inset-*) through padding on a probe element, in px. */
  safeArea: Insets;
  /** --ds-inset-safe-start and -end on the first [data-style] element, when there is one: the token chain. */
  tokens: { start: string; end: string; top: string; bottom: string; dir: string } | null;
  horizontalSegments: number | null;
  verticalSegments: number | null;
  /** env(viewport-segment-width 0 0) and friends, or null when env() has no value. */
  segmentEnv: { width0: number | null; left1: number | null; height0: number | null; top1: number | null };
  /** window.viewport.segments, or null when the API is absent. */
  segments: [number, number, number, number][] | null;
  postureMedia: 'folded' | 'continuous' | null;
  postureApi: string | null;
  /** Set when standInDuo ran: the stand in attributes. */
  standIn: { fold: string | null; posture: string | null };
}

/**
 * Runs in the page. Self contained: Playwright sends the source. No named
 * inner functions: tsx wraps those in a helper the page does not have.
 */
export function readDuo(): DuoReading {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;inset:0 auto auto 0;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);' +
    'margin:env(viewport-segment-width 0 0,-1px) env(viewport-segment-left 1 0,-1px) env(viewport-segment-height 0 0,-1px) env(viewport-segment-top 0 1,-1px);';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const [top = 0, right = 0, bottom = 0, left = 0] = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => parseFloat(v) || 0);
  const safeArea = { top, right, bottom, left };
  // The env() fallback is -1px, so a negative margin means env() has no value.
  const [width0 = null, left1 = null, height0 = null, top1 = null] = [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map((v) => ((parseFloat(v) || 0) < 0 ? null : parseFloat(v) || 0));
  const segmentEnv = { width0, left1, height0, top1 };
  probe.remove();
  const [horizontalSegments = null, verticalSegments = null] = ['horizontal', 'vertical'].map((axis) => [1, 2, 3].find((n) => matchMedia(`(${axis}-viewport-segments: ${n})`).matches) ?? null);
  const posture = matchMedia('(device-posture: folded)').matches ? 'folded' : matchMedia('(device-posture: continuous)').matches ? 'continuous' : null;
  const nav = navigator as Navigator & { devicePosture?: { type: string } };
  const vp = (window as Window & { viewport?: { segments?: { x: number; y: number; width: number; height: number }[] | null } }).viewport;
  const styled = document.querySelector<HTMLElement>('[data-style]');
  const tcs = styled ? getComputedStyle(styled) : null;
  const html = document.documentElement;
  return {
    width: innerWidth,
    height: innerHeight,
    dpr: devicePixelRatio,
    safeArea,
    tokens: tcs
      ? { start: tcs.getPropertyValue('--ds-inset-safe-start').trim(), end: tcs.getPropertyValue('--ds-inset-safe-end').trim(), top: tcs.getPropertyValue('--ds-inset-safe-top').trim(), bottom: tcs.getPropertyValue('--ds-inset-safe-bottom').trim(), dir: tcs.direction }
      : null,
    horizontalSegments,
    verticalSegments,
    segmentEnv,
    segments: vp?.segments ? vp.segments.map((s) => [s.x, s.y, s.width, s.height] as [number, number, number, number]) : null,
    postureMedia: posture,
    postureApi: nav.devicePosture?.type ?? null,
    standIn: { fold: html.getAttribute('data-ds-test-fold'), posture: html.getAttribute('data-ds-test-posture') },
  };
}

/**
 * What differs between a reading and the profile. Empty when every override
 * took effect. With `standIn`, the fold and posture are read from the stand in
 * attributes and the safe area from the tokens, since env() cannot change.
 */
export function duoFindings(p0: DuoProfile, r: DuoReading, opts: { standIn?: boolean; checkSize?: boolean; skipFold?: boolean } = {}): string[] {
  // skipFold: the page is not at the profile size (applyDuo said foldSkipped), so only the safe area and the posture count.
  const p: DuoProfile = opts.skipFold ? { ...p0, fold: undefined } : p0;
  const out: string[] = [];
  if (opts.checkSize !== false && (r.width !== p.viewport.width || r.height !== p.viewport.height)) out.push(`viewport is ${r.width} by ${r.height}, the profile says ${p.viewport.width} by ${p.viewport.height}`);
  if (opts.standIn) {
    const want = p.fold ? p.fold.orientation : null;
    if (r.standIn.fold !== want) out.push(`stand in fold is ${r.standIn.fold ?? 'absent'}, want ${want ?? 'absent'}`);
    const wantPosture = p.posture === 'folded' ? 'folded' : null;
    if (r.standIn.posture !== wantPosture) out.push(`stand in posture is ${r.standIn.posture ?? 'absent'}, want ${wantPosture ?? 'absent'}`);
    if (r.tokens) {
      const rtl = r.tokens.dir === 'rtl';
      const want = { top: p.safeArea.top, bottom: p.safeArea.bottom, start: rtl ? p.safeArea.right : p.safeArea.left, end: rtl ? p.safeArea.left : p.safeArea.right };
      for (const k of ['top', 'bottom', 'start', 'end'] as const) if (parseFloat(r.tokens[k]) !== want[k]) out.push(`--ds-inset-safe-${k} is ${r.tokens[k]}, want ${want[k]}px`);
    } else out.push('no [data-style] element, so the stand in safe area has nowhere to go');
    return out;
  }
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    if (r.safeArea[side] !== p.safeArea[side]) out.push(`env(safe-area-inset-${side}) is ${r.safeArea[side]}px, the profile says ${p.safeArea[side]}px`);
  }
  const fold = p.fold;
  const h = fold?.orientation === 'vertical' ? 2 : 1;
  const v = fold?.orientation === 'horizontal' ? 2 : 1;
  if (r.horizontalSegments !== h) out.push(`(horizontal-viewport-segments) matches ${r.horizontalSegments ?? 'nothing'}, want ${h}`);
  if (r.verticalSegments !== v) out.push(`(vertical-viewport-segments) matches ${r.verticalSegments ?? 'nothing'}, want ${v}`);
  if (fold) {
    const segs = expectedSegments(p, { width: r.width, height: r.height });
    const [a, b] = segs;
    if (a && b) {
      if (fold.orientation === 'vertical' && (r.segmentEnv.width0 !== a[2] || r.segmentEnv.left1 !== b[0])) out.push(`env(viewport-segment-width 0 0) is ${r.segmentEnv.width0}, env(viewport-segment-left 1 0) is ${r.segmentEnv.left1}; want ${a[2]} and ${b[0]}`);
      if (fold.orientation === 'horizontal' && (r.segmentEnv.height0 !== a[3] || r.segmentEnv.top1 !== b[1])) out.push(`env(viewport-segment-height 0 0) is ${r.segmentEnv.height0}, env(viewport-segment-top 0 1) is ${r.segmentEnv.top1}; want ${a[3]} and ${b[1]}`);
    }
    if (r.segments && JSON.stringify(r.segments) !== JSON.stringify(segs)) out.push(`window.viewport.segments is ${JSON.stringify(r.segments)}, want ${JSON.stringify(segs)}`);
  } else if (r.segmentEnv.width0 !== null) out.push(`env(viewport-segment-width 0 0) is ${r.segmentEnv.width0} with no fold`);
  const posture = p.posture;
  if (r.postureMedia !== posture) out.push(`(device-posture) matches ${r.postureMedia ?? 'nothing'}, want ${posture}`);
  if (r.postureApi !== null && r.postureApi !== posture) out.push(`navigator.devicePosture.type is ${r.postureApi}, want ${posture}`);
  return out;
}

/** The protocol session kept per page: a detach clears the fold and the posture, so it stays open while the page lives. */
const sessions = new WeakMap<Page, CDPSession>();

async function sessionFor(page: Page): Promise<CDPSession> {
  let s = sessions.get(page);
  if (!s) {
    s = await page.context().newCDPSession(page);
    sessions.set(page, s);
    page.once('close', () => sessions.delete(page));
  }
  return s;
}

export interface Applied {
  method: 'cdp' | 'stand-in';
  /** Protocol commands sent and whether each was accepted. */
  commands: { command: string; ok: boolean; error?: string }[];
  /** Set when the fold was left out: the page's viewport is not the profile's (a 320px reflow test under a profile). */
  foldSkipped?: string;
}

/**
 * Applies a profile's safe area, posture and fold to a page in Chromium
 * through the DevTools protocol. Call it after every navigation (the posture
 * API resets on navigation). The viewport itself comes from the context
 * options (duoContextOptions); the fold is sent with the page's current
 * viewport size and only when that is the profile's size.
 */
export async function applyDuo(page: Page, p: DuoProfile): Promise<Applied> {
  const browser = page.context().browser()?.browserType().name();
  if (browser && browser !== 'chromium') return standInDuo(page, p);
  const cdp = await sessionFor(page);
  const commands: Applied['commands'] = [];
  const send = async (command: string, params: Record<string, unknown>) => {
    try {
      await cdp.send(command as 'Emulation.setSafeAreaInsetsOverride', params as never);
      commands.push({ command, ok: true });
    } catch (err) {
      commands.push({ command, ok: false, error: err instanceof Error ? err.message.split('\n')[0] : String(err) });
    }
  };
  await send('Emulation.setSafeAreaInsetsOverride', { insets: { ...p.safeArea } });
  if (p.posture === 'folded') await send('Emulation.setDevicePostureOverride', { posture: { type: 'folded' } });
  let foldSkipped: string | undefined;
  if (p.fold) {
    const vp = page.viewportSize();
    if (!vp || vp.width !== p.viewport.width || vp.height !== p.viewport.height) {
      foldSkipped = `the page is ${vp?.width ?? '?'} by ${vp?.height ?? '?'}, not the profile's ${p.viewport.width} by ${p.viewport.height}`;
    } else {
      // The context's own scale (a screenshot run may use 1), so the fold never changes it.
      const scale = await page.evaluate(() => devicePixelRatio);
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: scale,
        mobile: true,
        displayFeature: { orientation: p.fold.orientation, offset: p.fold.offset, maskLength: p.fold.mask },
      });
    }
  }
  // The posture API and the segments update a task later: wait for them, a
  // second at most. A miss is left for duoFindings to report.
  await page
    .waitForFunction(
      (arg) => {
        const nav = navigator as Navigator & { devicePosture?: { type: string } };
        const posture = !nav.devicePosture || nav.devicePosture.type === arg.posture;
        const segments = !arg.fold || matchMedia(`(${arg.fold === 'vertical' ? 'horizontal' : 'vertical'}-viewport-segments: 2)`).matches;
        return posture && segments;
      },
      { posture: p.posture, fold: foldSkipped ? null : (p.fold?.orientation ?? null) },
      { timeout: 1000 },
    )
    .catch(() => undefined);
  return { method: 'cdp', commands, foldSkipped };
}

/** Runs in the page: writes the stand in. Self contained, no named inner functions. */
export function writeStandIn(arg: { fold: string | null; posture: string | null; foldOffset: number | null; foldMask: number | null; safe: Insets }): void {
  const html = document.documentElement;
  for (const [name, v] of [['data-ds-test-fold', arg.fold], ['data-ds-test-posture', arg.posture]] as const) {
    if (v === null) html.removeAttribute(name);
    else html.setAttribute(name, v);
  }
  if (arg.foldOffset !== null && arg.foldMask !== null) {
    html.style.setProperty('--ds-test-fold-offset', `${arg.foldOffset}px`);
    html.style.setProperty('--ds-test-fold-size', `${arg.foldMask}px`);
  } else {
    html.style.removeProperty('--ds-test-fold-offset');
    html.style.removeProperty('--ds-test-fold-size');
  }
  for (const el of [html, ...Array.from(document.querySelectorAll<HTMLElement>('[data-style]'))]) {
    const rtl = getComputedStyle(el).direction === 'rtl';
    el.style.setProperty('--ds-inset-safe-top', `${arg.safe.top}px`);
    el.style.setProperty('--ds-inset-safe-bottom', `${arg.safe.bottom}px`);
    el.style.setProperty('--ds-inset-safe-start', `${rtl ? arg.safe.right : arg.safe.left}px`);
    el.style.setProperty('--ds-inset-safe-end', `${rtl ? arg.safe.left : arg.safe.right}px`);
  }
}

/**
 * STAND IN, not emulation. For an engine without the protocol (WebKit), or
 * to test layout rules without it: sets data-ds-test-fold (vertical or
 * horizontal), data-ds-test-posture (folded), --ds-test-fold-offset and
 * --ds-test-fold-size on the html element, and inline --ds-inset-safe-*
 * values on the html element and every [data-style] element (start and end
 * by each element's direction). env() and the media features do not change,
 * so a rule that reads only them sees nothing. Run it after the page renders.
 */
export async function standInDuo(page: Page, p: DuoProfile): Promise<Applied> {
  await page.evaluate(writeStandIn, { fold: p.fold?.orientation ?? null, posture: p.posture === 'folded' ? 'folded' : null, foldOffset: p.fold?.offset ?? null, foldMask: p.fold?.mask ?? null, safe: p.safeArea });
  return { method: 'stand-in', commands: [] };
}

/**
 * Applies a profile after a navigation and returns what did not take effect
 * (empty when all did). Under a page that is not at the profile size (a 320px
 * reflow test) the size and the fold are left out of the check.
 */
export async function applyAndCheck(page: Page, p: DuoProfile): Promise<{ applied: Applied; findings: string[] }> {
  const applied = await applyDuo(page, p);
  const reading = await page.evaluate(readDuo);
  const skip = !!applied.foldSkipped || reading.width !== p.viewport.width || reading.height !== p.viewport.height;
  const failed = applied.commands.filter((c) => !c.ok).map((c) => `${c.command} failed: ${c.error ?? 'no message'}`);
  return { applied, findings: [...failed, ...duoFindings(p, reading, { standIn: applied.method === 'stand-in', checkSize: !skip, skipFold: skip })] };
}

export interface ProbeLine {
  command: string;
  accepted: boolean;
  /** True when the page reports the override afterwards. */
  effect: boolean;
  detail: string;
}

/**
 * Runs each protocol command on its own on a page at the profile's size and
 * reads what the page reports, for the record: accepted and effective,
 * accepted with no effect, or missing. Leaves the overrides in place; use a
 * fresh page.
 */
export async function probeEmulation(page: Page, p: DuoProfile): Promise<ProbeLine[]> {
  const cdp = await sessionFor(page);
  const out: ProbeLine[] = [];
  const run = async (command: string, params: Record<string, unknown>, effect: (r: DuoReading) => boolean, detail: (r: DuoReading) => string) => {
    let accepted = true;
    let error = '';
    try {
      await cdp.send(command as 'Emulation.setSafeAreaInsetsOverride', params as never);
    } catch (err) {
      accepted = false;
      error = err instanceof Error ? err.message.split('\n')[0] ?? '' : String(err);
    }
    await page.waitForTimeout(50);
    const r = await page.evaluate(readDuo);
    out.push({ command, accepted, effect: accepted && effect(r), detail: accepted ? detail(r) : error });
  };
  const fold = p.fold ?? { orientation: 'vertical' as const, ...FOLD };
  const two = (r: DuoReading) => (fold.orientation === 'vertical' ? r.horizontalSegments : r.verticalSegments) === 2;
  const segs = (r: DuoReading) => `segments ${JSON.stringify(r.segments)}, h ${r.horizontalSegments}, v ${r.verticalSegments}, env width0 ${r.segmentEnv.width0}, height0 ${r.segmentEnv.height0}`;
  await run('Emulation.setDisplayFeaturesOverride', { features: [{ orientation: fold.orientation, offset: fold.offset, maskLength: fold.mask }] }, two, segs);
  await run('Emulation.setDeviceMetricsOverride', { width: p.viewport.width, height: p.viewport.height, deviceScaleFactor: p.deviceScaleFactor, mobile: true, displayFeature: { orientation: fold.orientation, offset: fold.offset, maskLength: fold.mask } }, two, segs);
  await run('Emulation.setDevicePostureOverride', { posture: { type: 'folded' } }, (r) => r.postureMedia === 'folded', (r) => `media ${r.postureMedia}, navigator.devicePosture ${r.postureApi}`);
  await run('Emulation.setSafeAreaInsetsOverride', { insets: { top: 1, right: 84, bottom: 2, left: 0 } }, (r) => r.safeArea.right === 84 && r.safeArea.top === 1 && r.safeArea.bottom === 2 && r.safeArea.left === 0, (r) => `env top ${r.safeArea.top}, right ${r.safeArea.right}, bottom ${r.safeArea.bottom}, left ${r.safeArea.left}`);
  return out;
}
