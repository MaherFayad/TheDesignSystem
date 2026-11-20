// Moving focus to the element a URL fragment names, shared by the React and
// Angular SkipLink (order C5, item 7). It reads only the document it is
// given, so it runs on any DOM and in tests.

/**
 * Moves focus to the element a fragment (`#main`) names. Returns false when
 * there is none. A link, a field or an element with its own tabindex keeps
 * what it has; any other target gets tabindex -1 first, so a script can
 * focus it.
 */
export function focusFragment(href: string, doc: Document = document): boolean {
  if (!href.startsWith('#') || href.length < 2) return false;
  let id: string;
  try {
    id = decodeURIComponent(href.slice(1));
  } catch {
    id = href.slice(1);
  }
  const target = doc.getElementById(id);
  if (!target) return false;
  // Try the element as it is first: a link, a field or an element with its own tabindex keeps what it has.
  target.focus();
  if (doc.activeElement === target) return true;
  // Not focusable (a region, an anchor with no href, a disabled control): make it a script focus target.
  target.setAttribute('tabindex', '-1');
  target.focus();
  return doc.activeElement === target;
}
