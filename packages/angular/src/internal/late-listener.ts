// A listener on a host that runs after every listener the caller binds on
// the same element. Angular registers a component's host listeners before
// the caller's template listeners, and a trusted event runs microtasks
// between listeners, so waiting one microtask does not see the caller's
// preventDefault(). A listener added after the first render is added after
// the caller's, so it can decide synchronously, as React does after
// onClick. Synchronous also keeps the user activation for the clipboard.
import { DestroyRef, afterNextRender, inject } from '@angular/core';

/** Call it in a constructor. The handler runs after the caller's listeners for `type` on `host`. */
export function listenAfterCallers(host: HTMLElement, type: string, handler: (event: Event) => void): void {
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    host.addEventListener(type, handler);
    destroyRef.onDestroy(() => host.removeEventListener(type, handler));
  });
}
