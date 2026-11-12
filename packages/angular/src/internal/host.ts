// Angular writes every static attribute of a template element to the DOM,
// also the ones a directive consumes as inputs, and the selector marker
// itself. `<button dsButton tone="accent" disabled>` would carry
// `dsbutton=""`, `tone="accent"` and the native `disabled` attribute, which
// takes the button out of the tab order. React renders none of them. So each
// system directive removes its marker and its input attributes from the host
// once it is created; host bindings then stamp the contract attributes.
import { ElementRef, inject } from '@angular/core';

/** Removes static attributes that only fed inputs. Call it in a constructor. */
export function consumeHostAttributes(names: readonly string[]): HTMLElement {
  const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  if (typeof el.removeAttribute === 'function') for (const name of names) el.removeAttribute(name);
  return el;
}
