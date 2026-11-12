// The copy logic of CopyButton, apart from React. Runs only inside a click
// handler: nothing here touches window or navigator at module scope.

/**
 * Copies `text`. First the Clipboard API; where it is missing (an old
 * browser, an insecure context), a hidden textarea and the copy command.
 * Resolves true when the text reached the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
  if (clipboard && typeof clipboard.writeText === 'function') {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Refused (no permission, the page is not focused): try the fallback.
    }
  }
  return copyWithCommand(text);
}

/** The fallback: select the text in a hidden, read only textarea and run the copy command. */
export function copyWithCommand(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.setAttribute('aria-hidden', 'true');
  area.tabIndex = -1;
  // Off screen and invisible, but laid out, so it can hold a selection.
  area.style.position = 'fixed';
  area.style.insetBlockStart = '0';
  area.style.insetInlineStart = '0';
  area.style.opacity = '0';
  area.style.pointerEvents = 'none';
  const active = document.activeElement as HTMLElement | null;
  document.body.append(area);
  let ok = false;
  try {
    area.select();
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    area.remove();
    active?.focus?.({ preventScroll: true });
  }
  return ok;
}

/**
 * After a failed copy: selects the text of the element with this id, so the
 * person can copy it with the keyboard (Ctrl+C or Cmd+C) in one step.
 */
export function selectTextOf(id: string | undefined): void {
  if (!id || typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  try {
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.addRange(range);
  } catch {
    // Nothing to select: the status still says the copy failed.
  }
}

/** Reads a time token (`--ds-delay-peek-hide` and so on) from the element, in ms. 0 when missing. */
export function readTimeToken(el: Element | null, name: string): number {
  if (!el || typeof getComputedStyle !== 'function') return 0;
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return raw.endsWith('ms') ? n : raw.endsWith('s') ? n * 1000 : n;
}
