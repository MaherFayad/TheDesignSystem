// M10.2 music-search: a stub from order M10.0. Order M10.2 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./music-search.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'music-search',
  order: 'M10.2',
  title: 'The search tab expanded into the field, scope chips, results, an empty result',
  families: ['search tab', 'search field', 'segmented control', 'empty state', 'activity indicator'],
  references: [
    { label: 'The search tab', href: 'https://mobbin.com/screens/38013fe5-6e15-4038-9c0f-039bf66715c7' },
    { label: 'Search with the field open', href: 'https://mobbin.com/screens/0fdc7e6a-e4aa-4c5a-8879-84396df1a589' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
