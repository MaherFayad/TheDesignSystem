// The axes a ButtonGroup passes to its children, through DI. The twin of
// packages/react/src/components/ButtonGroup/ButtonGroupContext.ts. Every
// directive on DsButtonBase (Button, IconButton, ToggleButton, CloseButton,
// CopyButton, FloatingActionButton) and SplitButton injects it as optional
// and lets its own input win: `size() ?? group?.size() ?? 'md'`.
//
// DI follows the template where an element is declared, so a button written
// inside `<div dsButtonGroup>` reads it, also through a wrapper element.
import { InjectionToken, type Signal } from '@angular/core';
import type { Emphasis, Shape, Size } from '@the-system/shared';

export type ButtonGroupSize = Extract<Size, 'xs' | 'sm' | 'md' | 'lg'>;
/** No link emphasis: a row of links is not a group of actions. */
export type ButtonGroupEmphasis = Extract<Emphasis, 'solid' | 'soft' | 'outline' | 'ghost'>;
export type ButtonGroupShape = Extract<Shape, 'default' | 'pill' | 'square'>;

export interface ButtonGroupAxes {
  readonly size: Signal<ButtonGroupSize | undefined>;
  readonly emphasis: Signal<ButtonGroupEmphasis | undefined>;
  readonly shape: Signal<ButtonGroupShape | undefined>;
}

/** The axes of the nearest ButtonGroup. Inject with `{ optional: true }`: null outside a group. */
export const DS_BUTTON_GROUP = new InjectionToken<ButtonGroupAxes>('DsButtonGroup');
