// Inline styles written in a fixed order. Radix writes inline styles on some
// parts (the slider thumb wrapper, the range, the hidden form inputs) from a
// style object, so the browser serializes them in the object's key order:
// `transform: ...; position: absolute; left: calc(...)`. Angular's `[style]`
// binding sorts the keys, which gives another attribute string for the same
// style. This directive writes the declarations in the order given, so the
// style attribute equals the React one character for character.
//
//   <span [dsOrderedStyle]="[['position', 'absolute'], ['left', '40%']]"></span>
//
// An empty list removes the style attribute. Selector by property binding
// only, so no marker attribute lands in the DOM.
import { Directive, ElementRef, effect, inject, input } from '@angular/core';

export type OrderedStyle = readonly (readonly [property: string, value: string])[];

@Directive({ selector: '[dsOrderedStyle]' })
export class DsOrderedStyle {
  readonly dsOrderedStyle = input.required<OrderedStyle | null | undefined>();

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    effect(() => {
      const list = this.dsOrderedStyle() ?? [];
      if (list.length === 0) {
        el.removeAttribute('style');
        return;
      }
      el.style.cssText = '';
      for (const [property, value] of list) el.style.setProperty(property, value);
    });
  }
}
