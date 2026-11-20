// The theme at the top of every portal (orders S1, C5 item 2 and C6 item 1).
// The Angular form of packages/react/src/theme/LayerTheme.tsx.
//
// An overlay portaled to <body> sits outside every dsTheme element, where
// the token selectors would not reach it. So each portal host is a theme
// element that copies every axis of the dsTheme the overlay is opened in,
// `dir` and `lang` included. That element stamps the platform again, and
// the token CSS gives every platform element its own --ds-inset-safe-* from
// env(): an override on the dsTheme the overlay comes from (a drawn device
// frame that says where its camera cutout and side column are) would not
// reach the overlay. So the layer reads the four computed inset tokens
// where the overlay comes from, on mount, after the next render, on every
// resize (a turn of the device) and when the source's inline style changes,
// and writes them on its own element. In a test DOM with no tokens nothing
// is written and the layer keeps no style attribute.
//
// Where it reads: the element `DS_LAYER_INSETS_FROM` returns (the Toaster's
// hidden anchor, order S1), else the element of the nearest dsTheme. A
// portal inside a portal (a menu in a dialog) reads the outer layer, which
// carries the copied values inline.
//
// Use: put `layerThemeProviders(() => inject(TOKEN).theme)` in the layer
// component's providers and `hostDirectives: [DsLayerTheme]` on it.
import {
  DestroyRef,
  Directive,
  ElementRef,
  InjectionToken,
  afterNextRender,
  computed,
  inject,
  type Signal,
} from '@angular/core';
import { attributesOf } from './resolve';
import { DsThemeScope, DsThemeService, themeScopeProviders } from './theme';
import type { ThemeValue } from './types';

/** The safe area tokens a portal theme copies from where its overlay comes from. */
export const SAFE_AREA_TOKENS = ['--ds-inset-safe-top', '--ds-inset-safe-bottom', '--ds-inset-safe-start', '--ds-inset-safe-end'] as const;

/** The computed safe area tokens at an element, or undefined when it has none (a test DOM). */
export function readSafeArea(el: Element): Record<string, string> | undefined {
  const computed = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!computed) return undefined;
  const out: Record<string, string> = {};
  for (const name of SAFE_AREA_TOKENS) {
    const value = computed.getPropertyValue(name).trim();
    if (value) out[name] = value;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Where a layer reads the safe area, when not at the nearest dsTheme (the Toaster's anchor). */
export const DS_LAYER_INSETS_FROM = new InjectionToken<() => Element | null>('DS_LAYER_INSETS_FROM');

/**
 * The theme providers of a portal layer: its theme service holds the copied
 * axes of the source and names the layer element, so a portal opened from
 * inside it reads its insets here.
 */
export function layerThemeProviders(theme: () => Signal<ThemeValue>) {
  return themeScopeProviders(() => new DsThemeScope(theme(), inject<ElementRef<Element>>(ElementRef).nativeElement));
}

/**
 * Host directive of every portal layer: stamps `data-ds="theme"`, every
 * axis, `dir` and `lang`, and copies the safe area tokens of the source
 * onto the layer element.
 */
@Directive({
  host: {
    'data-ds': 'theme',
    '[attr.data-style]': 'attrs()["data-style"]',
    '[attr.data-scheme]': 'attrs()["data-scheme"]',
    '[attr.data-density]': 'attrs()["data-density"]',
    '[attr.data-contrast]': 'attrs()["data-contrast"]',
    '[attr.data-platform]': 'attrs()["data-platform"]',
    '[attr.data-glass]': 'attrs()["data-glass"]',
    '[attr.dir]': 'attrs().dir',
    '[attr.lang]': 'attrs().lang',
  },
})
export class DsLayerTheme {
  /** The layer's own scope (layerThemeProviders on the host component). */
  private readonly theme = inject(DsThemeService);
  protected readonly attrs = computed(() => attributesOf(this.theme.value()));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly source = inject(DsThemeService, { skipSelf: true });
  private readonly from = inject(DS_LAYER_INSETS_FROM, { optional: true });
  private written: Record<string, string> | undefined;
  private stop: (() => void) | null = null;

  constructor() {
    this.start();
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => {
      this.stop?.();
      this.stop = null;
    });
  }

  /** Reads the source and follows it. Waits while the source is not there yet. */
  private start(): void {
    const source = this.from?.() ?? this.source.element;
    if (!source) return;
    this.read(source);
    if (this.stop) return;
    const view = source.ownerDocument.defaultView;
    if (!view) return;
    const read = () => this.read(source);
    view.addEventListener('resize', read);
    // The source may be another layer that writes its copy a moment later, or a frame theme whose override changes.
    const watch = typeof view.MutationObserver === 'function' ? new view.MutationObserver(read) : null;
    watch?.observe(source, { attributes: true, attributeFilter: ['style'] });
    this.stop = () => {
      view.removeEventListener('resize', read);
      watch?.disconnect();
    };
  }

  private read(source: Element): void {
    // A source not yet in the document computes nothing; keep what was written.
    if (!source.isConnected) return;
    const next = readSafeArea(source);
    for (const name of SAFE_AREA_TOKENS) {
      const value = next?.[name];
      if (value === this.written?.[name]) continue;
      if (value === undefined) this.host.style.removeProperty(name);
      else this.host.style.setProperty(name, value);
    }
    this.written = next;
  }
}
