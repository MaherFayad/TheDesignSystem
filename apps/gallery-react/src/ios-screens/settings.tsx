// M10.4 settings: a stub from order M10.0. Order M10.4 owns this file and
// replaces the stub with the screen (docs/plan/reset-ios-families.md
// section 5). Keep the two exports: `meta` and `Screen`. Content comes from
// ./kit; styles go in an optional ./settings.css beside this file.
import { StubScreen } from './stub';
import type { ScreenMeta, ScreenProps } from './types';

export const meta: ScreenMeta = {
  id: 'settings',
  order: 'M10.4',
  title: 'App settings: grouped rows, switches, a stepper, a pop-up button, a slider, account fields',
  families: ['grouped list', 'section header and footer', 'switch', 'stepper', 'pop-up button', 'slider', 'text fields in grouped rows', 'segmented control', 'split of list and detail (inner screen, landscape)'],
  references: [
    { label: 'Timer settings', href: 'https://mobbin.com/screens/3dbbba07-85fb-446a-b7f6-6716cd8b5a3e' },
    { label: 'App settings with a slider', href: 'https://mobbin.com/screens/36c13178-2eb0-4c24-bad1-d048d6f31ccf' },
  ],
  frames: ['phone', 'duo-outer', 'duo-inner'],
  status: 'stub',
};

export function Screen(props: ScreenProps) {
  return <StubScreen meta={meta} {...props} />;
}
