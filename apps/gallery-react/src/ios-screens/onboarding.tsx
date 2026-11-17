// M10.8 onboarding: a stub from order M10.0. Order M10.8 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./onboarding.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'onboarding',
  order: 'M10.8',
  title: 'Three pages of onboarding with page dots and a capsule action',
  families: ['page control', 'capsule buttons', 'glass close button'],
  references: [
    { label: 'Onboarding with page dots', href: 'https://mobbin.com/screens/553ba4e0-41b9-4daa-9e3f-26b882e49254' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
