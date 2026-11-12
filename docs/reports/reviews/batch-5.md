# Review: wave 1, batch 5 (feedback)

Fresh eyes review by ds-qa of the eleven components merged from lanes 5A,
5B and 5C: Alert, Callout, Banner, Spinner, ProgressBar, ProgressCircle,
Meter, StatusDot, Skeleton, ErrorState, NotificationCenter. No source file
was edited. Base: `claude/relaxed-hypatia-7gseap` at the merge of the three
lanes.

## Summary

| Component | Verdict | Blockers | Notes |
| --- | --- | --- | --- |
| Alert | pass | 0 | 5 |
| Callout | pass | 0 | 2 |
| Banner | pass | 0 | 5 |
| Spinner | pass | 0 | 3 |
| ProgressBar | fix needed | 2 | 4 |
| ProgressCircle | fix needed | 1 | 4 |
| Meter | fix needed | 2 | 4 |
| StatusDot | pass | 0 | 4 |
| Skeleton | fix needed | 2 | 3 |
| ErrorState | fix needed | 3 | 4 |
| NotificationCenter | fix needed | 3 | 5 |

The look is clean in all six style and scheme pairs, Neutral included, and
the text contrast is right everywhere axe can see it. What needs fixing is
behavior that only shows in a browser or in a screen reader: a lost focus,
an alert role that reads too much, a reduced motion form that lies about the
value, a loop that never ends, and two components that ignore the Theme
language. Six of the blockers are one line or a few lines each.

## How this was checked

- `npm install`, then `npm run check`: green (tokens, gen, typecheck,
  eslint, manifests, vitest, Angular, native, consumers).
- `npm run contract -- --framework react --component Alert,Callout,Banner,Spinner,ProgressBar,ProgressCircle,Meter,StatusDot,Skeleton,ErrorState,NotificationCenter`:
  **308 passed, 4 failed**. The four failures are "no sideways scroll at
  320px" for Meter and NotificationCenter, en ltr and ar rtl. Cause: the demo
  grids (see Meter and NotificationCenter below), not the components.
- `npm run a11y`: 600 axe runs on 45 pages, **576 pass, 24 fail**. All 24
  failures are outside this batch: a locator click timeout when opening
  `/c/accordion` and `/c/section` (12 each, every style, scheme and
  direction). The eleven pages of this batch pass in every run. The
  regenerated `docs/reports/a11y-react.*` files are not part of this commit.
- My own Playwright run (chromium headless, `@axe-core/playwright`), React
  gallery on port 5173, `chrome=0`:
  - axe (wcag2a, wcag2aa, wcag21aa, wcag22aa and best practice) on every
    component page in studio, desk and neutral, dark and light, en ltr, plus
    desk dark and neutral light in ar rtl. 88 runs. `color-contrast`: no
    violation anywhere. Only `landmark-unique` (best practice) fired, on
    Banner and NotificationCenter (see below).
  - Non text contrast of every mark (dot, indicator, ring, arc, unread dot,
    callout edge), computed against the real composited background by
    walking the ancestor backgrounds, in the six pairs. Results are cited
    where they fail.
  - Accessibility tree snapshots, keyboard paths (close, dismiss, mark all
    read), sticky scroll padding, 320px and 640px wide (200 percent zoom of a
    1280px window), forced colors (emulated), reduced motion on and off.
- Screenshots that show a finding: `docs/reports/reviews/shots/batch-5/`.
- I read the lane reports last, after forming the findings below.

---

## Alert: pass

Anatomy, axes, tone words on the icon, live role rule and the solid
emphasis button overrides are right. The accessibility tree reads
`img "Notice"` then the title and body; a live danger alert is `role=alert`,
other live tones `role=status` with `aria-atomic`.

- **note** `packages/manifest/src/component/Alert.manifest.json:126` The
  announce text tells a consumer to "keep an empty live Alert mounted and
  fill it". The API cannot do that: `title` is required
  (`Alert.tsx:49`) and the icon and box always render, so an "empty" Alert
  is a visible empty box. Either drop the advice and point polite live
  messages to Toast, or add the pattern (a `live` region that renders
  nothing until it has a title).
- **note** `packages/react/src/components/Alert/Alert.tsx:117` Close leaves
  focus to the consumer, and the demo does not move it: after Enter on the
  close button in `case=one`, `document.activeElement` is `BODY`
  (`Alert.demo.tsx:48`). Banner moves focus itself. See "one convention",
  item 3.
- **note** `packages/css/src/components/Alert.css:66` The fade-rise plays on
  every mount, including alerts present at load. Harmless (140ms, reduced
  motion off), but the comment says "when an alert mounts"; an Alert in the
  first paint should not move. Consider playing it only with `live`.
- **note** `packages/css/src/components/Alert.css:225` and `:230` The hover
  and press veils on a solid alert use raw `12%` and `20%` in `color-mix`.
  Logged by the lane as a token gap; keep it on the token list.
- **note** `packages/react/src/components/Alert/messageTones.ts:15` and
  `packages/react/src/components/ProgressBar/format.ts:12` Two copies of
  `isArabic`, plus the same regex in `ErrorState.tsx:47`,
  `NotificationCenter/time.ts:9` and `Toast.tsx:43`. See "one convention",
  item 2.

## Callout: pass

Role `note`, named "Note Boards keep their history" through the icon and the
title, no live role, no motion. Arabic copy is natural white Saudi ("مو
عليك", "اللي تبيها").

- **note** `packages/css/src/components/Callout.css:31` The neutral tone
  edge is `color.border.default`: 1.19:1 (neutral light) to 1.66:1 (studio
  and desk dark) against the page. The edge is decorative (the icon name
  carries the tone), so this is not a 1.4.11 failure, but the neutral
  callout reads as a plain tinted box in light schemes. Consider
  `color.text.muted` for the neutral edge.
- **note** `packages/manifest/src/component/Callout.manifest.json`
  `insteadUse` points live messages to Alert, as the order asks. Good. It
  could also name Banner for "a note about the whole app" (it does) and
  Toast (it does). No change.

## Banner: pass

Region named "Announcement", tone word on the icon, close moves focus to
`#banner-demo-boards` before `onDismiss` (checked in the browser), sticky
sets `scroll-padding-block-start` to the banner height (35.6px measured on
its scroll container), and the actions move below the body under
`breakpoint.phone`.

- **note** `packages/css/src/components/Banner.css:5` and `:168` The comment
  says "the fill is always opaque". It is not for `tone="accent"
  emphasis="solid"` in Studio: `--_banner-tone-solid` is
  `color.primary.fill`, which is `rgba(255,255,255,0.2)` in Studio dark and
  `rgba(17,24,39,0.2)` in Studio light, and the tint is set to transparent.
  A sticky Studio accent banner shows content scrolling under it. It also
  looks the same as the soft neutral banner
  (`shots/batch-5/banner-studio-dark-accent-solid-translucent.png`, rows 2
  and 8). Fix: on solid, keep `background-color: var(--_banner-bg)` over the
  surface, for example `background-image: linear-gradient(var(--_banner-tone-solid), var(--_banner-tone-solid))`
  with `--_banner-bg: var(--ds-color-bg-surface)`.
- **note** `packages/react/src/components/Banner/Banner.tsx:153` Every
  banner without `label` is named "Announcement". axe `landmark-unique`
  fires on the variants page in every style. The manifest says "give each
  banner its own label when a page has two"; a dev warning, or a default
  that includes the tone word ("Warning announcement"), would make the rule
  hold by default.
- **note** `packages/react/src/components/Banner/Banner.tsx:125` Two sticky
  banners in one container each write and restore the same
  `scroll-padding-block-start`; the second unmount restores the first
  banner's value. Documented in the manifest notes. Acceptable for now.
- **note** `packages/react/src/components/Banner/Banner.tsx:70` `onDismiss`
  where Alert and Toast use `onClose`. The order named `onDismiss`. See "one
  convention", item 3.
- **note** `packages/react/src/components/Banner/Banner.demo.tsx:75` In the
  variants case the solid warning button uses the banner ink; fine. The
  English action copy ("Add payment method", "Open status page") is verb
  plus noun. Arabic "إضافة طريقة دفع", "عرض التفاصيل" are noun forms. Good.

## Spinner: pass

`role=status` with a hidden label, `aria-hidden` when decorative, a still
ring with its arc under reduced motion, two system colors in forced colors.
The turn is clockwise in both directions, as documented. Arc contrast is
8.7:1 or more in every pair.

- **note** `packages/css/src/components/Spinner.css:49` and `:50` `lg` is
  `size.icon.lg * 1.5` and `border.width.strong * 1.5`: a raw multiplier.
  Logged by the lane as a token gap. A `size.icon.xl` (36px) token closes it.
- **note** `packages/css/src/components/Spinner.css:37` The spin is
  infinite. That is the `spinner` pattern (`iterations: Infinity`), and a
  busy sign is the 2.2.2 "essential" case only when nothing else can be
  used. A Spinner beside working content for more than five seconds needs a
  way to stop; say in the manifest `avoidWhen` "a wait longer than five
  seconds beside content the person keeps using" points to ProgressBar (the
  current wording says "a few seconds with no visible text").
- **note** `packages/css/src/components/Spinner.css:64` The visually hidden
  block is the fourth copy of the same eight declarations (Button status,
  StatusDot, NotificationCenter). See "one convention", item 6.

## ProgressBar: fix needed

Radix progress, `aria-valuetext` carries the formatted value or "Loading",
the indicator scales with `scaleX` from the inline start and the origin
flips under `:dir(rtl)`. The tree reads `progressbar "Uploading files":
Uploading files 46%`.

- **blocker** `packages/css/src/components/ProgressBar.css:62` WCAG 1.4.11.
  In **Neutral dark** the success fill (`color.state.success.solid`,
  `#047857`) is **2.79:1** against the track and the page. The fill is the
  graphic that shows how far the task is. Danger is 3.17:1 there, Desk
  light warning 3.17:1, both just over. Fix in the Neutral tokens (the
  Neutral dark `state.success.solid` needs to reach 3:1 on `bg.body`), or
  draw the indicators with the `state.*.border` tokens, which StatusDot
  already uses because they are specified at 3:1 on body, surface and
  surface-2. Screenshot:
  `shots/batch-5/progress-bar-success-fill-2.79-neutral-dark.png`.
- **blocker** `packages/css/src/components/ProgressBar.css:155` to `:162`
  Under reduced motion the indeterminate bar becomes a full width bar at
  `opacity.disabled`. Visually that is a finished bar, faded, and the lane
  measured it at about 2:1 in Desk light. With `showValue={false}` nothing
  on screen says the task is still running
  (`shots/batch-5/progress-bar-reduced-motion-indeterminate-neutral-light.png`).
  The ProgressCircle lane rejected the same faded form for the same reason.
  Fix: keep a still segment at the inline start (the 40 percent segment
  with `transform: none`) in the full tone color, or a striped track, and
  keep "Loading" visible unless the caller shows its own status text.
- **note** `packages/react/src/components/ProgressBar/ProgressBar.demo.tsx:12`
  and `:19` The warning variant is labelled "Storage almost full" /
  "المساحة قربت تخلص". That is a measure, which the ProgressBar manifest
  sends to Meter, and the Arabic is a sentence where a label wants a noun
  form. ProgressCircle already changed it to "Upload slowing down" / "بطء
  الرفع"; do the same here.
- **note** `packages/react/src/components/ProgressBar/format.ts:1` Formatting
  uses `Intl.NumberFormat` directly because `packages/shared/src/number.ts`
  did not exist. Keep the swap on the lead's list.
- **note** `packages/react/src/components/ProgressBar/ProgressBar.tsx:72` No
  name when neither `label` nor `aria-label` is given; Radix renders an
  unnamed progressbar. axe catches it in a test, but a dev warning (as the
  lane suggests) is cheap.
- **note** `packages/react/src/components/ProgressBar/ProgressBar.test.tsx`
  The RTL origin flip and the reduced motion form are only covered by CSS
  reading; neither is asserted in a browser. The contract suite does not
  cover them either.

## ProgressCircle: fix needed

Conic mask on a bordered span, no stroke animation, value text hidden from
the tree because `aria-valuetext` says the same.

- **blocker** `packages/css/src/components/ProgressCircle.css:98` and
  `:114` Under reduced motion the indeterminate ring stops as a still
  quarter arc, which is exactly what a determinate ring at 25 percent looks
  like, and the indeterminate form shows no value text
  (`ProgressCircle.tsx:68`). A sighted person reads "a quarter done"
  (`shots/batch-5/progress-circle-reduced-motion-indeterminate-neutral-dark.png`:
  compare the Indeterminate row with the others, and "Syncing boards" in the
  loading case). Fix: give the still form a shape no value can have, for
  example a dashed full ring (`border-style: dashed` on the indicator with
  the mask removed) or two short arcs at 12 and 6 o'clock.
- **note** `packages/react/src/components/ProgressCircle/ProgressCircle.demo.tsx`
  "Value on small sizes" shows `showValue` at xs: "46%" spills out of the
  16px ring (visible in every shot). Either clamp `showValue` to md and lg,
  or drop the demo row; the manifest already says the value is not readable
  at xs and sm.
- **note** `packages/css/src/components/ProgressCircle.css:62` Neutral dark
  success ring is 3.55:1 (passes because the ring sits on the page, not on
  the track), but see the ProgressBar blocker for the shared token.
- **note** `packages/css/src/components/ProgressCircle.css:27` The track is
  `bg.overlay-10`; at 0 percent in Studio and Neutral dark the ring is
  almost invisible (empty case). Not a 1.4.11 failure (the track is not
  needed to read the value once there is one), but at 0 percent there is
  nothing to read. Consider `bg.overlay-20`, as Spinner uses.
- **note** `packages/react/src/components/ProgressCircle/ProgressCircle.tsx:87`
  A long `valueText` ("7 of 12 files") is `white-space: nowrap` inside a
  44px ring. The demo uses "7/12", which fits. Say the limit in the
  manifest prop description.

## Meter: fix needed

`role=meter` with `aria-valuetext` "32 GB of 100 GB, Plenty of room"; the
level word is in the visible value text too, so the level is never color
alone.

- **blocker** `packages/react/src/components/Meter/Meter.demo.tsx:41`, `:46`,
  `:51`, `:58`, `:83` `DemoGrid min="20rem"`: at 320px the cell is wider than
  the 292px column, the page scrolls sideways by 14px, and the contract
  suite fails ("no sideways scroll at 320px", en ltr and ar rtl). The Meter
  itself reflows. Fix: `min="min(20rem, 100%)"` or `16rem`.
  Screenshot: `shots/batch-5/meter-320px-sideways-scroll.png`.
- **blocker** `packages/css/src/components/Meter.css:62` Same as
  ProgressBar: success fill 2.79:1 in Neutral dark (WCAG 1.4.11). For a
  meter the color is the tone of the level, and the level word saves 1.4.1,
  but the fill length is the value and must reach 3:1.
- **note** `packages/manifest/src/component/Meter.manifest.json:72`
  `"states": []`, while the root stamps `data-level` (`Meter.tsx:102`) and
  the order lists it. List `data-level` with its values.
- **note** `packages/manifest/src/component/Meter.manifest.json:55`
  `levelLabels` is typed `"string"`; it is an object of three strings.
- **note** `packages/manifest/src/component/Meter.manifest.json:129`
  `"motion": "number-roll"` but nothing rolls: the CSS eases `scaleX`. The
  manifest names a pattern the component does not play. Either play
  `number-roll` on the value text or name no pattern (`null`, as Callout).
- **note** `packages/react/src/components/Meter/level.ts:1` The level logic
  is pure and Angular will need it; the lane asks the lead to move it to
  `packages/shared/src/meter.ts`. Agree.

## StatusDot: pass

Label required, dot hidden, pulse three times of `duration.shimmer` (4.2s,
under five seconds, never more than one flash a second), off under reduced
motion, `CanvasText` dot in forced colors. Dot contrast is 3.36:1 or more in
every measured pair.

- **note** `packages/manifest/src/component/StatusDot.manifest.json:95`
  `"motion": "thinking"`. Thinking is three dots that lift in turn; this is
  one ring that grows and fades. The lane asked for a `pulse` pattern; until
  it exists, the manifest misleads an agent that reads the pattern to port
  it to native.
- **note** `packages/css/src/components/StatusDot.css:111` and `:117`
  Raw `0.6` opacity and `scale(2.5)` in the keyframes. Move them to the
  pattern (or `opacity.*` and `scale.*` tokens) when `pulse` lands.
- **note** `packages/react/src/components/StatusDot/StatusDot.demo.tsx:86`
  The long Arabic line ends in the Latin run "Wi-Fi" without `Bidi`
  (PLAN.md section 12: Latin runs inside Arabic go through Bidi). It renders
  right here because the run is at the end; it will not in the middle of a
  line.
- **note** `packages/react/src/components/StatusDot/StatusDot.test.tsx` Four
  tests, none for the pulse stopping or for the reduced motion form. The
  pulse limit is the one WCAG 2.2.2 claim this component makes; test it in
  the browser (`getAnimations()` iterations equals 3).

## Skeleton: fix needed

`aria-hidden` always, even when a caller passes `aria-hidden={false}`;
outline in forced colors; shimmer travels toward the inline end.

- **blocker** `packages/css/src/components/Skeleton.css:60` The shimmer is
  `infinite`. The pattern the manifest names, `skeleton-shimmer`, runs
  `SHIMMER_ITERATIONS = 3` (4.2s) precisely so it stops before five seconds
  and needs no pause control (`packages/motion/src/patterns/skeleton-shimmer.ts:3`,
  and the catalog test asserts it). WCAG 2.2.2: a skeleton beside working
  content that waits on a slow network shimmers forever for anyone who has
  not set reduced motion. Fix: `animation-iteration-count: 3` (and
  `linear` easing, which the pattern uses and the lane already flagged).
- **blocker** `packages/react/src/components/Skeleton/Skeleton.demo.tsx:24`
  to `:26` Nothing says "loading" to a screen reader, in the component or in
  the demo. Every skeleton is hidden, and the demo's `Busy` wrapper is an
  empty `role="group"` with `aria-busy` and a name such as "Members". Screen
  reader support for `aria-busy` is thin; a person hears an empty group. The
  order and the brief ask that loading is announced once per region. Fix:
  either a `SkeletonGroup` (or a `label` on a wrapper) that renders the
  busy container with one visually hidden `role="status"` line ("Loading
  members"), or at least show that pattern in every demo case and in the
  manifest `a11y.announce`, so consumers copy it.
- **note** `packages/css/src/components/Skeleton.css:28` and `:29` The fill
  and band are both `bg.overlay-10`. On Neutral light the shapes are about
  1.2:1 against the page. Skeletons are decorative, so no WCAG criterion
  applies, but people with low vision may see an empty page. Consider
  `overlay-20` for the fill in light schemes.
- **note** `packages/react/src/components/Skeleton/Skeleton.test.tsx` No
  browser test of the iteration count or the RTL direction of the band.
- **note** `packages/react/src/components/Skeleton/Skeleton.tsx:50` `size`
  is dropped for circle and rect; documented. Fine.

## ErrorState: fix needed

Native `details` disclosure with a visible focus ring, retry Button first,
title a real heading, error code in an LTR `code`. The Arabic copy is good
("بيانات فريقك سليمة وما تغير شيء").

- **blocker** `packages/react/src/components/ErrorState/ErrorState.tsx:117`
  to `:120` The prop comment (`:83` to `:87`), the manifest `a11y.role` and
  `a11y.announce`, and the lane report all say `aria-atomic="false"`. The
  code never sets it. `role="alert"` is atomic by default, so when Retry is
  pressed the Button's hidden status ("Retrying", a nested live region)
  changes inside the alert and the whole error (title, body, buttons) can
  be read again. Fix: `aria-atomic={live ? false : undefined}` and a test.
- **blocker** `packages/react/src/components/ErrorState/ErrorState.tsx:107`
  `live` defaults to `true`, so an ErrorState present at page load (a page
  rendered on the server after a failed fetch, the commonest case) is a
  `role="alert"` and shouts on load in some screen readers. Alert made the
  opposite choice (`live` default false, `Alert.tsx:81`). The review brief
  is explicit: present at load must not shout. Fix: default `live` to
  false, as Alert; the consumer sets it when the error replaces content.
- **blocker** `packages/react/src/components/ErrorState/ErrorState.tsx:112`
  The default words read only the `lang` prop, never the Theme. In an app
  wrapped in `<Theme lang="ar">` the retry button says "Retry loading" and
  the toggle "Error details". Alert, Callout, Banner, ProgressBar, Meter and
  Dialog all fall back to `useTheme().lang`. Fix: `labelsFor(lang ?? theme.lang)`;
  keep `dir` from the prop only.
- **note** `packages/react/src/components/ErrorState/ErrorState.tsx:135`
  `body` is a `ReactNode` rendered inside `<p>`. A list or a second
  paragraph in `body` is invalid HTML and React warns. Use a `div` with
  `data-part="body"`, as Alert does.
- **note** `packages/css/src/components/ErrorState.css:33` The line length
  borrows `--ds-dialog-width-md`, a Dialog component token. A measure token
  is on the lane's token gap list; until then a semantic size is safer than
  another component's token.
- **note** `packages/manifest/src/component/ErrorState.manifest.json` The
  anatomy adds `retry`, `summary` and `code` to the order's list. Reasoned
  and fine, and EmptyState (1.9.12) must copy them.
- **note** `packages/react/src/components/ErrorState/ErrorState.test.tsx`
  No test of `aria-atomic` (which would have caught the first blocker) and
  none under a Theme in Arabic.

## NotificationCenter: fix needed

A section named by its heading, a group per day with a heading one level
down, items are articles named "Unread: Sara mentioned you in Launch plan",
a `time` element with `Intl.RelativeTimeFormat` and Western digits in
Arabic. Unread is a dot, a bold title and a hidden word: never color alone.

- **blocker** `packages/react/src/components/NotificationCenter/NotificationCenter.tsx:210`
  "Mark all as read" unmounts itself when it works (`unread > 0` turns
  false). Focus falls to `BODY`: checked in the browser, Enter on the button
  in the variants case leaves `document.activeElement` on the body. WCAG
  2.4.3; for a panel inside a Popover this also closes nothing and leaves
  the keyboard user at the top of the page. Fix: move focus to the panel
  title (`tabIndex={-1}` on the heading) or the first item before calling
  `onMarkAllRead`, as Banner does for dismiss; or keep the button and set
  `aria-disabled`.
- **blocker** `packages/react/src/components/NotificationCenter/NotificationCenter.tsx:187`
  Same as ErrorState: `notificationLanguage(lang)` reads only the prop. Under
  `<Theme lang="ar">` the panel says "Notifications", "Mark all as read",
  "Today", "No notifications" and formats times in English. Fix:
  `notificationLanguage(lang ?? useTheme().lang)`.
- **blocker** `packages/react/src/components/NotificationCenter/NotificationCenter.demo.tsx:127`
  `DemoGrid min="20rem"` scrolls the 320px page sideways by 14px; the
  contract suite fails on it (en ltr and ar rtl). Same fix as Meter.
  Screenshot: `shots/batch-5/notification-center-320px-sideways-scroll.png`.
- **note** `packages/react/src/components/NotificationCenter/NotificationCenter.tsx:142`,
  `:150`, `:219`, `:220`, `:230` Five ad hoc hooks, `data-entry`,
  `data-list`, `data-unread-word`, `data-empty-title`, `data-empty-body`,
  that are neither parts nor states. The CSS selects on them
  (`NotificationCenter.css:105`, `:208`, `:254`, `:261`). Either make them
  parts in the manifest (`empty-title`, `empty-body`, `list`) or select by
  element under a part (`[data-part='empty'] > p:first-of-type`). Angular
  must reproduce them byte for byte, so they need to be in the contract.
- **note** `packages/css/src/components/NotificationCenter.css:150`
  `box-shadow: inset var(--_notification-center-ring)`. In Neutral,
  `focus.shadow.ring` is two shadows (halo 2px, ring 4px, tokens.css lines
  1111 and 1375); `inset` applies to the first only, so the 4px ring draws
  outside the item and is clipped by a Popover with `overflow: hidden`. Use
  a private two layer value with `inset` on both, or `outline` inside the
  focus selector.
- **note** `packages/manifest/src/component/NotificationCenter.manifest.json:120`
  `"motion": "list-stagger"`, not played (the lane says so). Same issue as
  Meter: do not name a pattern the component does not play.
- **note** `packages/react/src/components/NotificationCenter/NotificationCenter.tsx:57`
  `notificationIcons` is a copy of `messageIcons` in `Alert/messageTones.ts`.
- **note** The variants page has two panels both named "Notifications"
  (axe `landmark-unique`). Demo only; a real app has one.

---

## One convention

Inconsistencies across the batch and with Button, Input, Dialog and Toast,
with one recommendation each.

1. **When a message is live.** Alert defaults `live` to false and picks
   `alert` or `status` by tone; ErrorState defaults to true and always uses
   `alert`; Toast is always live; Banner is never live. Recommendation: one
   rule written into `anatomy.md`: a component that can appear at load
   defaults to no live role, `live` opts in, danger maps to `alert` and
   every other tone to `status`, and a live root with interactive children
   sets `aria-atomic="false"`.
2. **The language of built in words.** Alert, Callout, Banner, ProgressBar,
   ProgressCircle, Meter and Dialog use `lang ?? useTheme().lang`. ErrorState,
   NotificationCenter and Toast use only the `lang` prop and also set `dir`.
   The `ar` regex exists in six copies. Recommendation: one helper in
   `packages/shared` (`wordsFor(labels, lang)` and `dirFor(lang)`), and
   every component resolves `lang ?? theme.lang` for words and sets `dir`
   only when the prop is given. Fix Toast in the same pass.
3. **Dismiss and focus.** Alert `onClose` leaves focus to the consumer,
   Banner `onDismiss` moves it to `main`, Toast `onClose` is handled by
   Radix, NotificationCenter mark all drops it. Recommendation: one prop name,
   `onClose`, for anything with a close part (Banner keeps `onDismiss` as an
   alias until the next minor), and one rule: a control that removes itself
   or its container moves focus first, with a `returnFocus` prop of the same
   shape as Banner's.
4. **Marks drawn on a surface.** StatusDot dots and NotificationCenter icons
   use `state.*.border` (specified at 3:1 on body, surface and surface-2);
   ProgressBar, ProgressCircle and Meter fills use `state.*.solid`, which is
   a fill for text on top and falls to 2.79:1 in Neutral dark. Recommendation:
   every mark that carries meaning without text on it (dot, indicator, ring,
   arc) uses `state.*.border` or `primary.border`; `state.*.solid` is only for
   a fill with text on it (solid Alert and Banner, Button).
5. **Manifest motion is a promise.** Meter names `number-roll`,
   NotificationCenter `list-stagger`, StatusDot `thinking`, and none plays
   it; Skeleton names `skeleton-shimmer` and plays it differently.
   Recommendation: `motion` names only a pattern the component plays with
   the pattern's own timing, else `null`; add a contract check that a
   component naming a looping pattern does not loop longer than the
   pattern's `iterations`.
6. **Shared pieces copied by hand.** The visually hidden block (Button
   status, Spinner label, StatusDot label, NotificationCenter unread word),
   the tone icon map (Alert and NotificationCenter), and the tone words
   (Alert, Banner, Callout, Toast; neutral and accent both "Notice" in two of
   them). Recommendation: a `[data-visually-hidden]` rule in
   `packages/css/src/base.css` used by every component, and one tone table
   (icon and word per tone and language) in `packages/shared`.
7. **Reduced motion of a looping indicator.** Spinner stops as a still arc
   (right, it has no value), ProgressCircle as a quarter arc (reads as 25
   percent), ProgressBar as a full faded bar (reads as done). Recommendation:
   an indeterminate indicator under reduced motion must take a shape no
   determinate value can take, in the full tone color, and keep its text.
8. **Ad hoc data attributes.** NotificationCenter adds five hooks outside the
   contract; StatusDot adds `data-hide-label` (listed under states, though it
   is a layout switch). Recommendation: CSS selects only `data-ds`,
   `data-part`, the shared axes and the states the manifest lists; a lint
   rule can check `[data-*]` selectors in component CSS against the
   manifest.
9. **Size words.** Default `md` everywhere, sizes drawn from the shared words.
   Consistent. Spinner and ProgressCircle `lg` use a raw `1.5` multiplier
   and `control.lg + icon.lg`; add `size.icon.xl` and a ring size token so
   the two match each other and Button.
10. **Demo grids at 320px.** Meter and NotificationCenter fail reflow only
    because of `DemoGrid min="20rem"`. Recommendation: `DemoGrid` clamps its
    `min` with `min(<min>, 100%)` in `packages/react/src/demo/index.tsx`, so
    no demo can fail 1.4.10 by its grid.

## Look in Neutral

Neutral renders right for all eleven components in both schemes: no recipe
is needed, and nothing depends on a Studio or Desk only value. The solid
tones keep their text contrast (dark text on the amber warning fill in
Neutral dark, white elsewhere). The two Neutral specific problems are the
success fill at 2.79:1 in Neutral dark (ProgressBar, Meter) and the two
layer focus ring that `inset` does not fully cover (NotificationCenter).

## Tests

The unit tests are meaningful for props, roles and names, and each file
renders its demo. What they cannot see needs the browser and is missing in
the component tests and the contract suite: reduced motion forms, animation
iteration counts (Skeleton, StatusDot), RTL transform origins, focus after a
control removes itself (NotificationCenter, Alert), and `aria-atomic`
(ErrorState). Recommendation for the contract suite: a "focus is never on
body after a key press" check after each `contract.keys` action, and an
`iterations` check for any manifest motion that loops.
