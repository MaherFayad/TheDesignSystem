// What Alert, Callout, Banner and ErrorState share: the tone icons and tone
// words, the language pick, and DsFilledPart, which keeps an optional part
// out of the DOM while it has no content. The twin of
// packages/react/src/components/Alert/messageTones.ts. Not exported from the
// package barrel.
//
// Why DsFilledPart: React leaves out a part when its children prop is empty
// (`children !== undefined && children !== ''`). Angular cannot see whether
// projected content is empty before it renders. So the part renders around
// its ng-content, and after the render the directive swaps an empty part
// for a comment placeholder, and puts it back as soon as content arrives
// (an @if inside the projected content, for example). The DOM then equals
// React's, part for part.
import { DestroyRef, Directive, afterNextRender, inject } from '@angular/core';
import type { IconName } from '@the-system/icons';
import type { Tone } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

/** The icon of each tone. */
export const messageIcons: Readonly<Record<Tone, IconName>> = {
  neutral: 'bell',
  accent: 'star',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
};

/** True for any `ar` language tag. */
export function isArabic(lang: string | undefined | null): boolean {
  return typeof lang === 'string' && /^ar(-|$)/i.test(lang);
}

/** Picks the Arabic or the English words for a language tag. */
export function wordsFor<E, A>(words: { en: E; ar: A }, lang: string | undefined | null): E | A {
  return isArabic(lang) ? words.ar : words.en;
}

/** True when a node holds an element or text that is not only white space. Comments do not count. */
export function hasContent(node: Node): boolean {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) return true;
    if (child.nodeType === 3 && (child.textContent ?? '').trim() !== '') return true;
  }
  return false;
}

/**
 * On a part that wraps projected content: `<div data-part="body" dsFilledPart><ng-content /></div>`.
 * The part leaves the DOM while it is empty and comes back when it fills.
 */
@Directive({ selector: '[dsFilledPart]' })
export class DsFilledPart {
  private readonly el = consumeHostAttributes(['dsFilledPart']);

  constructor() {
    const el = this.el;
    const doc = el.ownerDocument;
    const placeholder = doc.createComment('');
    const sync = () => {
      const filled = hasContent(el);
      if (!filled && el.parentNode) el.replaceWith(placeholder);
      else if (filled && placeholder.parentNode) placeholder.replaceWith(el);
    };
    let observer: MutationObserver | undefined;
    afterNextRender(() => {
      sync();
      if (typeof MutationObserver === 'undefined') return;
      observer = new MutationObserver(sync);
      observer.observe(el, { childList: true, subtree: true, characterData: true });
    });
    inject(DestroyRef).onDestroy(() => {
      observer?.disconnect();
      if (placeholder.parentNode) placeholder.replaceWith(el);
    });
  }
}
