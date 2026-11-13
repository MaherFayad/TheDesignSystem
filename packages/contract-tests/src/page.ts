// Functions that run inside the gallery page through page.evaluate. Each one
// is self contained (no reference to anything outside its own body), because
// Playwright sends the function source to the browser. They read only the
// anatomy attributes (data-ds, data-part, data-*) and plain DOM, never
// framework internals. page.test.ts runs the scans on jsdom.
import type { AnatomyScan, StateHit, VariantRoot } from './lib';

/**
 * The part ownership walk: every data-part under a root, kept only when the
 * nearest ancestor with data-ds is that root. A part on an element that is
 * itself a nested root belongs to the parent, so the walk starts at the
 * parent element.
 */
export function scanAnatomy(arg: { kebab: string; fresh?: boolean }): AnatomyScan {
  const kebab = arg.kebab;
  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const ds = el.getAttribute('data-ds');
    const part = el.getAttribute('data-part');
    const demo = el.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    return `${tag}${ds ? `[data-ds=${ds}]` : ''}${part ? `[data-part=${part}]` : ''}${demo ? ` in case ${demo}` : ''}`;
  };
  const roots = Array.from(document.querySelectorAll(`[data-ds="${kebab}"]`)).filter((r) => !arg.fresh || !r.hasAttribute('data-contract-seen'));
  const parts: AnatomyScan['parts'] = [];
  const rootPart: string[] = [];
  roots.forEach((root, i) => {
    if (root.getAttribute('data-part') === 'root') rootPart.push(describe(root));
    for (const el of Array.from(root.querySelectorAll('[data-part]'))) {
      const owner = el.parentElement ? el.parentElement.closest('[data-ds]') : null;
      if (owner !== root) continue;
      parts.push({ root: i, part: el.getAttribute('data-part') ?? '', where: describe(el) });
    }
  });
  return { roots: roots.length, rootPart, parts };
}

/** Variant attributes on every root, and whether the root sits in the variants case. */
export function scanVariants(arg: { kebab: string; fresh?: boolean; asVariants?: boolean }): { roots: VariantRoot[]; hasVariantsCase: boolean } {
  const kebab = arg.kebab;
  const axes = ['size', 'tone', 'emphasis', 'shape'];
  const found = Array.from(document.querySelectorAll(`[data-ds="${kebab}"]`)).filter((r) => !arg.fresh || !r.hasAttribute('data-contract-seen'));
  const roots = found.map((root) => {
    const attrs: Record<string, string> = {};
    for (const axis of axes) {
      const v = root.getAttribute(`data-${axis}`);
      if (v !== null) attrs[axis] = v;
    }
    const demo = root.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    const where = `${root.tagName.toLowerCase()}[data-ds=${kebab}]${demo ? ` in case ${demo}` : arg.fresh ? ' opened by a trigger' : ''}`;
    return { attrs, inVariants: arg.asVariants === true || demo === 'variants', where };
  });
  return { roots, hasVariantsCase: document.querySelector('[data-demo-case="variants"]') !== null };
}

/** State attributes, data-state and class names on every root and every part the root owns. */
export function scanStates(arg: { kebab: string; booleans: string[]; valued?: string[]; fresh?: boolean }): StateHit[] {
  const out: StateHit[] = [];
  const roots = Array.from(document.querySelectorAll(`[data-ds="${arg.kebab}"]`)).filter((r) => !arg.fresh || !r.hasAttribute('data-contract-seen'));
  for (const root of roots) {
    const owned = Array.from(root.querySelectorAll('[data-part]')).filter((el) => (el.parentElement ? el.parentElement.closest('[data-ds]') : null) === root);
    for (const el of [root, ...owned]) {
      const booleans: Record<string, string> = {};
      for (const attr of arg.booleans) {
        const v = el.getAttribute(attr);
        if (v !== null) booleans[attr] = v;
      }
      const valued: Record<string, string> = {};
      for (const attr of arg.valued ?? []) {
        const v = el.getAttribute(attr);
        if (v !== null) valued[attr] = v;
      }
      const part = el.getAttribute('data-part');
      const demo = el.closest('[data-demo-case]')?.getAttribute('data-demo-case');
      out.push({
        where: `${el.tagName.toLowerCase()}${part ? `[data-part=${part}]` : `[data-ds=${arg.kebab}]`}${demo ? ` in case ${demo}` : ''}`,
        booleans,
        valued,
        dataState: el.getAttribute('data-state'),
        className: el.getAttribute('class') ?? '',
      });
    }
  }
  return out;
}

/**
 * Disabled roots: the root and everything in it is either out of the tab
 * order or carries aria-disabled="true" (on itself or an ancestor inside the
 * root). Returns failures.
 */
export function scanDisabled(kebab: string): { disabledRoots: number; failures: string[] } {
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [tabindex], [contenteditable=""], [contenteditable="true"]';
  const roots = Array.from(document.querySelectorAll(`[data-ds="${kebab}"][data-disabled]`));
  const failures: string[] = [];
  for (const root of roots) {
    const els = [root, ...Array.from(root.querySelectorAll(FOCUSABLE))].filter((el) => el.matches(FOCUSABLE));
    for (const el of els) {
      const h = el as HTMLElement;
      if (h.tabIndex < 0 || el.matches(':disabled') || el.closest('[inert]')) continue;
      const flagged = el.closest('[aria-disabled="true"]');
      if (flagged && (flagged === root || root.contains(flagged))) continue;
      const demo = root.closest('[data-demo-case]')?.getAttribute('data-demo-case');
      failures.push(`${el.tagName.toLowerCase()}${el.getAttribute('data-part') ? `[data-part=${el.getAttribute('data-part')}]` : ''} in a disabled root${demo ? ` in case ${demo}` : ''} is in the tab order without aria-disabled="true"`);
    }
  }
  return { disabledRoots: roots.length, failures };
}

/**
 * Marks with data-contract-target the first enabled root that holds a tab
 * stop (the root itself or a control inside it). With `button` set, only a
 * root that is a button (a button element or role button) counts.
 * Returns a description, or null when there is none.
 */
export function markTarget(arg: { kebab: string; button: boolean; within?: string; fresh?: boolean }): string | null {
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';
  for (const old of Array.from(document.querySelectorAll('[data-contract-target]'))) old.removeAttribute('data-contract-target');
  const scope = arg.within ? document.querySelector(arg.within) : document;
  if (!scope) return null;
  const enabled = (el: Element) =>
    !el.hasAttribute('data-disabled') && !el.hasAttribute('data-loading') && el.getAttribute('aria-disabled') !== 'true' && !el.matches(':disabled');
  const visible = (el: Element) => (typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true);
  const tabbable = (el: Element) => el.matches(FOCUSABLE) && (el as HTMLElement).tabIndex >= 0 && !el.matches(':disabled') && visible(el);
  for (const root of Array.from(scope.querySelectorAll(`[data-ds="${arg.kebab}"]`))) {
    if (arg.fresh && root.hasAttribute('data-contract-seen')) continue;
    if (!enabled(root) || !visible(root)) continue;
    if (arg.button && !(root.tagName === 'BUTTON' || root.getAttribute('role') === 'button')) continue;
    const stop = tabbable(root) ? root : Array.from(root.querySelectorAll(FOCUSABLE)).find(tabbable);
    if (!stop) continue;
    root.setAttribute('data-contract-target', '');
    stop.setAttribute('data-contract-stop', '');
    const demo = root.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    return `${root.tagName.toLowerCase()}[data-ds=${arg.kebab}]${demo ? ` in case ${demo}` : ''}`;
  }
  return null;
}

/** Where focus is, relative to the marked target root. */
export function focusState(): { inTarget: boolean; active: string } {
  const a = document.activeElement;
  const t = document.querySelector('[data-contract-target]');
  const desc = a ? `${a.tagName.toLowerCase()}${a.getAttribute('data-ds') ? `[data-ds=${a.getAttribute('data-ds')}]` : ''}${a.getAttribute('data-part') ? `[data-part=${a.getAttribute('data-part')}]` : ''}` : 'nothing';
  return { inTarget: !!(a && t && (a === t || t.contains(a))), active: desc };
}

/** A snapshot of what a key press may change, read from the focused element and its root. */
export function keySnapshot(arg: string | { kebab: string; attrs?: string[] }): { active: string; value: string | null; states: string } {
  const kebab = typeof arg === 'string' ? arg : arg.kebab;
  // Boolean state attributes the manifest lists (data-zoomed) count as state too.
  const extra = typeof arg === 'string' ? [] : (arg.attrs ?? []);
  const a = document.activeElement as HTMLElement | null;
  const root = a ? a.closest(`[data-ds="${kebab}"]`) : null;
  const read = (el: Element | null) =>
    el ? ['data-state', 'aria-checked', 'aria-selected', 'aria-expanded', 'aria-pressed', 'aria-valuenow', 'data-selected'].map((n) => `${n}=${el.getAttribute(n)}`).join(';') : '';
  let id = a?.getAttribute('data-contract-id');
  if (a && !id) {
    id = String(Math.random()).slice(2);
    a.setAttribute('data-contract-id', id);
  }
  const value = a && 'value' in a ? String((a as HTMLInputElement).value) : a?.getAttribute('aria-valuenow') ?? null;
  return { active: id ?? 'none', value, states: `${read(a)}|${read(root)}|${Array.from(document.querySelectorAll(`[data-ds="${kebab}"]`))
      .map((r) => [r.getAttribute('data-state'), ...extra.map((n) => `${n}=${r.getAttribute(n)}`)].join(';'))
      .join(',')}` };
}

/** Counts click events on an element marked with data-contract-stop. */
export function listenClicks(): boolean {
  const el = document.querySelector('[data-contract-stop]');
  if (!el) return false;
  const w = window as unknown as { __dsClicks: number };
  w.__dsClicks = 0;
  el.addEventListener('click', () => {
    w.__dsClicks += 1;
  });
  return true;
}

export function clickCount(): number {
  return (window as unknown as { __dsClicks?: number }).__dsClicks ?? 0;
}

/** Number of roots with data-state="open". */
export function openRoots(kebab: string): number {
  return document.querySelectorAll(`[data-ds="${kebab}"][data-state="open"]`).length;
}

export interface TargetProbe {
  id: string;
  what: string;
  owner: string;
  w: number;
  h: number;
  /** The element is the only interactive element of a root that is 24px or more, so a click in the root may reach it. */
  probeable: boolean;
}

/**
 * Target size (WCAG 2.5.8), ported from GoBanana's design-target-size gate.
 * Every interactive element inside a demo case is at least 24 by 24 CSS px,
 * counting padding and an absolutely positioned ::before or ::after hit area.
 * The inline exception holds for a link inside a sentence. The spacing
 * exception is not taken: the anatomy contract asks for 24px controls.
 * An undersized element that is the only interactive element of its root
 * is marked probeable: the suite clicks in the root outside the element and
 * counts the root as the hit area only when that click focuses the element
 * (an input inside its box).
 * With `scope` set, it measures the elements that match the scope or sit
 * inside it (the roots a trigger opened, which may render in a portal)
 * instead of the demo cases.
 */
export function undersizedTargets(arg: { scope?: string; min?: number } = {}): TargetProbe[] {
  const MIN = arg.min ?? 24;
  const SELECTOR = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [tabindex], [contenteditable=""], [contenteditable="true"]';
  const NATIVE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/;
  const describe = (el: Element) => {
    const name = (el.getAttribute('aria-label') ?? (el.textContent ?? '').trim()).slice(0, 40);
    const ds = el.getAttribute('data-ds');
    const part = el.getAttribute('data-part');
    const demo = el.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    return `${el.tagName.toLowerCase()}${ds ? `[data-ds=${ds}]` : ''}${part ? `[data-part=${part}]` : ''} "${name}"${demo ? ` in case ${demo}` : ''}`;
  };
  const hitRect = (el: Element) => {
    const r = el.getBoundingClientRect();
    let { left, top, right, bottom } = r;
    for (const pseudo of ['::before', '::after']) {
      const s = getComputedStyle(el, pseudo);
      if (s.content === 'none' || s.content === 'normal' || s.position !== 'absolute' || s.pointerEvents === 'none') continue;
      const w = parseFloat(s.width);
      const h = parseFloat(s.height);
      const x = parseFloat(s.left);
      const y = parseFloat(s.top);
      if ([w, h, x, y].some((n) => Number.isNaN(n))) continue;
      left = Math.min(left, r.left + x);
      top = Math.min(top, r.top + y);
      right = Math.max(right, r.left + x + w);
      bottom = Math.max(bottom, r.top + y + h);
    }
    // The button family's `hit` part (anatomy.md): an empty last child that a
    // platform grows to 44 or 48px. It counts when a press on it reaches the
    // control: the middle of each band it adds outside the box is hit tested.
    const hit = Array.from(el.children).find((c) => c.getAttribute('data-part') === 'hit');
    if (hit && getComputedStyle(hit).display !== 'none' && getComputedStyle(hit).pointerEvents !== 'none') {
      const h = hit.getBoundingClientRect();
      const reaches = (x: number, y: number) => {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return true;
        const at = document.elementFromPoint(x, y);
        return at !== null && (at === el || el.contains(at));
      };
      const cx = (h.left + h.right) / 2;
      const cy = (h.top + h.bottom) / 2;
      const ok = (h.top < r.top - 0.5 ? reaches(cx, (h.top + r.top) / 2) : true) && (h.bottom > r.bottom + 0.5 ? reaches(cx, (h.bottom + r.bottom) / 2) : true) && (h.left < r.left - 0.5 ? reaches((h.left + r.left) / 2, cy) : true) && (h.right > r.right + 0.5 ? reaches((h.right + r.right) / 2, cy) : true);
      if (ok && h.width > 0 && h.height > 0) {
        left = Math.min(left, h.left);
        top = Math.min(top, h.top);
        right = Math.max(right, h.right);
        bottom = Math.max(bottom, h.bottom);
      }
    }
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  };
  for (const old of Array.from(document.querySelectorAll('[data-contract-probe]'))) old.removeAttribute('data-contract-probe');
  const query = arg.scope ? `:is(${arg.scope}) :is(${SELECTOR}), :is(${arg.scope}):is(${SELECTOR})` : `[data-demo-case] :is(${SELECTOR})`;
  const candidates = Array.from(document.querySelectorAll(query)).filter((el) => {
    if (!NATIVE.test(el.tagName) && el.getAttribute('tabindex') === '-1' && el.getAttribute('role') !== 'button') return false;
    if (el.matches(':disabled')) return false;
    if (el.closest('[inert], [hidden], dialog:not([open])')) return false;
    if (typeof el.checkVisibility === 'function' && !el.checkVisibility({ visibilityProperty: true })) return false;
    return true;
  });
  const out: TargetProbe[] = [];
  candidates.forEach((el, i) => {
    let rect = hitRect(el);
    // Visually hidden until focused (a skip link): measure it focused.
    if (rect.width <= 2 || rect.height <= 2) {
      (el as HTMLElement).focus({ preventScroll: true });
      rect = hitRect(el);
      (el as HTMLElement).blur();
    }
    // Still tiny: a visually hidden control whose pointer target is its label.
    if (rect.width <= 2 || rect.height <= 2) return;
    if (rect.width >= MIN - 0.01 && rect.height >= MIN - 0.01) return;
    // Inline exception: a link in running text.
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') {
      let block: Element | null = el.parentElement;
      while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement;
      const own = (el.textContent ?? '').trim().length;
      const all = (block?.textContent ?? '').trim().length;
      if (all > own + 10) return;
    }
    const id = `t${i}`;
    el.setAttribute('data-contract-probe', id);
    const ownerRoot = el.hasAttribute('data-ds') ? el : el.closest('[data-ds]');
    const owner = ownerRoot?.getAttribute('data-ds') ?? 'none';
    const item: TargetProbe = { id, what: describe(el), owner, w: Math.round(rect.width * 10) / 10, h: Math.round(rect.height * 10) / 10, probeable: false };
    if (ownerRoot && ownerRoot !== el) {
      const inRoot = Array.from(ownerRoot.querySelectorAll(SELECTOR)).filter((o) => !o.matches(':disabled'));
      const rr = ownerRoot.getBoundingClientRect();
      item.probeable = inRoot.length === 1 && inRoot[0] === el && rr.width >= MIN - 0.01 && rr.height >= MIN - 0.01;
    }
    out.push(item);
  });
  return out;
}

/**
 * A point inside the root that owns the probed element and outside the
 * element itself, on its short side. Call after scrolling it into view.
 */
export function probePoint(id: string): { x: number; y: number; rootW: number; rootH: number } | null {
  const el = document.querySelector(`[data-contract-probe="${id}"]`);
  const root = el?.parentElement?.closest('[data-ds]');
  if (!el || !root) return null;
  (document.activeElement as HTMLElement | null)?.blur();
  const r = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const size = { rootW: Math.round(rr.width * 10) / 10, rootH: Math.round(rr.height * 10) / 10 };
  if (r.height < 24 && rr.top < r.top - 0.4) return { x: cx, y: (rr.top + r.top) / 2, ...size };
  if (r.height < 24 && rr.bottom > r.bottom + 0.4) return { x: cx, y: (rr.bottom + r.bottom) / 2, ...size };
  if (rr.left < r.left - 0.4) return { x: (rr.left + r.left) / 2, y: cy, ...size };
  if (rr.right > r.right + 0.4) return { x: (rr.right + r.right) / 2, y: cy, ...size };
  return null;
}

/** True when the focused element carries the probe id. */
export function probeFocused(id: string): boolean {
  return document.activeElement?.getAttribute('data-contract-probe') === id;
}

/**
 * Sideways scroll and native title attributes. When the page scrolls
 * sideways, each demo case is shown alone in turn to find the cases that
 * cause it, and the widest text or leaf elements in those cases are named.
 */
export function reflowAndTitles(): { overflow: number; wide: string[]; titles: string[] } {
  const doc = document.documentElement;
  const measure = () => Math.max(doc.scrollWidth, document.body.scrollWidth) - doc.clientWidth;
  const overflow = measure();
  const wide: string[] = [];
  if (overflow > 1) {
    const cases = Array.from(document.querySelectorAll<HTMLElement>('[data-demo-case]'));
    const saved = cases.map((c) => c.style.display);
    for (const c of cases) {
      cases.forEach((o) => (o.style.display = o === c ? saved[cases.indexOf(o)] ?? '' : 'none'));
      const own = measure();
      if (own <= 1) continue;
      const leaves = Array.from(c.querySelectorAll('*'))
        .filter((el) => el.children.length === 0 || Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim().length > 0))
        .map((el) => ({ el, w: el.getBoundingClientRect().width }))
        .filter((x) => {
          if (x.w < 1) return false;
          // A block stretched to its parent's content box is a symptom, not the cause.
          const parent = x.el.parentElement;
          if (!parent) return true;
          const ps = getComputedStyle(parent);
          const inner = parent.clientWidth - parseFloat(ps.paddingInlineStart) - parseFloat(ps.paddingInlineEnd);
          return Math.abs(inner - x.w) > 1;
        })
        .sort((x, y) => y.w - x.w)
        .slice(0, 2)
        .map(({ el, w }) => {
          const owner = el.closest('[data-ds]:not([data-ds="theme"])');
          const part = el.getAttribute('data-part');
          return `${el.tagName.toLowerCase()}${part ? `[data-part=${part}]` : ''}${owner ? ` in [data-ds=${owner.getAttribute('data-ds')}]` : ''} is ${Math.round(w)}px wide, white-space ${getComputedStyle(el).whiteSpace}`;
        });
      wide.push(`case ${c.getAttribute('data-demo-case')} alone scrolls sideways by ${Math.round(own)}px${leaves.length ? `: ${leaves.join('; ')}` : ''}`);
    }
    cases.forEach((c, i) => (c.style.display = saved[i] ?? ''));
  }
  const titles = Array.from(document.querySelectorAll('body [title]')).map((el) => {
    const owner = el.closest('[data-ds]')?.getAttribute('data-ds');
    return `${el.tagName.toLowerCase()} title="${(el.getAttribute('title') ?? '').slice(0, 40)}"${owner ? ` in ${owner}` : ''}`;
  });
  return { overflow, wide, titles };
}

/** The component that owns each axe target, for the report. */
export function axeOwners(targets: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const t of targets) {
    let el: Element | null = null;
    try {
      el = document.querySelector(t);
    } catch {
      el = null;
    }
    const root = el ? el.closest('[data-ds]:not([data-ds="theme"])') : null;
    const demo = el?.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    if (root || demo) out[t] = `${root ? `[data-ds=${root.getAttribute('data-ds')}]` : 'page'}${demo ? ` case ${demo}` : ''}`;
  }
  return out;
}

/**
 * Marks every root on the page as seen, so the roots a trigger adds can be
 * told apart from static examples. Returns how many roots there were.
 */
export function markSeen(kebab: string): number {
  const roots = Array.from(document.querySelectorAll(`[data-ds="${kebab}"]`));
  for (const r of roots) r.setAttribute('data-contract-seen', '');
  return roots.length;
}

/** Roots added since markSeen that are still open (in the DOM and not data-state="closed"). */
export function freshOpen(kebab: string): number {
  return Array.from(document.querySelectorAll(`[data-ds="${kebab}"]:not([data-contract-seen])`)).filter((r) => r.getAttribute('data-state') !== 'closed').length;
}

/** Static examples of an overlay that stamp data-state, which a presentational example must not do. */
export function staticDataState(kebab: string): string[] {
  return Array.from(document.querySelectorAll(`[data-ds="${kebab}"][data-state]`)).map((r) => {
    const demo = r.closest('[data-demo-case]')?.getAttribute('data-demo-case');
    return `${r.tagName.toLowerCase()}[data-ds=${kebab}][data-state=${r.getAttribute('data-state')}]${demo ? ` in case ${demo}` : ''}`;
  });
}

/** Tab stops inside the marked target root. */
export function targetStops(): number {
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"]';
  const t = document.querySelector('[data-contract-target]');
  if (!t) return 0;
  return [t, ...Array.from(t.querySelectorAll(FOCUSABLE))].filter((el) => el.matches(FOCUSABLE) && (el as HTMLElement).tabIndex >= 0 && !el.matches(':disabled')).length;
}

/** True when the marked target root, or something in it, has aria-modal="true". */
export function targetModal(): boolean {
  const t = document.querySelector('[data-contract-target]');
  return !!t && (t.getAttribute('aria-modal') === 'true' || t.querySelector('[aria-modal="true"]') !== null);
}

/**
 * Waits for every finite animation on the page to finish (an open that
 * grows from its button), so sizes are read at rest, not mid scale. Endless
 * animations (a spinner) are left alone.
 */
export async function finiteAnimationsDone(): Promise<number> {
  const finite = document.getAnimations().filter((a) => {
    const end = a.effect?.getComputedTiming().endTime;
    return typeof end === 'number' && Number.isFinite(end);
  });
  await Promise.all(finite.map((a) => a.finished.catch(() => undefined)));
  return finite.length;
}

/**
 * Marks the root that holds focus (the nearest root of this component above
 * the focused element) and returns its box, for the `moves` expectation.
 */
export function markFocusedRoot(kebab: string): { x: number; y: number; dir: 'ltr' | 'rtl' } | null {
  for (const old of Array.from(document.querySelectorAll('[data-contract-moving]'))) old.removeAttribute('data-contract-moving');
  const root = document.activeElement?.closest(`[data-ds="${kebab}"]`);
  if (!root) return null;
  root.setAttribute('data-contract-moving', '');
  const r = root.getBoundingClientRect();
  return { x: r.left, y: r.top, dir: getComputedStyle(root).direction === 'rtl' ? 'rtl' : 'ltr' };
}

/** The box of the root marked by markFocusedRoot, or null when it left the page. */
export function movingRootBox(): { x: number; y: number } | null {
  const root = document.querySelector('[data-contract-moving]');
  if (!root) return null;
  const r = root.getBoundingClientRect();
  return { x: r.left, y: r.top };
}

/**
 * Marks the root that holds focus for the `closes` expectation. Returns false
 * when focus is in no root of this component.
 */
export function markClosing(kebab: string): boolean {
  for (const old of Array.from(document.querySelectorAll('[data-contract-closing]'))) old.removeAttribute('data-contract-closing');
  const root = document.activeElement?.closest(`[data-ds="${kebab}"]`);
  if (!root) return false;
  root.setAttribute('data-contract-closing', '');
  return true;
}

/** True when the marked root left the page, is hidden, or says data-state="closed". */
export function closingDone(): boolean {
  const root = document.querySelector('[data-contract-closing]');
  if (!root) return true;
  if (root.getAttribute('data-state') === 'closed') return true;
  return typeof root.checkVisibility === 'function' ? !root.checkVisibility({ visibilityProperty: true }) : false;
}
