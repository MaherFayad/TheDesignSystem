# Order P1, lane E3: React and shared

Scope from `docs/plan/reset-mobile.md`, round 1, lane E3. Files touched are
only in `packages/react` and `packages/shared`. No manifest, contract doc or
CSS file was edited. No barrel changed, so `gen-index` was not needed.

Sheets (outside the repo):
`/tmp/claude-0/-home-user/518a8dbb-1db5-56da-adff-512e498db35e/scratchpad/p1/e3/`,
named `<phase>-<component>-<case>-<style>-<scheme>-<platform>.png`.

## 1. TabBar demo: side column search fields and the accessory row

Cause, measured at 390 by 844 on ios: in the case `search-side` the compact
side bar hides (`visibility: hidden`) and is 10 by 10; its expanded field is
drawn out of the bar's box, 48 high, with its foot on the bar's foot. In the
flex row the two 10 px bars sat 16 px apart, so the two fields overlapped by
28 px (Desk; axe `target-size` failed) and the first rose over the case title.
In `variants` the bottom bar's accessory capsule is drawn 56 px above the bar
(48 and the 8 gap), over the row label above it, in English and Arabic.

Fix, `packages/react/src/components/TabBar/TabBar.demo.tsx`:

- `search-side`: each bar is in its own block (`SideSearch`), as tall as the
  field (`--ds-size-touch-ios` plus `--ds-space-fixed-2xs`), bar at its end;
  English then Arabic one under the other. Same copy as before.
- `AppBar`: on ios, a bottom bar with a non compact accessory keeps 56 px of
  room above it (touch size, 2xs and m), read from `useTheme().platform`, so
  web keeps its old spacing.

Measured after, Desk ios: title ends at 83, the fields are 92 to 140 and 150
to 198, no overlap. Sheets after: `search-side` in the four styles, light and
dark, ios and web (16); `variants` in the four styles, light, ios and web (8).
axe (`target-size`, `color-contrast`) on the case: no violation in any of the
24 (before: Desk ios `target-size` 1).

## 2. Navbar `title-wrap`: the Arabic shell

Cause: the two shells sat in a `DemoRow` (flex). The Arabic `Theme` with
`data-demo="content"` is a grid with a `minmax(0, 1fr)` column, so as a flex
item its content width was 0 and the shell (`min(100%, 20rem)`) came out 2 px.

Fix, `packages/react/src/components/Navbar/Navbar.demo.tsx`: the two shells
are in a `DemoGrid min="20rem"`, so each takes a cell. Measured after: both
shells 320 wide, at 390 and at 1280 wide, ios and web. Sheets after in the
four styles, ios and web; axe clean.

## 3. Sheet header action disc on the ios glass

The disc is the Button inside `div[data-part="header-action"]` (ios.css styles
`header-action > :is([data-ds='button'], [data-ds='icon-button'])` as the
close disc), so that is what joins `REFRACTION_PARTS` in
`packages/shared/src/refraction.ts`:
`[data-ds='sheet'] > [data-part='panel'] > [data-part='header'] > [data-part='header-action'] > :is([data-ds='button'], [data-ds='icon-button'])`.
The part div itself is not on the list (a layout box, not glass).

Measured in Chromium, Liquid and Neutral, ios: the header action button now
gets `--_ios-refraction: url(#ds-refraction-44x44r22)`, the same filter as the
close disc. Its `backdrop-filter` stays `blur(12px) saturate(1.6)` until the
CSS reads the property: that needs `ios-refraction.css` (lane E1).

### Lines for E1, `packages/css/src/platform/ios-refraction.css`

At each of the twelve selectors that name the close disc (lines 73, 123, 220,
244, 245, 267, 355, 400, 442, 472, 473, 496 today), add the same selector with
`> [data-part='close']` replaced by
`> [data-part='header-action'] > :is([data-ds='button'], [data-ds='icon-button'])`
(and `::before` kept where the close line has it). For example, beside line 123:

```css
:root[data-refraction='true'] [data-platform='ios'] [data-ds='sheet'] > [data-part='panel'] > [data-part='header'] > [data-part='header-action'] > :is([data-ds='button'], [data-ds='icon-button']),
```

Checked with that tier 1 line injected into the page: the button's
`backdrop-filter` becomes `url("#ds-refraction-44x44r22") blur(1.5px)
saturate(1.15)`, the same as the close disc (Liquid; Neutral 1px). Sheets:
`after-Sheet-header-action-<style>-ios.png` and
`after-with-css-line-Sheet-header-action-<style>-ios.png`.

## 4. SplitView on a folded screen

Cause: `packages/css/src/platform/ios-shell.css` lines 994 to 996 set
`flex: 1 1 0` on both panes under `(horizontal-viewport-segments: 2)`, an even
split of the root. That lands on the band only when the root is centred on it.
With the root not centred (a side column of 84 at the right, on the folded
profile `duo-inner-landscape-folded`), the panes were 18 to 413 and 454 to 849:
the detail started in the band (455 to 495).

Fix:

- `packages/shared/src/fold.ts`: `foldSplit(fold, box, dir)`, the pane sizes
  in percent that put the divide in the band: each pane takes the part of its
  own segment the root covers; the first pane is on the right in rtl; null
  without a side by side fold or when the band is outside the root.
- `packages/react/src/components/SplitView/SplitView.tsx`: SplitView keeps
  the sizes itself (controlled group), reads the fold with `useFold` while
  split, measures the root's content box and sets the fold sizes. The limits
  widen to let them in; the handle still resizes; the sizes from before the
  fold come back when it goes; `onLayout` is not called for fold sizes.
  Nothing changes without the viewport segments API.

### Line for E1, `packages/css/src/platform/ios-shell.css`

Remove the rule at lines 994 to 996 (`flex: 1 1 0` on the panes under
`horizontal-viewport-segments: 2`), so the base `flex:
var(--_resizable-panels-size) 1 0` applies and the sizes React and Angular
write are used. Keep the column gap at line 990. The stand in rule at lines
1031 to 1033 can stay: the stand in has no segments, so React does not size.

Measured with that rule overridden in the page (Liquid and Desk, ltr and rtl):
list 18 to 454 and detail 495 to 849 in ltr, mirrored in rtl, exactly the band
edges. Without it, the sizes are written (`55.25`) but the CSS keeps them even.
Sheets: `after-SplitView-folded-offset-<style>-<dir>[-with-css-line].png`.

## Tests

- `packages/shared/src/refraction.test.ts`: the header action disc is on the list.
- `packages/react/src/components/Sheet/Sheet.headerAction.test.tsx`: under an
  ios Theme the header action button and the close disc match
  `REFRACTION_SELECTOR`; the part div does not.
- `packages/shared/src/fold.test.ts`: `foldSplit`, centred root, offset root,
  rtl, and the null cases.
- `packages/react/src/components/SplitView/SplitView.fold.test.tsx` (new): no
  API, offset root, rtl, restore after the fold, band outside the root.

## Commands and results

- `npm run typecheck`: passed.
- `npx vitest run packages/react/src/components/TabBar packages/react/src/components/Navbar packages/react/src/components/Sheet packages/react/src/components/SplitView packages/shared`: 47 files, 677 tests passed.
- Contract, `DS_CONTRACT_WORKERS=1 npm run contract -- --framework react --platform ios --component <Name>`:
  TabBar 42 passed, 1 skipped; Navbar 43 passed, 20 skipped; Sheet 63 passed; SplitView 43 passed. No failures.

## Not done, and for other lanes

- The two CSS lines above (E1). Until they land, item 3 shows no bend and
  item 4 keeps the even split in the browser; the React and shared side is in.
- Angular: SplitView there has no fold sizing; it would call `foldSplit` the
  same way.
- No "before" sheet of the Navbar case: the 2 px width is the measured cause above.

## Decisions

- The refraction part is the button in the header action, not the div: the
  disc is drawn on the button, as the close disc is drawn on the close control.
- Fold sizes go through the group as ordinary sizes, so the handle keeps
  working, and are not reported to `onLayout` (they belong to the screen).
- The TabBar accessory room is on ios only, read from the Theme, so web keeps
  its spacing.
