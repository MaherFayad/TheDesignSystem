// SkipLink: the first focusable link of a page. Hidden until it takes
// keyboard focus, then drawn at the block start of the page. Enter moves
// focus to the target (`#main` by default), so a keyboard user skips the
// header and navigation (WCAG 2.4.1 Bypass blocks). The twin of
// packages/react/src/components/SkipLink/SkipLink.tsx, on the same DOM.
//
//   <a dsSkipLink></a>                                  Skip to main content, to #main
//   <a dsSkipLink href="#boards">Skip to the board list</a>
//
//   <a href="#main" data-ds="skip-link">Skip to main content</a>
//
// Behavior as React: on activation focus moves to the target itself (a
// target that is not focusable gets tabindex -1 first); the URL fragment
// still changes; a click with a modifier key or a middle click is left to
// the browser; the caller's own (click) runs first and may call
// preventDefault. The default text follows the theme's language, and the
// projected text replaces it.
import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, input } from '@angular/core';
import { consumeHostAttributes } from '../../internal/host';
import { DsThemeService } from '../../theme/theme';

/** The default visible text, per language. */
export const skipLinkLabels = { en: 'Skip to main content', ar: 'الانتقال للمحتوى الرئيسي' } as const;

/** Moves focus to the element a fragment names. Returns false when there is none. As React's focusFragment. */
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

/** A link that is drawn only while it has focus, and moves focus to the main content. */
@Component({
  selector: 'a[dsSkipLink]',
  exportAs: 'dsSkipLink',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.href]': 'href()',
    'data-ds': 'skip-link',
  },
  template: `<ng-content>{{ fallback() }}</ng-content>`,
})
export class DsSkipLink {
  /** The fragment of the element to jump to. Default "#main". */
  readonly href = input('#main');

  private readonly theme = inject(DsThemeService);
  private readonly host = consumeHostAttributes(['dsSkipLink', 'href']);
  protected readonly fallback = computed(() => skipLinkLabels[this.theme.value().lang === 'ar' ? 'ar' : 'en']);

  constructor() {
    const el = this.host;
    // After the caller's own (click), which Angular adds when the element is made.
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = this.href();
      if (!focusFragment(href, el.ownerDocument)) return;
      event.preventDefault();
      const view = el.ownerDocument.defaultView;
      // After focus, so hashchange and :target fire; the browser scrolls to the same element.
      if (view && view.location.hash !== href) view.location.hash = href;
    };
    afterNextRender(() => el.addEventListener('click', click));
    inject(DestroyRef).onDestroy(() => el.removeEventListener('click', click));
  }
}
