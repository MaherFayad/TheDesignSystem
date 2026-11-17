// M10.6 booking: a stub from order M10.0. Order M10.6 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./booking.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'booking',
  order: 'M10.6',
  title: 'Book a table: party size stepper, inline calendar, time chips, a confirm alert with the default action',
  families: ['date and time picker', 'time wheel', 'stepper', 'capsule buttons', 'alert with default action'],
  references: [
    { label: 'A table booking', href: 'https://mobbin.com/screens/0dee4854-b1a0-4153-bc9a-f06ce98169dd' },
    { label: 'A booking with time chips', href: 'https://mobbin.com/screens/1bf31016-1dfb-424a-8f0c-eb29b54bb6a9' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
