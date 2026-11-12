import { effect } from '@angular/core';

/**
 * Writes an attribute only while the component has a value for it. A host
 * binding that returns null would remove the attribute every time it runs,
 * which drops a caller's own `[attr.aria-label]` or `[attr.tabindex]`. Here
 * the attribute is removed only when this helper set it before.
 * Call in an injection context.
 */
export function ownAttribute(el: Element, name: string, read: () => string | null | undefined): void {
  let owned = false;
  effect(() => {
    const value = read();
    if (value !== null && value !== undefined) {
      el.setAttribute(name, value);
      owned = true;
    } else if (owned) {
      el.removeAttribute(name);
      owned = false;
    }
  });
}
