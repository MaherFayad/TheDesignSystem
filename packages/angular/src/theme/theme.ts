// dsTheme: the Angular twin of the React Theme. It stamps every runtime axis
// on its own element and resolves what is not passed from the nearest parent
// dsTheme, through DI, then from the style.json defaults.
//
//   <div dsTheme="desk" scheme="light">...</div>
//   <main dsTheme [style]="axes.style" lang="ar">...</main>
//
// Platform follows "Platform axis" in docs/contracts/frameworks.md: a value
// wins; `auto` asks the device through the shared resolver
// (packages/shared/src/platform.ts); no input takes the parent's value, and
// the outermost dsTheme with none is `auto`. Under server rendering the
// device is `web`; in the browser it is read once, by DsDevicePlatform.
//
// The `style` input. React names the style axis `style` and moves inline
// styles to a `css` prop; dsTheme keeps both names. In Angular a binding,
// `[style]="'desk'"`, reaches the `style` input. A static `style="desk"` does
// not: the template compiler parses a static style attribute as inline CSS
// at build time, drops "desk" (it has no colon) and never hands it to an
// input, so the theme silently falls back to its parent. Write
// `[style]="'desk'"`, or put the style on the selector attribute:
// `<div dsTheme="desk">`. Inline styles pass through `css`, as in React.
//
// Input modality (order C3, docs/contracts/frameworks.md): the root dsTheme,
// the one with no dsTheme above it, starts the shared modality flag after its
// first render in the browser (`acquireModality(document)`), which keeps
// `data-modality="keyboard"` or `"pointer"` on the document element. It
// releases its hold on destroy; the last hold removes the listeners and the
// attribute. Nothing is written on the server or before the first input.
import {
  DestroyRef,
  Directive,
  ElementRef,
  Injectable,
  afterNextRender,
  PLATFORM_ID,
  signal,
  computed,
  effect,
  inject,
  input,
  untracked,
  type OnInit,
  type Signal,
} from '@angular/core';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { acquireModality, detectPlatform, deviceOf } from '@the-system/shared';
import { DS_ICON_STYLE } from '@the-system/icons/angular';
import type { IconStyle } from '@the-system/icons';
import { consumeHostAttributes } from '../internal/host';
import { iconStyleFor, resolveTheme } from './resolve';
import type { Contrast, Density, Dir, Glass, Lang, Platform, PlatformInput, Scheme, ThemeStyle, ThemeValue } from './types';

const rootDefaults = resolveTheme({}, null);

/**
 * The platform `auto` resolves to on this device: `ios`, `android` or `web`,
 * never `macos`. Under server rendering it is `web`. In the browser it reads
 * `navigator` once, when the first dsTheme asks for it, never at module
 * scope. A hydrated page keeps the server's markup and the first client
 * change detection stamps the detected value once; Angular hydration
 * compares nodes, not attribute values, so this raises no mismatch.
 */
@Injectable({ providedIn: 'root' })
export class DsDevicePlatform {
  private readonly _value = signal<Platform>('web');
  readonly value: Signal<Platform> = this._value.asReadonly();

  constructor() {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    this._value.set(detectPlatform(deviceOf(inject(DOCUMENT).defaultView?.navigator)));
  }
}

/**
 * The resolved axes of the nearest dsTheme, as a signal. Outside any dsTheme
 * the root service returns the root defaults. Inject it in any component:
 * `inject(DsThemeService).value()`.
 */
@Injectable({ providedIn: 'root' })
export class DsThemeService {
  /** True for the root service, which no dsTheme provides. */
  readonly isRoot: boolean = true;
  readonly value: Signal<ThemeValue> = computed(() => rootDefaults);
  /** The theme element, where a portal opened inside it reads the safe area tokens. None at the root. */
  readonly element: Element | null = null;

  /**
   * True when the active style turns on an optional part: its style.json
   * lists `part` under `optionalParts[component]`. Component names are the
   * kebab case data-ds value: `optionalPart('dialog', 'titlebar')`.
   */
  optionalPart(component: string, part: string): Signal<boolean> {
    return computed(() => this.value().styleData.optionalParts[component]?.includes(part) ?? false);
  }
}

/** A theme scope that holds a value someone else resolved (the dialog portal copies one). */
export class DsThemeScope extends DsThemeService {
  override readonly isRoot = false;
  constructor(
    override readonly value: Signal<ThemeValue>,
    override readonly element: Element | null = null,
  ) {
    super();
  }
}

/** Keeps a CDK Directionality in step with a theme value, so CDK overlays and key managers follow dir. */
export function syncDirectionality(dir: Directionality, value: Signal<ThemeValue>): void {
  const apply = (next: Dir) => {
    if (dir.valueSignal() === next) return;
    dir.valueSignal.set(next);
    dir.change.emit(next);
  };
  apply(untracked(value).dir);
  effect(() => apply(value().dir));
}

/**
 * The providers of a theme scope: the theme service, the CDK Directionality
 * and the icon style. `scope` returns the element's DsThemeService.
 */
export function themeScopeProviders(scope: () => DsThemeService) {
  return [
    { provide: DsThemeService, useFactory: scope },
    { provide: Directionality, useFactory: () => new Directionality() },
    {
      provide: DS_ICON_STYLE,
      useFactory: (): Signal<IconStyle> => {
        const theme = scope();
        return computed(() => iconStyleFor(theme.value().styleData));
      },
    },
  ];
}

/**
 * Stamps `data-ds="theme"`, `data-style`, `data-scheme`, `data-density`,
 * `data-contrast`, `data-platform`, `data-glass`, `dir` and `lang` on its
 * element. Input names equal the React Theme props.
 */
@Directive({
  selector: '[dsTheme]',
  exportAs: 'dsTheme',
  providers: themeScopeProviders(() => inject(DsTheme).scope),
  host: {
    'data-ds': 'theme',
    '[attr.data-style]': 'value().style',
    '[attr.data-scheme]': 'value().scheme',
    '[attr.data-density]': 'value().density',
    '[attr.data-contrast]': 'value().contrast',
    '[attr.data-platform]': 'value().platform',
    '[attr.data-glass]': 'value().glass',
    '[attr.dir]': 'value().dir',
    '[attr.lang]': 'value().lang',
    '[style]': 'css()',
  },
})
export class DsTheme implements OnInit {
  /** The style id: studio, desk or any custom id. Not inline CSS: that is `css`. */
  readonly style = input<ThemeStyle | undefined>(undefined);
  /** The selector attribute: `dsTheme="desk"` is the same as a style input. Empty means no style. */
  readonly dsTheme = input<ThemeStyle | '' | undefined>(undefined);
  readonly scheme = input<Scheme | undefined>(undefined);
  readonly density = input<Density | undefined>(undefined);
  readonly contrast = input<Contrast | undefined>(undefined);
  /**
   * `web`, `ios`, `android`, `macos`, or `auto`, which follows the device.
   * No input takes the parent's value; the outermost dsTheme with none is `auto`.
   */
  readonly platform = input<PlatformInput | undefined>(undefined);
  readonly glass = input<Glass | undefined>(undefined);
  readonly dir = input<Dir | undefined>(undefined);
  readonly lang = input<Lang | undefined>(undefined);
  /** Inline styles for the theme element, the React `css` prop. */
  readonly css = input<Record<string, string | number> | string | null | undefined>(undefined);

  private readonly parent = inject(DsThemeService, { skipSelf: true });
  private readonly device = inject(DsDevicePlatform).value;
  /** dir and lang are stamped back by host bindings; style never reaches the DOM as an attribute. */
  private readonly _consumed = consumeHostAttributes(['dsTheme', 'scheme', 'density', 'contrast', 'platform', 'glass', 'css']);
  private readonly directionality = inject(Directionality, { self: true });

  /** The resolved axes plus the style.json data. */
  readonly value: Signal<ThemeValue> = computed(() =>
    resolveTheme(
      {
        style: this.style() ?? (this.dsTheme() || undefined),
        scheme: this.scheme(),
        density: this.density(),
        contrast: this.contrast(),
        platform: this.platform(),
        glass: this.glass(),
        dir: this.dir(),
        lang: this.lang(),
      },
      this.parent.isRoot ? null : this.parent.value(),
      { platform: this.device() },
    ),
  );

  /** This element's theme service, what children inject as DsThemeService. */
  readonly scope: DsThemeService = new DsThemeScope(this.value, inject<ElementRef<Element>>(ElementRef).nativeElement);

  constructor() {
    if (this.parent.isRoot && isPlatformBrowser(inject(PLATFORM_ID))) {
      const doc = inject(DOCUMENT);
      let release: (() => void) | null = null;
      let destroyed = false;
      // After the first render, so the server render and the first paint carry no attribute.
      afterNextRender(() => {
        if (!destroyed) release = acquireModality(doc);
      });
      inject(DestroyRef).onDestroy(() => {
        destroyed = true;
        release?.();
        release = null;
      });
    }
    effect(() => {
      const next = this.value().dir;
      if (this.directionality.valueSignal() !== next) {
        this.directionality.valueSignal.set(next);
        this.directionality.change.emit(next);
      }
    });
  }

  ngOnInit(): void {
    // Inputs are set now: give the CDK the right direction before any child reads it.
    this.directionality.valueSignal.set(this.value().dir);
  }
}

