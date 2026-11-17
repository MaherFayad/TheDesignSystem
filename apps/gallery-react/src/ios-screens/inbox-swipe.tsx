// M10.5 inbox-swipe: a stub from order M10.0. Order M10.5 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./inbox-swipe.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'inbox-swipe',
  order: 'M10.5',
  title: 'A list of saved items with swipe actions on both sides, filter menu, a banner after an action',
  families: ['list swipe actions', 'menu from a button', 'notification banner', 'bottom toolbar', 'top bar'],
  references: [
    { label: 'A list of saved articles', href: 'https://mobbin.com/screens/e97a2ae1-ef94-4f8d-bdfb-f85b325a9936' },
    { label: 'Swipe actions on a row', href: 'https://mobbin.com/screens/0abd5c81-4cd1-450b-bf9a-1cb0990bdca5' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
