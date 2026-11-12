// A tiny router on the History API: enough for `/`, `/all` and `/c/<slug>`.
//
// The gallery can be served under a base path (GALLERY_BASE in vite.config.ts,
// for example /gallery/ when it ships inside the docs site). The app works in
// paths without the base: useUrl strips it, navigate and Link add it back.
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

const EVENT = 'gallery:navigate';

/** The base path without its trailing slash: '' at the origin root, '/gallery' under the docs. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** An app path with the base in front. A path that already carries the base is left as it is. */
export function withBase(to: string): string {
  if (!BASE || !to.startsWith('/') || to === BASE || to.startsWith(`${BASE}/`) || to.startsWith(`${BASE}?`)) return to;
  return `${BASE}${to}`;
}

function withoutBase(pathname: string): string {
  if (!BASE) return pathname;
  if (pathname === BASE) return '/';
  return pathname.startsWith(`${BASE}/`) ? pathname.slice(BASE.length) : pathname;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The current URL, its pathname without the base. Re-renders on every navigation. */
export function useUrl(): URL {
  const href = useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => 'http://localhost/',
  );
  const url = new URL(href);
  url.pathname = withoutBase(url.pathname);
  return url;
}

/** Moves to a path and query in this app without a page load. */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
  const target = withBase(to);
  if (options.replace) window.history.replaceState(null, '', target);
  else window.history.pushState(null, '', target);
  window.dispatchEvent(new Event(EVENT));
}

/** A plain link that navigates in the app on a primary click without modifiers. */
export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handle = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(href);
  };
  return <a href={withBase(href)} onClick={handle} {...rest} />;
}
