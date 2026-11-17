// M10.7 notes-edit: a stub from order M10.0. Order M10.7 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./notes-edit.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'notes-edit',
  order: 'M10.7',
  title: 'A note with a selection menu, a colour sheet for the pen, rename by an alert with a field',
  families: ['edit menu capsule', 'colour picker in a sheet', 'alert with text fields', 'bottom toolbar with glass groups'],
  references: [
    { label: 'The edit menu on a note', href: 'https://mobbin.com/screens/a4cfb735-8a30-4567-88a5-5b5fd2398fc0' },
    { label: 'A colour sheet for the pen', href: 'https://mobbin.com/screens/29cb7507-470f-4fde-9fa2-c64d978de254' },
    { label: 'An alert with a field', href: 'https://mobbin.com/screens/8b0cf01b-25f8-4848-a43b-0c3a52cdabf9' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
