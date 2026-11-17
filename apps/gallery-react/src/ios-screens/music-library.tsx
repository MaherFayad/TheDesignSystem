// M10.1 music-library: a stub from order M10.0. Order M10.1 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./music-library.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'music-library',
  order: 'M10.1',
  title: 'A library of tracks with a large title, play and shuffle buttons, sections by first letter and an index bar; long press a track',
  families: ['top bar with large title', 'glass buttons', 'capsule buttons', 'grouped list', 'section header', 'index bar', 'context menu with quick action row', 'tab bar', 'search tab', 'progress bar', 'activity indicator', 'bottom toolbar', 'sidebar (inner screen, landscape)'],
  references: [
    { label: 'A list of songs', href: 'https://mobbin.com/screens/3a938b4d-3b4e-43b7-8de3-cb039a924e31' },
    { label: 'Contacts with an index bar', href: 'https://mobbin.com/screens/b1f60825-edc1-40e4-92ed-0c2d8a79fe60' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
