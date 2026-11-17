// Helpers for the colour controls (order M9.18), which render React Aria's
// DOM props on the system's own elements through `render`.
import type { Ref } from 'react';

type Props = Record<string, unknown>;

/**
 * React Aria's DOM props without its own class names, slots and data
 * attributes. The system stamps its own state attributes, present and empty
 * when true (anatomy.md), so every data attribute React Aria adds is dropped.
 */
export function racOwnProps(props: Props): Props {
  const out: Props = {};
  for (const [key, value] of Object.entries(props)) {
    if (key === 'className' || key === 'slot') continue;
    if (key.startsWith('data-')) continue;
    out[key] = value;
  }
  return out;
}

/** One ref callback that sets every ref given. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (node: T | null) => void {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref && typeof ref === 'object') (ref as { current: T | null }).current = node;
    }
  };
}

/** A boolean state attribute: present and empty when true, absent when false. */
export const flag = (on: boolean | undefined) => (on ? '' : undefined);
