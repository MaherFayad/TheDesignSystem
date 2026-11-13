// Digit roll (orders 1.22 and 1.23): a number changes digit by digit. Each changed
// character rolls in its own column, from below when the value grew and from
// above when it fell, the old character rolling out the other way. Columns
// start one stagger step apart from the last digit toward the first, so a
// carry ripples like an odometer. Unchanged characters stay still.
//
// The host is a decorative element the primitive owns: the component renders
// it empty with `aria-hidden="true"` next to the real value in a visually
// hidden span (or keeps the value as the accessible name), so assistive
// technology reads the number once and never the columns.
//
//   renderDigits(host, '1,240');                // first paint, no motion
//   rollDigits(host, '1,240', '1,277', { direction: 'up' });
//
// - Width: the host uses tabular figures, so a change of value never shifts
//   the layout unless the number of characters changes.
// - A second change while a roll plays rebuilds the columns from the new
//   value and rolls from the value as drawn: nothing stacks.
// - Reduced: the new characters fade in with no travel. Mode `none`: the text
//   changes at once.
// - Right to left (order 1.23, review B4): each number run is its own left to
//   right isolated box and only digits roll; other text stays one node, so a
//   page "16" never reads "61" and Arabic words keep their joined letters.
// - Studio's spring eases are steps, so its digits flip in hard cuts.
import { fadeOnly, played, resolveMode, run, spec, springTiming, STAGGER_DELAY, STAGGER_MAX_STEPS, stepsWithin, type PrimitiveOptions } from './shared';

/** The id of every animation a digit roll starts. */
export const DIGIT_ROLL_ID = 'digit-roll';

/** One column of a roll: the character before and after, aligned from the end. */
export interface DigitSlot {
  from: string;
  to: string;
  changed: boolean;
}

/** Aligns two strings from their end (the last digit first) into columns. */
export function digitSlots(from: string, to: string): DigitSlot[] {
  const a = [...from];
  const b = [...to];
  const n = Math.max(a.length, b.length);
  const out: DigitSlot[] = [];
  for (let i = 0; i < n; i++) {
    const f = a[a.length - n + i] ?? '';
    const t = b[b.length - n + i] ?? '';
    out.push({ from: f, to: t, changed: f !== t });
  }
  return out;
}

/** `up` when the second value is larger, read as numbers (digits only). Equal or not numeric: `up`. */
export function rollDirection(from: string, to: string): 'up' | 'down' {
  const num = (s: string) => Number.parseFloat(s.replace(/[^\d.-]/g, ''));
  const a = num(from);
  const b = num(to);
  return Number.isFinite(a) && Number.isFinite(b) && b < a ? 'down' : 'up';
}

const COLUMN = 'data-digit';
const LEAVING = 'data-digit-out';

function column(doc: Document, ch: string): HTMLElement {
  const col = doc.createElement('span');
  col.setAttribute(COLUMN, '');
  col.style.display = 'inline-block';
  col.style.position = 'relative';
  col.style.overflow = 'clip';
  col.style.whiteSpace = 'pre';
  col.style.verticalAlign = 'bottom';
  const inner = doc.createElement('span');
  inner.style.display = 'inline-block';
  inner.textContent = ch;
  col.append(inner);
  return col;
}

function prepareHost(host: HTMLElement): void {
  host.style.fontVariantNumeric = 'tabular-nums';
  host.style.display = host.style.display || 'inline-block';
  host.style.whiteSpace = 'nowrap';
}

/** A run of the value: a number (rolls digit by digit) or other text (never split). */
export interface DigitSegment {
  kind: 'number' | 'text';
  value: string;
}

/** Western and Arabic Indic digits, with the separators that sit inside a number. */
const NUMBER_RUN = /[0-9\u0660-\u0669](?:[0-9\u0660-\u0669,.\u066B\u066C]*[0-9\u0660-\u0669])?/g;

/**
 * Splits a value into number runs and text runs (order 1.23, review B4).
 * Only the digits of a number roll; a word such as "ريال" or "نتيجة" stays
 * one text node, so Arabic letters keep joining.
 */
export function digitSegments(text: string): DigitSegment[] {
  const out: DigitSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER_RUN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: 'text', value: text.slice(last, i) });
    out.push({ kind: 'number', value: m[0] });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', value: text.slice(last) });
  return out;
}

const RUN = 'data-digit-run';

/**
 * A number run: its own left to right, isolated box, as `bdi dir="ltr"`
 * does, so its columns read 1, 6 and never 6, 1 on a right to left line
 * (review B4). The run as a whole still sits where the bidi algorithm puts
 * a number in the line.
 */
function numberRun(doc: Document, value: string): HTMLElement {
  const run = doc.createElement('span');
  run.setAttribute(RUN, '');
  run.style.direction = 'ltr';
  run.style.unicodeBidi = 'isolate';
  run.style.display = 'inline-block';
  run.append(...[...value].map((ch) => column(doc, ch)));
  return run;
}

function textRun(doc: Document, value: string): HTMLElement {
  const t = doc.createElement('span');
  t.style.whiteSpace = 'pre';
  t.textContent = value;
  return t;
}

/** Writes a value into the host as still columns. */
export function renderDigits(host: HTMLElement, text: string): void {
  prepareHost(host);
  if (typeof host.getAnimations === 'function') for (const a of host.getAnimations({ subtree: true } as GetAnimationsOptions)) a.cancel();
  const doc = host.ownerDocument;
  host.replaceChildren(...digitSegments(text).map((seg) => (seg.kind === 'number' ? numberRun(doc, seg.value) : textRun(doc, seg.value))));
}

export interface DigitRollOptions extends PrimitiveOptions {
  /** Default: from the numbers. */
  direction?: 'up' | 'down';
}

/**
 * Rolls the host from one value to the next. Returns the animations it
 * started. The number runs of the two values pair by position; when they do
 * not pair (a run came or went), the new value shows at once.
 */
export function rollDigits(host: HTMLElement, from: string, to: string, opts: DigitRollOptions = {}): Animation[] {
  const mode = resolveMode(opts);
  renderDigits(host, to);
  if (mode === 'none' || from === to) return [];
  const prefix = opts.prefix ?? 'ds';
  const fromRuns = digitSegments(from).filter((s) => s.kind === 'number');
  const toRuns = digitSegments(to).filter((s) => s.kind === 'number');
  if (fromRuns.length !== toRuns.length || toRuns.length === 0) return [];
  const runs = [...host.querySelectorAll<HTMLElement>(`[${RUN}]`)];
  const dir = opts.direction ?? rollDirection(from, to);
  const sign = dir === 'up' ? 1 : -1;
  // Every changed column of every run, the last digit first, so a carry ripples.
  const pairs: { slot: DigitSlot; col: HTMLElement }[] = [];
  toRuns.forEach((r, k) => {
    const slots = digitSlots(fromRuns[k]!.value, r.value);
    const cols = [...(runs[k]?.children ?? [])] as HTMLElement[];
    // Columns that only exist in the new value sit at the start of `slots` when
    // the value got longer; columns that left are dropped (the width changes).
    const offset = slots.length - cols.length;
    slots.forEach((slot, i) => {
      const col = cols[i - offset];
      if (slot.changed && col) pairs.push({ slot, col });
    });
  });
  pairs.reverse();
  const out: (Animation | null)[] = [];
  let changed = 0;
  // The digits are text: the ripple fits the stagger budget (STAGGER_BUDGET_MS).
  const maxSteps = stepsWithin(host, STAGGER_MAX_STEPS, prefix);
  for (const { slot, col } of pairs) {
    const step = Math.min(changed, maxSteps);
    changed += 1;
    const inner = col.firstElementChild as HTMLElement | null;
    const delay = mode === 'full' && step > 0 ? { delay: STAGGER_DELAY, delaySteps: step, fill: 'backwards' as FillMode } : {};
    if (mode === 'reduced') {
      out.push(run(inner, fadeOnly('enter'), DIGIT_ROLL_ID, prefix));
      continue;
    }
    out.push(
      run(
        inner,
        spec(
          [
            { transform: `translateY(${100 * sign}%)`, opacity: 0 },
            { transform: 'none', opacity: 1 },
          ],
          springTiming('snappy'),
          delay,
        ),
        DIGIT_ROLL_ID,
        prefix,
      ),
    );
    if (slot.from.trim()) {
      const old = host.ownerDocument.createElement('span');
      old.setAttribute(LEAVING, '');
      old.style.position = 'absolute';
      old.style.insetInlineStart = '0';
      old.style.insetBlockStart = '0';
      old.textContent = slot.from;
      col.append(old);
      const a = run(
        old,
        spec(
          [
            { transform: 'none', opacity: 1 },
            { transform: `translateY(${-100 * sign}%)`, opacity: 0 },
          ],
          springTiming('snappy'),
          { ...delay, fill: 'both' },
        ),
        `${DIGIT_ROLL_ID}-out`,
        prefix,
      );
      out.push(a);
      // The leaving character is removed when its roll ends or is cancelled.
      const drop = () => old.remove();
      if (a) a.finished.then(drop, drop);
      else drop();
    }
  }
  return played(out);
}
