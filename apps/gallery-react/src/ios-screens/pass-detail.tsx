// M10.3 pass-detail: a stub from order M10.0. Order M10.3 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./pass-detail.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'pass-detail',
  order: 'M10.3',
  title: 'A pass detail sheet: close, share and confirm in the header, switches, a remove row, details',
  families: ['sheet with confirm', 'grouped list', 'switch', 'section footer', 'popover with arrow', 'action sheet', 'share panel and the system share'],
  references: [
    { label: 'A pass detail sheet', href: 'https://mobbin.com/screens/f3ce79fa-8661-4833-a601-04c40cc95ef5' },
    { label: 'The front of a pass', href: 'https://mobbin.com/screens/e1061c73-0be8-42ba-aaed-3bb1c3321a4e' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
