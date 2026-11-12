// Angular icon. Renders the same DOM as the React Icon: the host svg is the
// root, with data-ds="icon", data-size, data-set and data-mirror.
//
//   <svg dsIcon name="chevron-forward" size="sm"></svg>
//   <svg dsIcon name="warning" label="Warning"></svg>
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  Renderer2,
  computed,
  effect,
  inject,
  input,
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

/** The active style's icon config. The dsTheme directive provides it. */
export const DS_ICON_STYLE = new InjectionToken<IconStyle>('DS_ICON_STYLE', {
  factory: () => defaultIconStyle,
});

@Component({
  selector: 'svg[dsIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'icon',
    focusable: 'false',
    '[attr.data-icon]': 'name()',
    '[attr.data-size]': 'sizeName()',
    '[attr.data-set]': 'resolved().set.id',
    '[attr.data-mirror]': 'mirror() ? "" : null',
    '[attr.viewBox]': 'resolved().data.viewBox',
    '[attr.width]': 'pixels()',
    '[attr.height]': 'pixels()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class DsIcon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('md');
  /** An icon set id. Overrides the style's set. */
  readonly set = input<string | undefined>(undefined);
  /** Gives the icon role img and this accessible name. Without it the icon is hidden. */
  readonly label = input<string | undefined>(undefined);

  private readonly style = inject(DS_ICON_STYLE);
  private readonly host = inject<ElementRef<SVGSVGElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  protected readonly sizeName = computed(() => resolveIconSize(this.size()));
  protected readonly pixels = computed(() => iconSizes[this.sizeName()]);
  protected readonly mirror = computed(() => isMirrored(this.name()));
  protected readonly resolved = computed(() => {
    const set = this.set();
    return resolveIcon(this.name(), set !== undefined ? { set } : this.style);
  });

  constructor() {
    effect(() => {
      const { set, data } = this.resolved();
      const el = this.host.nativeElement;
      for (const [k, v] of Object.entries(set.attrs)) this.renderer.setAttribute(el, k, v);
      while (el.firstChild) this.renderer.removeChild(el, el.firstChild);
      for (const [tag, attrs] of parseBody(data.body)) {
        const child = this.renderer.createElement(tag, 'svg') as SVGElement;
        for (const [k, v] of Object.entries(attrs)) this.renderer.setAttribute(child, k, v);
        this.renderer.appendChild(el, child);
      }
    });
  }
}
