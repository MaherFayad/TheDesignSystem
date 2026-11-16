// Functions that run inside the page through page.evaluate. Each one is self
// contained (no reference to anything outside its own body), because
// Playwright sends the function source to the browser. They read plain DOM
// and computed style, so the same probe reads a source page and the gallery.
import type { SideProbe } from './types';

export interface ProbeArg {
  root: string;
  nth?: number;
  probes: { key: string; property: string; sub?: string | null; pseudo?: string }[];
}

/**
 * Reads every probe of one region on one side. The region root is the first
 * visible match of `root` (or the nth visible match). A probe with a `sub`
 * selector reads the first visible match inside the root; `sub: null` means
 * the part does not exist on this side on purpose and reads "absent".
 */
export function probeRegion(arg: ProbeArg): SideProbe {
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const roots = Array.from(document.querySelectorAll(arg.root)).filter(visible);
  const root = roots[arg.nth ?? 0];
  const empty = { x: 0, y: 0, width: 0, height: 0 };
  if (!root) return { found: false, rect: empty, values: {} };
  const rr = root.getBoundingClientRect();
  const px = (v: string, basis: number): number => (v.endsWith('%') ? (parseFloat(v) / 100) * basis : parseFloat(v) || 0);
  const round = (n: number): string => `${Math.round(n * 1000) / 1000}px`;
  const fourOrOne = (list: number[]): string => (list.every((v) => Math.abs(v - (list[0] ?? 0)) < 0.001) ? round(list[0] ?? 0) : list.map(round).join(' '));
  const values: Record<string, string> = {};
  for (const p of arg.probes) {
    if (p.sub === null) {
      values[p.key] = 'absent';
      continue;
    }
    if (p.property === 'count') {
      values[p.key] = String(p.sub ? Array.from(root.querySelectorAll(p.sub)).filter(visible).length : 1);
      continue;
    }
    const el = p.sub ? Array.from(root.querySelectorAll(p.sub)).find(visible) : root;
    if (!el) {
      values[p.key] = '(not found)';
      continue;
    }
    const cs = getComputedStyle(el, p.pseudo ?? null);
    const r = el.getBoundingClientRect();
    values[`${p.key}@fs`] = cs.fontSize;
    const prop = p.property;
    if (prop === 'width' || prop === 'inline-size') values[p.key] = round(r.width);
    else if (prop === 'height' || prop === 'block-size') values[p.key] = round(r.height);
    else if (prop === 'x') values[p.key] = round(el === root ? r.x : r.x - rr.x);
    else if (prop === 'y') values[p.key] = round(el === root ? r.y : r.y - rr.y);
    else if (prop === 'border-radius') {
      const half = Math.min(r.width, r.height) / 2;
      const corners = ['top-left', 'top-right', 'bottom-right', 'bottom-left'].map((c) => {
        const v = (cs.getPropertyValue(`border-${c}-radius`).split(' ')[0] ?? '0px').trim();
        return Math.min(px(v, r.width), half);
      });
      values[p.key] = fourOrOne(corners);
    } else if (prop === 'border-width' || prop === 'padding' || prop === 'margin') {
      const sides = ['top', 'right', 'bottom', 'left'].map((s) => parseFloat(cs.getPropertyValue(prop === 'border-width' ? `border-${s}-width` : `${prop}-${s}`)) || 0);
      values[p.key] = fourOrOne(sides);
    } else if (prop.endsWith('radius')) {
      const half = Math.min(r.width, r.height) / 2;
      values[p.key] = round(Math.min(px((cs.getPropertyValue(prop).split(' ')[0] ?? '0px').trim(), r.width), half));
    } else {
      values[p.key] = cs.getPropertyValue(prop).trim();
    }
  }
  return { found: true, rect: { x: rr.x, y: rr.y, width: rr.width, height: rr.height }, values };
}

/**
 * Boxes to paint over before a pixel diff, relative to the region root: every
 * text run, image, SVG, canvas and video inside it, plus the extra selectors.
 */
export function maskRects(arg: { root: string; nth?: number; text: boolean; extra: string[] }): { x: number; y: number; width: number; height: number }[] {
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const root = Array.from(document.querySelectorAll(arg.root)).filter(visible)[arg.nth ?? 0];
  if (!root) return [];
  const rr = root.getBoundingClientRect();
  const out: { x: number; y: number; width: number; height: number }[] = [];
  const add = (r: DOMRect) => {
    if (r.width > 0 && r.height > 0) out.push({ x: r.x - rr.x, y: r.y - rr.y, width: r.width, height: r.height });
  };
  if (arg.text) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent || n.textContent.trim() === '') continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of Array.from(range.getClientRects())) add(r);
    }
    for (const el of Array.from(root.querySelectorAll('img, svg, canvas, video, picture'))) add(el.getBoundingClientRect());
  }
  for (const sel of arg.extra) for (const el of Array.from(root.querySelectorAll(sel))) add(el.getBoundingClientRect());
  return out;
}

/**
 * Waits until every finite animation and transition on the page has ended,
 * so a probe reads the rest state. Endless ones (spinners) are skipped.
 */
export async function settle(ms: number): Promise<number> {
  const running = document.getAnimations().filter((a) => {
    const timing = a.effect?.getComputedTiming();
    return a.playState === 'running' && timing?.iterations !== Infinity;
  });
  await Promise.race([Promise.all(running.map((a) => a.finished.catch(() => undefined))), new Promise((r) => setTimeout(r, ms))]);
  return running.length;
}
