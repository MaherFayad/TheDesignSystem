// The input modality flag (order C3, proposed): one attribute on the
// document element that says whether the last input that moved or used focus
// was a keyboard or a pointer (mouse, pen or touch). CSS reads it where
// :focus-visible cannot tell the two apart: a text field always matches
// :focus-visible, and so does a control that a pointer press sends focus to.
//
//   <html data-modality="keyboard">   after Tab, an arrow key and so on
//   <html data-modality="pointer">    after pointerdown, mousedown or touchstart
//   <html>                            at load and on the server: no attribute
//
// CSS only ever hides a ring under `:root[data-modality='pointer']`, so
// with no attribute (before any input, or with no script) every ring shows as
// it did before the flag (WCAG 2.2 2.4.7).
//
// No window or document at module scope: a framework calls
// `acquireModality(document)` after mount, on the client only. It sets an
// attribute and nothing else, so no component state changes and nothing
// renders again.

/** The attribute on the document element. */
export const MODALITY_ATTRIBUTE = 'data-modality';

/** The values of the attribute. No attribute means no input seen yet. */
export type InputModality = 'keyboard' | 'pointer';

/** Keys that move focus or move within a focused control in every context. */
const NAVIGATION_KEYS = new Set([
  'Tab',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Escape',
  'F6',
]);

/** Keys that use the focused control (press it) unless it takes text. */
const ACTIVATION_KEYS = new Set(['Enter', ' ', 'Spacebar']);

interface KeyLike {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  isComposing?: boolean;
  target?: EventTarget | null;
}

/** True when the target takes typed text, where Enter and Space type or submit and are no sign of keyboard navigation. */
export function takesText(target: EventTarget | null | undefined): boolean {
  const el = target as (Element & { isContentEditable?: boolean; type?: string }) | null | undefined;
  if (!el || typeof el.tagName !== 'string') return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === 'textarea') return true;
  if (tag !== 'input') return false;
  const type = (el.type ?? 'text').toLowerCase();
  return !['button', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'reset', 'submit'].includes(type);
}

/**
 * True when a key press is keyboard use of focus: Tab, the arrows, Home, End,
 * Page Up, Page Down, Escape and F6 anywhere, and Enter or Space on a control
 * that does not take text. Letters, digits, a modifier alone, a shortcut with
 * Control, Meta or Alt, and composition (an input method) are not.
 */
export function isModalityKey(event: KeyLike): boolean {
  if (event.isComposing) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (NAVIGATION_KEYS.has(event.key)) return true;
  if (ACTIVATION_KEYS.has(event.key)) return !takesText(event.target);
  return false;
}

/** The modality the document element carries now, or null before any input. */
export function modalityOf(doc: Document): InputModality | null {
  const v = doc.documentElement.getAttribute(MODALITY_ATTRIBUTE);
  return v === 'keyboard' || v === 'pointer' ? v : null;
}

interface Manager {
  users: number;
  stop: () => void;
}

const managers = new WeakMap<Document, Manager>();

function start(doc: Document): () => void {
  const root = doc.documentElement;
  const set = (value: InputModality) => {
    // Written only on a change, so a run of key presses or taps costs no style work.
    if (root.getAttribute(MODALITY_ATTRIBUTE) !== value) root.setAttribute(MODALITY_ATTRIBUTE, value);
  };
  const onKey = (event: KeyboardEvent) => {
    if (isModalityKey(event)) set('keyboard');
  };
  const onPointer = () => set('pointer');
  // Capture, so a component that stops the event does not hide it; passive, so a touch never waits on this.
  const options: AddEventListenerOptions = { capture: true, passive: true };
  doc.addEventListener('keydown', onKey, options);
  doc.addEventListener('pointerdown', onPointer, options);
  doc.addEventListener('mousedown', onPointer, options);
  doc.addEventListener('touchstart', onPointer, options);
  return () => {
    doc.removeEventListener('keydown', onKey, options);
    doc.removeEventListener('pointerdown', onPointer, options);
    doc.removeEventListener('mousedown', onPointer, options);
    doc.removeEventListener('touchstart', onPointer, options);
    root.removeAttribute(MODALITY_ATTRIBUTE);
  };
}

/**
 * Starts the modality flag for a document: listens (capture, passive) for
 * keydown, pointerdown, mousedown and touchstart and keeps
 * `data-modality` on the document element in step. Several callers share
 * one instance; the returned function releases this caller's hold and the
 * last release removes the listeners and the attribute.
 *
 * React: the root Theme calls it in an effect. Angular: call it once in the
 * browser, for example `afterNextRender(() => acquireModality(document))`
 * in the root `dsTheme` directive, and call the returned function on destroy.
 */
export function acquireModality(doc: Document): () => void {
  let m = managers.get(doc);
  if (!m) {
    m = { users: 0, stop: start(doc) };
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
