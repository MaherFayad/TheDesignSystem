// The shared sliding indicator of the navigation family (order 1.22,
// interaction round 2, proposed): the Angular wiring only. The slide, the
// track, the small answers, `activated` and the framework free `hoverFollow`
// live once in @the-system/motion (helpers/indicator.ts, order 1.29), next
// to React's hooks; components import them from there.
//
// No zone timing: a component keeps a track as a field and calls
// followIndicator from afterRenderEffect; injectHoverFollow ties hoverFollow
// to the life of the calling component or directive.
import { DestroyRef, inject } from '@angular/core';
import { hoverFollow, type HoverFollowOptions } from '@the-system/motion';

/** hoverFollow for the life of the calling component or directive. Call in an injection context. */
export function injectHoverFollow(root: Element, opts: HoverFollowOptions): void {
  inject(DestroyRef).onDestroy(hoverFollow(root, opts));
}
