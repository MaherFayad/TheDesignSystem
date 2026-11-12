# Review round 2: fix rounds re-checked

Reviewer: ds-qa (lead plus four subagents, each claude-opus-5-5 at medium
effort). Branch `claude/ds-review-round-2`, cut from
`claude/relaxed-hypatia-7gseap` at `6ee8679`. No component source, CSS,
manifest or token was edited. Every blocker was reproduced on the current
tree in the React gallery (Chromium through Playwright) and read in the
code; the fix reports were not taken on their word. Screenshots are under
`docs/reports/reviews/shots/round-2/`, each named after its component.

Reviews: `batch-1-2.md`, `batch-3-4.md`, `batch-5.md`, `batch-6.md`,
`batch-7.md`, `batch-8.md`, `batch-9.md`, `motion-catalog.md`. Fix reports:
`docs/reports/fixes/batch-1-6.md`, `batch-5.md`, `batch-7.md`,
`batch-8-9.md`, `motion-catalog.md`.

## Summary

55 original blockers: 52 fixed, 1 not fixed, 2 fixed with a
regression.

- Not fixed: the OTPField gallery slug (`scripts/gen-index.ts:127`, routed to
  the lead and never landed). OTPField still has no gallery route, so the
  contract and axe runs skip it and stay green.
- Fixed with a regression: Sheet (the moved toast now covers "Close sheet"
  on an lg Sheet, new blocker C1) and Breadcrumbs (hover at 320px wraps the
  step out from under the pointer, new blocker B1).

New blockers: 3.

| # | File | WCAG | What |
| --- | --- | --- | --- |
| B1 | `packages/css/src/components/Breadcrumbs.css:99` to `103` | 1.4.13 | Hover on a cut off step at 320px wraps it away from the pointer; the full name cannot be read by pointer |
| C1 | `packages/css/src/components/Dialog.css:597` to `605` | 2.4.11 | On an lg Sheet the toast moved to the top covers the focusable "Close sheet" fully at 1280 by 800 and 82% at 320 by 640 |
| D1 | `packages/motion/src/core.ts:396` to `399` | 2.2.2 | `pauseLoops` only reaches `ds-motion:` animations; every component spinner is an id less infinite CSS animation, so nothing on 11 gallery routes can be paused |

Every fixed blocker has a unit test that would fail on the old code (read,
not reverted). Many of them read the CSS text rather than a rendered page;
two of those missed the regressions above (`Sheet.test.tsx:186`, the
Breadcrumbs test), see A6, B1 and C1.

## Original blockers

Review column: the review file it came from (`7` is `batch-7.md`, `motion`
is `motion-catalog.md`).

| Review | Component | Blocker | Status | Evidence |
| --- | --- | --- | --- | --- |
| 1-2 | ToggleButton | Forced colors: the label of a pressed toggle is lost behind the Canvas backplate on the Highlight fill (WCAG 1.4.3, 1.4.11) | fixed | `packages/css/src/components/Button.css:534` to `557`: `forced-color-adjust: none` on the pressed toggle and its descendants, HighlightText label and ring. With `forcedColors: 'active'` and `colorScheme: 'dark'` (the palette that failed), every pressed label is readable in Studio, Desk and Neutral, English and Arabic: `toggle-button-forced-colors-dark-palette-studio.png`, `toggle-button-forced-dark-bold-{studio,desk,neutral}.png`; light palette: `toggle-button-forced-colors-studio-dark.png`. Test: `ToggleButton.test.tsx:107` "keeps the label of a pressed toggle readable in forced colors" (reads the CSS, would fail on the old rule, which had no `forced-color-adjust`). |
| 1-2 | OTPField | Gallery slug: `scripts/gen-index.ts:127` gives `otpfield`, so `/c/otp-field` renders nothing and the contract suite skips OTPField and exits 0 | not fixed | `scripts/gen-index.ts:127` is unchanged (last commit on the file is `6a0444d`, wo-0.19). `apps/gallery-react/src/routes.gen.ts:70` still has `slug: 'otpfield'`. In the browser `/c/otp-field` has 0 `[data-demo-case]`. `packages/contract-tests/src/contract.spec.ts:99` still calls `test.skip` when a route is missing, so the run stays green. No test covers it. The fix report routed it to the lead; it has not landed. |
| 1-2 | OTPField | lg rows overflow at 320px in Neutral (WCAG 1.4.10) | fixed | `OTPField.css:47` to `53` `min-inline-size: 0`. At 320px on `/c/otpfield`: `scrollWidth` 320 and every root inside 306px (Studio, Desk) or 304px (Neutral), light and dark, LTR and RTL, 12 of 12 runs. `otp-field-320px-neutral-lg-fits.png`. Test: `OTPField.test.tsx:296` "can shrink inside a narrow flex or grid parent (reflow at 320px)", a CSS string check that fails on the old root. |
| 3-4 | RangeSlider | Thumbs drawn over each other at 320px, axe `target-size` (WCAG 2.5.8) | fixed | axe (wcag2a to wcag22aa) at 320px: 0 violations in Neutral light RTL, Studio dark LTR and Desk dark LTR. In "Thumbs side by side", ArrowRight 30 times on the first thumb stops at 2019 to 2022, centers 30.5px apart. In the variants case, thumbs pushed 13.4px apart: `elementFromPoint` at the focused thumb center hits the focused thumb (the lift works). `range-slider-320-neutral-rtl-thumbs.png`. Tests: `RangeSlider.test.tsx:106` "draws the focused thumb on top when the thumbs overlap" (CSS check) and `:112` "keeps the demo thumb centers 24px apart on a 320px screen"; both would fail on the old tree. |
| 3-4 | Rating | Default star names English under an Arabic Theme (copy rules, WCAG 3.1.2) | fixed | `Rating.tsx:27` to `38`. Gallery `lang=ar`: radios "1 من 5 نجوم" to "5 من 5 نجوم", "7 من 10 نجوم", read only image "4.5 من 5 نجوم"; the demo no longer passes labels. Test: `Rating.test.tsx:144` "names the stars in Arabic inside an Arabic Theme, with no labels passed" (`lang="ar-SA"`), fails on the old defaults. |
| 3-4 | Combobox | `contract.trigger` missing, 15 open state checks skipped | fixed | `Combobox.manifest.json` `contract.trigger` is `[data-ds='combobox'] [data-part='trigger']`, 16 matches in the demo. Opened at 320px: `aria-expanded="true"`, 6 options, axe 0 violations in Studio dark LTR and Neutral light RTL Arabic. `combobox-open-320-neutral-rtl.png`. Test: `Combobox.test.tsx:305` (the manifest trigger exists in the demo), fails on the old manifest. |
| 6 | Dialog (and Drawer, Sheet, Popover) | Close part is an IconButton, not CloseButton | fixed | `Dialog.tsx:391`, `Drawer.tsx:226`, `Popover.tsx:322`. In the gallery the visible close part has `data-ds="close-button"` in all four; Arabic names: Dialog "إغلاق النافذة", Drawer "إغلاق الشريط الجانبي", Sheet "إغلاق النافذة السفلية", Popover "إغلاق"; sizes 28 by 28, 24 by 28, 24 by 28, 24 by 24. Tests: `Dialog.test.tsx:456`, `Drawer.test.tsx:77`, `Sheet.test.tsx:81`, `Popover.test.tsx:86`, each fails on an `icon-button`. |
| 6 | Sheet | A toast raised from a Sheet covers the Sheet footer (WCAG 2.4.11, 2.4.12, PLAN.md section 12) | fixed with a regression | Toaster injected on `/c/sheet` (the gallery mounts none) and `toast.danger` raised while the Sheet is open. Footer clear: md Sheet at 320 by 640, toast 16 to 66px, footer 587 to 640px, 0% of any footer control covered; toaster returns to the bottom on close (574 to 624px). `sheet-toast-md-320.png`, `sheet-toast-md-1280.png`. Regression: on the `lg` Sheet the moved toast now covers the focusable "Close sheet": 82% at 320 by 640 and 100% at 1280 by 800, where the Sheet does not fill the screen (`sheet-toast-lg-1280.png`, `sheet-toast-lg-320.png`). See new finding 1. Test: `Sheet.test.tsx:186`, a CSS string check for the `:root:has()` rule; it fails on the old tree but does not see the lg case. |
| 6 | Popover | Manifest says Tab leaves the popover; it wraps (WCAG 2.1.1 keyboard map honesty) | fixed (option 1) | `Popover.manifest.json:89` to `90` and `Popover.tsx:24` to `26` now say Tab wraps. Gallery "many" case: six Tabs stay inside (field, field, Apply size, Close popover, then wraps), Escape returns focus to "Set size", an outside click closes it. Test: `Popover.test.tsx:307` "Tab wraps inside the popover, as the manifest says" (fails on the old manifest text). |
| 6 | HoverCard | Escape undone by the Radix openDelay timer (WCAG 1.4.13 dismissable) | fixed | `HoverCard.tsx:125` to `130` `preventDefault()` after `setOpen(true)`. Reproduced the original steps in the browser with a HoverCard mounted at the default `openDelay` (500ms): Escape at 200, 300 and 1000ms after focus, card closed 900ms later in all three. Gallery case (openDelay 0): closed after Escape and 1200ms. Test: `HoverCard.test.tsx:131` "stays closed after an early Escape: the open delay never opens it again" (`openDelay={500}`, 600ms), fails on the old handler. |
| 6 | Tour | Tab wraps inside the panel, so the tour blocks the page for keyboard users (order 1.6.13, manifest honesty) | fixed | `Tour.tsx:369` to `387`. Gallery "many": panel, Skip tour, Next step, then out to "New board" (the step target), then on through the page; the tour stays open. Same in RTL Arabic. "error" case (no target): Finish tour goes to "Start tour". Shift+Tab from the panel also leaves. `tour-tab-leaves-to-target.png`. Tests: `Tour.test.tsx:197` and `:216`, both fail on the old loop. |
| 5 | ProgressBar | Success fill 2.79:1 on the track in Neutral dark (1.4.11) | fixed | Fills now `state.*.border` (`ProgressBar.css:65` to `:75`). Measured in the browser, fill composited on the track on the page: Neutral dark success 7.96, lowest of all tones in six modes 3.05 (Desk light danger). Test `ProgressBar.test.tsx:155` "every tone fill holds 3:1 on the track in %s", reads the built tokens; the old `state.success.solid` gives 2.79 and fails it. |
| 5 | ProgressBar | Reduced motion indeterminate was a full faded bar | fixed | `ProgressBar.css:155` to `:173`. Measured under emulated reduced motion: segment from 0.30 to 0.70 of the track, opacity 1, no running animation, in LTR and RTL; `aria-valuetext` "Loading" / "جار التحميل". Test `ProgressBar.test.tsx:162` (reads CSS: no `opacity`, no `inline-size: 100%`, `translateX(75%)`); fails on the old rule. Shots `shots/round-2/progress-bar-reduced-motion-indeterminate-neutral-light-ltr.png`, `-rtl.png`. |
| 5 | ProgressCircle | Reduced motion indeterminate was a still quarter arc | fixed | `ProgressCircle.css:112` to `:123`. All 7 indeterminate rings: `border-style: dashed`, `mask-image: none`, no animation, LTR and RTL. Test `ProgressCircle.test.tsx:117` "under reduced motion the indeterminate ring is a dashed full ring, not a quarter arc"; fails on the old rule (no dashed). Shot `shots/round-2/progress-circle-reduced-motion-indeterminate-neutral-dark.png`. |
| 5 | Meter | Demo grid scrolls the 320px page (1.4.10) | fixed | `Meter.demo.tsx:41`, `:46`, `:51`, `:58`, `:83` use `min(20rem, 100%)`. At 320px: scrollWidth 320, clientWidth 320, en LTR and ar RTL. Test `Meter.test.tsx:129` "no demo grid cell has a fixed minimum wider than a 320px page"; `20rem` fails it. |
| 5 | Meter | Success fill 2.79:1 in Neutral dark (1.4.11) | fixed | `Meter.css:65` to `:73`. Neutral dark success 7.96; lowest in six modes 3.05. Test `Meter.test.tsx` "every tone fill holds 3:1 on the track in %s". |
| 5 | Skeleton | Shimmer loops forever (2.2.2) | fixed | `Skeleton.css:62` `linear 3`. `getAnimations()`: 64 shimmer animations, iterations 3, 1400ms each (4.2s in all), easing linear; 0 running after 13s. Test `Skeleton.test.tsx:75` "plays the shimmer three times, linear, never infinite", checks against `SHIMMER_ITERATIONS`; fails on `infinite`. |
| 5 | Skeleton | Nothing announces loading | fixed (demo and manifest, as the review allowed) | `Skeleton.demo.tsx:39`. 8 busy regions, 8 `role="status"` lines outside them, 1 by 1 px; tree reads `status: Loading variants` then `group "Variants"`. Test `Skeleton.test.tsx:82` "every busy region in the demo has a status line outside it that says what loads". See new finding 1. |
| 5 | ErrorState | `aria-atomic="false"` never set | fixed | `ErrorState.tsx:123` `aria-atomic={live ? false : undefined}`. Test `ErrorState.test.tsx:94` "with live it is an alert with aria-atomic false and no name override"; fails on the old code. No demo case uses `live`, so checked in the unit test only (note 3). |
| 5 | ErrorState | `live` default true shouts on load | fixed | `ErrorState.tsx:109` `live = false`. Browser: all 9 demo roots `role="group"`, named by `aria-labelledby`, no `aria-atomic`. Test `ErrorState.test.tsx:16` "renders the anatomy and the defaults: no live role, a group named by its title". |
| 5 | ErrorState | Default words ignore the Theme language | fixed | `ErrorState.tsx:116` `labelsFor(lang ?? theme.lang)`. Test `ErrorState.test.tsx:102` "takes the default words from the Theme language and sets no dir of its own" (Arabic retry and summary under `<Theme lang="ar">`, no lang or dir on the root) and `:115` (prop wins). The demo passes `lang` itself, so the browser shows the prop path only. |
| 5 | NotificationCenter | Mark all read drops focus to the body (2.4.3) | fixed | `NotificationCenter.tsx:258`, `:269` to `:272`. Browser, keyboard Enter on "Mark all as read": active element is the `h2` title, `:focus-visible` true, outline solid 2px `rgb(37, 99, 235)`; next Tab goes to the first item. Test `NotificationCenter.test.tsx:181` "moves focus to the panel title when mark all read removes its button". Shot `shots/round-2/notification-center-focus-after-mark-all-neutral-light.png`. |
| 5 | NotificationCenter | Words and times ignore the Theme language | fixed | `NotificationCenter.tsx:236` `notificationLanguage(lang ?? theme.lang)`. Test `NotificationCenter.test.tsx:192` "takes its words from the Theme language and sets no lang or dir of its own". |
| 5 | NotificationCenter | Demo grid scrolls the 320px page | fixed | `NotificationCenter.demo.tsx:127`. 320px: scrollWidth 320 in en LTR and ar RTL. Test `NotificationCenter.test.tsx:206`. |
| 8 | AspectRatio | className, style and ref on the inner Radix box | fixed | `AspectRatio.tsx` renders one `div` (or Slot). Browser: no Radix wrapper; with `inline-size: 240px` and a start margin set on the root, root 240 by 135, image 240 by 135, position static; the other 23 boxes keep their ratio (computed `aspect-ratio` matches width / height). Tests `AspectRatio.test.tsx:37` "is one element: no wrapper sits between the root and its parent" and `:42` "keeps ref, className and a consumer width on the ratio element"; both fail with the wrapper. Departs from the order (Radix named): needs the DECISIONS.md line the fix report asks for. |
| 8 | Surface | `motion` null with no reason | fixed | `Surface.manifest.json` `frameworks.react.note` starts "No motion: a static box has nothing to animate". Test `Surface.test.tsx:75` "says in the manifest why it names no motion pattern". |
| 8 | Bento | `motion` null with no reason | fixed | `Bento.manifest.json` note "No motion: a static grid ...". Test `Bento.test.tsx:69`. |
| 8 | ScrollArea | Demo wider than 320px | fixed | `ScrollArea.demo.tsx:10` to `:14` (max inline size). 320px: scrollWidth 320 in en and ar. Test `ScrollArea.test.tsx:233` "gives no demo ScrollArea a fixed inline size that could overflow a 320px screen". |
| 8 | ScrollArea | Thumb under 3:1 on every surface (1.4.11) | fixed in the component; token still wrong | `ScrollArea.css:49` to `:50` use `color.text.muted` and `color.text.default`. Browser, 12 thumbs per mode on their real background: lowest Studio dark 8.19, Studio light 6.09, Desk dark 8.33, Desk light 5.76, Neutral dark 8.58, Neutral light 7.00. Test `ScrollArea.test.tsx:217` "draws the thumb at 3:1 or more on body and surface 1 to 4 in every style and scheme". Surface 5 in Studio and Desk dark stays at about 2.5 (documented, token request open). See new finding 2. |
| 9 | Stat | `NaN` and `Infinity` drawn and read aloud | fixed | `Stat.tsx:125` to `:132`. Browser: no "NaN", infinity sign or "Infinity" text on the page; empty case reads "No data" and "Not counted yet". Test `Stat.test.tsx:78` "never draws NaN or the infinity sign: a value that is not a finite number reads as no data" and `:93` (Arabic). Shot `shots/round-2/stat-empty-no-data-neutral-light.png`. |
| 9 | Tile | No Neutral recipe, tiles read as one slab | fixed | `packages/styles/neutral/recipes/Tile.css`. Browser, Neutral: grid gap 11.36px, tiles 12px radius, 1px `border.default` edge, surface fill. Light and dark both read as separate cards. Test `Tile.test.tsx:112` "has a recipe in every style whose dial is not the 1px gap"; fails without the file. Shots `shots/round-2/tile-neutral-light-separation.png`, `tile-neutral-dark-separation.png`. |
| 7 | Navbar | `mobile` is a hand built disclosure, not a Drawer root; manifest says Drawer is not built | fixed | At 320px the menu button opens `[data-ds=drawer][data-part=mobile]`, `role=dialog` named "Site menu" ("قائمة الموقع" in Arabic); Escape returns focus to `menu-button`. Manifest `a11y.role`, `frameworks.react.behavior` now name the Drawer (`Navbar.manifest.json:116`, `:205`). Test: `Navbar.test.tsx:83` "the menu button opens the phone list as a Drawer root, and Escape closes it, back to the button" (fails on the old disclosure: no `data-ds=drawer`). Shots: `navbar-drawer-open-320-neutral-ltr.png`, `navbar-drawer-open-320-studio-rtl.png` |
| 7 | Navbar | end actions cut to an ellipsis at 320px (1.4.10) | fixed | 320px, all 3 styles x 2 schemes: bar `end` is `display: none` wherever a menu button shows, `display: flex` in the no-items case; 0 truncated elements in `end`, 0 elements past the viewport, page scrollWidth 320. Drawer footer holds "Start a trial" whole. Test: `Navbar.test.tsx:83` checks the end actions are in the Drawer footer. Gap: no test reads the CSS that hides the bar copy (`Navbar.css` phone block), see new findings |
| 7 | Sidebar | sticky header and footer hide the focused item (2.4.11); axe target-size failure | fixed | Header and footer are no longer sticky; groups scroll in a new `body` part (`Sidebar.css:152` to `176`). Tabbing all 16 body items of the too-many case: every focused item fully inside the body scrollport (Studio dark LTR 1280, Neutral light Arabic RTL 1280, Desk dark 320). axe on the Sidebar in Studio dark, Neutral light and dark Arabic RTL at 1280, and Desk, Studio, Neutral at 320: 0 violations (landmark-unique ignored). Last item "Snoozed" fully visible with its ring. Test: `Sidebar.test.tsx` "scrolls the groups in a body part, with the header and footer outside it (WCAG 2.4.11)" (fails on old: no `body` part). Shots: `sidebar-too-many-last-item-focused-studio-dark-ltr.png`, `sidebar-too-many-last-item-focused-neutral-light-rtl.png` |
| 7 | Sidebar | collapsed items have no Tooltip | fixed | Collapsed items: `role=tooltip` with the label on hover and on focus for each of the first 4 items in Studio dark, Desk light, Neutral dark RTL; Escape dismisses (0 tooltips after); no `aria-describedby` on the item. Test: `Sidebar.test.tsx` "shows a Tooltip with the label on a focused item while collapsed". Shots: `sidebar-collapsed-tooltip-on-focus-studio-dark-ltr.png`, `-desk-light-ltr.png`, `-neutral-dark-rtl.png` |
| 7 | Sidebar | manifest says Tooltip is not built | fixed | `Sidebar.manifest.json:207` now describes the Tooltip; `:271` behavior names Tooltip. No "not built" text left in Navbar, Sidebar, Rail, Avatar or Chip manifests. Manifest text is not under test (contract suite reads anatomy only) |
| 7 | Rail | `hideLabels` items have no Tooltip | fixed | `[data-hide-labels]` items (18): tooltip with the label on hover and focus in Studio dark, Desk light, Neutral dark RTL (placed at the inline end, left in RTL); Escape dismisses. `Rail.manifest.json:155` rewritten. Tests: `Rail.test.tsx` "with hideLabels, a focused item shows a Tooltip with its label (WCAG 1.4.13)" and "with labels shown, a label that fits shows no Tooltip and a cut one does". Shots: `rail-hide-labels-tooltip-on-focus-*.png` (3) |
| 7 | Tabs | soft indicator 1.5 to 1.9:1 (1.4.11) | fixed | Pill now has a 1px `text.muted` border. Computed and pixel: edge vs track 7.58 Studio dark, 5.18 Desk light, 7.76 Neutral dark, 6.29 Neutral light; edge vs fill 4.24, 3.43, 4.11, 4.14. Active weight 700 vs 500 (600 vs 500 Neutral). Test: `Tabs.test.tsx` "gives the soft pill a muted text border, so the active tab has a 3:1 edge" (reads the CSS; fails on old, no border). Shots: `tabs-soft-indicator-studio-dark.png`, `-desk-light.png`, `-neutral-light.png` |
| 7 | Dock | label not hoverable (1.4.13) | fixed | Walked the pointer from tile center to label center in 10 steps, all 6 style and scheme pairs: label opacity stayed 1 at every step, `elementFromPoint` at the label center is the label. Test: `Dock.test.tsx` "lets the pointer onto a shown name (hoverable)" (CSS read; fails on old `pointer-events: none`) |
| 7 | Dock | hovered label not dismissible by Escape (1.4.13) | fixed | Pointer on item, focus blurred to `body`, Escape: label opacity 1 to 0, all 6 pairs. `Dock.tsx:95` to `104` listens on the document while hovered. Test: `Dock.test.tsx` "Escape hides a name shown by hover while focus is elsewhere" |
| 7 | Dock | current app ring 1.0 to 1.2:1 (1.4.11) | fixed | Ring is `text.default`. Pixels, ring vs tile and vs dock: Studio dark 6.57 and 12.59, Studio light 8.93 and 13.69, Desk dark 8.72 and 16.00, Desk light 8.87 and 13.57, Neutral dark 7.10 and 13.50, Neutral light 9.66 and 14.76. Test: `Dock.test.tsx` "draws the current app ring in the default text color, not border.strong". Shots: `dock-current-app-ring-studio-dark.png`, `dock-current-app-ring-neutral-light.png`. See new finding on focus versus current look |
| 7 | Dock | edge labels cut by the viewport at 320px (1.4.10) | fixed | At 320px, every one of 48 items focused in Studio dark LTR and RTL, Desk light LTR and RTL, Neutral dark LTR, Neutral light RTL: 0 labels outside 0 to 320. Long text first tile LTR label 19 to 203 (was -51 to 133). Test: `Dock.test.tsx` "anchors the names of the first and the last item to the tile edge". Shots: `dock-first-label-inside-320-studio-dark-ltr.png`, `-rtl.png` |
| 7 | Breadcrumbs | truncation width loses to Link.css | fixed | At 1280px the long steps compute `max-inline-size: 200px`, width 200, `text-overflow: ellipsis` in Studio, Desk and Neutral, English and Arabic (Arabic steps 258 and 212px of text cut to 200). Test: `Breadcrumbs.test.tsx` "the step width beats Link standalone, which is imported later at the same layer" (fails on old selector). Shots: `breadcrumbs-truncated-at-rest-1280-desk-light-rtl.png`, `breadcrumbs-arabic-truncated-at-rest-1280-desk-light-rtl.png`, `-neutral-dark-ltr.png` |
| 7 | Breadcrumbs | a focused truncated step stays truncated at 320px (1.4.10) | fixed with a regression | Keyboard focus at 320px: "Quarterly planning..." goes to 272 x 48px, scrollWidth equals clientWidth, page width 320 (Studio dark LTR, Neutral light RTL 266 x 48). Regression: hover at 320px never holds; see new findings. Test: `Breadcrumbs.test.tsx:69` "a hovered or focused step shows whole: it wraps inside its row" (reads CSS only, cannot catch the hover loop). Shots: `breadcrumbs-focused-step-studio-dark-ltr-320.png`, `breadcrumbs-focused-step-neutral-light-rtl-320.png`, `breadcrumbs-hover-does-not-hold-320-studio-dark.png` |
| 7 | Pagination | focus lost when the page window shifts (2.4.3) | fixed | Enter on the next page number 4 times in every demo row: focus stays on the pressed page each time (4 to 5 to 9, 250 to 254, 1,240 to 1,244). `Pagination.tsx:182` uses one keyed `flatMap`. Test: `Pagination.test.tsx` "keeps focus on a pressed page when the window of pages shifts: 4 to 5 and 250 to 251" (presses pages that move; fails on old nested arrays) |
| 7 | Pagination | inert link ends leave the tab order (2.4.3) | fixed | Link-mode row: pressed Previous down to page 1, focus stays on Previous with `tabindex=0`, `aria-disabled=true`; Shift+Tab from Next reaches Previous and First. Fixed in Pagination only (`Pagination.tsx:157`, `:211`); ButtonBase root cause is lead item 1 and still open for every other inert `asChild` Button. Tests: `Pagination.test.tsx` "in link mode keeps an inert end in the tab order, and focus on it after the press" and "in link mode keeps every control focusable when the whole row is disabled" |
| 7 | Pagination | current page fill and border under 3:1, same weight | fixed | Border `text.muted` vs page: Studio dark 8.19, Studio light 6.09, Desk dark 8.33, Desk light 5.76, Neutral dark 8.58, Neutral light 7.00; vs fill 4.93 or more where measured. Weight 700 vs 400 (600 vs 400 Neutral). Shots: `pagination-current-page-studio-dark.png`, `-neutral-light.png`. No test reads the border token or the weight (fix report claims five tests, none covers this one), see new findings |
| 7 | Pagination | NaN and Infinity print into the summary | fixed | `Pagination.tsx:124` to `126`, `:166` guard the count and summary. Test: `Pagination.test.tsx` "renders no summary for an item count that is not a finite number" asserts no `NaN`, `∞` or `Infinity`. The shared guard in `packages/shared/src/pagination.ts` is still open (lead item 2) |
| 7 | TableOfContents | malformed fragment crashes the component | fixed | Loaded the gallery with `#50%` and `#%E0%A4%A`: 8 TOCs render, 0 page errors, 0 console errors. `#toc-sharing` marks "Sharing". Test: `TableOfContents.test.tsx` "renders with a malformed fragment in the URL, such as #50%" (would throw on old unguarded decode) |
| 7 | Avatar | online, away and busy differ by color only (1.4.1) | fixed | Four shapes: full disk, ring with lower half filled, disk with a bar, empty ring; distinct in Desk light, Studio dark, Neutral light, and in forced colors (CanvasText on Canvas, `forced-color-adjust: none`) in Studio dark and Neutral light. Tests: `Avatar.test.tsx` "the shapes differ from each other", "keeps the shapes in forced colors". Shots: `avatar-status-shapes-desk-light.png`, `-studio-dark.png`, `-neutral-light.png`, `-studio-dark-forced-colors.png`, `-neutral-light-forced-colors.png`, `avatar-status-shapes-md-zoom-studio-dark-forced-colors.png` |
| 7 | Avatar | `status` is not a StatusDot root | fixed | All 13 status parts in the demo are `data-ds="status-dot" data-part="status"`; names "Omar Haddad, Online / Away / Busy / Offline". Test: `Avatar.test.tsx` "the status part is a StatusDot root carrying data-part status, its words in the hidden label" |
| 7 | Chip | selected label vanishes in forced colors | fixed | Forced colors, Studio dark, Desk light, Neutral light and dark: selected root `forced-color-adjust: none`, label white on the Highlight fill, 19.04:1 computed; label plainly visible. Test: `Chip.test.tsx` "a selected chip keeps its label in forced colors" (CSS read). Shots: `chip-selected-forced-colors-studio-dark.png` and 3 more |
| motion | `settled()` in `packages/motion/src/core.ts:440` | B1. `settled()` hangs when it is called after a cancel | fixed | Chromium: dialog enter, `cancel()`, then `settled()` settles at once (it stayed pending past 1000ms before). Also settles after `settle(el)`, after a later `play()` replaced it, and on a normal finish. Window in the gallery, all three styles: close, quick reopen, close again unmounts the window, no catalog animation left. Test: `packages/motion/src/play.test.ts` "settled > resolves when it is called after a cancel (B1)". Its fake swaps `finished` for a new pending promise on cancel, as the browser does, so the old code (`await animation.finished` with no idle check, seen in `git show a60a990~1`) would stay pending and fail the test. |
| motion | manifests, `packages/motion/src/catalog.test.ts:200` to `217` | B2. Manifest motion names that are not patterns pass the check | fixed (by the option the review allowed: the fields were dropped); see note D6 | `PENDING_RENAME` is gone. The test reads `packages/manifest/src/component/*.manifest.json` directly. Every motion value in the 111 source manifests is a catalog id or `none` (script over all files: 89 values, 0 unknown). `fade` and `press` are catalog ids. But no manifest uses them: the 18 the fix report lists (Input, Textarea, Checkbox, Switch, Pagination and so on) say `none`, and Button, IconButton, WindowControls, Input, ProgressBar and StatusDot have no `motion` field at all. Their notes still say "no catalog pattern" (`Button.manifest.json:286`, `Input.manifest.json:187`, `WindowControls.manifest.json:124`). `packages/manifest/schema.json:242` is still a free string, not an enum. Test: `catalog.test.ts` "every motion value is a catalog id or none" would fail on the old `press` and `fade` values with no allow list. |
| motion | Spinner, Button, IconButton, FloatingActionButton, SplitButton, SearchField, Select, MultiSelect, Combobox, ProgressCircle, ProgressBar | B3. Loops run past five seconds with no pause path (WCAG 2.2.2) | fixed in the catalog as the review asked; the component loops are a new blocker, D1 | Helper in Chromium: `thinking` plays 3 loops and ends at 4200ms; `skeleton-shimmer` plays 3; `pauseLoops(document)` paused 4 catalog loops (spinner and 3 dots), the spinner `currentTime` stayed still for 300ms, `resumeLoops` played all 4. Components in the gallery: every spinner is a CSS animation with `infinite` iterations and an empty id. `pauseLoops(document)` paused 0 of them on every route: spinner 36 running, button 6, icon-button 5, floating-action-button 2, split-button 2, search-field 1, select 1, multi-select 1, combobox 1, progress-circle 7, progress-bar 5. No component uses the catalog `spinner` or `thinking`. No component has a pause control. Skeleton (3 loops) and StatusDot (3 loops) stop before five seconds. Tests: `play.test.ts` "loops" (4 tests). They would fail on the old code (`thinking` had `Infinity`, `pauseLoops` did not exist), but they use a fake element and cover only the catalog's own Animations, not the CSS loops the components play. |

## Contract and axe runs

Both ran once, centrally, on the final tree, for the 50 touched components:
Accordion, AspectRatio, Avatar, Bento, Breadcrumbs, ButtonGroup, Card, Chip,
Combobox, Container, Dialog, AlertDialog, Dock, Drawer, DropdownMenu,
EmptyState, ErrorState, FormWizard, HoverCard, Kbd, Label, Link, List, Meter,
Navbar, NotificationCenter, OTPField, Pagination, Popover, ProgressBar,
ProgressCircle, Rail, RangeSlider, Rating, ResizablePanels, ScrollArea,
Separator, Sheet, Sidebar, Skeleton, SplitView, Stat, Surface, Switch,
TableOfContents, Tabs, Tile, ToggleButton, Tour and Window.

| Run | Result |
| --- | --- |
| `npm run check` | exit 0, every step pass |
| `npm run contract -- --framework react --component <the 50>` | exit 0: 1544 passed, 0 failed, 73 skipped (27.5 minutes) |
| `npm run a11y -- --framework react --component <the 50>` | exit 1: 744 runs on 49 pages (Studio, Desk, Neutral; dark and light; English ltr and Arabic rtl), 696 pass, 48 fail. 0 axe violations. All 48 fails are the "open" step timing out, see note L1. Full output: `docs/reports/reviews/round-2/a11y-react.md` and `.json` (kept here so the narrowed run does not overwrite `docs/reports/a11y-react.*`) |
| axe by hand on the open states the harness could not open | 0 violations. Accordion, Breadcrumbs (collapsed steps menu), Navbar (phone menu at 320px) and Sidebar (groups open), each in Studio dark English, Neutral light Arabic and Desk light English, at 1280px and 320px |

The 73 contract skips: 60 are "axe open" and "target size open" for
Accordion, Breadcrumbs, Navbar and Sidebar (same cause as L1); 12 are
"keyboard map" for components with no keys (Surface, Stat, Skeleton,
Separator, ProgressCircle, ProgressBar, Meter, Kbd, Container, Bento, Avatar,
AspectRatio), which is expected; 1 is OTPField, which has no gallery route
(the open blocker in the table).

### Findings from these runs

L1. **note** (test gap, WCAG 4.1.2 and 2.5.8 coverage):
`packages/manifest/src/component/Accordion.manifest.json`,
`Breadcrumbs.manifest.json`, `Navbar.manifest.json` and
`Sidebar.manifest.json` list `open` and `closed` states but have no
`contract.trigger`, and their demos have no `[data-demo-trigger]`. The
contract suite then skips every open state check
(`packages/contract-tests/src/contract.spec.ts:105` to `107`), while
`scripts/a11y.ts` clicks `[data-demo-trigger]` anyway and fails on a 30
second timeout, without a count guard like the contract has. Result: the
Navbar phone menu (the Drawer the fix added) and the Breadcrumbs steps menu
have never had axe or target size checks in the automated runs. The hand run
above is clean today, but nothing keeps it so. Fix: add `contract.trigger`
to the four manifests, and give `scripts/a11y.ts` the same guard as the
contract suite (skip with a note when the trigger count is 0).

L2. **note**: `npm run a11y -- --component` writes over the full report in
`docs/reports/a11y-react.json` and `.md`, unlike `npm run contract`, which
writes a partial file for a narrowed run (`scripts/a11y.ts:190` and `:220`).
A narrowed check run by any lane silently replaces the full report.

## New findings by batch

Numbered by part: A is batch 5, 8 and 9; B is batch 7; C is batch 1-2, 3-4
and 6; D is the motion catalog.

### A. Batch 5, 8 and 9

A1. note, `packages/react/src/components/Skeleton/Skeleton.demo.tsx:39`,
   WCAG 4.1.3. The `role="status"` line mounts with its text already in it.
   Screen readers mostly read a live region only when its text changes, so
   on a page that renders the skeletons on first load, "Loading members" is
   in the tree (found in browse mode) but is often not spoken. It does speak
   when the busy region mounts after the page, which is the common client
   case. The manifest `a11y.announce` should say: render the status line
   empty, or mount it before the skeletons, then set its text. Not a
   blocker: the review asked for this pattern, and it is far better than the
   empty group it replaced.
A2. note, `packages/css/src/components/ScrollArea.css:49`, WCAG 1.4.11 side
   effect. The thumb is now solid and in the text color, and the scrollbars
   overlay the viewport. Where both axes scroll, the horizontal thumb sits
   on the last visible line of text at the start and covers part of it
   ("Search finds text inside images"). Before it was 58 percent
   translucent and lighter. Content scrolls, so nothing is lost for good, but
   it reads heavier than the Studio source. Shot
   `shots/round-2/scroll-area-solid-thumb-over-text-neutral-light.png`.
   Goes away when the `scrollbar.thumb` token request lands, or keep a block
   end padding the size of the bar when both axes scroll.
A3. note, `packages/react/src/components/ErrorState/ErrorState.demo.tsx`. No
   demo case sets `live`, so the `role="alert"` with `aria-atomic="false"`
   form is never rendered in the gallery, and the contract and axe suites
   never see it. Add an "error" case that swaps content for a live
   ErrorState after a retry fails.
A4. note, `packages/react/src/components/Stat/Stat.tsx:128` and
   `packages/css/src/components/Stat.css:183`. The empty label is selected by
   a new ad hoc hook, `data-empty-label`, which is neither a part nor a state
   in the manifest. Same class of issue as the NotificationCenter hooks
   waiting on convention item 8: Angular has to reproduce it from the source,
   not the contract. Select `[data-ds='stat'][data-empty] > [data-part='value']`
   instead, or make it a part.
A5. note, `docs/reports/fixes/batch-8-9.md:89`. The report says the Neutral
   Tile grid "stops clipping". It does not: `TileGrid.css:21` keeps
   `overflow: hidden` (computed `hidden` in Neutral). It does no harm, since
   the radius is 0 and the Tile rings are inset, but the report is wrong on
   that point.
A6. note, the fill, reduced motion and shimmer tests (`ProgressBar.test.tsx:162`,
   `ProgressCircle.test.tsx:117`, `Skeleton.test.tsx:75`) match CSS text with
   regular expressions, not a browser. They catch the old behavior, but a
   reformat of the CSS (a different indent before the closing brace of the
   media block) turns `reduced` into an empty string and the `toContain`
   checks fail loudly, while a rename of the selector could pass silently.
   The browser numbers above confirm today's behavior; a contract check of
   `getAnimations()` iterations and the reduced motion geometry would hold
   it.
A7. note, Neutral Tile and Card titles render in the link blue in the gallery
   (`tile-neutral-light-separation.png`). This is
   `apps/gallery-react/src/gallery.css:66`, already on the lead's list in the
   fix report, not a component defect.

No new blockers. No AGENTS.md hard rule break found in the touched files:
no em or en dash in the fix reports, tokens only in the changed CSS, no
`!important`, no new runtime dependency.

### B. Batch 7

B1. **blocker**: `packages/css/src/components/Breadcrumbs.css:99` to `103`.
   WCAG 1.4.13 (hoverable, persistent). At 320px with a hover pointer (the
   400% zoom layout), hovering a truncated step makes it wrap to the next
   row (y 634 to 658, 200 x 24 to 272 x 48), which moves it out from under
   the pointer, so it collapses at once. A frame log shows ENTER, LEAVE on
   alternate frames for as long as the pointer moves; with a still pointer
   it settles truncated (2 enters in 2.5s, `:hover` false, width 200). The
   full name is never readable by pointer at this width, and the step
   flickers under a moving pointer. The old rule did not wrap, so this is
   new. Keep the hovered step on its row (for example only `:focus-visible`
   wraps, hover shows the name without changing layout), and add a browser
   level check. Shot: `breadcrumbs-hover-does-not-hold-320-studio-dark.png`.
B2. note: `packages/css/src/components/Dock.css:41`. In Studio and Desk the
   current app ring (`text.default`, 2px inset, `#ededed` dark) looks like
   the focus ring (`#f4f4f5`, 2px outer). With focus on a neighbor, two tiles
   carry near identical white rings; the only other cue is the fill. Not a
   2.4.7 failure (focus is visible), but the two states read alike. A ring
   inset by a gap, or the open dot plus weight on the label, would set them
   apart. Shots: `dock-focus-and-current-look-alike-studio-dark.png`,
   `-studio-light.png`, `-desk-dark.png`.
B3. note: `packages/css/src/components/Dock.css:269`. A label shown by focus
   (not hover) now takes the pointer (`pointer-events: auto`), so the name
   of a focused tile blocks clicks on page content above the dock until
   focus leaves. Only the hovered case needs it.
B4. note: `packages/react/src/components/Navbar/Navbar.tsx:200` and `:239`.
   `end` renders twice under `breakpoint.tablet` once the Drawer opens: once
   hidden in the bar, once in the Drawer footer. Stateful or id carrying end
   content (an account menu, a theme switch with an id) mounts twice. The
   manifest should say so.
B5. note: `packages/react/src/components/Navbar/Navbar.tsx:219`. The Drawer is
   a dialog named "Site menu" holding a `nav` also named "Site menu"; a
   screen reader hears the name twice on entry. Name the inner nav after the
   bar's landmark, or leave the dialog name alone.
B6. note (test gap): no unit or contract test reads the Navbar phone rule
   `[data-ds='navbar'] > [data-part='end']:has(~ [data-part='menu-button'])`
   (`Navbar.css`, phone block) or the Pagination border token and weight
   (`Pagination.css:31` to `33`, `:81`). Either could regress silently. A
   CSS read test like the Tabs and Dock ones would cover both.
B7. note: `packages/css/src/components/Avatar.css:131`, `:138`, `:143`. At the
   md avatar the status is 11.7px (13.7px Neutral); away (lower half filled)
   and busy (bar) are told apart by a few pixels. Distinct in every shot, so
   1.4.1 passes, but sm and xs will be harder. Worth a check when StatusDot
   takes the shapes (lead item 6).
B8. note: the ButtonBase root cause (inert `asChild` link drops out of the
   tab order) and the shared `pagination.ts` guards are still open as lead
   items 1 and 2; Pagination works around both locally. Any other inert link
   Button or IconButton still fails 2.4.3 until item 1 lands.

No AGENTS.md hard rule break found in the fix diff: no raw color, no
physical property, no `title` attribute on a DOM element, no `!important`,
no em or en dash.

### C. Batch 1-2, 3-4 and 6

C1. **blocker**, WCAG 2.4.11 (focus not obscured, minimum): `packages/css/src/components/Dialog.css:597` to `605`. The rule that moves a bottom toaster to the top edge while a Sheet is open puts the toast over the Sheet close control on an `lg` Sheet: 100% of "Close sheet" at 1280 by 800 (the Sheet is 1000px wide and does not fill the screen) and 82% at 320 by 640. A danger toast never times out and cannot be reached by keyboard while the Sheet is open, so focus on the close control is entirely hidden for as long as the Sheet stays open. The fix report names a "fills the screen" limit, but the measurement shows it at desktop width too. The guarding test (`packages/react/src/components/Sheet/Sheet.test.tsx:186`) only reads the CSS and cannot see it. Shots: `sheet-toast-lg-1280.png`, `sheet-toast-lg-320.png`. The lasting fix belongs in the toast layer (fix report, lead change 2).
C2. note: `packages/css/src/components/Dialog.css:597` to `605`. Dialog.css restyles the Toaster (`flex-direction`, `inset-block-*`, the toast private `--_toast-enter-y`). The fix report admits this sits outside the rule that a parent restyles only a nested component through private properties. Move it into `Toast.css` keyed on an attribute DialogBase sets.
C3. note: `packages/contract-tests/src/contract.spec.ts:99`. A ready component with no gallery route is still skipped, not failed. This is what hid the OTPField slug; it will hide the next one.
C4. note: `packages/css/src/components/RangeSlider.css:27`. The thumb lift uses `--ds-z-canvas-selection` (51) inside an isolated control. It works, but the token name is wrong; the `z.raised` token request in the fix report is still open.
C5. note, WCAG 2.5.8: `packages/manifest/src/component/RangeSlider.manifest.json:128` to `132`. The review asked the manifest to say that `minStepsBetweenThumbs` should keep the thumb centers 24px apart at the narrowest width. The prop description is still "Steps that must stay between the thumbs." With the default of 1 the variants slider lets the thumbs sit 13.4px apart at 320px. The focus lift keeps the focused thumb reachable, but a consumer has no guidance.
C6. note: `packages/react/src/components/Tour/Tour.tsx:135`. A target that takes no focus gets `tabindex="-1"` and keeps it after the tour ends. Harmless for the keyboard, but the Tour writes to page content and never cleans up; remove the attribute it added on step change and on close.
C7. note, WCAG 3.1.2: `packages/react/src/components/Tour/Tour.demo.tsx`. Under `lang=ar` the English step copy ("Start a board") sits in a panel whose buttons are Arabic ("تخطي الجولة", "الخطوة التالية"): the English cases are still not wrapped in an English Theme. Already a note in review batch 6; still open.
C8. note: `packages/react/src/components/Tour/Tour.tsx:369` to `387`. Once Tab has left the panel for the target, Shift+Tab from the target walks back through the page, not to the panel; the panel is reached again only from the end of the document. Not a trap, and the manifest does not promise a way back, but say in `a11y.keys` how to return (for example the Toaster style F6 or a hotkey), or move focus back to the panel on Shift+Tab from the target.

Visual sweep (Studio, Desk, Neutral, light and dark, at 900 by 640) of ToggleButton, OTPField, RangeSlider, Rating, Combobox, Dialog, Drawer, Sheet, Popover, HoverCard and Tour: no layout regressions and no console errors.

Not done: `npm run contract` and `npm run a11y` (the lead runs them); `npm run check` was not rerun, since this round edited no source, test or lint file, only PNG shots under `docs/reports/reviews/shots/round-2/`.

### D. Motion catalog

D1. `packages/motion/src/core.ts:396` to `399`. **Blocker**, WCAG 2.2.2. `pauseLoops` and `resumeLoops` keep only Animations whose id starts with `ds-motion:`. Every spinner and indeterminate loop a component ships is a CSS animation with no id (`packages/css/src/components/Spinner.css:37`, `Button.css:152`, `SearchField.css:165`, `ProgressCircle.css:103`, `ProgressBar.css:127`, all `infinite`), so the API the fix report points to pauses none of them. Proved in Chromium on 11 gallery routes: 0 paused, every loop still running. The "Many spinners, one per busy row" demo is a page that stays usable, the case the spinner file says needs a pause control, and it has none. Evidence: `motion-spinner-studio-dark.png`. Fix: one of these. Components play the catalog `spinner` through `play()`. Or `pauseLoops` also pauses `CSSAnimation`s with infinite iterations under the root. Or the CSS adds a pause hook, such as `animation-play-state: paused` under a root attribute. Then the components with a usable page around them wire a pause control (order 1.21).
D2. `packages/motion/src/play.test.ts:101` to `111`. Note. The `pauseLoops` test uses a fake root that returns only catalog Animations, so it cannot see the gap in finding 1. Add a browser or fake case with an id-less infinite CSS animation under the root.
D3. `packages/motion/src/patterns/thinking.ts:6`. Note. The comment says the dots "rest at their first frame" after the last loop, but the spec has `fill: 'none'`. After the last loop the dot shows its own CSS style (opacity 1, no lift), not the first frame (opacity 0.4). Either set the end opacity in the component CSS or fix the comment.
D4. `packages/motion/src/core.ts:440`. Note. `settled()` on a loop that `pauseLoops` paused, or on an infinite spinner, never resolves (Chromium: pending after 300ms). This is expected, but the doc comment says "Resolves when the animation ends or is cancelled" and does not warn against awaiting a loop. Add one line.
D5. `packages/motion/src/catalog.test.ts:214`. Note. The check skips a manifest with no `motion` field or a value that is not a string. Button, IconButton, WindowControls, Input, ProgressBar and StatusDot now have no field, so the test cannot tell "no motion" from "forgot the field". Make the field required, with `none` as the explicit value, or make it an enum in `packages/manifest/schema.json:242` as the fix report asks.
D6. `packages/manifest/src/component/*.manifest.json`. Note, the lead's work. The 18 manifests listed under "Changes needed from the lead" in `docs/reports/fixes/motion-catalog.md` still say `none` or have no field, and Button, IconButton and WindowControls still say "no catalog pattern" while `press` exists. No component plays `fade` or `press` yet.
D7. Regression check. No regression found. `animateWindow` now goes through `play()` with group `window-`. Window open, close and a quick reopen work in Studio, Desk and Neutral, and the window unmounts after close (`motion-window-*.png`).
