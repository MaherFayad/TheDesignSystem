// The Dialog focus rule and the focus return, shared by React and Angular.
// Pure: it reads only the elements it is given (and their ownerDocument),
// never a global window or document, so it runs on any DOM and in tests.
//
// It relies on the dialog anatomy (docs/contracts/anatomy.md):
//   [data-part='panel']   the element with role dialog
//   [data-part='body']    the content, where fields live
//   [data-part='footer']  the actions
//   [data-part='close']   the close control (IconButton or the Desk close light)
// and on two markers:
//   [data-autofocus]      any element that must take focus on open
//   [data-dialog-cancel]  the Cancel action (DialogClose / dsDialogClose)

/** A dialog tone. Only `danger` changes the rule. */
export type DialogFocusTone = 'neutral' | 'danger' | (string & {});

/** The fields the rule looks for in the body. */
export const DIALOG_FIELD_SELECTOR = 'input:not([type="hidden"]), select, textarea';
/** The actions the rule looks for in the footer. */
export const DIALOG_ACTION_SELECTOR = 'button, a[href], [tabindex]:not([tabindex="-1"])';
/** What may take focus when focus returns to an ancestor. */
const FOCUSABLE_SELECTOR =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** Tab stops, for the fallback into `main`. */
const TABBABLE_SELECTOR =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/** Rendered, not hidden, not inert and not natively disabled. Where checkVisibility is missing (jsdom) it says yes. */
function usable(el: Element): el is HTMLElement {
  if (!('focus' in el) || typeof (el as HTMLElement).focus !== 'function') return false;
  if (el.matches(':disabled') || el.closest('[hidden], [inert]')) return false;
  return typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true;
}

function first(scope: Element | null | undefined, selector: string, enabledOnly = false): HTMLElement | null {
  if (!scope) return null;
  for (const el of Array.from(scope.querySelectorAll(selector))) {
    if (!usable(el)) continue;
    if (enabledOnly && el.getAttribute('aria-disabled') === 'true') continue;
    return el;
  }
  return null;
}

/** The first `[data-part=<part>]` that belongs to this panel (not to a dialog nested inside it). */
function own(panel: Element, part: string): Element | null {
  return Array.from(panel.querySelectorAll(`[data-part="${part}"]`)).find((el) => el.closest('[data-part="panel"]') === panel) ?? null;
}

/**
 * Where focus goes when a dialog opens (manifest Dialog a11y.focus):
 *
 * 1. an element marked `data-autofocus`;
 * 2. else the first field in the body;
 * 3. else, in a danger dialog, the Cancel action (`data-dialog-cancel`), or
 *    the first footer action that is not tone danger: never a destructive one;
 * 4. else, in any other tone, the first footer action that is not tone
 *    danger, then the first enabled footer action, then any footer action;
 * 5. else the close control (`data-part="close"`).
 *
 * Null means none of these: the caller focuses the first tab stop or the
 * panel itself.
 */
export function dialogInitialFocus(panel: HTMLElement, tone: DialogFocusTone = 'neutral'): HTMLElement | null {
  const marked = first(panel, '[data-autofocus]');
  if (marked) return marked;
  const field = first(own(panel, 'body'), DIALOG_FIELD_SELECTOR);
  if (field) return field;
  const footer = own(panel, 'footer');
  const safe = first(footer, `:is(${DIALOG_ACTION_SELECTOR}):not([data-tone="danger"])`, true);
  if (tone === 'danger') {
    const cancel = first(panel, '[data-dialog-cancel]') ?? safe;
    if (cancel) return cancel;
  } else {
    const action = safe ?? first(footer, DIALOG_ACTION_SELECTOR, true) ?? first(footer, DIALOG_ACTION_SELECTOR);
    if (action) return action;
  }
  return Array.from(panel.querySelectorAll('[data-part="close"]')).find(usable) ?? null;
}

/** Where focus should go back when a dialog closes, captured when it opens. */
export interface FocusReturn {
  /** The element that had focus, or the trigger. */
  readonly target: HTMLElement | null;
  /** Its ancestors at open time, nearest first, up to (not including) <body>. */
  readonly path: readonly HTMLElement[];
}

/**
 * Captures the return target and its ancestors when a dialog opens, so the
 * fallback can find a place near it once it is gone. Pass the trigger, or
 * the element that had focus (ownerDocument.activeElement). <body> and null
 * give an empty capture.
 */
export function captureFocusReturn(target: Element | null | undefined): FocusReturn {
  if (!target || !('focus' in target) || target === target.ownerDocument.body) return { target: null, path: [] };
  const path: HTMLElement[] = [];
  for (let el = target.parentElement; el && el !== el.ownerDocument.body; el = el.parentElement) path.push(el);
  return { target: target as HTMLElement, path };
}

/**
 * The element to focus when the dialog closes:
 *
 * 1. the captured target, when it is still connected;
 * 2. else the nearest ancestor of it that is still connected and can take
 *    focus (a row, a list with a tabindex);
 * 3. else the first focusable element of `main` in that document;
 * 4. else the body.
 *
 * Returns null only when there is no document to fall back to (an empty
 * capture with no `doc`). Focusing the body moves focus nowhere; the caller
 * may blur the active element instead.
 */
export function focusReturnTarget(memo: FocusReturn, doc?: Document | null): HTMLElement | null {
  const { target, path } = memo;
  if (target?.isConnected) return target;
  for (const el of path) if (el.isConnected && el.matches(FOCUSABLE_SELECTOR) && usable(el)) return el;
  const owner = doc ?? target?.ownerDocument ?? null;
  if (!owner) return null;
  const main = owner.querySelector('main');
  return first(main, TABBABLE_SELECTOR) ?? owner.body;
}
