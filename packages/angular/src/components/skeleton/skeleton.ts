// Skeleton: a placeholder shape while content loads. The host element is the
// root, `span[dsSkeleton]`, with no parts. Always aria-hidden: the container
// that is loading carries aria-busy and, where the wait is worth saying, a
// status message.
//
//   <span dsSkeleton variant="circle" [width]="48"></span>
//
// The twin of packages/react/src/components/Skeleton/Skeleton.tsx. Width and
// height reach the CSS through the private properties --_skeleton-width and
// --_skeleton-height, set as inline styles as in React.
import { ChangeDetectionStrategy, Component, computed, input, type AnimationCallbackEvent } from '@angular/core';
import type { Size } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';
import { injectMotion } from '../../internal/motion';
import { fadeAway, ghostOf, placeOf } from '../../internal/motion-feedback';

export type SkeletonVariant = 'text' | 'circle' | 'rect';
export type SkeletonSize = Extract<Size, 'sm' | 'md' | 'lg'>;

function toLength(value: string | number | undefined): string | null {
  if (value === undefined) return null;
  return typeof value === 'number' ? `${value}px` : value;
}

@Component({
  selector: 'span[dsSkeleton]',
  exportAs: 'dsSkeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-hidden]': '"true"',
    'data-ds': 'skeleton',
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'variant() === "text" ? size() : null',
    '[style.--_skeleton-width]': 'widthValue()',
    '[style.--_skeleton-height]': 'heightValue()',
    '(animate.leave)': 'leave($event)',
  },
  template: '',
})
export class DsSkeleton {
  /** The form of the placeholder. Default text. */
  readonly variant = input<SkeletonVariant>('text');
  /** For text: the type size of the line it stands for. Default md. Ignored for circle and rect. */
  readonly size = input<SkeletonSize>('md');
  /** Inline size: a CSS length or a number of px. Default: the full line for text and rect, 32px for circle. */
  readonly width = input<string | number | undefined>(undefined);
  /** Block size for rect: a CSS length or a number of px. A circle takes its width. Ignored for text. */
  readonly height = input<string | number | undefined>(undefined);

  protected readonly widthValue = computed(() => toLength(this.width()));
  protected readonly heightValue = computed(() => (this.variant() === 'rect' ? toLength(this.height()) : null));

  private readonly motion = injectMotion();

  constructor() {
    consumeHostAttributes(['dsSkeleton', 'variant', 'size', 'width', 'height']);
  }

  /**
   * skeleton-swap (order 1.22): Angular calls this while the node is still
   * in the document. Record where it is drawn and let it go at once (nothing
   * waits); just before the next paint, if it is really gone, its ghost fades
   * out over the content that took its place, as React plays it.
   */
  protected leave(event: AnimationCallbackEvent): void {
    const el = event.target;
    const mode = this.motion.mode('skeleton-swap');
    const place = el.isConnected && mode !== 'none' && typeof requestAnimationFrame === 'function' ? placeOf(el) : null;
    event.animationComplete();
    if (!place) return;
    requestAnimationFrame(() => {
      if (!el.isConnected) fadeAway(ghostOf(place), mode);
    });
  }
}
