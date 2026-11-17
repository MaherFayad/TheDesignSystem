// The list of iOS test screens (order M10.0), in the order of the plan's
// table (docs/plan/reset-ios-families.md section 5).
//
// How a screen order adds its screen: the file ./<id>.tsx already exists as
// a stub and is listed here. Replace the stub's `Screen` with the screen,
// set `meta.status` to 'built', and keep `meta` and `Screen` exported. Put
// styles in ./<id>.css beside it (gallery overrides layer only) and import
// that file from ./<id>.tsx. Nothing else changes: the route, the frames,
// the index page and the capture script read this list.
//
// A screen that is not in the plan's table is a new order: the lead adds its
// line here.
import * as booking from './booking';
import * as fitnessPlan from './fitness-plan';
import * as inboxSwipe from './inbox-swipe';
import * as musicLibrary from './music-library';
import * as musicSearch from './music-search';
import * as notesEdit from './notes-edit';
import * as onboarding from './onboarding';
import * as passDetail from './pass-detail';
import * as settings from './settings';
import * as shareFlow from './share-flow';
import type { ScreenModule } from './types';

export const screens: readonly ScreenModule[] = [musicLibrary, musicSearch, passDetail, settings, inboxSwipe, booking, notesEdit, onboarding, fitnessPlan, shareFlow];

export function screenById(id: string): ScreenModule | undefined {
  return screens.find((s) => s.meta.id === id);
}
