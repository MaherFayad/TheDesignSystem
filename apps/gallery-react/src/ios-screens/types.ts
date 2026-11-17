// The shape of one iOS test screen (order M10.0). Each screen file exports a
// `meta` of this type and a default component that takes ScreenProps.
import type { ComponentType } from 'react';
import type { FrameId, FrameVariant } from './frames';
import type { Lang } from './kit';

/** One Mobbin reference: what it shows, and its link. Images stay in scratch. */
export interface ScreenReference {
  label: string;
  href: string;
}

export interface ScreenMeta {
  /** The route id: /screens/ios/<id>. Kebab case, the same as the file name. */
  id: string;
  /** The work order that builds it, for example M10.1. */
  order: string;
  /** English, sentence case: what the screen is. */
  title: string;
  /** The families the screen proves, in the words of the plan's table. */
  families: readonly string[];
  /** The Mobbin references it is rebuilt from, the first one is the main one. */
  references: readonly ScreenReference[];
  /** The frames it is shown in. Every screen supports all three unless it says otherwise. */
  frames: readonly FrameId[];
  /** stub until the screen order lands. */
  status: 'stub' | 'built';
}

/** What the host hands a screen. */
export interface ScreenProps {
  /** The frame variant the screen is drawn in: its size, orientation and mode. */
  variant: FrameVariant;
  /** The language of the screen, from the URL key `lang`. */
  lang: Lang;
}

export interface ScreenModule {
  meta: ScreenMeta;
  Screen: ComponentType<ScreenProps>;
}
