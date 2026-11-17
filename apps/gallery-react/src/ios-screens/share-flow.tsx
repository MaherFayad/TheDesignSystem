// M10.10 share-flow: a stub from order M10.0. Order M10.10 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./share-flow.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'share-flow',
  order: 'M10.10',
  title: 'Share a workout card: our share panel with people, targets and actions, then a link copied banner',
  families: ['share panel', 'system share path', 'notification banner'],
  references: [
    { label: 'Sharing a workout card', href: 'https://mobbin.com/screens/089e33d7-e9dc-4726-8ba5-257641fb73f1' },
    { label: 'Sending to people', href: 'https://mobbin.com/screens/4f15982c-81b5-4d48-8ad6-b301662f8968' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
