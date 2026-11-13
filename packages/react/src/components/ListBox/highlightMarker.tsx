'use client';
// Order 1.23 (interaction round 3) for the selection family: the one
// highlight marker of a list, and the check that draws when a row is chosen.
// Shared by ListBox (and through it Combobox, Autocomplete, MultiSelect and
// TagField), Select, CommandPalette and the menus (DropdownMenu, ContextMenu,
// Menubar). Not exported from the package barrel.
//
// - useHighlightMarker (interaction "highlight-marker"): one aria-hidden
//   element, `data-part="highlight"`, inside the list part. It draws the fill
//   of the lit row and is placed with `transform` from the lit row's offset in
//   the list, so the fill slides from row to row while the rows, their hit
//   areas, their text and their focus ring stay still. The component CSS
//   holds the transition (a CSS transition on transform, timed by tokens);
//   this hook only writes where the marker is:
//     closed or nothing lit   the marker is hidden (opacity 0)
//     first lit row           it jumps there with no motion, then shows
//     lit row moves (pointer) it slides on the snappy spring
//     lit row moves (keys)    it slides over duration.fast, so it never lags
//                             behind the keys
//     rows change (a filter)  it follows the lit row to its new place
//   The size of the marker is written at once (never animated): rows of one
//   list share one height in most lists. Under reduced motion, or when the
//   style turns the interaction off, every move is a jump.
// - drawCheck (interaction "check-draw-pick"): the check of a row that was
//   just chosen draws itself. A stroked glyph (the line set) draws with
//   stroke-dashoffset from its short arm; a filled glyph (the pixel set) is
//   wiped in with clip-path. Never on first paint: the caller plays it on a
//   change only.
//
// Nothing waits on transitionend or animationend.
import { useCallback, useEffect, useRef } from 'react';
import { ANIMATION_ID_PREFIX, readDuration, readEasing, type PatternMode } from '@the-system/motion';
import { useMotion } from '../../internal/motion';

/** The interaction id of the marker (packages/motion/src/interactions/selection.ts). */
export const HIGHLIGHT_MARKER_ID = 'highlight-marker';
/** The interaction id of the drawn check. */
export const CHECK_DRAW_ID = 'check-draw-pick';
/** The selector of the marker inside its list. */
export const MARKER_SELECTOR = ":scope > [data-part='highlight']";

export interface HighlightMarkerOptions {
  /** The rows the marker can light. */
  rows: string;
  /** What makes a row lit, as a selector the row must match. Default `[data-highlighted]`. */
  lit?: string;
  /**
   * A second choice when no row matches `lit`: a menu keeps the row of an open
   * submenu lit while focus is in the submenu.
   */
  fallback?: string;
  /**
   * Follow the pointer over rows that are not lit, for a list that holds focus
   * itself and lights a row on focus only (ListBox alone). The marker then
   * takes `colors.hover`, and `colors.lit` again on the lit row.
   */
  hover?: boolean;
  /** CSS colors for the marker over a lit row and a hovered row, when `hover` is on. */
  colors?: { lit: string; hover: string };
  /** The interaction id the style's preset names. Default highlight-marker. */
  interaction?: string;
}

interface Geometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The ratio of drawn px to CSS px of an element (a CSS zoom or a scale on an ancestor), 1 when unknown. */
export function drawnScale(el: Element): number {
  const w = (el as HTMLElement).offsetWidth;
  if (!w) return 1;
  const r = el.getBoundingClientRect().width / w;
  return Number.isFinite(r) && r > 0 ? r : 1;
}

/**
 * Where `row` sits in `list`, in CSS px of the list's padding box, scroll
 * included, for a marker at inset-inline-start 0. Read from the offset chain,
 * so a running scale of the menu or a CSS zoom on the page does not bend it;
 * from the drawn boxes, scaled back, when the chain does not reach the list.
 */
export function markerGeometry(list: Element, row: Element): Geometry {
  const cs = typeof getComputedStyle === 'function' ? getComputedStyle(list) : null;
  const rtl = cs?.direction === 'rtl';
  const box = row as HTMLElement;
  let x = 0;
  let y = 0;
  let el: HTMLElement | null = box;
  while (el && el !== list) {
    x += el.offsetLeft;
    y += el.offsetTop;
    const parent = el.offsetParent as HTMLElement | null;
    el = parent && list.contains(parent) ? parent : parent === list ? parent : null;
  }
  if (el === list && box.offsetHeight > 0) {
    const width = box.offsetWidth;
    const listW = (list as HTMLElement).clientWidth;
    return { x: rtl ? x + width - listW : x, y, width, height: box.offsetHeight };
  }
  const num = (v: string | undefined) => {
    const n = parseFloat(v ?? '');
    return Number.isFinite(n) ? n : 0;
  };
  const k = drawnScale(list);
  const c = list.getBoundingClientRect();
  const r = row.getBoundingClientRect();
  const ry = (r.top - c.top) / k - num(cs?.borderTopWidth) + list.scrollTop;
  const rx = rtl ? (r.right - c.right) / k + num(cs?.borderRightWidth) : (r.left - c.left) / k - num(cs?.borderLeftWidth);
  return { x: rx, y: ry, width: r.width / k, height: r.height / k };
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Places the marker. `how`: `jump` (no motion), `keys` (fast) or `pointer`
 * (the spring the CSS holds). Exposed for tests.
 */
export function placeMarker(marker: HTMLElement, g: Geometry, how: 'jump' | 'keys' | 'pointer', fastMs = 0): void {
  const s = marker.style;
  if (how === 'jump') s.transition = 'none';
  else if (how === 'keys') s.transitionDuration = `${fastMs}ms`;
  else s.transitionDuration = '';
  s.inlineSize = `${round(g.width)}px`;
  s.blockSize = `${round(g.height)}px`;
  s.transform = `translate(${round(g.x)}px, ${round(g.y)}px)`;
  if (how === 'jump') {
    // Commit the jump before the transition comes back.
    void marker.offsetWidth;
    s.transition = '';
  }
}

type WatchOptions = Required<Pick<HighlightMarkerOptions, 'rows' | 'lit' | 'hover'>> & Pick<HighlightMarkerOptions, 'fallback' | 'colors'>;

function watch(list: HTMLElement, opts: WatchOptions, mode: () => PatternMode): () => void {
  const marker = list.querySelector<HTMLElement>(MARKER_SELECTOR);
  if (!marker) return () => {};
  const doc = list.ownerDocument;
  let shown = false;
  let current: Element | null = null;
  let hovered: Element | null = null;
  let input: 'keys' | 'pointer' = 'pointer';

  const litRow = (): Element | null => {
    const lit = list.querySelector(`:is(${opts.rows}):is(${opts.lit})`);
    if (lit) return lit;
    return opts.fallback ? list.querySelector(`:is(${opts.rows}):is(${opts.fallback})`) : null;
  };

  const update = () => {
    const lit = litRow();
    const row = opts.hover && hovered && hovered.isConnected ? hovered : lit;
    if (!row) {
      if (shown) marker.style.opacity = '0';
      shown = false;
      current = null;
      return;
    }
    const g = markerGeometry(list, row);
    const m = mode();
    let how: 'jump' | 'keys' | 'pointer' = input;
    if (!shown || m !== 'full') how = 'jump';
    const fast = how === 'keys' ? readDuration(marker, 'duration.fast') : 0;
    // A row that stays lit but moved (a filter) follows on the spring, a new row on the input's timing.
    if (row === current && how !== 'jump') how = 'pointer';
    placeMarker(marker, g, how, fast);
    if (opts.colors) marker.style.backgroundColor = row === lit ? opts.colors.lit : opts.colors.hover;
    marker.style.opacity = '1';
    shown = true;
    current = row;
  };

  const observer = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
  // A popup that gets its width after it mounts (Radix measures the trigger) resizes the rows: the marker follows.
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => current && update());
  resize?.observe(list);
  observer?.observe(list, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-highlighted', 'data-state', 'data-disabled'] });
  const onKey = () => {
    input = 'keys';
    // The keys take the marker back from the pointer: it goes to the lit row.
    if (hovered !== null) {
      hovered = null;
      update();
    }
  };
  const onPointer = (event: Event) => {
    input = 'pointer';
    if (!opts.hover) return;
    const row = (event.target as Element | null)?.closest?.(opts.rows) ?? null;
    const next = row && list.contains(row) && !row.matches('[data-disabled]') ? row : null;
    if (next === hovered) return;
    hovered = next;
    update();
  };
  const onLeave = () => {
    if (!opts.hover || hovered === null) return;
    hovered = null;
    update();
  };
  doc.addEventListener('keydown', onKey, true);
  list.addEventListener('pointermove', onPointer);
  list.addEventListener('pointerleave', onLeave);
  update();
  return () => {
    observer?.disconnect();
    resize?.disconnect();
    doc.removeEventListener('keydown', onKey, true);
    list.removeEventListener('pointermove', onPointer);
    list.removeEventListener('pointerleave', onLeave);
  };
}

/**
 * The marker of a list. Render `marker` as the last child of the element that
 * holds the rows and pass `ref` to that element (a ref callback, so a popup
 * that mounts late is followed). The element must be positioned and must
 * make a stacking context (the component CSS does both).
 */
export function useHighlightMarker({ rows, lit = '[data-highlighted]', fallback, hover = false, colors, interaction = HIGHLIGHT_MARKER_ID }: HighlightMarkerOptions) {
  const motion = useMotion();
  const modeRef = useRef(motion.mode);
  modeRef.current = motion.mode;
  const stop = useRef<(() => void) | null>(null);
  useEffect(() => () => stop.current?.(), []);
  const ref = useCallback(
    (el: HTMLElement | null) => {
      stop.current?.();
      stop.current = el ? watch(el, { rows, lit, hover, fallback, colors }, () => modeRef.current(interaction)) : null;
    },
    // colors is read once per list (pass constant strings).
    [rows, lit, hover, fallback, interaction, colors?.lit, colors?.hover],
  );
  return ref;
}

/** The marker element: decorative, last child of the list. */
export function HighlightMarker() {
  return <span data-part="highlight" aria-hidden="true" />;
}

/**
 * Draws the check glyph inside `host` (an svg, or an element that holds one):
 * a stroked path draws from its short arm with stroke-dashoffset, a filled
 * glyph wipes in from the inline start with clip-path, in steps for the pixel
 * set. Returns the animations played.
 */
export function drawCheck(host: Element | null | undefined, mode: PatternMode): Animation[] {
  if (!host || mode === 'none') return [];
  const svg = host instanceof SVGSVGElement ? host : host.querySelector('svg');
  if (!svg || typeof svg.animate !== 'function') return [];
  const id = `${ANIMATION_ID_PREFIX}${CHECK_DRAW_ID}`;
  for (const a of svg.getAnimations?.({ subtree: true } as GetAnimationsOptions) ?? []) if (String(a.id) === id) a.cancel();
  const duration = readDuration(svg, mode === 'reduced' ? 'duration.base' : 'duration.spring-snappy');
  if (mode === 'reduced') return [svg.animate([{ opacity: 0 }, { opacity: 1 }], { id, duration, easing: readEasing(svg, 'ease.out') })];
  const out: Animation[] = [];
  const easing = readEasing(svg, 'ease.out');
  const stroked = svg.getAttribute('stroke') !== null && svg.getAttribute('stroke') !== 'none';
  const paths = Array.from(svg.querySelectorAll('path, polyline'));
  if (stroked && paths.length) {
    for (const p of paths) {
      const geo = p as unknown as SVGGeometryElement;
      const length = typeof geo.getTotalLength === 'function' ? Math.ceil(geo.getTotalLength()) || 24 : 24;
      // From the end of the path backward: the check path of the line set starts at its long arm.
      out.push(
        p.animate([{ strokeDasharray: `${length} ${length}`, strokeDashoffset: `${-length}` }, { strokeDasharray: `${length} ${length}`, strokeDashoffset: '0' }], {
          id,
          duration,
          easing,
        }),
      );
    }
  } else {
    // A filled glyph has no stroke to draw: it is wiped in, in steps for a pixel glyph.
    const pixel = svg.getAttribute('data-set') === 'pixel';
    out.push(svg.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { id, duration, easing: pixel ? 'steps(4, end)' : easing }));
  }
  // The glyph lands: a small pop past its size and back, on the bouncy spring.
  const pop = readDuration(svg, 'duration.spring-bouncy');
  out.push(svg.animate([{ transform: 'scale(0.6)' }, { transform: 'none' }], { id, duration: pop, easing: readEasing(svg, 'ease.spring-bouncy') }));
  return out;
}

/**
 * Review B6 (order 1.23): a menu or a picker popup leaves the DOM at once on
 * close, so a press on its trigger during the exit opens it again at once.
 * Call this with the content node as it is detached (its ref gets null): an
 * inert, aria-hidden copy of the portal layer, the Radix positioning wrapper
 * and the content (data-state closed) is put back in <body>, where the
 * component CSS plays its exit (the `[data-state='closed'][inert]` rule), and
 * it is removed when that animation finishes or is cancelled. Under reduced
 * motion there is no exit animation, so no copy stays. Nothing waits on
 * animationend.
 */
export function exitGhost(node: HTMLElement | null | undefined): void {
  if (!node || !node.isConnected || typeof node.animate !== 'function') return;
  if (node.getAttribute('data-state') !== 'closed') return;
  const wrapper = node.parentElement;
  const layer = wrapper?.parentElement;
  if (!wrapper || !layer || !layer.matches("[data-ds='theme']")) return;
  const r = node.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return;
  const l = layer.cloneNode(false) as HTMLElement;
  const w = wrapper.cloneNode(false) as HTMLElement;
  const g = node.cloneNode(true) as HTMLElement;
  for (const el of [l, w, g, ...Array.from(g.querySelectorAll('[id]'))]) el.removeAttribute('id');
  g.setAttribute('aria-hidden', 'true');
  g.setAttribute('inert', '');
  w.style.pointerEvents = 'none';
  w.append(g);
  l.append(w);
  node.ownerDocument.body.append(l);
  const running = typeof g.getAnimations === 'function' ? g.getAnimations() : [];
  if (running.length === 0) {
    l.remove();
    return;
  }
  const drop = () => l.remove();
  Promise.all(running.map((a) => a.finished)).then(drop, drop);
}

/**
 * Platform hook (order 1.23, for 1.25): where a press landed, in CSS px from
 * the element's inline start and block start, written on the element as
 * `--_<name>-press-x` and `--_<name>-press-y` (the component CSS declares both
 * at 50%), so a platform can grow a ripple from the touch point.
 */
export function setPressPoint(el: HTMLElement, name: string, clientX: number, clientY: number): void {
  const r = el.getBoundingClientRect();
  const k = drawnScale(el);
  const rtl = typeof getComputedStyle === 'function' && getComputedStyle(el).direction === 'rtl';
  const x = (rtl ? r.right - clientX : clientX - r.left) / k;
  const y = (clientY - r.top) / k;
  el.style.setProperty(`--_${name}-press-x`, `${Math.round(x * 100) / 100}px`);
  el.style.setProperty(`--_${name}-press-y`, `${Math.round(y * 100) / 100}px`);
}
