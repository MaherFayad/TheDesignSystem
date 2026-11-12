// The modal behavior Dialog needs, on the CDK: a focus trap that keeps Tab
// inside the top dialog, the focus rule's helpers, a scroll lock and the
// hiding of the rest of the page from assistive tech.
//
// Why not the CDK Dialog or the CDK FocusTrap: both add elements the React
// DOM does not have. The CDK Dialog renders a `cdk-dialog-container` element
// around the content (between the root and the panel, which breaks the
// `[data-ds='dialog'] > [data-part='panel']` selectors), plus the overlay
// container, wrapper and pane. The CDK FocusTrap inserts two focusable
// anchor elements next to the trapped element, which would become children
// of the dialog root. So this file uses the CDK's InteractivityChecker for
// what is tabbable and wraps Tab itself, and Dialog renders through a CDK
// Portal into document.body (see components/dialog/dialog.ts).
import { InteractivityChecker } from '@angular/cdk/a11y';

/** Elements that may take focus. The checker decides which really can. */
const CANDIDATES = 'a[href], area[href], button, input, select, textarea, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** The tab stops inside a scope, in document order. */
export function tabbables(scope: HTMLElement, checker: InteractivityChecker): HTMLElement[] {
  return Array.from(scope.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
    (el) => checker.isFocusable(el, { ignoreVisibility: true }) && checker.isTabbable(el) && shown(el),
  );
}

/** Rendered and not hidden. Where checkVisibility is missing (jsdom) it says yes. */
export function shown(el: Element): boolean {
  if (el.closest('[hidden], [inert]')) return false;
  return typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : true;
}

/**
 * Keeps Tab and Shift+Tab inside the scope: from the last tab stop to the
 * first and back. With no tab stop, focus stays on the scope.
 */
export function wrapTab(event: KeyboardEvent, scope: HTMLElement, checker: InteractivityChecker): void {
  if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
  const stops = tabbables(scope, checker);
  const active = scope.ownerDocument.activeElement;
  const inside = active instanceof Node && scope.contains(active);
  if (stops.length === 0) {
    event.preventDefault();
    scope.focus();
    return;
  }
  const first = stops[0] as HTMLElement;
  const last = stops[stops.length - 1] as HTMLElement;
  if (event.shiftKey && (!inside || active === first || active === scope)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (!inside || active === last)) {
    event.preventDefault();
    first.focus();
  }
}

// ------------------------------------------------------------------ scroll lock

let locks = 0;
let saved: { overflow: string; marginRight: string } | null = null;

/**
 * Stops the page behind from scrolling. The scrollbar's room is kept as a
 * margin, so the page does not shift (what Radix's scroll lock does).
 * Counted: nested dialogs lock once and unlock with the last.
 */
export function lockScroll(doc: Document): () => void {
  const body = doc.body;
  if (locks === 0) {
    const gap = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    saved = { overflow: body.style.overflow, marginRight: body.style.marginRight };
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.marginRight = `${gap}px`;
  }
  locks += 1;
  let done = false;
  return () => {
    if (done) return;
    done = true;
    locks -= 1;
    if (locks === 0 && saved) {
      body.style.overflow = saved.overflow;
      body.style.marginRight = saved.marginRight;
      saved = null;
    }
  };
}

// ------------------------------------------------------------------ hide others

/**
 * Hides every other child of body from assistive tech with aria-hidden, as
 * Radix does, and returns the undo. A live region (a toaster) stays heard.
 */
export function hideOthers(keep: Element): () => void {
  const hidden: Element[] = [];
  const body = keep.ownerDocument.body;
  for (const el of Array.from(body.children)) {
    if (el === keep || el.contains(keep)) continue;
    if (['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(el.tagName)) continue;
    if (el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('aria-live')) continue;
    el.setAttribute('aria-hidden', 'true');
    hidden.push(el);
  }
  return () => {
    for (const el of hidden) el.removeAttribute('aria-hidden');
  };
}

// ------------------------------------------------------------------ exit motion

/**
 * Resolves when every animation running on the elements has finished. With
 * none (reduced motion, a 0ms token, no CSS) it resolves at once, so nothing
 * waits on an animationend that never fires.
 */
export function animationsDone(elements: readonly (Element | null | undefined)[]): Promise<void> {
  const running = elements.flatMap((el) => (el && typeof el.getAnimations === 'function' ? el.getAnimations() : []));
  if (running.length === 0) return Promise.resolve();
  return Promise.all(running.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
}
