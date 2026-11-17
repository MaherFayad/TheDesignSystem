// The DOM side of the refraction on the iOS glass (order F2, proposed): one
// hidden SVG with one filter per size of glass part, kept in step with the
// parts, and the attribute that turns the filter on in CSS.
//
// No window or document at module scope: a framework calls
// `acquireRefraction(document)` after mount, on the client only, and only
// when `refractionSupported` said yes. The map math is in `refraction.ts`.
import {
  REFRACTION_ATTRIBUTE,
  REFRACTION_PROPERTY,
  REFRACTION_SELECTOR,
  refractionFilter,
  refractionId,
  type FilterNode,
  type RefractionShape,
} from './refraction';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Tracked {
  id: string | null;
}

interface FilterEntry {
  node: Element;
  refs: number;
  ready: Promise<void>;
}

interface Manager {
  users: number;
  stop: () => void;
}

const managers = new WeakMap<Document, Manager>();

function createNode(doc: Document, spec: FilterNode): Element {
  const el = doc.createElementNS(SVG_NS, spec.tag);
  for (const [k, v] of Object.entries(spec.attrs)) el.setAttribute(k, v);
  for (const child of spec.children ?? []) el.appendChild(createNode(doc, child));
  return el;
}

/** The layout box and the top start corner of a part, before any transform. */
export function shapeOf(el: Element, view: Pick<Window, 'getComputedStyle'>): RefractionShape | null {
  const html = el as HTMLElement;
  const width = html.offsetWidth;
  const height = html.offsetHeight;
  if (!width || !height || width < 4 || height < 4) return null;
  const raw = view.getComputedStyle(el).borderTopLeftRadius.split(' ')[0] ?? '0';
  const n = Number.parseFloat(raw);
  const radius = Number.isFinite(n) ? (raw.trim().endsWith('%') ? (n / 100) * Math.min(width, height) : n) : 0;
  return { width, height, radius };
}

/** Waits for a map to be decoded, so a filter never runs on an empty map (which would shift the whole backdrop). */
function decoded(doc: Document, href: string): Promise<void> {
  const view = doc.defaultView as (Window & { Image?: typeof Image }) | null;
  if (!view?.Image) return Promise.resolve();
  const img = new view.Image();
  img.src = href;
  return typeof img.decode === 'function' ? img.decode().catch(() => undefined) : Promise.resolve();
}

function start(doc: Document): { stop: () => void; ready: Promise<void> } {
  const view = doc.defaultView;
  const body = doc.body;
  if (!view || !body) return { stop: () => undefined, ready: Promise.resolve() };

  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('data-ds-refraction', '');
  svg.setAttribute('style', 'position:fixed;inset-block-start:0;inset-inline-start:0;inline-size:0;block-size:0;overflow:hidden;pointer-events:none');
  const defs = doc.createElementNS(SVG_NS, 'defs');
  svg.appendChild(defs);
  body.appendChild(svg);

  const filters = new Map<string, FilterEntry>();
  const parts = new Map<Element, Tracked>();
  const dirty = new Set<Element>();
  let scanNeeded = true;
  let frame = 0;
  let stopped = false;

  const release = (id: string | null) => {
    if (!id) return;
    const entry = filters.get(id);
    if (!entry) return;
    entry.refs -= 1;
    if (entry.refs <= 0) {
      entry.node.remove();
      filters.delete(id);
    }
  };

  const acquire = (shape: RefractionShape): { id: string; ready: Promise<void> } => {
    const id = refractionId(shape);
    let entry = filters.get(id);
    if (!entry) {
      const built = refractionFilter(shape);
      const node = createNode(doc, built.node);
      defs.appendChild(node);
      entry = { node, refs: 0, ready: decoded(doc, built.href) };
      filters.set(id, entry);
    }
    entry.refs += 1;
    return { id, ready: entry.ready };
  };

  const resize = typeof view.ResizeObserver === 'function'
    ? new view.ResizeObserver((entries) => {
        for (const e of entries) dirty.add(e.target);
        schedule();
      })
    : null;

  const untrack = (el: Element) => {
    const t = parts.get(el);
    if (!t) return;
    release(t.id);
    parts.delete(el);
    resize?.unobserve(el);
    (el as HTMLElement).style?.removeProperty(REFRACTION_PROPERTY);
  };

  const update = (el: Element): Promise<void> => {
    const t = parts.get(el);
    if (!t) return Promise.resolve();
    const shape = shapeOf(el, view);
    const id = shape ? refractionId(shape) : null;
    if (id === t.id) return Promise.resolve();
    release(t.id);
    t.id = null;
    (el as HTMLElement).style.removeProperty(REFRACTION_PROPERTY);
    if (!shape || !id) return Promise.resolve();
    const got = acquire(shape);
    t.id = got.id;
    return got.ready.then(() => {
      if (!stopped && parts.get(el)?.id === got.id) (el as HTMLElement).style.setProperty(REFRACTION_PROPERTY, `url(#${got.id})`);
    });
  };

  const scan = () => {
    const found = new Set<Element>();
    for (const el of doc.querySelectorAll(REFRACTION_SELECTOR)) {
      // Only a style that takes the platform's glass sets the strength switch.
      if (!parts.has(el) && !view.getComputedStyle(el).getPropertyValue('--_ios-glass').trim()) continue;
      found.add(el);
      if (!parts.has(el)) {
        parts.set(el, { id: null });
        resize?.observe(el);
        dirty.add(el);
      }
    }
    for (const el of [...parts.keys()]) if (!found.has(el)) untrack(el);
  };

  const flush = () => {
    frame = 0;
    if (stopped) return;
    if (scanNeeded) {
      scanNeeded = false;
      scan();
    }
    for (const el of dirty) void update(el);
    dirty.clear();
  };

  function schedule() {
    if (frame || stopped) return;
    frame = view!.requestAnimationFrame(flush);
  }

  const mutations = typeof view.MutationObserver === 'function'
    ? new view.MutationObserver((records) => {
        // Only nodes coming and going can add or drop a part; text and attribute changes cannot.
        if (records.some((r) => r.addedNodes.length > 0 || r.removedNodes.length > 0)) {
          scanNeeded = true;
          schedule();
        }
      })
    : null;
  mutations?.observe(body, { childList: true, subtree: true });

  // The first pass runs now; the attribute that turns the filters on waits for its maps (see acquireRefraction).
  scanNeeded = false;
  scan();
  const first = Promise.all([...dirty].map(update)).then(() => undefined);
  dirty.clear();

  const stop = () => {
    stopped = true;
    if (frame) view.cancelAnimationFrame(frame);
    mutations?.disconnect();
    resize?.disconnect();
    for (const el of [...parts.keys()]) untrack(el);
    svg.remove();
  };
  return { stop, ready: first };
}

/**
 * Turns the refraction on for a document: mounts the filters once, keeps one
 * per size of glass part (a ResizeObserver redraws a part's map when its size
 * or corner changes; parts of the same size share one), and, once the first
 * maps are decoded, sets `data-refraction="true"` on the document element,
 * which the CSS keys on.
 * Several callers share one instance; the returned function releases this
 * caller's hold and the last release takes everything off again.
 */
export function acquireRefraction(doc: Document): () => void {
  let m = managers.get(doc);
  if (!m) {
    const run = start(doc);
    let live = true;
    // The CSS only glass paints until every first map is decoded and set, then the filter takes over in one frame.
    void run.ready.then(() => {
      if (live) doc.documentElement.setAttribute(REFRACTION_ATTRIBUTE, 'true');
    });
    m = {
      users: 0,
      stop: () => {
        live = false;
        doc.documentElement.removeAttribute(REFRACTION_ATTRIBUTE);
        run.stop();
      },
    };
    managers.set(doc, m);
  }
  m.users += 1;
  let released = false;
  return () => {
    if (released || !m) return;
    released = true;
    m.users -= 1;
    if (m.users <= 0) {
      m.stop();
      managers.delete(doc);
    }
  };
}
