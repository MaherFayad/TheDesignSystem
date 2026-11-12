// A tiny router on the History API: enough for `/`, `/all` and `/c/<slug>`.
import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

const EVENT = 'gallery:navigate';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/** The current URL. Re-renders on every navigation. */
export function useUrl(): URL {
  const href = useSyncExternalStore(
    subscribe,
    () => window.location.href,
    () => 'http://localhost/',
  );
  return new URL(href);
}

/** Moves to a path and query in this app without a page load. */
export function navigate(to: string, options: { replace?: boolean } = {}): void {
  if (options.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
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
  return <a href={href} onClick={handle} {...rest} />;
}
