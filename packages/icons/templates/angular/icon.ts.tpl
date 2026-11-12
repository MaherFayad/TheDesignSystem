// Angular icon. Renders the same DOM as the React Icon: the host svg is the
// root, with data-ds="icon", data-icon, data-size, data-set and data-mirror.
// A directive, not a component: there is no template, the glyph nodes are
// created with the Renderer from the parsed set data (no innerHTML).
//
//   <svg dsIcon name="chevron-forward" size="sm"></svg>
//   <svg dsIcon name="warning" label="Warning"></svg>
import {
  Directive,
  ElementRef,
  InjectionToken,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import {
  defaultIconStyle,
  iconSizes,
  isMirrored,
  parseBody,
  resolveIcon,
  resolveIconSize,
  type IconName,
  type IconSize,
  type IconStyle,
} from '@the-system/icons';

/**
 * The active style's icon config, as a signal so icons follow a style
 * change. The dsTheme directive provides it.
 */
export const DS_ICON_STYLE = new InjectionToken<Signal<IconStyle>>('DS_ICON_STYLE', {
  factory: () => signal<IconStyle>(defaultIconStyle).asReadonly(),
});

@Directive({
  selector: 'svg[dsIcon]',
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    'data-ds': 'icon',
    focusable: 'false',
    '[attr.data-icon]': 'name()',
    '[attr.data-size]': 'sizeName()',
    '[attr.data-set]': 'resolved().set.id',
    '[attr.data-mirror]': 'mirror() ? "" : null',
    '[attr.viewBox]': 'resolved().data.viewBox',
    '[attr.width]': 'pixels()',
    '[attr.height]': 'pixels()',
    '[attr.role]': 'named() ? "img" : null',
    '[attr.aria-label]': 'named() ? label() : null',
    '[attr.aria-hidden]': 'named() ? null : "true"',
  },
})
export class DsIcon {
  readonly name = input.required<IconName>();
  /** sm 12, md 16, lg 24, from the size.icon tokens. Numbers are accepted too. Default md. */
  readonly size = input<IconSize | undefined>(undefined);
  /** An icon set id. Overrides the style's set. */
  readonly set = input<string | undefined>(undefined);
  /** Gives the icon role img and this accessible name. Without it the icon is hidden. */
  readonly label = input<string | undefined>(undefined);

  private readonly style = inject(DS_ICON_STYLE);
  private readonly host = inject<ElementRef<SVGSVGElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  /** The set attributes on the host now, so a set change removes the ones the new set lacks. */
  private setAttrs: readonly string[] = [];

  /** The same check as React: an empty label still names the icon. */
  protected readonly named = computed(() => this.label() !== undefined);
  protected readonly sizeName = computed(() => resolveIconSize(this.size()));
  protected readonly pixels = computed(() => iconSizes[this.sizeName()]);
  protected readonly mirror = computed(() => isMirrored(this.name()));
  protected readonly resolved = computed(() => {
    const set = this.set();
    return resolveIcon(this.name(), set !== undefined ? { set } : this.style());
  });

  constructor() {
    // Angular writes static attributes to the DOM, input ones and the
    // selector marker included. React renders none of them.
    for (const attr of ['dsIcon', 'name', 'size', 'set', 'label']) this.host.nativeElement.removeAttribute(attr);
    effect(() => {
      const { set, data } = this.resolved();
      const el = this.host.nativeElement;
      for (const k of this.setAttrs) if (!(k in set.attrs)) this.renderer.removeAttribute(el, k);
      for (const [k, v] of Object.entries(set.attrs)) this.renderer.setAttribute(el, k, v);
      this.setAttrs = Object.keys(set.attrs);
      while (el.firstChild) this.renderer.removeChild(el, el.firstChild);
      for (const [tag, attrs] of parseBody(data.body)) {
        const child = this.renderer.createElement(tag, 'svg') as SVGElement;
        for (const [k, v] of Object.entries(attrs)) this.renderer.setAttribute(child, k, v);
        this.renderer.appendChild(el, child);
      }
    });
  }
}
