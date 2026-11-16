// The frame sampler. These functions run inside the page through
// page.evaluate, so each one is self contained: Playwright sends the function
// source to the browser. On every animation frame the sampler reads, for the
// component root, its parts and any surface that opened, the drawn box,
// opacity (own and through every ancestor), transform, colours, clip-path,
// filters and shadow, plus every animation that starts. It also logs the
// pointer, touch and click events with their times, so latency from the
// finger is known. Nothing here changes the page.
import type { AnimationRecord, ElementMeta, Frame, Recording, Snap } from './types';

export interface SamplerConfig {
  /** Selector of the element the finger lands on; the runner marks it with data-perceive-target. */
  target: string;
  root: string | null;
  overlay: string | null;
  headline: string;
  headlineIn: 'root' | 'document';
  scheme: 'light' | 'dark';
}

interface SamplerState {
  frames: Frame[];
  meta: Record<number, ElementMeta>;
  events: [string, number][];
  animations: AnimationRecord[];
  running: boolean;
  stateAtStart?: string;
  stateOf?: () => string;
}

/** Starts sampling. Returns at once; stopSampler ends it and hands the data back. */
export function startSampler(cfg: SamplerConfig): boolean {
  const w = window as unknown as { __perceive?: SamplerState };
  const state: SamplerState = { frames: [], meta: {}, events: [], animations: [], running: true };
  w.__perceive = state;
  const ids = new WeakMap<Element, number>();
  let next = 1;
  const seenAnims = new WeakSet<Animation>();
  const shownAtStart = (sel: string | null): Set<Element> => new Set(sel ? Array.from(document.querySelectorAll(sel)).filter((el) => el.getBoundingClientRect().width > 0) : []);
  // Surfaces already on screen before the finger lands (a demo's open tooltip) are not what the gesture opened.
  const overlayBefore = shownAtStart(cfg.overlay);
  const stateOf = (): string => {
    const t = document.querySelector('[data-perceive-target]');
    const r = t ? ((cfg.root ? t.closest(cfg.root) : t.closest('[data-ds]')) ?? t) : null;
    if (!r) return '';
    const names = ['aria-checked', 'aria-pressed', 'aria-selected', 'aria-expanded', 'data-state', 'data-selected', 'data-checked', 'value'];
    return [r, ...Array.from(r.querySelectorAll('*')).slice(0, 160)].map((el) => names.map((n) => el.getAttribute(n) ?? '').join(',')).join('|');
  };
  state.stateAtStart = stateOf();
  state.stateOf = stateOf;
  const headlineBefore = cfg.headlineIn === 'document' ? shownAtStart(cfg.headline) : new Set<Element>();
  const describe = (el: Element): string => {
    const tag = el.tagName.toLowerCase();
    const part = el.getAttribute('data-part');
    const ds = el.getAttribute('data-ds');
    const role = el.getAttribute('role');
    return `${tag}${ds ? ` ${ds}` : ''}${part ? `/${part}` : ''}${role ? `[${role}]` : ''}`;
  };
  const idOf = (el: Element): number => {
    let id = ids.get(el);
    if (id === undefined) {
      id = next;
      next += 1;
      ids.set(el, id);
    }
    return id;
  };
  for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchend', 'mousedown', 'mouseup', 'click']) {
    window.addEventListener(type, () => state.running && state.events.push([type, performance.now()]), { capture: true, passive: true });
  }
  const clear = (c: string): boolean => c === 'transparent' || /rgba\(\s*0,\s*0,\s*0,\s*0\s*\)/.test(c) || /,\s*0\)$/.test(c) || /\/\s*0\)$/.test(c);
  const paints = (el: Element, cs: CSSStyleDeclaration): number => {
    if (!clear(cs.backgroundColor) || cs.backgroundImage !== 'none' || cs.boxShadow !== 'none' || cs.backdropFilter !== 'none') return 1;
    if (parseFloat(cs.borderTopWidth) > 0 && !clear(cs.borderTopColor)) return 1;
    if (/^(svg|img|input|textarea|canvas|video|path)$/i.test(el.tagName)) return 1;
    if (Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '')) return 1;
    return 0;
  };
  const visibleEl = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const tick = () => {
    if (!state.running) return;
    const t = performance.now();
    const target = document.querySelector('[data-perceive-target]');
    const root = target ? (cfg.root ? target.closest(cfg.root) : target.closest('[data-ds]')) ?? target : null;
    const tracked: { el: Element; group: 'root' | 'overlay' }[] = [];
    const inSet = new Set<Element>();
    const add = (el: Element, group: 'root' | 'overlay') => {
      if (inSet.has(el) || el.getAttribute('data-part') === 'hit' || (el.parentElement?.closest('svg') ?? null) !== null || /^(style|script|template)$/i.test(el.tagName)) return;
      inSet.add(el);
      tracked.push({ el, group });
    };
    if (root) {
      add(root, 'root');
      for (const el of Array.from(root.querySelectorAll('*')).slice(0, 160)) add(el, 'root');
    }
    if (cfg.overlay) {
      for (const ov of Array.from(document.querySelectorAll(cfg.overlay)).filter((el) => !overlayBefore.has(el)).slice(0, 4)) {
        add(ov, 'overlay');
        for (const el of Array.from(ov.querySelectorAll('*')).slice(0, 80)) add(el, 'overlay');
      }
    }
    let headline: Element | null = null;
    if (cfg.headline === 'root') headline = root;
    else if (cfg.headlineIn === 'document') {
      const all = Array.from(document.querySelectorAll(cfg.headline)).filter((el) => !headlineBefore.has(el));
      headline = all.find(visibleEl) ?? all[0] ?? null;
    } else headline = root ? root.querySelector(cfg.headline) : null;
    if (headline && !inSet.has(headline)) add(headline, root && root.contains(headline) ? 'root' : 'overlay');

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const opacityCache = new Map<Element, number>();
    const effOpacity = (el: Element | null): number => {
      if (!el) return 1;
      const hit = opacityCache.get(el);
      if (hit !== undefined) return hit;
      const own = parseFloat(getComputedStyle(el).opacity);
      const v = (Number.isFinite(own) ? own : 1) * effOpacity(el.parentElement);
      opacityCache.set(el, v);
      return v;
    };
    const els: Record<number, Snap> = {};
    for (const { el, group } of tracked) {
      const id = idOf(el);
      if (!state.meta[id]) {
        let parent: number | null = null;
        for (let p = el.parentElement; p; p = p.parentElement) {
          if (inSet.has(p)) {
            parent = idOf(p);
            break;
          }
        }
        state.meta[id] = { id, desc: describe(el), tag: el.tagName.toLowerCase(), part: el.getAttribute('data-part'), ds: el.getAttribute('data-ds'), role: el.getAttribute('role'), group, parent };
      }
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const hidden = cs.visibility === 'hidden' || cs.display === 'none';
      const ix = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
      const iy = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const eo = effOpacity(el);
      els[id] = {
        x: Math.round(r.x * 100) / 100,
        y: Math.round(r.y * 100) / 100,
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        o: Math.round(parseFloat(cs.opacity) * 1000) / 1000,
        eo: Math.round(eo * 1000) / 1000,
        va: hidden ? 0 : Math.round(ix * iy * eo),
        tf: cs.transform,
        bg: cs.backgroundColor,
        c: cs.color,
        bc: cs.borderTopColor,
        bs: cs.boxShadow,
        cp: cs.clipPath,
        f: cs.filter,
        bf: cs.backdropFilter,
        p: paints(el, cs),
      };
    }
    for (const a of document.getAnimations()) {
      if (seenAnims.has(a)) continue;
      seenAnims.add(a);
      const effect = a.effect as KeyframeEffect | null;
      const el = effect?.target ?? null;
      const timing = effect?.getComputedTiming();
      let props: string[] = [];
      let keyEasing = '';
      try {
        const frames = effect?.getKeyframes() ?? [];
        props = Array.from(new Set(frames.flatMap((k) => Object.keys(k).filter((p) => !['offset', 'computedOffset', 'easing', 'composite'].includes(p)))));
        keyEasing = String(frames[0]?.easing ?? '');
      } catch {
        props = [];
      }
      const kind = a.constructor.name;
      const name = kind === 'CSSTransition' ? String((a as unknown as { transitionProperty: string }).transitionProperty) : kind === 'CSSAnimation' ? String((a as unknown as { animationName: string }).animationName) : 'waapi';
      const iterations = Number(timing?.iterations ?? 1);
      // An animation on an untracked node (a path inside an icon) belongs to its nearest tracked ancestor.
      let owner: Element | null = el;
      while (owner && !inSet.has(owner)) owner = owner.parentElement;
      state.animations.push({
        el: owner ? idOf(owner) : null,
        target: el ? describe(el) : '',
        type: kind,
        name,
        props,
        duration: Number(timing?.duration ?? 0) || 0,
        delay: Number(timing?.delay ?? 0) || 0,
        easing: String(effect?.getTiming().easing ?? ''),
        keyEasing,
        iterations: Number.isFinite(iterations) ? iterations : -1,
        firstSeen: t,
      });
    }
    state.frames.push({ t: Math.round(t * 10) / 10, h: headline && inSet.has(headline) ? idOf(headline) : null, els });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return true;
}

/** Stops the sampler and returns what it recorded. */
export function stopSampler(scheme: 'light' | 'dark'): Recording {
  const w = window as unknown as { __perceive?: SamplerState };
  const s = w.__perceive;
  if (!s) return { frames: [], meta: {}, events: [], animations: [], viewport: { width: window.innerWidth, height: window.innerHeight }, scheme };
  s.running = false;
  const stateChanged = s.stateOf ? s.stateOf() !== s.stateAtStart : false;
  return { frames: s.frames, meta: s.meta, events: s.events, animations: s.animations, viewport: { width: window.innerWidth, height: window.innerHeight }, scheme, stateChanged };
}

/** performance.now() in the page, to line the gesture up with the frames. */
export function pageNow(): number {
  return performance.now();
}
