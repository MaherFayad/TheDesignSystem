// The person a toast's start part draws (order M9.8, `start: { avatar }`).
// Angular has no Avatar component yet, so this is the decorative form of
// React's Avatar as the toast renders it (size md, shape default,
// decorative), on the same DOM, so Avatar.css applies as is:
//
//   <span data-ds="avatar" data-size="md" data-shape="default" data-state? aria-hidden="true" style="--_avatar-hue: ...">
//     <img data-part="image" alt="">            only once the image has loaded, as Radix Avatar
//     <span data-part="fallback" aria-hidden>  the initials, else the user icon; after 600ms while an image loads
//
// It is hidden from assistive tech: the toast title names the person.
// Internal to the toast folder; the Avatar port replaces it.
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { DsIcon } from '@the-system/icons/angular';
import { initials, toneIndex } from '@the-system/shared';
import { consumeHostAttributes } from '../../internal/host';

/** The loading state of the image, stamped as data-state on the root while there is a src. */
type AvatarState = 'loading' | 'loaded' | 'error';

/** Milliseconds before the fallback shows while an image loads, as React's Avatar default. */
const FALLBACK_DELAY = 600;

@Component({
  selector: 'span[dsToastAvatar]',
  imports: [DsIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-ds': 'avatar',
    'data-size': 'md',
    'data-shape': 'default',
    'aria-hidden': 'true',
    '[attr.data-state]': 'src() ? state() : null',
    '[style.--_avatar-hue]': 'hue()',
  },
  template: `@if (src() && state() === 'loaded') {<img data-part="image" [src]="src()" alt="" />}@if (showFallback()) {<span data-part="fallback" aria-hidden="true">@if (letters() === '') {<svg dsIcon name="user" size="md"></svg>} @else {{{ letters() }}}</span>}`,
})
export class DsToastAvatar {
  /** The person or workspace name: the initials and the fallback color. */
  readonly name = input.required<string>();
  /** The image URL. Without it, the fallback shows at once. */
  readonly src = input<string | undefined>(undefined);

  protected readonly state = signal<AvatarState>('loading');
  private readonly delayed = signal(false);
  protected readonly letters = computed(() => initials(this.name()));
  protected readonly hue = computed(() => `var(--ds-color-accent-${toneIndex(this.name())})`);
  protected readonly showFallback = computed(() => this.state() !== 'loaded' && (!this.src() || this.delayed()));

  constructor() {
    consumeHostAttributes(['dsToastAvatar', 'name', 'src']);
    // Radix Avatar loads the image off the page and renders the img only once it has loaded.
    effect((onCleanup) => {
      const src = this.src();
      this.state.set('loading');
      this.delayed.set(false);
      if (!src || typeof Image === 'undefined') return;
      const image = new Image();
      let live = true;
      image.onload = () => live && this.state.set('loaded');
      image.onerror = () => live && this.state.set('error');
      image.src = src;
      const timer = setTimeout(() => this.delayed.set(true), FALLBACK_DELAY);
      onCleanup(() => {
        live = false;
        clearTimeout(timer);
      });
    });
  }
}
