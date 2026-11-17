// M10.9 fitness-plan: a stub from order M10.0. Order M10.9 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./fitness-plan.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'fitness-plan',
  order: 'M10.9',
  title: 'A workout plan with a medium detent sheet of actions, a menu on an exercise, progress for the week',
  families: ['sheet with detents and grabber', 'menu', 'progress bar', 'toast', 'popover'],
  references: [
    { label: 'A sheet of routine actions', href: 'https://mobbin.com/screens/15cb87a0-88b5-4a37-adf2-d93f9904f81f' },
    { label: 'A menu on a workout', href: 'https://mobbin.com/screens/95037e85-88cb-42be-bd02-a1fbb6891989' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
